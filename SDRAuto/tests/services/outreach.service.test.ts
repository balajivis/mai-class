import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * TDD Test Suite: Outreach Orchestration Service
 *
 * Tests the full outreach lifecycle: research -> email gen -> approval -> send -> follow-up.
 * Spec refs: Technical Spec §2.1, §3.2 Data Flow, App Flow §4 State Machine
 */

// --- Mocks ---

vi.mock('../../src/lib/db.js', () => ({
  db: {
    campaign: {
      findUnique: vi.fn(),
    },
    outreach: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
      update: vi.fn(),
    },
    voiceProfile: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('../../src/services/research.service.js', () => ({
  researchService: {
    buildResearchBrief: vi.fn(),
  },
}))

vi.mock('../../src/services/emailGeneration.service.js', () => ({
  emailGenerationService: {
    generateFirstTouch: vi.fn(),
  },
}))

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { db } from '../../src/lib/db.js'
import { researchService } from '../../src/services/research.service.js'
import { emailGenerationService } from '../../src/services/emailGeneration.service.js'
import { OutreachService } from '../../src/services/outreach.service.js'

// --- Fixtures ---

const mockCampaign = {
  id: 'camp-1',
  userId: 'user-1',
  name: 'Q2 Founder Outreach',
  autonomyLevel: 'L2' as const,
  status: 'active' as const,
  dailyCap: 20,
  domainCap: 5,
}

const mockCampaignL4 = {
  ...mockCampaign,
  id: 'camp-l4',
  autonomyLevel: 'L4' as const,
}

const mockAccount = {
  id: 'acc-1',
  domain: 'acme.com',
  companyName: 'Acme Corp',
  buyerEmail: 'vp@acme.com',
}

const mockResearchBrief = {
  accountId: 'acc-1',
  companyName: 'Acme Corp',
  recentNews: [
    { headline: 'Acme raises Series B', date: '2026-01-15', sourceUrl: 'https://techcrunch.com' },
  ],
  painIndicators: [
    { signal: 'Hiring 10 AEs', confidence: 0.85, date: '2026-02-15' },
  ],
  buyerPersona: { role: 'VP of Sales', seniority: 'VP', likelyGoals: ['Scale pipeline'] },
  icpFitScore: 0.82,
}

const mockVoiceProfile = {
  id: 'vp-1',
  userId: 'user-1',
  tone: 'conversational',
  sentenceStructure: 'short',
  signOffPatterns: ['Best,'],
  emojiUsage: false,
  avgMessageLength: 100,
  confidenceScore: 0.9,
  validatedByUser: true,
  createdAt: new Date(),
}

const mockGeneratedEmail = {
  subject: 'Quick question about pipeline efficiency',
  body: 'Hi, noticed your Series B round...',
  recipientEmail: 'vp@acme.com',
  personalizationUsed: ['Series B mention', 'Hiring signal'],
  voiceConfidenceScore: 0.9,
  reasoningLog: 'Used recent funding news for personalization',
  messageType: 'first_touch' as const,
}

const mockMessage = {
  id: 'msg-1',
  outreachId: 'outreach-1',
  messageType: 'first_touch',
  direction: 'outbound',
  subject: mockGeneratedEmail.subject,
  body: mockGeneratedEmail.body,
  status: 'draft',
}

const mockOutreachResearched = {
  id: 'outreach-1',
  campaignId: 'camp-1',
  userId: 'user-1',
  accountId: 'acc-1',
  accountName: 'Acme Corp',
  buyerEmail: 'vp@acme.com',
  researchBrief: mockResearchBrief,
  status: 'researched',
  autonomyAtCreation: 'L2',
  reasoningLog: 'Outreach initiated. ICP fit score: 0.82. Research brief generated with 1 news items and 1 pain indicators.',
  firstTouchId: null,
  voiceProfileId: null,
}

const mockOutreachFirstTouchPending = {
  ...mockOutreachResearched,
  status: 'first_touch_pending',
  firstTouchId: 'msg-1',
  voiceProfileId: 'vp-1',
  campaign: mockCampaign,
}

const mockOutreachFirstTouchSent = {
  ...mockOutreachResearched,
  status: 'first_touch_sent',
  firstTouchId: 'msg-1',
}

const mockOutreachAwaitingReply = {
  ...mockOutreachResearched,
  status: 'awaiting_reply',
  firstTouchId: 'msg-1',
}

const mockOutreachEngaged = {
  ...mockOutreachResearched,
  status: 'engaged',
}

const mockOutreachPaused = {
  ...mockOutreachResearched,
  status: 'paused',
}

// --- Tests ---

describe('OutreachService', () => {
  let outreachService: OutreachService

  beforeEach(() => {
    vi.clearAllMocks()
    outreachService = new OutreachService()

    // Default mock implementations
    vi.mocked(db.campaign.findUnique).mockResolvedValue(mockCampaign as any)
    vi.mocked(researchService.buildResearchBrief).mockResolvedValue(mockResearchBrief as any)
    vi.mocked(db.outreach.create).mockResolvedValue(mockOutreachResearched as any)
    vi.mocked(db.voiceProfile.findFirst).mockResolvedValue(mockVoiceProfile as any)
    vi.mocked(emailGenerationService.generateFirstTouch).mockResolvedValue(mockGeneratedEmail as any)
    vi.mocked(db.message.create).mockResolvedValue(mockMessage as any)
    vi.mocked(db.message.update).mockResolvedValue({ ...mockMessage, status: 'approved' } as any)
  })

  describe('State Machine Transitions', () => {
    it('should start outreach in "researched" state after research completes', async () => {
      const outreach = await outreachService.initiate(mockCampaign.id, mockAccount)

      expect(outreach.status).toBe('researched')
      expect(outreach.researchBrief).toBeDefined()
    })

    it('should transition to "first_touch_pending" when email is generated', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue({
        ...mockOutreachResearched,
        campaign: mockCampaign,
      } as any)
      vi.mocked(db.outreach.update).mockResolvedValue(mockOutreachFirstTouchPending as any)

      const outreach = await outreachService.generateFirstTouch('outreach-1')

      expect(outreach.status).toBe('first_touch_pending')
      expect(outreach.firstTouchId).toBeDefined()
    })

    it('should transition to "first_touch_sent" after approval (L2)', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachFirstTouchPending as any)
      vi.mocked(db.outreach.update).mockResolvedValue(mockOutreachFirstTouchSent as any)

      const outreach = await outreachService.approveFirstTouch('outreach-1', 'user-1')

      expect(outreach.status).toBe('first_touch_sent')
    })

    it('should auto-send first touch without approval at L3/L4', async () => {
      vi.mocked(db.campaign.findUnique).mockResolvedValue(mockCampaignL4 as any)

      // initiate -> creates researched outreach -> generateFirstTouch -> approveFirstTouch
      const researchedOutreach = { ...mockOutreachResearched, autonomyAtCreation: 'L4' }
      vi.mocked(db.outreach.create).mockResolvedValue(researchedOutreach as any)

      // generateFirstTouch call will findUnique the outreach
      vi.mocked(db.outreach.findUnique)
        .mockResolvedValueOnce({ ...researchedOutreach, campaign: mockCampaignL4 } as any) // generateFirstTouch lookup
        .mockResolvedValueOnce({ ...researchedOutreach, status: 'first_touch_pending', firstTouchId: 'msg-1' } as any) // approveFirstTouch lookup

      vi.mocked(db.outreach.update)
        .mockResolvedValueOnce({ ...researchedOutreach, status: 'first_touch_pending', firstTouchId: 'msg-1' } as any) // after generateFirstTouch
        .mockResolvedValueOnce({ ...researchedOutreach, status: 'first_touch_sent' } as any) // after approveFirstTouch

      const outreach = await outreachService.initiate('camp-l4', mockAccount)

      expect(outreach.status).toBe('first_touch_sent')
    })

    it('should transition to "awaiting_reply" after email is sent', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachFirstTouchSent as any)
      vi.mocked(db.outreach.update).mockResolvedValue(mockOutreachAwaitingReply as any)

      const outreach = await outreachService.markSent('outreach-1')

      expect(outreach.status).toBe('awaiting_reply')
    })

    it('should transition to "engaged" on positive reply', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachAwaitingReply as any)
      vi.mocked(db.outreach.update).mockResolvedValue(mockOutreachEngaged as any)

      const outreach = await outreachService.handleReply('outreach-1', { classification: 'positive' })

      expect(outreach.status).toBe('engaged')
    })

    it('should transition to "paused" on unsubscribe', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachAwaitingReply as any)
      vi.mocked(db.outreach.update).mockResolvedValue(mockOutreachPaused as any)

      const outreach = await outreachService.handleReply('outreach-1', { classification: 'unsubscribe' })

      expect(outreach.status).toBe('paused')
    })

    it('should stay in "awaiting_reply" after follow-up is sent', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachAwaitingReply as any)

      const outreach = await outreachService.sendFollowUp('outreach-1')

      expect(outreach.status).toBe('awaiting_reply')
    })

    it('should transition from "engaged" to "booked" on meeting acceptance', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachEngaged as any)
      vi.mocked(db.outreach.update).mockResolvedValue({ ...mockOutreachEngaged, status: 'booked' } as any)

      const outreach = await outreachService.bookMeeting('outreach-1', { slotAccepted: '2026-04-01T14:00:00Z' })

      expect(outreach.status).toBe('booked')
    })

    it('should transition from "engaged" back to "awaiting_reply" after objection rebuttal', async () => {
      vi.mocked(db.outreach.findUnique)
        .mockResolvedValueOnce(mockOutreachAwaitingReply as any)  // handleReply
        .mockResolvedValueOnce(mockOutreachEngaged as any)        // sendRebuttal

      vi.mocked(db.outreach.update)
        .mockResolvedValueOnce(mockOutreachEngaged as any)
        .mockResolvedValueOnce(mockOutreachAwaitingReply as any)

      await outreachService.handleReply('outreach-1', { classification: 'objection' })
      const updated = await outreachService.sendRebuttal('outreach-1')

      expect(updated.status).toBe('awaiting_reply')
    })

    it('should allow resuming a paused sequence', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachPaused as any)
      vi.mocked(db.outreach.update).mockResolvedValue(mockOutreachAwaitingReply as any)

      const outreach = await outreachService.resume('outreach-1')

      expect(outreach.status).toBe('awaiting_reply')
    })

    it('should prevent invalid state transitions', async () => {
      // Trying to book a meeting from "researched" state should fail
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachResearched as any)

      await expect(
        outreachService.bookMeeting('outreach-1', { slotAccepted: '2026-04-01T14:00:00Z' })
      ).rejects.toThrow('Invalid state transition')
    })
  })

  describe('Approval Workflow (L2)', () => {
    it('should require approval for first touch at L2', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue({
        ...mockOutreachResearched,
        campaign: mockCampaign,
      } as any)
      vi.mocked(db.outreach.update).mockResolvedValue(mockOutreachFirstTouchPending as any)

      const outreach = await outreachService.generateFirstTouch('outreach-1')

      expect(outreach.status).toBe('first_touch_pending')
      expect(outreach.requiresApproval).toBe(true)
    })

    it('should record who approved the first touch', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachFirstTouchPending as any)
      vi.mocked(db.outreach.update).mockResolvedValue({
        ...mockOutreachFirstTouchSent,
        approvedBy: 'user-1',
      } as any)

      const outreach = await outreachService.approveFirstTouch('outreach-1', 'user-1')

      // The db.message.update is called with approvalBy: userId
      expect(vi.mocked(db.message.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ approvalBy: 'user-1' }),
        })
      )
    })

    it('should allow rejection with a reason', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(mockOutreachFirstTouchPending as any)

      const outreach = await outreachService.rejectFirstTouch('outreach-1', 'user-1', 'Tone is too aggressive')

      expect(outreach.status).toBe('first_touch_pending')
      expect(outreach.rejectionReason).toBe('Tone is too aggressive')
    })

    it('should not require approval for follow-ups at L2', async () => {
      const followUp = await outreachService.scheduleFollowUp('outreach-1')

      expect(followUp.requiresApproval).toBe(false)
    })
  })

  describe('Outreach Logging', () => {
    it('should log reasoning for every outreach action', async () => {
      const outreach = await outreachService.initiate(mockCampaign.id, mockAccount)

      expect(outreach.reasoningLog).toBeDefined()
      expect(outreach.reasoningLog).toContain('ICP')
    })

    it('should record personalization sources used', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue({
        ...mockOutreachResearched,
        campaign: mockCampaign,
      } as any)
      vi.mocked(db.outreach.update).mockResolvedValue(mockOutreachFirstTouchPending as any)

      await outreachService.generateFirstTouch('outreach-1')

      expect(vi.mocked(db.message.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            personalizationUsed: expect.arrayContaining([expect.any(String)]),
          }),
        })
      )
    })

    it('should record the autonomy level at creation time', async () => {
      const outreach = await outreachService.initiate(mockCampaign.id, mockAccount)

      expect(vi.mocked(db.outreach.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            autonomyAtCreation: 'L2',
          }),
        })
      )
    })
  })
})
