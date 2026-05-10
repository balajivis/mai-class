import type { Job } from 'bull'
import { replyClassifierQueue } from './queue.js'
import { replyClassificationService } from '../services/replyClassification.service.js'
import { outreachService } from '../services/outreach.service.js'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

interface ReplyClassifyJobData {
  replyData: {
    id: string
    senderEmail: string
    subject: string
    body: string
    receivedTimestamp: string
    outreachId: string
    originalMessageId: string
  }
  userId: string
}

export function registerReplyClassifierProcessor() {
  replyClassifierQueue.process(async (job: Job<ReplyClassifyJobData>) => {
    const { replyData, userId } = job.data

    logger.info('Classifying reply', { replyId: replyData.id, outreachId: replyData.outreachId })

    // Classify the reply
    const classification = await replyClassificationService.classifyReply({
      id: replyData.id,
      senderEmail: replyData.senderEmail,
      subject: replyData.subject,
      body: replyData.body,
    })

    // Get user's autonomy level
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { autonomyLevel: true },
    })

    const autonomyLevel = (user?.autonomyLevel ?? 'L2') as 'L1' | 'L2' | 'L3' | 'L4'
    const action = replyClassificationService.determineAction(
      classification.classification,
      classification.confidence,
      autonomyLevel
    )

    // Store the reply
    const reply = await db.reply.create({
      data: {
        messageId: replyData.originalMessageId,
        outreachId: replyData.outreachId,
        receivedTimestamp: new Date(replyData.receivedTimestamp),
        senderEmail: replyData.senderEmail,
        subject: replyData.subject,
        body: replyData.body,
        classification: classification.classification,
        confidence: classification.confidence,
        objectionType: classification.objectionType,
        extractedSentiment: classification.extractedSentiment,
        extractedIntent: classification.extractedIntent,
        reasoningLog: classification.reasoningLog,
        actionTaken: action === 'escalate' ? null : action,
      },
    })

    // Update outreach based on classification
    await outreachService.handleReply(replyData.outreachId, {
      classification: classification.classification,
    })

    // Update campaign stats
    const outreach = await db.outreach.findUnique({ where: { id: replyData.outreachId } })
    if (outreach) {
      await db.campaign.update({
        where: { id: outreach.campaignId },
        data: { repliesReceived: { increment: 1 } },
      })
    }

    // Auto-handle based on action
    if (action === 'pause_sequence') {
      await db.unsubscribeList.create({
        data: {
          userId,
          email: replyData.senderEmail,
          domain: replyData.senderEmail.split('@')[1],
          reason: 'unsubscribe',
        },
      }).catch(() => {
        // Ignore duplicate unsubscribe entries
      })
    }

    logger.info('Reply classified and processed', {
      replyId: reply.id,
      classification: classification.classification,
      action,
    })

    return { replyId: reply.id, classification: classification.classification, action }
  })
}
