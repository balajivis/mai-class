import type { Job } from 'bull'
import { emailSenderQueue } from './queue.js'
import { emailSendingService } from '../services/emailSending.service.js'
import { outreachService } from '../services/outreach.service.js'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

interface EmailSendJobData {
  messageId: string
  userId: string
}

export function registerEmailSenderProcessor() {
  emailSenderQueue.process(async (job: Job<EmailSendJobData>) => {
    const { messageId, userId } = job.data

    const message = await db.message.findUnique({
      where: { id: messageId },
      include: { outreach: true },
    })

    if (!message) {
      logger.error('Email send job: message not found', { messageId })
      return { success: false, error: 'Message not found' }
    }

    if (message.status === 'sent') {
      logger.warn('Email send job: message already sent', { messageId })
      return { success: true, alreadySent: true }
    }

    const result = await emailSendingService.send(
      {
        id: message.id,
        recipientEmail: message.recipientEmail,
        subject: message.subject,
        body: message.body,
        senderEmail: message.senderEmail,
      },
      { userId }
    )

    if (result.success) {
      // Update outreach status to awaiting_reply
      await outreachService.markSent(message.outreachId)

      // Update campaign stats
      await db.campaign.update({
        where: { id: message.outreach.campaignId },
        data: { firstTouchesSent: { increment: 1 } },
      })

      logger.info('Email sent successfully', {
        messageId,
        recipient: message.recipientEmail,
      })
    }

    return result
  })
}
