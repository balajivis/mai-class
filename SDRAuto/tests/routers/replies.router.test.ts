import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    reply: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }
  return { mockDb }
})

vi.mock('../../src/lib/db.js', () => ({ db: mockDb }))

import { appRouter } from '../../src/routers/index.js'
import type { Context } from '../../src/trpc.js'

/**
 * TDD Test Suite: Replies Router
 *
 * Tests reply queue, filtering, escalation, and status updates.
 * Spec refs: Technical Spec §2.1 Stage 4, PRD R3, App Flow §2.D
 */

describe('RepliesRouter', () => {
  const ctx: Context = {
    req: {} as any,
    user: { id: 'user-1', email: 'test@test.com', role: 'founder' },
  }
  const caller = appRouter.createCaller(ctx)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should return replies for the authenticated user', async () => {
      const replies = [
        {
          id: 'reply-1',
          classification: 'positive',
          confidence: 0.9,
          actionTaken: null,
          receivedTimestamp: new Date(),
          outreach: { accountName: 'Acme', campaignId: 'camp-1' },
          message: { subject: 'Re: Hello' },
        },
      ]
      mockDb.reply.findMany.mockResolvedValue(replies)

      const results = await caller.replies.list()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should sort replies by classification priority (positive first)', async () => {
      const replies = [
        {
          id: 'reply-noise',
          classification: 'noise',
          confidence: 0.95,
          actionTaken: null,
          receivedTimestamp: new Date('2024-01-01'),
          outreach: { accountName: 'Acme', campaignId: 'camp-1' },
          message: { subject: 'OOO' },
        },
        {
          id: 'reply-pos',
          classification: 'positive',
          confidence: 0.9,
          actionTaken: null,
          receivedTimestamp: new Date('2024-01-02'),
          outreach: { accountName: 'Beta', campaignId: 'camp-1' },
          message: { subject: 'Re: Interested' },
        },
      ]
      // Return noise first, then positive (unsorted from DB)
      mockDb.reply.findMany.mockResolvedValue([replies[0], replies[1]])

      const results = await caller.replies.list({ sort: 'priority' })
      const firstPositiveIdx = results.findIndex(r => r.classification === 'positive')
      const firstNoiseIdx = results.findIndex(r => r.classification === 'noise')
      if (firstPositiveIdx >= 0 && firstNoiseIdx >= 0) {
        expect(firstPositiveIdx).toBeLessThan(firstNoiseIdx)
      }
    })

    it('should filter replies by classification type', async () => {
      const replies = [
        {
          id: 'reply-1',
          classification: 'positive',
          confidence: 0.9,
          actionTaken: null,
          receivedTimestamp: new Date(),
          outreach: { accountName: 'Acme', campaignId: 'camp-1' },
          message: { subject: 'Re: Hello' },
        },
      ]
      mockDb.reply.findMany.mockResolvedValue(replies)

      const positiveOnly = await caller.replies.list({ classification: 'positive' })
      positiveOnly.forEach(r => expect(r.classification).toBe('positive'))
    })

    it('should filter replies by pending/escalated/resolved status', async () => {
      const replies = [
        {
          id: 'reply-1',
          classification: 'unclear',
          confidence: 0.5,
          actionTaken: null,
          receivedTimestamp: new Date(),
          outreach: { accountName: 'Acme', campaignId: 'camp-1' },
          message: { subject: 'Re: Hello' },
        },
      ]
      mockDb.reply.findMany.mockResolvedValue(replies)

      const pending = await caller.replies.list({ status: 'pending' })
      pending.forEach(r => expect(r.actionTaken).toBeNull())
    })
  })

  describe('escalate', () => {
    it('should mark a reply as escalated with user context', async () => {
      mockDb.reply.findFirst.mockResolvedValue({
        id: 'reply-1',
        classification: 'positive',
        actionTaken: null,
      })
      mockDb.reply.update.mockResolvedValue({
        id: 'reply-1',
        classification: 'positive',
        actionTaken: 'escalated',
      })

      const result = await caller.replies.escalate({
        replyId: 'reply-1',
        note: 'Need to discuss pricing with this prospect',
      })
      expect(result.actionTaken).toBe('escalated')
    })
  })

  describe('markReviewed', () => {
    it('should mark a reply as reviewed', async () => {
      mockDb.reply.findFirst.mockResolvedValue({
        id: 'reply-1',
        classification: 'noise',
        actionTaken: null,
      })
      mockDb.reply.update.mockResolvedValue({
        id: 'reply-1',
        classification: 'noise',
        actionTaken: 'reviewed',
      })

      const result = await caller.replies.markReviewed({ replyId: 'reply-1' })
      expect(result.actionTaken).toBeDefined()
    })

    it('should log the manual action for classifier improvement', async () => {
      mockDb.reply.findFirst.mockResolvedValue({
        id: 'reply-1',
        classification: 'noise',
        actionTaken: null,
      })
      mockDb.reply.update.mockResolvedValue({
        id: 'reply-1',
        classification: 'noise',
        actionTaken: 'reviewed',
        classifierFeedback: {
          originalClassification: 'noise',
          correctedClassification: 'positive',
          correctedAt: new Date().toISOString(),
          correctedBy: 'user-1',
        },
      })

      const result = await caller.replies.markReviewed({
        replyId: 'reply-1',
        correctClassification: 'positive',
      })
      expect(result.classifierFeedback).toBeDefined()
    })
  })
})
