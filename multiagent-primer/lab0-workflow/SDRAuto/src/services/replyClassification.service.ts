import { llmGenerateJSON } from '../lib/anthropic.js'
import { logger } from '../lib/logger.js'
import type { ReplyClassification, ReplyAction, ClassificationResult, AutonomyLevel } from '../types/index.js'

interface ReplyInput {
  id: string
  senderEmail: string
  subject: string
  body: string
}

export class ReplyClassificationService {
  async classifyReply(reply: ReplyInput): Promise<ClassificationResult> {
    const result = await llmGenerateJSON<{
      classification: ReplyClassification
      confidence: number
      objection_type?: string
      extracted_sentiment: string
      extracted_intent: string
      reasoning: string
    }>(
      `You are a sales reply classifier. Classify this email reply into one of these categories:
- "positive": Shows interest, willing to discuss, asks for more info
- "objection": Raises concern (price, timing, fit, competitor, budget)
- "unsubscribe": Explicit opt-out ("stop emailing", "remove me")
- "noise": Out-of-office, bounce, spam, auto-reply
- "unclear": Ambiguous, cannot determine intent

Return JSON:
{
  "classification": "positive|objection|unsubscribe|noise|unclear",
  "confidence": 0.0-1.0,
  "objection_type": "already_using_competitor|budget_constraint|bad_timing|no_authority|not_interested" (only for objections),
  "extracted_sentiment": "interested|frustrated|curious|neutral|hostile|confused",
  "extracted_intent": "free text summary of what the prospect wants",
  "reasoning": "why this classification was chosen"
}

Be conservative: if unsure, classify as "unclear" with low confidence.
Unsubscribe requests should always have confidence >= 0.9.`,
      `Classify this reply:
From: ${reply.senderEmail}
Subject: ${reply.subject}
Body: ${reply.body}`
    )

    const recommendedAction = this.determineAction(
      result.classification,
      result.confidence,
      'L2' // Default; caller can override
    )

    logger.info('Reply classified', {
      replyId: reply.id,
      classification: result.classification,
      confidence: result.confidence,
    })

    return {
      classification: result.classification,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      objectionType: result.objection_type,
      extractedSentiment: result.extracted_sentiment,
      extractedIntent: result.extracted_intent,
      recommendedAction,
      reasoningLog: result.reasoning,
    }
  }

  determineAction(
    classification: ReplyClassification,
    confidence: number,
    autonomyLevel: AutonomyLevel
  ): ReplyAction {
    // L1: escalate everything
    if (autonomyLevel === 'L1') return 'escalate'

    // Low confidence: always escalate
    if (confidence < 0.7) return 'escalate'

    switch (classification) {
      case 'unsubscribe':
        return 'pause_sequence'
      case 'noise':
        return 'archive'
      case 'positive':
        if (autonomyLevel === 'L2') return 'escalate'
        return 'book_meeting' // L3, L4
      case 'objection':
        if (autonomyLevel === 'L2') return 'escalate'
        if (autonomyLevel === 'L3' && confidence >= 0.7) return 'auto_rebuttal'
        if (autonomyLevel === 'L4') return 'auto_rebuttal'
        return 'escalate'
      case 'unclear':
        return 'escalate'
      default:
        return 'escalate'
    }
  }
}

export const replyClassificationService = new ReplyClassificationService()
