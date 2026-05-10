import Bull from 'bull'
import { logger } from '../lib/logger.js'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export function createQueue(name: string) {
  const queue = new Bull(name, REDIS_URL, {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  })

  queue.on('error', (error) => {
    logger.error(`Queue ${name} error`, { error: error.message })
  })

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} in queue ${name} failed`, {
      jobId: job.id,
      data: job.data,
      error: error.message,
      attemptsMade: job.attemptsMade,
    })
  })

  queue.on('completed', (job) => {
    logger.debug(`Job ${job.id} in queue ${name} completed`)
  })

  return queue
}

// Queue instances
export const emailSenderQueue = createQueue('email-sender')
export const inboxPollerQueue = createQueue('inbox-poller')
export const replyClassifierQueue = createQueue('reply-classifier')
export const followUpSchedulerQueue = createQueue('follow-up-scheduler')
export const accountResearchQueue = createQueue('account-research')
