import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * TDD Test Suite: Rate Limit Middleware
 *
 * Tests per-user API rate limiting.
 * Spec refs: Backend §2 (middleware/rateLimit.middleware.ts)
 */

vi.mock('../../src/lib/redis.js', () => ({
  cacheIncr: vi.fn(),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
}))

import { cacheIncr, cacheGet } from '../../src/lib/redis.js'
import { checkRateLimit } from '../../src/middleware/rateLimit.middleware.js'

const mockCacheIncr = vi.mocked(cacheIncr)
const mockCacheGet = vi.mocked(cacheGet)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RateLimitMiddleware', () => {
  it('should allow requests under the rate limit (100 req/min)', async () => {
    mockCacheIncr.mockResolvedValue(50)

    const result = await checkRateLimit('user-1')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(50) // 100 - 50
  })

  it('should block requests exceeding 100 req/min', async () => {
    mockCacheIncr.mockResolvedValue(101)
    mockCacheGet.mockResolvedValue(null)

    const result = await checkRateLimit('user-1')

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterMs).toBeDefined()
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('should rate limit per-user (not globally)', async () => {
    // User A is over limit, user B is not
    mockCacheIncr
      .mockResolvedValueOnce(101) // user-a
      .mockResolvedValueOnce(5)   // user-b

    const resultA = await checkRateLimit('user-a')
    const resultB = await checkRateLimit('user-b')

    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true)
  })

  it('should reset rate limit after the window expires', async () => {
    // After window reset, counter starts back at 1
    mockCacheIncr.mockResolvedValue(1)

    const result = await checkRateLimit('user-1')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(99)
  })

  it('should allow exactly the limit (boundary: count === limit)', async () => {
    mockCacheIncr.mockResolvedValue(100)

    const result = await checkRateLimit('user-1')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('should respect a custom limit parameter', async () => {
    mockCacheIncr.mockResolvedValue(11)

    const result = await checkRateLimit('user-custom', 10)

    expect(result.allowed).toBe(false)
  })
})
