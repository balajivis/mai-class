import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockDb, mockRedis, mockSendEmail } = vi.hoisted(() => {
  const mockDb = {
    message: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    unsubscribeList: {
      findUnique: vi.fn(),
    },
  }

  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
    pipeline: vi.fn(() => ({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  }

  const mockSendEmail = vi.fn()

  return { mockDb, mockRedis, mockSendEmail }
})

vi.mock('../../src/lib/db.js', () => ({ db: mockDb }))
vi.mock('../../src/lib/redis.js', () => ({ redis: mockRedis }))
vi.mock('../../src/lib/email.js', () => ({ sendEmail: mockSendEmail }))
vi.mock('../../src/jobs/queue.js', () => ({
  emailSenderQueue: { process: vi.fn(), add: vi.fn() },
  inboxPollerQueue: { process: vi.fn(), add: vi.fn() },
  replyClassifierQueue: { process: vi.fn(), add: vi.fn() },
  followUpSchedulerQueue: { process: vi.fn(), add: vi.fn() },
  accountResearchQueue: { process: vi.fn(), add: vi.fn() },
}))

import { emailSendingService } from '../../src/services/emailSending.service.js'

/**
 * TDD Test Suite: Email Sender Job
 *
 * Tests async email sending, retry logic, cap enforcement, and error handling.
 * Spec refs: Backend §2 (jobs/emailSender.job.ts), App Flow §3 (Email Send Failure)
 */

const baseMessage = {
  id: 'msg-1',
  recipientEmail: 'vp@acme.com',
  subject: 'Test',
  body: 'Hello',
  senderEmail: 'rep@startup.io',
}

describe('EmailSenderJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: user exists with no custom caps
    mockDb.user.findUnique.mockResolvedValue({ dailyEmailCap: 20, domainEmailCap: 5 })

    // Default: no bounces, no unsubscribes
    mockDb.message.findFirst.mockResolvedValue(null)
    mockDb.unsubscribeList.findUnique.mockResolvedValue(null)

    // Default: zero send counts
    mockRedis.get.mockResolvedValue(null)

    // Default: pipeline exec succeeds
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })
  })

  describe('process', () => {
    it('should send email via SMTP and log result', async () => {
      mockSendEmail.mockResolvedValue({
        success: true,
        messageId: 'smtp-msg-id',
      })
      mockDb.message.update.mockResolvedValue({ id: 'msg-1', status: 'sent' })

      const result = await emailSendingService.send(baseMessage, { userId: 'user-1' })
      expect(result.success).toBe(true)
      expect(result.sentTimestamp).toBeDefined()
    })

    it('should mark as failed after retry exhaustion', async () => {
      mockSendEmail.mockResolvedValue({
        success: false,
        error: 'SMTP connection refused',
      })

      const result = await emailSendingService.send(baseMessage, { userId: 'user-1' })
      expect(result.success).toBe(false)
    })

    it('should skip sending when daily cap is reached', async () => {
      // 20 emails already sent today (at cap)
      mockRedis.get.mockImplementation(async (key: string) => {
        if (key.includes('sendcount:daily')) return '20'
        return null
      })

      const canSend = await emailSendingService.checkCanSend('user-1', 'vp@acme.com')
      expect(canSend.allowed).toBe(false)
      expect(canSend.reason).toContain('cap')
    })

    it('should skip sending when domain cap is reached', async () => {
      // 5 emails sent to acme.com today (at domain cap)
      mockRedis.get.mockImplementation(async (key: string) => {
        if (key.includes('sendcount:domain')) return '5'
        return null
      })

      const canSend = await emailSendingService.checkCanSend('user-1', 'another@acme.com')
      expect(canSend.allowed).toBe(false)
      expect(canSend.reason).toContain('cap')
    })

    it('should skip sending when domain is paused', async () => {
      // Spam flag set for domain
      mockRedis.get.mockImplementation(async (key: string) => {
        if (key.includes('spam:')) return '1'
        return null
      })

      const canSend = await emailSendingService.checkCanSend('user-1', 'vp@paused-domain.com')
      expect(canSend.allowed).toBe(false)
      expect(canSend.reason).toContain('spam')
    })

    it('should include compliance footer before sending', async () => {
      const prepared = emailSendingService.prepareForSend(baseMessage)
      expect(prepared.body).toContain('unsubscribe')
    })
  })
})
