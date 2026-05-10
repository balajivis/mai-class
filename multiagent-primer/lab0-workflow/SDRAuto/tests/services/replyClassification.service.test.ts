import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReplyClassificationService } from '../../src/services/replyClassification.service.js'

/**
 * TDD Test Suite: Reply Classification Service
 *
 * Tests inbox reply classification into positive/objection/unsubscribe/noise/unclear.
 * Spec refs: Technical Spec §2.1 Stage 4, PRD F5, App Flow §2.D
 */

// --- Fixtures ---
const positiveReply = {
  id: 'reply-1',
  senderEmail: 'vp@acme.com',
  subject: 'Re: Quick question about your outbound tool',
  body: 'This sounds really interesting — I would love to learn more. Do you have time next Tuesday?',
}

const objectionReply = {
  id: 'reply-2',
  senderEmail: 'cto@beta.io',
  subject: 'Re: Scaling your outbound',
  body: "Thanks for reaching out, but we're already using Outreach.io and are locked into a 12-month contract.",
}

const unsubscribeReply = {
  id: 'reply-3',
  senderEmail: 'info@gamma.co',
  subject: 'Re: Partnership opportunity',
  body: 'Please remove me from your mailing list. Do not contact me again.',
}

const noiseReply = {
  id: 'reply-4',
  senderEmail: 'autoreply@delta.com',
  subject: 'Out of Office',
  body: 'I am currently out of the office and will return on April 5th. For urgent matters, contact jane@delta.com.',
}

const unclearReply = {
  id: 'reply-5',
  senderEmail: 'pm@epsilon.dev',
  subject: 'Re: Quick question',
  body: 'k',
}

// Mock the LLM module
vi.mock('../../src/lib/anthropic.js', () => ({
  llmGenerateJSON: vi.fn(),
}))

import { llmGenerateJSON } from '../../src/lib/anthropic.js'
const mockLlm = vi.mocked(llmGenerateJSON)

const service = new ReplyClassificationService()

// --- Tests ---

describe('ReplyClassificationService', () => {
  describe('classifyReply', () => {
    it('should classify a positive reply correctly', async () => {
      mockLlm.mockResolvedValueOnce({
        classification: 'positive',
        confidence: 0.92,
        extracted_sentiment: 'interested',
        extracted_intent: 'Wants to learn more and meet',
        reasoning: 'Reply shows clear interest with time proposal',
      })
      const result = await service.classifyReply(positiveReply)
      expect(result.classification).toBe('positive')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      // At L2 default, positive replies get escalated not book_meeting
      expect(result.recommendedAction).toBe('escalate')
    })

    it('should classify an objection reply and extract objection type', async () => {
      mockLlm.mockResolvedValueOnce({
        classification: 'objection',
        confidence: 0.88,
        objection_type: 'already_using_competitor',
        extracted_sentiment: 'neutral',
        extracted_intent: 'Using competitor, locked in contract',
        reasoning: 'Mentions existing vendor and contract lock-in',
      })
      const result = await service.classifyReply(objectionReply)
      expect(result.classification).toBe('objection')
      expect(result.objectionType).toBe('already_using_competitor')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should classify an unsubscribe reply correctly', async () => {
      mockLlm.mockResolvedValueOnce({
        classification: 'unsubscribe',
        confidence: 0.98,
        extracted_sentiment: 'hostile',
        extracted_intent: 'Wants to be removed from mailing list',
        reasoning: 'Explicit opt-out request',
      })
      const result = await service.classifyReply(unsubscribeReply)
      expect(result.classification).toBe('unsubscribe')
      expect(result.recommendedAction).toBe('pause_sequence')
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('should classify noise (out-of-office, bounces) correctly', async () => {
      mockLlm.mockResolvedValueOnce({
        classification: 'noise',
        confidence: 0.95,
        extracted_sentiment: 'neutral',
        extracted_intent: 'Auto-reply, person is unavailable',
        reasoning: 'Out-of-office auto-reply detected',
      })
      const result = await service.classifyReply(noiseReply)
      expect(result.classification).toBe('noise')
      expect(result.recommendedAction).toBe('archive')
    })

    it('should classify ambiguous replies as unclear with low confidence', async () => {
      mockLlm.mockResolvedValueOnce({
        classification: 'unclear',
        confidence: 0.35,
        extracted_sentiment: 'confused',
        extracted_intent: 'Unknown',
        reasoning: 'Single character reply, impossible to determine intent',
      })
      const result = await service.classifyReply(unclearReply)
      expect(result.classification).toBe('unclear')
      expect(result.confidence).toBeLessThan(0.7)
      expect(result.recommendedAction).toBe('escalate')
    })

    it('should always return a reasoning log', async () => {
      mockLlm.mockResolvedValueOnce({
        classification: 'positive',
        confidence: 0.90,
        extracted_sentiment: 'interested',
        extracted_intent: 'Wants demo',
        reasoning: 'Reply indicates clear buying intent',
      })
      const result = await service.classifyReply(positiveReply)
      expect(result.reasoningLog).toBeDefined()
      expect(result.reasoningLog.length).toBeGreaterThan(0)
    })

    it('should extract sentiment from reply text', async () => {
      mockLlm.mockResolvedValueOnce({
        classification: 'positive',
        confidence: 0.90,
        extracted_sentiment: 'interested',
        extracted_intent: 'Wants to schedule a call',
        reasoning: 'Positive tone',
      })
      const result = await service.classifyReply(positiveReply)
      expect(result.extractedSentiment).toBeDefined()
    })

    it('should return confidence between 0 and 1', async () => {
      const replies = [positiveReply, objectionReply, unsubscribeReply, noiseReply, unclearReply]
      const classifications = ['positive', 'objection', 'unsubscribe', 'noise', 'unclear'] as const
      for (let i = 0; i < replies.length; i++) {
        mockLlm.mockResolvedValueOnce({
          classification: classifications[i],
          confidence: 0.5 + i * 0.1,
          extracted_sentiment: 'neutral',
          extracted_intent: 'test',
          reasoning: 'test',
        })
        const result = await service.classifyReply(replies[i])
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('determineAction (by autonomy level)', () => {
    it('L1: should escalate all replies regardless of classification', () => {
      const action = service.determineAction('positive', 0.95, 'L1')
      expect(action).toBe('escalate')
    })

    it('L2: should auto-handle unsubscribe', () => {
      const action = service.determineAction('unsubscribe', 0.95, 'L2')
      expect(action).toBe('pause_sequence')
    })

    it('L2: should auto-archive noise', () => {
      const action = service.determineAction('noise', 0.90, 'L2')
      expect(action).toBe('archive')
    })

    it('L2: should escalate positive replies', () => {
      const action = service.determineAction('positive', 0.92, 'L2')
      expect(action).toBe('escalate')
    })

    it('L2: should escalate objections', () => {
      const action = service.determineAction('objection', 0.85, 'L2')
      expect(action).toBe('escalate')
    })

    it('L3: should auto-rebuttal common objections when confident', () => {
      const action = service.determineAction('objection', 0.85, 'L3')
      expect(action).toBe('auto_rebuttal')
    })

    it('L3: should escalate objections when confidence < 0.7', () => {
      const action = service.determineAction('objection', 0.55, 'L3')
      expect(action).toBe('escalate')
    })

    it('L3: should propose calendar for positive replies', () => {
      const action = service.determineAction('positive', 0.92, 'L3')
      expect(action).toBe('book_meeting')
    })

    it('L4: should auto-handle all classifications', () => {
      const actionPositive = service.determineAction('positive', 0.92, 'L4')
      expect(actionPositive).toBe('book_meeting')
      const actionObjection = service.determineAction('objection', 0.80, 'L4')
      expect(actionObjection).toBe('auto_rebuttal')
    })

    it('L4: should still escalate unclear replies with confidence < 0.7', () => {
      const action = service.determineAction('unclear', 0.50, 'L4')
      expect(action).toBe('escalate')
    })
  })
})
