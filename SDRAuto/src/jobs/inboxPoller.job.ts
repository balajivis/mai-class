import type { Job } from 'bull'
import { inboxPollerQueue, replyClassifierQueue } from './queue.js'
import { inboxService } from '../services/inbox.service.js'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

interface InboxPollJobData {
  userId: string
  lastPollTimestamp?: string
  consecutiveFailures?: number
}

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export function registerInboxPollerProcessor() {
  inboxPollerQueue.process(async (job: Job<InboxPollJobData>) => {
    const { userId, lastPollTimestamp, consecutiveFailures = 0 } = job.data

    logger.info('Polling inbox', { userId, consecutiveFailures })

    const result = await inboxService.pollWithRetry(userId, {
      consecutiveFailures,
      lastPollTimestamp: lastPollTimestamp ? new Date(lastPollTimestamp) : undefined,
    })

    if (result.escalated) {
      logger.warn('Inbox polling escalated to user', { userId })
      return { escalated: true, replies: 0 }
    }

    if (result.replies.length > 0) {
      // Match replies to outreach
      const matched = await inboxService.matchToOutreach(result.replies)

      // Queue each matched reply for classification
      for (const reply of matched) {
        await replyClassifierQueue.add({
          replyData: reply,
          userId,
        })
      }

      logger.info('Inbox poll complete', {
        userId,
        totalReplies: result.replies.length,
        matchedReplies: matched.length,
      })
    }

    // Schedule next poll
    await inboxPollerQueue.add(
      {
        userId,
        lastPollTimestamp: new Date().toISOString(),
        consecutiveFailures: result.retried ? consecutiveFailures + 1 : 0,
      },
      { delay: POLL_INTERVAL_MS }
    )

    return { replies: result.replies.length, retried: result.retried }
  })
}
