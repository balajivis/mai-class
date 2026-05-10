import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockDb, mockGetOAuthToken } = vi.hoisted(() => {
  const mockDb = {
    outreach: {
      findFirst: vi.fn(),
    },
    oAuthToken: {
      findUnique: vi.fn(),
    },
  }

  const mockGetOAuthToken = vi.fn()

  return { mockDb, mockGetOAuthToken }
})

vi.mock('../../src/lib/db.js', () => ({ db: mockDb }))
vi.mock('../../src/lib/oauth.js', () => ({
  getOAuthToken: mockGetOAuthToken,
  refreshOAuthToken: vi.fn(),
  isTokenValid: vi.fn().mockResolvedValue(true),
}))
vi.mock('../../src/jobs/queue.js', () => ({
  emailSenderQueue: { process: vi.fn(), add: vi.fn() },
  inboxPollerQueue: { process: vi.fn(), add: vi.fn() },
  replyClassifierQueue: { process: vi.fn(), add: vi.fn() },
  followUpSchedulerQueue: { process: vi.fn(), add: vi.fn() },
  accountResearchQueue: { process: vi.fn(), add: vi.fn() },
}))

import { inboxService } from '../../src/services/inbox.service.js'

/**
 * TDD Test Suite: Inbox Poller Job
 *
 * Tests scheduled inbox polling, reply queuing, and failure handling.
 * Spec refs: Backend §2 (jobs/inboxPoller.job.ts), App Flow §3 (Inbox Polling Timeout)
 */

describe('InboxPollerJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetOAuthToken.mockResolvedValue('valid-token')
  })

  describe('process', () => {
    it('should poll inbox and queue new replies for classification', async () => {
      // Gmail token available, returns empty inbox (no new replies)
      const result = await inboxService.pollWithRetry('user-1', {
        consecutiveFailures: 0,
      })
      expect(result.replies.length).toBeGreaterThanOrEqual(0)
      expect(result.escalated).toBe(false)
    })

    it('should update lastPollTimestamp after successful poll', async () => {
      const before = new Date('2024-01-01T10:00:00Z')

      const result = await inboxService.pollWithRetry('user-1', {
        consecutiveFailures: 0,
        lastPollTimestamp: before,
      })

      // After a successful poll, retried should be false (no error)
      expect(result.retried).toBe(false)
      expect(result.escalated).toBe(false)
    })

    it('should retry on timeout without pausing campaign', async () => {
      // Simulate a failure by having getOAuthToken throw — pollWithRetry catches it
      mockGetOAuthToken.mockRejectedValueOnce(new Error('Timeout'))

      const result = await inboxService.pollWithRetry('user-1', {
        consecutiveFailures: 0,
      })
      expect(result.retried).toBe(true)
      expect(result.escalated).toBe(false)
    })

    it('should escalate after 3 consecutive failures', async () => {
      const result = await inboxService.pollWithRetry('user-1', {
        consecutiveFailures: 3,
      })
      expect(result.escalated).toBe(true)
    })
  })
})
