import type { Job } from 'bull'
import { followUpSchedulerQueue, emailSenderQueue } from './queue.js'
import { emailGenerationService } from '../services/emailGeneration.service.js'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

interface FollowUpCheckJobData {
  userId: string
}

export function registerFollowUpSchedulerProcessor() {
  followUpSchedulerQueue.process(async (job: Job<FollowUpCheckJobData>) => {
    const { userId } = job.data
    const cadence = emailGenerationService.getDefaultCadence() // [3, 7, 10]

    // Find outreach items in "awaiting_reply" that need follow-ups
    const awaitingOutreach = await db.outreach.findMany({
      where: {
        userId,
        status: 'awaiting_reply',
      },
      include: {
        messages: {
          where: { direction: 'outbound' },
          orderBy: { sentTimestamp: 'desc' },
          take: 1,
        },
      },
    })

    let followUpsScheduled = 0

    for (const outreach of awaitingOutreach) {
      const lastMessage = outreach.messages[0]
      if (!lastMessage?.sentTimestamp) continue

      const daysSinceLast = Math.floor(
        (Date.now() - lastMessage.sentTimestamp.getTime()) / (1000 * 60 * 60 * 24)
      )

      const followUpNumber = outreach.followUpIds.length
      const nextFollowUpDay = cadence[followUpNumber]

      if (!nextFollowUpDay || daysSinceLast < nextFollowUpDay) continue

      // Max 3 follow-ups per cadence
      if (followUpNumber >= cadence.length) continue

      // Get voice profile
      const voiceProfile = outreach.voiceProfileId
        ? await db.voiceProfile.findUnique({ where: { id: outreach.voiceProfileId } })
        : null

      if (!voiceProfile) continue

      const followUp = await emailGenerationService.generateFollowUp(
        {
          id: voiceProfile.id,
          tone: voiceProfile.tone,
          sentenceStructure: voiceProfile.sentenceStructure,
          signOffPatterns: voiceProfile.signOffPatterns,
          emojiUsage: voiceProfile.emojiUsage,
          avgMessageLength: voiceProfile.avgMessageLength,
          confidenceScore: voiceProfile.confidenceScore,
        },
        outreach.researchBrief as any,
        { priorMessageId: lastMessage.id, daysSinceLast }
      )

      // Create the follow-up message
      const message = await db.message.create({
        data: {
          outreachId: outreach.id,
          messageType: 'follow_up',
          direction: 'outbound',
          senderEmail: lastMessage.senderEmail,
          recipientEmail: outreach.buyerEmail,
          subject: followUp.subject,
          body: followUp.body,
          personalizationUsed: followUp.personalizationUsed,
          voiceConfidenceScore: followUp.voiceConfidenceScore,
          status: 'approved', // Follow-ups auto-approved at L2+
          reasoningLog: followUp.reasoningLog,
        },
      })

      // Update outreach follow-up IDs
      await db.outreach.update({
        where: { id: outreach.id },
        data: {
          followUpIds: [...outreach.followUpIds, message.id],
        },
      })

      // Queue for sending
      await emailSenderQueue.add({ messageId: message.id, userId })

      followUpsScheduled++
    }

    logger.info('Follow-up scheduler complete', {
      userId,
      checked: awaitingOutreach.length,
      scheduled: followUpsScheduled,
    })

    return { checked: awaitingOutreach.length, scheduled: followUpsScheduled }
  })
}
