import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * TDD Test Suite: Auth Router
 *
 * Tests signup, login, and me procedures.
 * Spec refs: Technical Spec §6.1, Backend §4 (Auth), PRD §5 (Security)
 */

// Set JWT_SECRET before any module with auth.middleware is imported
process.env.JWT_SECRET = 'test-secret-minimum-16-chars'

vi.mock('../../src/lib/db.js', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

// Logger mock — suppress noise in tests
vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

import { db } from '../../src/lib/db.js'
import bcrypt from 'bcrypt'
import { authRouter } from '../../src/routers/auth.router.js'
import { router } from '../../src/trpc.js'
import type { SessionUser } from '../../src/types/auth.js'

const mockDb = vi.mocked(db)
const mockBcrypt = vi.mocked(bcrypt)

// Build a minimal app router wrapping authRouter
const appRouter = router({ auth: authRouter })

/** Creates a caller with no authenticated user (public procedures). */
function makePublicCaller() {
  return appRouter.createCaller({
    req: {} as never,
    user: null,
  })
}

/** Creates a caller with an authenticated user (protected procedures). */
function makeAuthCaller(user: SessionUser) {
  return appRouter.createCaller({
    req: {} as never,
    user,
  })
}

// Shared test data
const validEmail = 'founder@startup.io'
const validPassword = 'SecureP@ss123'
const hashedPassword = '$2b$12$hashedpassword'

const dbUser = {
  id: 'user-uuid-1',
  email: validEmail,
  passwordHash: hashedPassword,
  role: 'founder',
  autonomyLevel: 'L2',
  dailyEmailCap: 20,
  domainEmailCap: 5,
  name: 'Test Founder',
  createdAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthRouter', () => {
  describe('signup', () => {
    it('should create a user with email and password', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never)
      mockDb.user.create.mockResolvedValue(dbUser as never)

      const caller = makePublicCaller()
      const result = await caller.auth.signup({ email: validEmail, password: validPassword })

      expect(result.userId).toBe(dbUser.id)
      expect(result.email).toBe(validEmail)
    })

    it('should reject duplicate email registration', async () => {
      mockDb.user.findUnique.mockResolvedValue(dbUser as never)

      const caller = makePublicCaller()
      await expect(
        caller.auth.signup({ email: validEmail, password: validPassword })
      ).rejects.toThrow('already exists')
    })

    it('should reject weak passwords', async () => {
      const caller = makePublicCaller()
      await expect(
        caller.auth.signup({ email: 'new@startup.io', password: '123' })
      ).rejects.toThrow()
    })

    it('should reject invalid email format', async () => {
      const caller = makePublicCaller()
      await expect(
        caller.auth.signup({ email: 'not-an-email', password: validPassword })
      ).rejects.toThrow()
    })

    it('should assign default role "founder"', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never)
      mockDb.user.create.mockResolvedValue(dbUser as never)

      const caller = makePublicCaller()
      const result = await caller.auth.signup({ email: 'new@startup.io', password: validPassword })

      expect(result.role).toBe('founder')
    })

    it('should assign default settings (L2 autonomy, 20 daily cap)', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never)
      mockDb.user.create.mockResolvedValue(dbUser as never)

      const caller = makePublicCaller()
      const result = await caller.auth.signup({ email: 'new@startup.io', password: validPassword })

      expect(result.settings.autonomyLevel).toBe('L2')
      expect(result.settings.dailyCap).toBe(20)
    })

    it('should return a token on successful signup', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never)
      mockDb.user.create.mockResolvedValue(dbUser as never)

      const caller = makePublicCaller()
      const result = await caller.auth.signup({ email: validEmail, password: validPassword })

      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
    })
  })

  describe('login', () => {
    it('should return a session token for valid credentials', async () => {
      mockDb.user.findUnique.mockResolvedValue(dbUser as never)
      mockBcrypt.compare.mockResolvedValue(true as never)

      const caller = makePublicCaller()
      const result = await caller.auth.login({ email: validEmail, password: validPassword })

      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
      expect(result.userId).toBe(dbUser.id)
    })

    it('should reject invalid credentials (wrong password)', async () => {
      mockDb.user.findUnique.mockResolvedValue(dbUser as never)
      mockBcrypt.compare.mockResolvedValue(false as never)

      const caller = makePublicCaller()
      await expect(
        caller.auth.login({ email: validEmail, password: 'wrong' })
      ).rejects.toThrow('Invalid credentials')
    })

    it('should reject login for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const caller = makePublicCaller()
      await expect(
        caller.auth.login({ email: 'nobody@example.com', password: validPassword })
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('me', () => {
    it('should return the authenticated user profile', async () => {
      const meUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        autonomyLevel: dbUser.autonomyLevel,
        dailyEmailCap: dbUser.dailyEmailCap,
        domainEmailCap: dbUser.domainEmailCap,
        createdAt: dbUser.createdAt,
      }
      mockDb.user.findUnique.mockResolvedValue(meUser as never)

      const caller = makeAuthCaller({ id: dbUser.id, email: dbUser.email, role: 'founder' })
      const user = await caller.auth.me()

      expect(user.id).toBeDefined()
      expect(user.email).toBe(validEmail)
      expect(user.settings).toBeDefined()
      expect(user.settings.autonomyLevel).toBe('L2')
    })

    it('should reject unauthenticated requests', async () => {
      const caller = makePublicCaller()
      await expect(caller.auth.me()).rejects.toThrow('User not authenticated')
    })
  })
})
