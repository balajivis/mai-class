import express from 'express'
import cors from 'cors'
import * as trpcExpress from '@trpc/server/adapters/express'
import { appRouter } from './routers/index.js'
import { extractUserFromRequest } from './middleware/auth.middleware.js'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { requestLogger } from './middleware/logging.middleware.js'
import { rateLimitMiddleware } from './middleware/rateLimit.middleware.js'
import { registerEmailSenderProcessor } from './jobs/emailSender.job.js'
import { registerInboxPollerProcessor } from './jobs/inboxPoller.job.js'
import { registerReplyClassifierProcessor } from './jobs/replyClassifier.job.js'
import { registerFollowUpSchedulerProcessor } from './jobs/followUpScheduler.job.js'
import { registerAccountResearchProcessor } from './jobs/accountResearch.job.js'
import { logger } from './lib/logger.js'
import type { Context } from './trpc.js'

const PORT = parseInt(process.env.PORT ?? '3000', 10)

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(requestLogger)
app.use(rateLimitMiddleware())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// tRPC
app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({ req }): Context => ({
      req,
      user: extractUserFromRequest(req),
    }),
    onError({ path, error }) {
      logger.error('tRPC error', { path, code: error.code, message: error.message })
    },
  })
)

// Error handler (must be last)
app.use(errorHandler)

// Register job processors
function registerJobs() {
  registerEmailSenderProcessor()
  registerInboxPollerProcessor()
  registerReplyClassifierProcessor()
  registerFollowUpSchedulerProcessor()
  registerAccountResearchProcessor()
  logger.info('All job processors registered')
}

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  registerJobs()
})

export { app, appRouter }
export type { AppRouter } from './routers/index.js'
