import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import type { JwtPayload, SessionUser } from '../types/auth.js'
import { logger } from '../lib/logger.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'
const JWT_EXPIRY = '24h'

export function generateToken(user: SessionUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  )
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('UNAUTHORIZED: Token expired')
    }
    throw new Error('UNAUTHORIZED: Invalid token')
  }
}

export function refreshToken(expiredToken: string): string | null {
  try {
    const payload = jwt.verify(expiredToken, JWT_SECRET, { ignoreExpiration: true }) as JwtPayload
    return generateToken({ id: payload.id, email: payload.email, role: payload.role })
  } catch {
    return null
  }
}

export function extractUserFromRequest(req: Request): SessionUser | null {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  try {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    return { id: payload.id, email: payload.email, role: payload.role }
  } catch (error) {
    logger.debug('Auth extraction failed', { error })
    return null
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = extractUserFromRequest(req)
  if (!user) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' })
    return
  }
  ;(req as Request & { user: SessionUser }).user = user
  next()
}
