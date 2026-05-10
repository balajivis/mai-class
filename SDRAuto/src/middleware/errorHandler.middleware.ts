import type { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error', { message: err.message, stack: err.stack })

  const statusCode = 'statusCode' in err ? (err as Error & { statusCode: number }).statusCode : 500
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message

  res.status(statusCode).json({
    error: 'INTERNAL_SERVER_ERROR',
    message,
  })
}
