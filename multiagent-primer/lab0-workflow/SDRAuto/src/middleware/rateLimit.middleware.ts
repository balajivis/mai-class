import type { Request, Response, NextFunction } from 'express'
import { cacheIncr, cacheGet } from '../lib/redis.js'
import { logger } from '../lib/logger.js'

const DEFAULT_RATE_LIMIT = 100 // requests per minute
const WINDOW_SECONDS = 60

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
}

export async function checkRateLimit(userId: string, limit: number = DEFAULT_RATE_LIMIT): Promise<RateLimitResult> {
  const key = `ratelimit:${userId}:${Math.floor(Date.now() / (WINDOW_SECONDS * 1000))}`
  const count = await cacheIncr(key, WINDOW_SECONDS)

  if (count > limit) {
    const ttl = await cacheGet(key + ':ttl')
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: WINDOW_SECONDS * 1000,
    }
  }

  return {
    allowed: true,
    remaining: limit - count,
  }
}

export function rateLimitMiddleware(limit: number = DEFAULT_RATE_LIMIT) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as Request & { user?: { id: string } }).user
    if (!user) {
      next()
      return
    }

    try {
      const result = await checkRateLimit(user.id, limit)

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', { userId: user.id })
        res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded',
          retryAfterMs: result.retryAfterMs,
        })
        return
      }

      res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
      next()
    } catch (error) {
      // Fail open: allow request if Redis is down
      logger.error('Rate limit check failed', { error })
      next()
    }
  }
}
