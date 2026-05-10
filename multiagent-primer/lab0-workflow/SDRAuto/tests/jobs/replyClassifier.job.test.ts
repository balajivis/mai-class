import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockLlmGenerateJSON } = vi.hoisted(() => {
  return { mockLlmGenerateJSON: vi.fn() }
})

vi.mock('../../src/lib/anthropic.js', () => ({ llmGenerateJSON: mockLlmGenerateJSON }))
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('../../src/jobs/queue.js', () => ({
  emailSenderQueue: { process: vi.fn(), add: vi.fn() },
  inboxPollerQueue: { process: vi.fn(), add: vi.fn() },
  replyClassifierQueue: { process: vi.fn(), add: vi.fn() },
  followUpSchedulerQueue: { process: vi.fn(), add: vi.fn() },
  accountResearchQueue: { process: vi.fn(), add: vi.fn() },
}))

import { replyClassificationService } from '../../src/services/replyClassification.service.js'

/**
 * TDD Test Suite: Reply Classifier Job
 *
 * Tests async reply classification and action dispatch by autonomy level.
 * Spec refs: Backend §2 (jobs/replyClassifier.job.ts), Technical Spec §2.1 Stage 4
 */

describe('ReplyClassifierJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('process', () => {
    it('should classify reply and store result', async () => {
      mockLlmGenerateJSON.mockResolvedValue({
        classification: 'positive',
        confidence: 0.9,
        extracted_sentiment: 'interested',
        extracted_intent: 'wants to learn more',
        reasoning: 'Prospect expressed clear interest',
      })

      const result = await replyClassificationService.classifyReply({
        id: 'reply-1',
        senderEmail: 'vp@acme.com',
        subject: 'Re: Quick question',
        body: 'This sounds great, let me know about next steps',
      })

      expect(result.classification).toBeDefined()
      expect(result.confidence).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should dispatch pause_sequence for unsubscribe at L2+', async () => {
      mockLlmGenerateJSON.mockResolvedValue({
        classification: 'unsubscribe',
        confidence: 0.98,
        extracted_sentiment: 'hostile',
        extracted_intent: 'wants to be removed from mailing list',
        reasoning: 'Explicit opt-out request',
      })

      const result = await replyClassificationService.classifyReply({
        id: 'reply-unsub',
        senderEmail: 'vp@acme.com',
        subject: 'Re: Remove me',
        body: 'Please remove me from your list',
      })

      const action = replyClassificationService.determineAction(
        result.classification,
        result.confidence,
        'L2'
      )
      expect(action).toBe('pause_sequence')
    })

    it('should dispatch escalate for positive reply at L2', async () => {
      mockLlmGenerateJSON.mockResolvedValue({
        classification: 'positive',
        confidence: 0.92,
        extracted_sentiment: 'interested',
        extracted_intent: 'wants to schedule a call',
        reasoning: 'Positive response with clear interest',
      })

      const result = await replyClassificationService.classifyReply({
        id: 'reply-pos',
        senderEmail: 'vp@acme.com',
        subject: 'Re: Hello',
        body: 'Yes, I would love to chat next week',
      })

      const action = replyClassificationService.determineAction(
        result.classification,
        result.confidence,
        'L2'
      )
      expect(action).toBe('escalate')
    })

    it('should dispatch book_meeting for positive reply at L3', async () => {
      mockLlmGenerateJSON.mockResolvedValue({
        classification: 'positive',
        confidence: 0.92,
        extracted_sentiment: 'interested',
        extracted_intent: 'wants to schedule a call',
        reasoning: 'Positive response with clear interest',
      })

      const result = await replyClassificationService.classifyReply({
        id: 'reply-pos',
        senderEmail: 'vp@acme.com',
        subject: 'Re: Hello',
        body: 'Yes, I would love to chat next week',
      })

      const action = replyClassificationService.determineAction(
        result.classification,
        result.confidence,
        'L3'
      )
      expect(action).toBe('book_meeting')
    })
  })
})
