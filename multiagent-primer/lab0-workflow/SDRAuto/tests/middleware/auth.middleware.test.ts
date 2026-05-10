import { describe, it, expect, beforeAll, vi } from 'vitest'
import jwt from 'jsonwebtoken'

/**
 * TDD Test Suite: Auth Middleware
 *
 * Tests JWT verification, session attachment, and token refresh.
 * Spec refs: Backend §4 (Auth), Technical Spec §5.4
 */

const TEST_SECRET = 'test-secret-minimum-16-chars'

// The module captures JWT_SECRET at load time from process.env.
// We must set the env var, reset modules, then dynamically import so the
// module re-evaluates with the correct secret.
vi.resetModules()
process.env.JWT_SECRET = TEST_SECRET

const { verifyToken, generateToken, refreshToken } = await import('../../src/middleware/auth.middleware.js')

const testUser = { id: 'user-123', email: 'founder@startup.io', role: 'founder' as const }

describe('AuthMiddleware', () => {
  it('should attach user to context for valid JWT', () => {
    const token = generateToken(testUser)
    const payload = verifyToken(token)
    expect(payload).toBeDefined()
    expect(payload.id).toBe(testUser.id)
    expect(payload.email).toBe(testUser.email)
    expect(payload.role).toBe(testUser.role)
  })

  it('should reject expired JWT', () => {
    const expiredToken = jwt.sign(
      { id: testUser.id, email: testUser.email, role: testUser.role },
      TEST_SECRET,
      { expiresIn: -1 }
    )
    expect(() => verifyToken(expiredToken)).toThrow('UNAUTHORIZED')
  })

  it('should reject malformed JWT', () => {
    expect(() => verifyToken('not-a-jwt')).toThrow('UNAUTHORIZED')
  })

  it('should reject an empty string token', () => {
    expect(() => verifyToken('')).toThrow('UNAUTHORIZED')
  })

  it('should handle token refresh for expired but valid sessions', () => {
    // Create an expired token using the same secret the module loaded with
    const expiredToken = jwt.sign(
      { id: testUser.id, email: testUser.email, role: testUser.role },
      TEST_SECRET,
      { expiresIn: -1 }
    )
    const newToken = refreshToken(expiredToken)
    expect(newToken).not.toBeNull()

    // Verify the refreshed token carries the same identity
    const payload = verifyToken(newToken as string)
    expect(payload.id).toBe(testUser.id)
    expect(payload.email).toBe(testUser.email)
  })

  it('should return null from refreshToken for a completely invalid token', () => {
    const result = refreshToken('garbage.token.value')
    expect(result).toBeNull()
  })

  it('generateToken should produce a verifiable JWT', () => {
    const token = generateToken(testUser)
    const decoded = jwt.decode(token) as Record<string, unknown>
    expect(decoded.id).toBe(testUser.id)
    expect(decoded.email).toBe(testUser.email)
    expect(decoded.role).toBe(testUser.role)
    expect(decoded.exp).toBeDefined()
  })
})
