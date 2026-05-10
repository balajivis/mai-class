import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VoiceCloningService } from '../../src/services/voiceCloning.service.js'

vi.mock('../../src/lib/db.js', () => ({
  db: {
    voiceProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('../../src/lib/anthropic.js', () => ({
  llmGenerateJSON: vi.fn(),
}))

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { db } from '../../src/lib/db.js'
import { llmGenerateJSON } from '../../src/lib/anthropic.js'

/**
 * TDD Test Suite: Voice Cloning Service
 *
 * Tests the extraction of tone, patterns, and confidence from rep email samples.
 * Spec refs: Technical Spec §2.1 Stage 3 (Voice Cloning), PRD F2, R1
 */

// --- Fixtures ---
const validEmailSamples = Array.from({ length: 35 }, (_, i) => ({
  id: `email-${i}`,
  subject: `Re: Follow up on our conversation`,
  body: `Hey there, just circling back on this. Let me know if you have 15 min this week. Cheers, Alex`,
  sentAt: new Date(`2026-03-${String(i + 1).padStart(2, '0')}`),
}))

const insufficientEmailSamples = validEmailSamples.slice(0, 10)

// Extract plain text bodies (service takes string[])
const validEmailTexts = validEmailSamples.map(e => e.body)
const insufficientEmailTexts = insufficientEmailSamples.map(e => e.body)

const mockLLMProfile = {
  tone: 'casual, direct',
  sentence_structure: 'short punchy lines',
  emoji_usage: false,
  avg_message_length: 15,
  common_openers: ['Hey there', 'Just circling back'],
  sign_off_patterns: ['Cheers', 'Best'],
  value_prop_style: 'concise and action-oriented',
  confidence_score: 0.88,
}

const mockStoredProfile = {
  id: 'vp-1',
  userId: 'user-1',
  tone: 'casual, direct',
  sentenceStructure: 'short punchy lines',
  emojiUsage: false,
  avgMessageLength: 15,
  commonOpeners: ['Hey there', 'Just circling back'],
  signOffPatterns: ['Cheers', 'Best'],
  valuePropStyle: 'concise and action-oriented',
  confidenceScore: 0.88,
  sourceEmailCount: 35,
  extractedFeatures: {},
  sourceEmails: Array.from({ length: 35 }, (_, i) => `email-${i + 1}`),
  validatedByUser: false,
}

// --- Tests ---

describe('VoiceCloningService', () => {
  let voiceCloningService: VoiceCloningService

  beforeEach(() => {
    voiceCloningService = new VoiceCloningService()
    vi.clearAllMocks()
  })

  describe('extractProfile (extractVoiceProfile)', () => {
    it('should extract a voice profile from 30+ email samples', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockLLMProfile)
      vi.mocked(db.voiceProfile.create).mockResolvedValue(mockStoredProfile as never)

      const profile = await voiceCloningService.extractProfile('user-1', validEmailTexts)
      expect(profile).toMatchObject({
        tone: expect.any(String),
        sentenceStructure: expect.any(String),
        emojiUsage: expect.any(Boolean),
        signOffPatterns: expect.any(Array),
        avgMessageLength: expect.any(Number),
        confidenceScore: expect.any(Number),
      })
    })

    it('should reject fewer than 30 email samples', async () => {
      await expect(
        voiceCloningService.extractProfile('user-1', insufficientEmailTexts)
      ).rejects.toThrow('Minimum 30 email samples required')
    })

    it('should return confidence score between 0 and 1', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockLLMProfile)
      vi.mocked(db.voiceProfile.create).mockResolvedValue(mockStoredProfile as never)

      const profile = await voiceCloningService.extractProfile('user-1', validEmailTexts)
      expect(profile.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(profile.confidenceScore).toBeLessThanOrEqual(1)
    })

    it('should achieve confidence >= 0.85 with 50 well-formed emails', async () => {
      const highConfidenceProfile = { ...mockLLMProfile, confidence_score: 0.91 }
      const highConfidenceStored = { ...mockStoredProfile, confidenceScore: 0.91, sourceEmailCount: 50 }
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(highConfidenceProfile)
      vi.mocked(db.voiceProfile.create).mockResolvedValue(highConfidenceStored as never)

      const fiftyEmails = Array.from({ length: 50 }, (_, i) => validEmailSamples[0].body)
      const profile = await voiceCloningService.extractProfile('user-1', fiftyEmails)
      expect(profile.confidenceScore).toBeGreaterThanOrEqual(0.85)
    })

    it('should detect emoji usage from email samples', async () => {
      const emojiProfile = { ...mockLLMProfile, emoji_usage: true }
      const emojiStored = { ...mockStoredProfile, emojiUsage: true }
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(emojiProfile)
      vi.mocked(db.voiceProfile.create).mockResolvedValue(emojiStored as never)

      const emojiEmails = validEmailSamples.map(e => e.body + ' 🚀')
      const profile = await voiceCloningService.extractProfile('user-1', emojiEmails)
      expect(profile.emojiUsage).toBe(true)
    })

    it('should extract common sign-off patterns', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockLLMProfile)
      vi.mocked(db.voiceProfile.create).mockResolvedValue(mockStoredProfile as never)

      const profile = await voiceCloningService.extractProfile('user-1', validEmailTexts)
      expect(profile.signOffPatterns.length).toBeGreaterThan(0)
      expect(profile.signOffPatterns).toContain('Cheers')
    })

    it('should compute average message length in words', async () => {
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(mockLLMProfile)
      vi.mocked(db.voiceProfile.create).mockResolvedValue(mockStoredProfile as never)

      const profile = await voiceCloningService.extractProfile('user-1', validEmailTexts)
      expect(profile.avgMessageLength).toBeGreaterThan(0)
      expect(Number.isInteger(profile.avgMessageLength)).toBe(true)
    })

    it('should flag low confidence when emails have inconsistent styles', async () => {
      const lowConfidenceProfile = { ...mockLLMProfile, confidence_score: 0.55 }
      const lowConfidenceStored = { ...mockStoredProfile, confidenceScore: 0.55 }
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce(lowConfidenceProfile)
      vi.mocked(db.voiceProfile.create).mockResolvedValue(lowConfidenceStored as never)

      const mixedEmails = [
        ...Array.from({ length: 15 }, () => 'Very formal. Regards, Dr. Smith.'),
        ...Array.from({ length: 20 }, () => 'yo whats good bro lmk'),
      ]
      const profile = await voiceCloningService.extractProfile('user-1', mixedEmails)
      expect(profile.confidenceScore).toBeLessThan(0.7)
    })
  })

  describe('validateProfile (validateVoiceProfile)', () => {
    it('should pass validation when confidence >= 0.70', async () => {
      vi.mocked(db.voiceProfile.findUnique).mockResolvedValue({
        ...mockStoredProfile,
        confidenceScore: 0.85,
        sourceEmailCount: 35,
      } as never)

      const result = await voiceCloningService.validateProfile('vp-1')
      expect(result.valid).toBe(true)
    })

    it('should fail validation when confidence < 0.70', async () => {
      vi.mocked(db.voiceProfile.findUnique).mockResolvedValue({
        ...mockStoredProfile,
        confidenceScore: 0.45,
        sourceEmailCount: 35,
      } as never)

      const result = await voiceCloningService.validateProfile('vp-1')
      expect(result.valid).toBe(false)
      expect(result.suggestion).toContain('confidence')
    })
  })

  describe('getPreview', () => {
    it('should return preview fields for a stored profile', async () => {
      vi.mocked(db.voiceProfile.findUnique).mockResolvedValue(mockStoredProfile as never)

      const preview = await voiceCloningService.getPreview('vp-1')
      expect(preview).toMatchObject({
        tone: expect.any(String),
        signOffPatterns: expect.any(Array),
        avgMessageLength: expect.any(Number),
        emojiUsage: expect.any(Boolean),
        confidenceScore: expect.any(Number),
      })
    })

    it('should throw when profile not found', async () => {
      vi.mocked(db.voiceProfile.findUnique).mockResolvedValue(null)

      await expect(voiceCloningService.getPreview('missing-id')).rejects.toThrow('Voice profile not found')
    })
  })

  describe('testGeneration', () => {
    it('should generate a sample email using the voice profile', async () => {
      vi.mocked(db.voiceProfile.findUnique).mockResolvedValue(mockStoredProfile as never)
      vi.mocked(llmGenerateJSON).mockResolvedValueOnce({
        subject: 'Quick question for you',
        body: 'Hey, just wanted to reach out. Worth a chat? Cheers, Alex',
      })

      const result = await voiceCloningService.testGeneration('vp-1')
      expect(result.subject).toBeDefined()
      expect(result.body).toBeDefined()
    })
  })

  describe('removeEmails', () => {
    it('should remove specified emails and return remaining count', async () => {
      const profileWithEmails = {
        ...mockStoredProfile,
        sourceEmails: ['email-1', 'email-2', 'email-3', 'email-4', 'email-5'],
        sourceEmailCount: 5,
      }
      vi.mocked(db.voiceProfile.findUnique).mockResolvedValue(profileWithEmails as never)
      vi.mocked(db.voiceProfile.update).mockResolvedValue({
        ...profileWithEmails,
        sourceEmails: ['email-3', 'email-4', 'email-5'],
        sourceEmailCount: 3,
      } as never)

      const result = await voiceCloningService.removeEmails('vp-1', ['email-1', 'email-2'])
      expect(result.remainingCount).toBe(3)
    })
  })

  describe('approveProfile', () => {
    it('should set validatedByUser to true', async () => {
      vi.mocked(db.voiceProfile.update).mockResolvedValue({
        ...mockStoredProfile,
        validatedByUser: true,
      } as never)

      const result = await voiceCloningService.approveProfile('vp-1')
      expect(result.validatedByUser).toBe(true)
    })
  })

  describe('retrainVoiceProfile', () => {
    it('should accept additional emails and re-analyze', async () => {
      // Re-extracting profile with combined emails
      vi.mocked(llmGenerateJSON).mockResolvedValue({ ...mockLLMProfile, confidence_score: 0.93 })
      vi.mocked(db.voiceProfile.create).mockResolvedValue({
        ...mockStoredProfile,
        confidenceScore: 0.93,
        sourceEmailCount: 50,
      } as never)

      const additionalEmails = Array.from({ length: 20 }, () => validEmailSamples[0].body)
      const combined = [...validEmailTexts, ...additionalEmails]
      const retrained = await voiceCloningService.extractProfile('user-1', combined)
      expect(retrained.confidenceScore).toBeGreaterThanOrEqual(mockStoredProfile.confidenceScore)
    })
  })
})
