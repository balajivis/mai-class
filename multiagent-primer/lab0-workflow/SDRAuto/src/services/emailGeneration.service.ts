import { llmGenerateJSON } from '../lib/anthropic.js'
import { logger } from '../lib/logger.js'
import type { ResearchBrief, GeneratedEmail } from '../types/index.js'

interface VoiceProfileData {
  id: string
  tone: string
  sentenceStructure: string
  signOffPatterns: string[]
  emojiUsage: boolean
  avgMessageLength: number
  confidenceScore: number
}

export class EmailGenerationService {
  private defaultCadence = [3, 7, 10] // days between follow-ups

  async generateFirstTouch(
    voiceProfile: VoiceProfileData,
    researchBrief: ResearchBrief,
    buyerEmail: string
  ): Promise<GeneratedEmail> {
    const newsContext = researchBrief.recentNews
      .map(n => `${n.headline} (${n.date})`)
      .join('; ')

    const painContext = researchBrief.painIndicators
      .map(p => `${p.signal} (confidence: ${p.confidence})`)
      .join('; ')

    const result = await llmGenerateJSON<{
      subject: string
      body: string
      personalization_used: string[]
      reasoning: string
    }>(
      `You are an expert sales email writer. Generate a personalized first-touch cold email.

VOICE PROFILE:
Tone: ${voiceProfile.tone}
Sentence Structure: ${voiceProfile.sentenceStructure}
Emoji Usage: ${voiceProfile.emojiUsage ? 'Yes' : 'No'}
Sign-off Style: ${voiceProfile.signOffPatterns[0] ?? 'Best'}
Target Length: ~${voiceProfile.avgMessageLength} words

RULES:
- DO NOT mention that this is AI-generated
- DO NOT use phrases like "As an AI" or "language model"
- Include at least 2 company-specific personalizations
- Use the sign-off pattern from the voice profile
- Include a reply-friendly CTA (e.g., "worth a chat?", "curious if...", "open to...")
- Keep within +/- 30% of target word count
- Reference specific company news or signals when available

Return JSON:
{
  "subject": "email subject line",
  "body": "full email body text",
  "personalization_used": ["signal1", "signal2"],
  "reasoning": "why these personalization choices were made"
}`,
      `Generate a first-touch email for:
Company: ${researchBrief.companyName}
Buyer Role: ${researchBrief.buyerPersona.role} (${researchBrief.buyerPersona.seniority})
Recent News: ${newsContext || 'None available'}
Pain Indicators: ${painContext || 'None detected'}
Buyer Goals: ${researchBrief.buyerPersona.likelyGoals.join(', ')}
ICP Fit Score: ${researchBrief.icpFitScore}`
    )

    logger.info('First touch generated', {
      company: researchBrief.companyName,
      personalizations: result.personalization_used.length,
    })

    return {
      subject: result.subject,
      body: result.body,
      recipientEmail: buyerEmail,
      personalizationUsed: result.personalization_used,
      voiceConfidenceScore: voiceProfile.confidenceScore,
      reasoningLog: result.reasoning,
      messageType: 'first_touch',
    }
  }

  async generateFollowUp(
    voiceProfile: VoiceProfileData,
    researchBrief: ResearchBrief,
    context: { priorMessageId: string; daysSinceLast: number }
  ): Promise<GeneratedEmail> {
    const result = await llmGenerateJSON<{
      subject: string
      body: string
      personalization_used: string[]
      reasoning: string
    }>(
      `You are a sales email writer. Generate a follow-up email that is distinctly different from the original.

VOICE PROFILE:
Tone: ${voiceProfile.tone}
Sign-off: ${voiceProfile.signOffPatterns[0] ?? 'Best'}

RULES:
- Keep it shorter than the first touch
- Reference the previous email without being pushy
- Offer a new angle or value proposition
- DO NOT repeat the same opening or CTA from the first email

Return JSON: { "subject": "...", "body": "...", "personalization_used": [...], "reasoning": "..." }`,
      `Write follow-up #${Math.ceil(context.daysSinceLast / 3)} for ${researchBrief.companyName}.
Days since last email: ${context.daysSinceLast}
Company: ${researchBrief.companyName}
Buyer: ${researchBrief.buyerPersona.role}`
    )

    return {
      subject: result.subject,
      body: result.body,
      recipientEmail: '',
      personalizationUsed: result.personalization_used,
      voiceConfidenceScore: voiceProfile.confidenceScore,
      reasoningLog: result.reasoning,
      messageType: 'follow_up',
    }
  }

  async generateSubjectVariants(
    researchBrief: ResearchBrief,
    voiceProfile: VoiceProfileData
  ): Promise<Array<{ subject: string; predictedOpenRate: number }>> {
    const result = await llmGenerateJSON<{
      variants: Array<{ subject: string; predicted_open_rate: number }>
    }>(
      `Generate 3 subject line variants for a cold sales email. Each should have a different angle.
Return JSON: { "variants": [{ "subject": "...", "predicted_open_rate": 0.0-1.0 }] }`,
      `Company: ${researchBrief.companyName}
Buyer: ${researchBrief.buyerPersona.role}
Tone: ${voiceProfile.tone}`
    )

    return result.variants.map(v => ({
      subject: v.subject,
      predictedOpenRate: v.predicted_open_rate,
    }))
  }

  getDefaultCadence(): number[] {
    return [...this.defaultCadence]
  }
}

export const emailGenerationService = new EmailGenerationService()
