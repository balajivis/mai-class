import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmailGenerationService } from '../../src/services/emailGeneration.service.js'
import { llmGenerateJSON } from '../../src/lib/anthropic.js'

vi.mock('../../src/lib/anthropic.js', () => ({
  llmGenerateJSON: vi.fn(),
}))

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

/**
 * TDD Test Suite: Email Generation Service
 *
 * Tests personalized email generation using voice profile + research brief.
 * Spec refs: Technical Spec §2.1 Stage 3 (Outreach), PRD F3, F4
 */

// --- Fixtures ---
const mockVoiceProfile = {
  id: 'vp-1',
  tone: 'direct, data-driven, casual',
  sentenceStructure: 'short punchy lines',
  signOffPatterns: ['Cheers', 'Best'],
  emojiUsage: false,
  avgMessageLength: 85,
  confidenceScore: 0.91,
}

const mockResearchBrief = {
  accountId: 'acc-1',
  companyName: 'Acme Corp',
  recentNews: [{ headline: 'Acme raises $20M Series B', date: '2026-03-15', sourceUrl: 'https://example.com' }],
  painIndicators: [{ signal: 'Hiring 3 SDRs', confidence: 0.88, date: '2026-03-10' }],
  buyerPersona: { role: 'VP Sales', seniority: 'senior', likelyGoals: ['scale outbound', 'reduce CAC'] },
  icpFitScore: 0.92,
}

const mockBuyerEmail = 'vp@acme.com'

const mockFirstTouchLLMResult = {
  subject: 'Congrats on the Series B — quick question',
  body: 'Hey, saw the Series B news — congrats! Curious if scaling outbound is on the radar. Worth a chat? Cheers, Alex',
  personalization_used: ['Series B funding', 'Hiring 3 SDRs'],
  reasoning: 'Used recent funding and hiring signals as personalization hooks',
}

const mockFollowUpLLMResult = {
  subject: 'Re: quick question',
  body: 'Just circling back — still curious if this is relevant. Let me know. Best, Alex',
  personalization_used: ['Acme Corp growth'],
  reasoning: 'Shorter follow-up referencing prior email',
}

const mockSubjectVariantsLLMResult = {
  variants: [
    { subject: 'Congrats on the Series B', predicted_open_rate: 0.32 },
    { subject: 'Quick question for VP Sales at Acme', predicted_open_rate: 0.28 },
    { subject: 'Scaling outbound at Acme?', predicted_open_rate: 0.35 },
  ],
}

// --- Tests ---

describe('EmailGenerationService', () => {
  let emailGenerationService: EmailGenerationService

  beforeEach(() => {
    emailGenerationService = new EmailGenerationService()
    vi.clearAllMocks()
  })

  describe('generateFirstTouch', () => {
    it('should generate a first-touch email with subject and body', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockFirstTouchLLMResult)

      const email = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      expect(email).toMatchObject({
        subject: expect.any(String),
        body: expect.any(String),
        recipientEmail: mockBuyerEmail,
        personalizationUsed: expect.any(Array),
      })
    })

    it('should include at least 2 company-specific personalizations', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockFirstTouchLLMResult)

      const email = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      expect(email.personalizationUsed.length).toBeGreaterThanOrEqual(2)
    })

    it('should match the voice profile tone (no obvious AI markers)', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockFirstTouchLLMResult)

      const email = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      expect(email.body).not.toContain('As an AI')
      expect(email.body).not.toContain('I am an artificial')
      expect(email.body).not.toContain('language model')
    })

    it('should use the voice profile sign-off pattern', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockFirstTouchLLMResult)

      const email = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      const hasMatchingSignOff = mockVoiceProfile.signOffPatterns.some(so => email.body.includes(so))
      expect(hasMatchingSignOff).toBe(true)
    })

    it('should include a reply-friendly CTA', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockFirstTouchLLMResult)

      const email = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      const ctaPatterns = ['reply', 'curious', 'interested', 'worth a chat', 'open to']
      const hasCta = ctaPatterns.some(p => email.body.toLowerCase().includes(p))
      expect(hasCta).toBe(true)
    })

    it('should keep message length within voice profile avg +/- 30%', async () => {
      // Use a body with word count close to avgMessageLength (85)
      const bodyWithGoodLength = Array(85).fill('word').join(' ') + ' Cheers, Alex'
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce({
        ...mockFirstTouchLLMResult,
        body: bodyWithGoodLength,
      })

      const email = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      const wordCount = email.body.split(/\s+/).length
      const min = mockVoiceProfile.avgMessageLength * 0.7
      const max = mockVoiceProfile.avgMessageLength * 1.3
      expect(wordCount).toBeGreaterThanOrEqual(min)
      expect(wordCount).toBeLessThanOrEqual(max)
    })

    it('should reference company-specific news when available', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockFirstTouchLLMResult)

      const email = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      expect(email.body.toLowerCase()).toContain('series b')
    })

    it('should generate a reasoning log explaining personalization choices', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockFirstTouchLLMResult)

      const email = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      expect(email.reasoningLog).toBeDefined()
      expect(email.reasoningLog.length).toBeGreaterThan(0)
    })
  })

  describe('generateFollowUp', () => {
    it('should generate a follow-up email based on prior outreach', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockFollowUpLLMResult)

      const followUp = await emailGenerationService.generateFollowUp(
        mockVoiceProfile,
        mockResearchBrief,
        { priorMessageId: 'msg-1', daysSinceLast: 3 }
      )
      expect(followUp.messageType).toBe('follow_up')
      expect(followUp.body).toBeDefined()
    })

    it('should vary content from the original first touch', async () => {
      vi.mocked(llmGenerateJSON)
        .mockResolvedValueOnce(mockFirstTouchLLMResult)
        .mockResolvedValueOnce(mockFollowUpLLMResult)

      const firstTouch = await emailGenerationService.generateFirstTouch(mockVoiceProfile, mockResearchBrief, mockBuyerEmail)
      const followUp = await emailGenerationService.generateFollowUp(
        mockVoiceProfile,
        mockResearchBrief,
        { priorMessageId: 'msg-1', daysSinceLast: 3 }
      )
      expect(followUp.body).not.toBe(firstTouch.body)
    })

    it('should respect cadence rules (Day 3, Day 7, Day 10)', async () => {
      const cadence = emailGenerationService.getDefaultCadence()
      expect(cadence).toEqual([3, 7, 10])
    })
  })

  describe('generateSubjectVariants', () => {
    it('should generate 3 subject line variants', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockSubjectVariantsLLMResult)

      const variants = await emailGenerationService.generateSubjectVariants(mockResearchBrief, mockVoiceProfile)
      expect(variants).toHaveLength(3)
      variants.forEach(v => {
        expect(v.subject).toBeDefined()
        expect(v.predictedOpenRate).toBeGreaterThan(0)
      })
    })
  })
})
