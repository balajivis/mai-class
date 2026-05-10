import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockDb, mockVoiceCloningService } = vi.hoisted(() => {
  const mockDb = {
    voiceProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }

  const mockVoiceCloningService = {
    extractProfile: vi.fn(),
    validateProfile: vi.fn(),
    getPreview: vi.fn(),
    testGeneration: vi.fn(),
    removeEmails: vi.fn(),
    approveProfile: vi.fn(),
  }

  return { mockDb, mockVoiceCloningService }
})

vi.mock('../../src/lib/db.js', () => ({ db: mockDb }))
vi.mock('../../src/services/voiceCloning.service.js', () => ({
  voiceCloningService: mockVoiceCloningService,
}))

import { appRouter } from '../../src/routers/index.js'
import type { Context } from '../../src/trpc.js'

/**
 * TDD Test Suite: Voice Profile Router
 *
 * Tests voice profile upload, validation, preview, and management.
 * Spec refs: Technical Spec §2.3, PRD F2, R1, M6
 */

const thirtyValidEmails = Array.from({ length: 30 }, (_, i) => `Email ${i + 1}: Subject line\n\nBody text here.`)
const tenEmails = Array.from({ length: 10 }, (_, i) => `Email ${i + 1}: Subject line\n\nBody text here.`)

describe('VoiceProfileRouter', () => {
  const ctx: Context = {
    req: {} as any,
    user: { id: 'user-1', email: 'test@test.com', role: 'founder' },
  }
  const caller = appRouter.createCaller(ctx)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('upload', () => {
    it('should accept 30+ email samples and create a voice profile', async () => {
      mockVoiceCloningService.extractProfile.mockResolvedValue({
        id: 'vp-1',
        confidenceScore: 0.85,
        tone: 'professional and friendly',
        sourceEmailCount: 30,
      })

      const result = await caller.voiceProfile.upload({ emails: thirtyValidEmails })
      expect(result.profileId).toBeDefined()
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0)
    })

    it('should reject fewer than 30 email samples', async () => {
      await expect(
        caller.voiceProfile.upload({ emails: tenEmails })
      ).rejects.toThrow()
    })

    it('should accept .eml, .txt, and raw text formats', async () => {
      const mixedFormatEmails = [
        ...Array.from({ length: 28 }, (_, i) => `Email ${i + 1}: plain text`),
        'From: user@example.com\nTo: vp@acme.com\nSubject: Test\n\nBody text here.',
        'Dear John,\n\nI wanted to reach out about...\n\nBest,\nJane',
      ]

      mockVoiceCloningService.extractProfile.mockResolvedValue({
        id: 'vp-2',
        confidenceScore: 0.75,
        tone: 'casual',
        sourceEmailCount: 30,
      })

      const result = await caller.voiceProfile.upload({ emails: mixedFormatEmails })
      expect(result.profileId).toBeDefined()
    })

    it('should complete extraction in < 30 seconds for 50 emails', async () => {
      const fiftyEmails = Array.from({ length: 50 }, (_, i) => `Email ${i + 1}: text`)

      mockVoiceCloningService.extractProfile.mockResolvedValue({
        id: 'vp-3',
        confidenceScore: 0.9,
        tone: 'direct',
        sourceEmailCount: 50,
      })

      const start = Date.now()
      await caller.voiceProfile.upload({ emails: fiftyEmails })
      expect(Date.now() - start).toBeLessThan(30_000)
    })
  })

  describe('validate', () => {
    it('should pass validation when confidence >= 0.70', async () => {
      mockDb.voiceProfile.findFirst.mockResolvedValue({
        id: 'vp-high-conf',
        userId: 'user-1',
        confidenceScore: 0.85,
      })
      mockVoiceCloningService.validateProfile.mockResolvedValue({ valid: true })

      const result = await caller.voiceProfile.validate({ profileId: 'vp-high-conf' })
      expect(result.valid).toBe(true)
    })

    it('should fail validation with guidance when confidence < 0.70', async () => {
      mockDb.voiceProfile.findFirst.mockResolvedValue({
        id: 'vp-low-conf',
        userId: 'user-1',
        confidenceScore: 0.55,
      })
      mockVoiceCloningService.validateProfile.mockResolvedValue({
        valid: false,
        suggestion: 'Upload more emails to improve confidence.',
      })

      const result = await caller.voiceProfile.validate({ profileId: 'vp-low-conf' })
      expect(result.valid).toBe(false)
      expect(result.suggestion).toContain('more emails')
    })
  })

  describe('preview', () => {
    it('should return voice profile summary (tone, sign-offs, length)', async () => {
      mockDb.voiceProfile.findFirst.mockResolvedValue({
        id: 'vp-1',
        userId: 'user-1',
        confidenceScore: 0.85,
      })
      mockVoiceCloningService.getPreview.mockResolvedValue({
        tone: 'professional and direct',
        signOffPatterns: ['Best,', 'Thanks,', 'Cheers,'],
        avgMessageLength: 120,
        emojiUsage: false,
        sentenceStructure: 'short and punchy',
        valuePropStyle: 'ROI-focused',
        confidenceScore: 0.85,
        sourceEmailCount: 30,
      })

      const preview = await caller.voiceProfile.preview({ profileId: 'vp-1' })
      expect(preview).toMatchObject({
        tone: expect.any(String),
        signOffPatterns: expect.any(Array),
        avgMessageLength: expect.any(Number),
        emojiUsage: expect.any(Boolean),
      })
    })
  })

  describe('test-generation', () => {
    it('should generate a sample email using the voice profile', async () => {
      mockDb.voiceProfile.findFirst.mockResolvedValue({
        id: 'vp-1',
        userId: 'user-1',
      })
      mockVoiceCloningService.testGeneration.mockResolvedValue({
        subject: 'Quick question about your sales process',
        body: 'Hi there,\n\nI noticed your company recently...\n\nBest,\nJane',
      })

      const sample = await caller.voiceProfile.testGeneration({ profileId: 'vp-1' })
      expect(sample.subject).toBeDefined()
      expect(sample.body).toBeDefined()
      expect(sample.body.length).toBeGreaterThan(0)
    })
  })

  describe('user curation', () => {
    it('should allow user to remove outlier emails before finalizing', async () => {
      mockDb.voiceProfile.findFirst.mockResolvedValue({
        id: 'vp-1',
        userId: 'user-1',
        sourceEmailCount: 30,
        sourceEmails: Array.from({ length: 30 }, (_, i) => `email-${i + 1}`),
      })
      mockVoiceCloningService.removeEmails.mockResolvedValue({ remainingCount: 28 })

      const result = await caller.voiceProfile.removeEmails({
        profileId: 'vp-1',
        emailIds: ['email-3', 'email-17'],
      })
      expect(result.remainingCount).toBe(28)
    })

    it('should re-analyze after email removal', async () => {
      // Preview before
      mockDb.voiceProfile.findFirst.mockResolvedValue({
        id: 'vp-1',
        userId: 'user-1',
      })
      mockVoiceCloningService.getPreview
        .mockResolvedValueOnce({ confidenceScore: 0.85, tone: 'professional', signOffPatterns: ['Best,'], avgMessageLength: 120, emojiUsage: false })
        .mockResolvedValueOnce({ confidenceScore: 0.78, tone: 'professional', signOffPatterns: ['Best,'], avgMessageLength: 115, emojiUsage: false })

      const before = await caller.voiceProfile.preview({ profileId: 'vp-1' })

      mockVoiceCloningService.removeEmails.mockResolvedValue({ remainingCount: 29 })
      await caller.voiceProfile.removeEmails({ profileId: 'vp-1', emailIds: ['email-3'] })

      const after = await caller.voiceProfile.preview({ profileId: 'vp-1' })
      // Confidence may change after re-analysis
      expect(after.confidenceScore).not.toBe(before.confidenceScore)
    })

    it('should allow user to validate (mark as approved) a voice profile', async () => {
      mockDb.voiceProfile.findFirst.mockResolvedValue({
        id: 'vp-1',
        userId: 'user-1',
        validatedByUser: false,
      })
      mockVoiceCloningService.approveProfile.mockResolvedValue({ validatedByUser: true })

      const result = await caller.voiceProfile.approve({ profileId: 'vp-1' })
      expect(result.validatedByUser).toBe(true)
    })
  })
})
