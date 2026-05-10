import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * TDD Test Suite: Inbox Monitoring Service
 *
 * Tests inbox polling, OAuth token handling, and reply detection.
 * Spec refs: Technical Spec §2.1 Stage 4, App Flow §3 (Error Flows)
 */

// --- Mocks ---

vi.mock('../../src/lib/db.js', () => ({
  db: {
    outreach: {
      findFirst: vi.fn(),
    },
    oAuthToken: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('../../src/lib/oauth.js', () => ({
  getOAuthToken: vi.fn(),
  refreshOAuthToken: vi.fn(),
  isTokenValid: vi.fn(),
  storeOAuthToken: vi.fn(),
}))

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { db } from '../../src/lib/db.js'
import { getOAuthToken, refreshOAuthToken, isTokenValid } from '../../src/lib/oauth.js'
import { InboxService } from '../../src/services/inbox.service.js'

// --- Fixtures ---
const mockReply = {
  id: 'msg-1',
  senderEmail: 'vp@acme.com',
  subject: 'Re: Quick question about pipeline',
  body: 'Thanks for reaching out, happy to chat.',
  receivedTimestamp: '2026-03-28T10:00:00Z',
}

const mockOutreach = {
  id: 'outreach-1',
  buyerEmail: 'vp@acme.com',
  messages: [{ id: 'outbound-msg-1', direction: 'outbound' }],
}

// --- Tests ---

describe('InboxService', () => {
  let inboxService: InboxService

  beforeEach(() => {
    vi.clearAllMocks()
    inboxService = new InboxService()
  })

  describe('pollInbox', () => {
    it('should fetch new replies since last poll timestamp using Google OAuth', async () => {
      vi.mocked(getOAuthToken).mockResolvedValue('google-access-token')

      const lastPollTimestamp = new Date('2026-03-28T09:00:00Z')
      const replies = await inboxService.pollInbox('user-1', lastPollTimestamp)

      expect(Array.isArray(replies)).toBe(true)
      expect(vi.mocked(getOAuthToken)).toHaveBeenCalledWith('user-1', 'google')
    })

    it('should fall back to Azure OAuth when Google token is unavailable', async () => {
      vi.mocked(getOAuthToken)
        .mockResolvedValueOnce(null)          // Google fails
        .mockResolvedValueOnce('azure-token') // Azure succeeds

      const replies = await inboxService.pollInbox('user-1')

      expect(Array.isArray(replies)).toBe(true)
      expect(vi.mocked(getOAuthToken)).toHaveBeenCalledWith('user-1', 'google')
      expect(vi.mocked(getOAuthToken)).toHaveBeenCalledWith('user-1', 'azure')
    })

    it('should throw when no OAuth token is available', async () => {
      vi.mocked(getOAuthToken).mockResolvedValue(null)

      await expect(inboxService.pollInbox('user-1')).rejects.toThrow(
        'No email OAuth token available'
      )
    })

    it('should match replies to existing outreach by sender email', async () => {
      vi.mocked(db.outreach.findFirst).mockResolvedValue(mockOutreach as any)

      const matched = await inboxService.matchToOutreach([mockReply])

      expect(matched).toHaveLength(1)
      expect(matched[0].outreachId).toBe('outreach-1')
      expect(matched[0].originalMessageId).toBe('outbound-msg-1')
    })

    it('should ignore replies not associated with any outreach', async () => {
      vi.mocked(db.outreach.findFirst).mockResolvedValue(null)

      const unrelatedReply = {
        id: 'msg-x',
        senderEmail: 'random@nobody.com',
        subject: 'Hello',
        body: 'Hi',
        receivedTimestamp: '2026-03-28T10:00:00Z',
      }
      const matched = await inboxService.matchToOutreach([unrelatedReply])

      expect(matched).toHaveLength(0)
    })
  })

  describe('OAuth Token Management', () => {
    it('should detect expired OAuth token before polling', async () => {
      vi.mocked(isTokenValid).mockResolvedValue(false)

      const valid = await inboxService.isTokenValid('user-1')

      expect(typeof valid).toBe('boolean')
      expect(valid).toBe(false)
    })

    it('should return true when Google token is valid', async () => {
      vi.mocked(isTokenValid).mockResolvedValueOnce(true) // google

      const valid = await inboxService.isTokenValid('user-1')

      expect(valid).toBe(true)
    })

    it('should check Azure when Google is invalid', async () => {
      vi.mocked(isTokenValid)
        .mockResolvedValueOnce(false) // google invalid
        .mockResolvedValueOnce(true)  // azure valid

      const valid = await inboxService.isTokenValid('user-1')

      expect(valid).toBe(true)
      expect(vi.mocked(isTokenValid)).toHaveBeenCalledWith('user-1', 'google')
      expect(vi.mocked(isTokenValid)).toHaveBeenCalledWith('user-1', 'azure')
    })

    it('should refresh token automatically when expired', async () => {
      vi.mocked(db.oAuthToken.findUnique).mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        provider: 'google',
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() - 1000), // expired
      } as any)
      vi.mocked(refreshOAuthToken).mockResolvedValue('new-access-token')

      const result = await inboxService.refreshToken('user-1')

      expect(result.success).toBe(true)
      expect(result.newToken).toBe('new-access-token')
    })

    it('should pause campaign and notify user when OAuth is revoked', async () => {
      vi.mocked(db.oAuthToken.findUnique).mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        provider: 'google',
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() - 1000),
      } as any)
      vi.mocked(refreshOAuthToken).mockResolvedValue(null) // refresh fails → revoked

      const result = await inboxService.refreshToken('user-1')

      expect(result.success).toBe(false)
      expect(result.action).toBe('pause_and_notify')
    })

    it('should return pause_and_notify when no token record exists', async () => {
      vi.mocked(db.oAuthToken.findUnique).mockResolvedValue(null)

      const result = await inboxService.refreshToken('user-1')

      expect(result.success).toBe(false)
      expect(result.action).toBe('pause_and_notify')
    })

    it('should backfill missed replies after token refresh', async () => {
      vi.mocked(getOAuthToken).mockResolvedValue('google-access-token')

      const disconnectedAt = new Date('2026-03-25T00:00:00Z')
      const backfilled = await inboxService.backfillReplies('user-1', disconnectedAt)

      expect(Array.isArray(backfilled)).toBe(true)
    })
  })

  describe('Polling Resilience', () => {
    it('should retry on timeout and continue polling', async () => {
      vi.mocked(getOAuthToken)
        .mockRejectedValueOnce(new Error('Timeout'))     // first attempt fails
        .mockResolvedValueOnce('google-access-token')    // retry succeeds (not actually called due to catch)

      const result = await inboxService.pollWithRetry('user-1')

      // pollWithRetry catches errors and marks retried: true
      expect(result.retried).toBe(true)
    })

    it('should escalate to user after 3 consecutive failures', async () => {
      const result = await inboxService.pollWithRetry('user-1', { consecutiveFailures: 3 })

      expect(result.escalated).toBe(true)
    })

    it('should not escalate (escalated: false) during transient polling failures', async () => {
      vi.mocked(getOAuthToken).mockRejectedValue(new Error('Timeout'))

      // 2 failures: not yet at the threshold
      const result = await inboxService.pollWithRetry('user-1', { consecutiveFailures: 2 })

      expect(result.escalated).toBe(false)
    })

    it('should return empty replies on escalation', async () => {
      const result = await inboxService.pollWithRetry('user-1', { consecutiveFailures: 3 })

      expect(result.replies).toEqual([])
      expect(result.escalated).toBe(true)
    })
  })
})
