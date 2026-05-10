import { db } from '../lib/db.js'
import { llmGenerateJSON } from '../lib/anthropic.js'
import { logger } from '../lib/logger.js'

interface ExtractedVoiceProfile {
  tone: string
  sentence_structure: string
  emoji_usage: boolean
  avg_message_length: number
  common_openers: string[]
  sign_off_patterns: string[]
  value_prop_style: string
  confidence_score: number
}

export class VoiceCloningService {
  async extractProfile(userId: string, emailTexts: string[]) {
    if (emailTexts.length < 30) {
      throw new Error('Minimum 30 email samples required')
    }

    const sampled = emailTexts.slice(0, 50)
    const emailsText = sampled.join('\n---EMAIL SEPARATOR---\n')

    const profile = await llmGenerateJSON<ExtractedVoiceProfile>(
      `You are an expert at analyzing writing style and tone. Extract the voice profile from these sales emails.
Return valid JSON with these fields:
{
  "tone": "description of tone (max 100 chars)",
  "sentence_structure": "description (max 100 chars)",
  "emoji_usage": boolean,
  "avg_message_length": number (word count),
  "common_openers": ["array", "of", "opening", "styles"],
  "sign_off_patterns": ["array", "of", "sign-offs"],
  "value_prop_style": "description (max 100 chars)",
  "confidence_score": number (0.0-1.0, based on consistency across samples)
}`,
      `Extract voice profile from these ${sampled.length} emails:\n\n${emailsText}`
    )

    const voiceProfile = await db.voiceProfile.create({
      data: {
        userId,
        tone: profile.tone,
        sentenceStructure: profile.sentence_structure,
        emojiUsage: profile.emoji_usage,
        avgMessageLength: profile.avg_message_length,
        commonOpeners: profile.common_openers,
        signOffPatterns: profile.sign_off_patterns,
        valuePropStyle: profile.value_prop_style,
        confidenceScore: profile.confidence_score,
        sourceEmailCount: sampled.length,
        extractedFeatures: profile as unknown as Record<string, unknown>,
        sourceEmails: sampled.map((_, i) => `email-${i + 1}`),
      },
    })

    logger.info('Voice profile extracted', {
      profileId: voiceProfile.id,
      confidence: profile.confidence_score,
      emailCount: sampled.length,
    })

    return voiceProfile
  }

  async validateProfile(profileId: string): Promise<{ valid: boolean; suggestion?: string }> {
    const profile = await db.voiceProfile.findUnique({ where: { id: profileId } })
    if (!profile) throw new Error('Voice profile not found')

    if (profile.confidenceScore >= 0.70) {
      return { valid: true }
    }

    return {
      valid: false,
      suggestion: profile.sourceEmailCount < 40
        ? 'Upload more emails (aim for 40-50 samples) to improve confidence.'
        : 'Try removing inconsistent emails and re-analyzing.',
    }
  }

  async getPreview(profileId: string) {
    const profile = await db.voiceProfile.findUnique({ where: { id: profileId } })
    if (!profile) throw new Error('Voice profile not found')

    return {
      tone: profile.tone,
      signOffPatterns: profile.signOffPatterns,
      avgMessageLength: profile.avgMessageLength,
      emojiUsage: profile.emojiUsage,
      sentenceStructure: profile.sentenceStructure,
      valuePropStyle: profile.valuePropStyle,
      confidenceScore: profile.confidenceScore,
      sourceEmailCount: profile.sourceEmailCount,
    }
  }

  async testGeneration(profileId: string) {
    const profile = await db.voiceProfile.findUnique({ where: { id: profileId } })
    if (!profile) throw new Error('Voice profile not found')

    const result = await llmGenerateJSON<{ subject: string; body: string }>(
      `You are a sales email writer. Write a sample cold email using this exact voice profile:
Tone: ${profile.tone}
Sentence Structure: ${profile.sentenceStructure}
Emoji Usage: ${profile.emojiUsage ? 'Yes' : 'No'}
Sign-off Style: ${profile.signOffPatterns[0] ?? 'Best'}
Avg Length: ~${profile.avgMessageLength} words

Return JSON: { "subject": "...", "body": "..." }`,
      'Generate a sample cold email to a VP of Sales at a mid-size SaaS company. Use the voice profile above.'
    )

    return result
  }

  async removeEmails(profileId: string, emailIds: string[]) {
    const profile = await db.voiceProfile.findUnique({ where: { id: profileId } })
    if (!profile) throw new Error('Voice profile not found')

    const currentEmails = (profile.sourceEmails as string[]) ?? []
    const remaining = currentEmails.filter(id => !emailIds.includes(id))

    await db.voiceProfile.update({
      where: { id: profileId },
      data: {
        sourceEmails: remaining,
        sourceEmailCount: remaining.length,
      },
    })

    return { remainingCount: remaining.length }
  }

  async approveProfile(profileId: string) {
    const profile = await db.voiceProfile.update({
      where: { id: profileId },
      data: { validatedByUser: true },
    })

    return { validatedByUser: profile.validatedByUser }
  }
}

export const voiceCloningService = new VoiceCloningService()
