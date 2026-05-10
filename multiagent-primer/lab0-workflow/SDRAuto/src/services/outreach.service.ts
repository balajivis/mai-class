import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'
import { researchService } from './research.service.js'
import { emailGenerationService } from './emailGeneration.service.js'
import type { OutreachStatus, AutonomyLevel, ReplyClassification } from '../types/index.js'

// Valid state transitions
const VALID_TRANSITIONS: Record<OutreachStatus, OutreachStatus[]> = {
  researched: ['first_touch_pending'],
  first_touch_pending: ['first_touch_sent', 'first_touch_pending'], // re-generate on reject
  first_touch_sent: ['awaiting_reply'],
  awaiting_reply: ['engaged', 'paused', 'awaiting_reply'], // follow-up keeps same state
  engaged: ['booked', 'awaiting_reply', 'paused'],
  booked: ['completed', 'paused'],
  paused: ['awaiting_reply'],
  completed: [],
}

function validateTransition(from: OutreachStatus, to: OutreachStatus): void {
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    throw new Error(`Invalid state transition: ${from} -> ${to}`)
  }
}

export class OutreachService {
  async initiate(
    campaignId: string,
    account: { id: string; domain: string; companyName: string; buyerEmail: string }
  ) {
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw new Error('Campaign not found')

    const researchBrief = await researchService.buildResearchBrief(
      account.id,
      account.companyName,
      account.domain,
      account.buyerEmail
    )

    const outreach = await db.outreach.create({
      data: {
        campaignId,
        userId: campaign.userId,
        accountId: account.id,
        accountName: account.companyName,
        buyerEmail: account.buyerEmail,
        researchBrief: researchBrief as unknown as Record<string, unknown>,
        status: 'researched',
        autonomyAtCreation: campaign.autonomyLevel,
        reasoningLog: `Outreach initiated. ICP fit score: ${researchBrief.icpFitScore}. Research brief generated with ${researchBrief.recentNews.length} news items and ${researchBrief.painIndicators.length} pain indicators.`,
      },
    })

    // For L3/L4, auto-generate and send first touch
    if (campaign.autonomyLevel === 'L3' || campaign.autonomyLevel === 'L4') {
      const generated = await this.generateFirstTouch(outreach.id)
      const sent = await this.approveFirstTouch(generated.id, campaign.userId)
      return sent
    }

    return outreach
  }

  async generateFirstTouch(outreachId: string) {
    const outreach = await db.outreach.findUnique({
      where: { id: outreachId },
      include: { campaign: true },
    })
    if (!outreach) throw new Error('Outreach not found')

    validateTransition(outreach.status as OutreachStatus, 'first_touch_pending')

    // Get voice profile for the user
    const voiceProfile = await db.voiceProfile.findFirst({
      where: { userId: outreach.userId, validatedByUser: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!voiceProfile) {
      // Fall back to any voice profile
      const anyProfile = await db.voiceProfile.findFirst({
        where: { userId: outreach.userId },
        orderBy: { confidenceScore: 'desc' },
      })
      if (!anyProfile) throw new Error('No voice profile available')
    }

    const profile = voiceProfile ?? await db.voiceProfile.findFirst({
      where: { userId: outreach.userId },
      orderBy: { confidenceScore: 'desc' },
    })

    const email = await emailGenerationService.generateFirstTouch(
      {
        id: profile!.id,
        tone: profile!.tone,
        sentenceStructure: profile!.sentenceStructure,
        signOffPatterns: profile!.signOffPatterns,
        emojiUsage: profile!.emojiUsage,
        avgMessageLength: profile!.avgMessageLength,
        confidenceScore: profile!.confidenceScore,
      },
      outreach.researchBrief as any,
      outreach.buyerEmail
    )

    const message = await db.message.create({
      data: {
        outreachId,
        messageType: 'first_touch',
        direction: 'outbound',
        senderEmail: '', // Will be set from user's connected email
        recipientEmail: outreach.buyerEmail,
        subject: email.subject,
        body: email.body,
        personalizationUsed: email.personalizationUsed,
        voiceConfidenceScore: email.voiceConfidenceScore,
        status: 'draft',
        reasoningLog: email.reasoningLog,
      },
    })

    const updated = await db.outreach.update({
      where: { id: outreachId },
      data: {
        status: 'first_touch_pending',
        firstTouchId: message.id,
        voiceProfileId: profile!.id,
      },
    })

    return { ...updated, requiresApproval: outreach.autonomyAtCreation === 'L1' || outreach.autonomyAtCreation === 'L2' }
  }

  async approveFirstTouch(outreachId: string, userId: string) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    validateTransition(outreach.status as OutreachStatus, 'first_touch_sent')

    if (outreach.firstTouchId) {
      await db.message.update({
        where: { id: outreach.firstTouchId },
        data: { status: 'approved', approvalBy: userId },
      })
    }

    return db.outreach.update({
      where: { id: outreachId },
      data: { status: 'first_touch_sent' },
    })
  }

  async rejectFirstTouch(outreachId: string, userId: string, reason: string) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    logger.info('First touch rejected', { outreachId, userId, reason })

    // Stay in first_touch_pending for re-generation
    return {
      ...outreach,
      status: 'first_touch_pending',
      rejectionReason: reason,
    }
  }

  async markSent(outreachId: string) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    validateTransition(outreach.status as OutreachStatus, 'awaiting_reply')

    return db.outreach.update({
      where: { id: outreachId },
      data: { status: 'awaiting_reply' },
    })
  }

  async handleReply(outreachId: string, classification: { classification: ReplyClassification }) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    let newStatus: OutreachStatus

    switch (classification.classification) {
      case 'positive':
        newStatus = 'engaged'
        break
      case 'unsubscribe':
        newStatus = 'paused'
        break
      case 'objection':
        newStatus = 'engaged'
        break
      case 'noise':
      case 'unclear':
        newStatus = outreach.status as OutreachStatus // Stay in current state
        break
      default:
        newStatus = outreach.status as OutreachStatus
    }

    if (newStatus !== outreach.status) {
      validateTransition(outreach.status as OutreachStatus, newStatus)
    }

    return db.outreach.update({
      where: { id: outreachId },
      data: { status: newStatus },
    })
  }

  async sendFollowUp(outreachId: string) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    // Follow-ups keep the same status
    return { ...outreach, requiresApproval: false }
  }

  async scheduleFollowUp(outreachId: string) {
    return { outreachId, requiresApproval: false, scheduled: true }
  }

  async bookMeeting(outreachId: string, data: { slotAccepted: string }) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    validateTransition(outreach.status as OutreachStatus, 'booked')

    return db.outreach.update({
      where: { id: outreachId },
      data: { status: 'booked' },
    })
  }

  async sendRebuttal(outreachId: string) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    return db.outreach.update({
      where: { id: outreachId },
      data: { status: 'awaiting_reply' },
    })
  }

  async resume(outreachId: string) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    validateTransition(outreach.status as OutreachStatus, 'awaiting_reply')

    return db.outreach.update({
      where: { id: outreachId },
      data: { status: 'awaiting_reply' },
    })
  }
}

export const outreachService = new OutreachService()
