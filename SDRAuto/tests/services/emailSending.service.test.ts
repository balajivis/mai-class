import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmailSendingService } from '../../src/services/emailSending.service.js'

vi.mock('../../src/lib/db.js', () => ({
  db: {
    message: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    unsubscribeList: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('../../src/lib/redis.js', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    pipeline: vi.fn(() => ({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  },
}))

vi.mock('../../src/lib/email.js', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../src/lib/validation.js', () => ({
  emailSchema: {
    safeParse: (val: string) => ({
      success: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    }),
  },
}))

import { db } from '../../src/lib/db.js'
import { redis } from '../../src/lib/redis.js'
import { sendEmail } from '../../src/lib/email.js'

/**
 * TDD Test Suite: Email Sending Service
 *
 * Tests SMTP sending, send caps, bounce handling, domain reputation, and deliverability.
 * Spec refs: Technical Spec §2.1 Stage 3 (Sending Rules), ADR-006, PRD F8
 */

// --- Fixtures ---
const validMessage = {
  id: 'msg-1',
  recipientEmail: 'vp@acme.com',
  subject: 'Quick question about scaling outbound',
  body: 'Hey, noticed your recent Series B...',
  senderEmail: 'alex@startup.io',
}

// Helper to set up a "clean" user with no sends today
function setupCleanUser() {
  vi.mocked(db.user.findUnique).mockResolvedValue({ dailyEmailCap: 20, domainEmailCap: 5 } as never)
  vi.mocked(db.unsubscribeList.findUnique).mockResolvedValue(null)
  vi.mocked(db.message.findFirst).mockResolvedValue(null) // no bounced messages
  vi.mocked(redis.get).mockResolvedValue(null) // no counts, no spam flags
}

// --- Tests ---

describe('EmailSendingService', () => {
  let emailSendingService: EmailSendingService

  beforeEach(() => {
    emailSendingService = new EmailSendingService()
    vi.clearAllMocks()
  })

  describe('Send Caps Enforcement (ADR-006)', () => {
    it('should enforce 20 emails/day global cap (default)', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ dailyEmailCap: 20, domainEmailCap: 5 } as never)
      vi.mocked(db.unsubscribeList.findUnique).mockResolvedValue(null)
      vi.mocked(db.message.findFirst).mockResolvedValue(null)
      // daily count = 20 (cap reached), domain count = 0
      vi.mocked(redis.get).mockImplementation(async (key: string) => {
        if (key.includes('sendcount:daily')) return '20'
        return null
      })

      await expect(
        emailSendingService.send(validMessage, { userId: 'user-1' })
      ).rejects.toThrow('Daily send cap reached')
    })

    it('should enforce 5 emails/domain/day cap (default)', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ dailyEmailCap: 20, domainEmailCap: 5 } as never)
      vi.mocked(db.unsubscribeList.findUnique).mockResolvedValue(null)
      vi.mocked(db.message.findFirst).mockResolvedValue(null)
      vi.mocked(redis.get).mockImplementation(async (key: string) => {
        if (key.includes('sendcount:daily')) return '10' // under daily cap
        if (key.includes('sendcount:domain')) return '5' // at domain cap
        return null
      })

      await expect(
        emailSendingService.send(validMessage, { userId: 'user-1' })
      ).rejects.toThrow('Domain send cap reached')
    })

    it('should allow configurable daily cap between 1 and 100', async () => {
      const result = emailSendingService.validateDailyCap(50)
      expect(result.valid).toBe(true)
    })

    it('should reject daily cap outside 1-100 range', async () => {
      expect(() => emailSendingService.validateDailyCap(0)).toThrow()
      expect(() => emailSendingService.validateDailyCap(101)).toThrow()
    })

    it('should count caps per-user, not per-campaign', async () => {
      vi.mocked(redis.get).mockResolvedValue('7')

      const count = await emailSendingService.getDailySendCount('user-1')
      // Should aggregate across all campaigns — returns a number
      expect(typeof count).toBe('number')
      expect(count).toBe(7)
    })

    it('should enforce caps in real-time (not batched)', async () => {
      setupCleanUser()

      const canSend = await emailSendingService.checkCanSend('user-1', 'vp@acme.com')
      expect(typeof canSend.allowed).toBe('boolean')
      expect(canSend).toMatchObject({
        allowed: expect.any(Boolean),
        dailyRemaining: expect.any(Number),
        domainRemaining: expect.any(Number),
      })
    })
  })

  describe('Bounce Handling', () => {
    it('should mark email as bounced on hard bounce', async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue({
        id: 'msg-1',
        recipientEmail: 'vp@acme.com',
        senderEmail: 'alex@startup.io',
        subject: 'Test',
        body: 'Body',
        status: 'sent',
      } as never)
      vi.mocked(db.message.update).mockResolvedValue({ id: 'msg-1', status: 'bounced' } as never)
      vi.mocked(redis.incr).mockResolvedValue(1)

      const result = await emailSendingService.handleBounce('msg-1', 'hard')
      expect(result.messageStatus).toBe('bounced')
    })

    it('should retry once on soft bounce', async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue({
        id: 'msg-1',
        recipientEmail: 'vp@acme.com',
        senderEmail: 'alex@startup.io',
        subject: 'Test',
        body: 'Body',
        status: 'sent',
      } as never)
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'new-msg-id' })

      const result = await emailSendingService.handleBounce('msg-1', 'soft')
      expect(result.retried).toBe(true)
    })

    it('should auto-pause domain when bounce rate exceeds 5%', async () => {
      // 6 bounces out of 100 sends = 6% bounce rate (above 5% threshold)
      vi.mocked(redis.get).mockImplementation(async (key: string) => {
        if (key.startsWith('spam:')) return null
        if (key.startsWith('bounces:')) return '6'
        if (key.includes('sendcount:domain')) return '100'
        return null
      })

      const status = await emailSendingService.checkDomainHealth('acme.com', 'user-1')
      expect(status.paused).toBe(true)
      expect(status.reason).toContain('bounce rate')
    })

    it('should skip sending to previously bounced emails', async () => {
      vi.mocked(db.message.findFirst).mockResolvedValue({
        id: 'msg-old',
        recipientEmail: 'bounced@acme.com',
        status: 'bounced',
      } as never)

      const canSend = await emailSendingService.checkCanSend('user-1', 'bounced@acme.com')
      expect(canSend.allowed).toBe(false)
      expect(canSend.reason).toContain('bounced')
    })
  })

  describe('Domain Reputation', () => {
    it('should auto-pause domain on any spam complaint', async () => {
      vi.mocked(redis.set).mockResolvedValue('OK')
      vi.mocked(redis.get).mockImplementation(async (key: string) => {
        if (key.startsWith('spam:user-1:startup.io')) return '1'
        return null
      })

      await emailSendingService.handleSpamComplaint('user-1', 'startup.io')
      const health = await emailSendingService.checkDomainHealth('startup.io', 'user-1')
      expect(health.paused).toBe(true)
      expect(health.reason).toContain('spam complaint')
    })

    it('should skip sending if domain reputation is flagged', async () => {
      vi.mocked(db.message.findFirst).mockResolvedValue(null)
      vi.mocked(db.unsubscribeList.findUnique).mockResolvedValue(null)
      vi.mocked(redis.get).mockImplementation(async (key: string) => {
        if (key.startsWith('spam:')) return '1' // flagged domain
        return null
      })

      const canSend = await emailSendingService.checkCanSend('user-1', 'vp@flagged-domain.com')
      expect(canSend.allowed).toBe(false)
    })

    it('should skip sending if email fails validation', async () => {
      const canSend = await emailSendingService.checkCanSend('user-1', 'not-an-email')
      expect(canSend.allowed).toBe(false)
      expect(canSend.reason).toContain('invalid email')
    })
  })

  describe('Send Logging', () => {
    it('should log send timestamp, recipient, and full message context', async () => {
      setupCleanUser()
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'ext-msg-id' })
      vi.mocked(db.message.update).mockResolvedValue({ id: 'msg-1', status: 'sent' } as never)

      const result = await emailSendingService.send(validMessage, { userId: 'user-1' })
      expect(result.sentTimestamp).toBeDefined()
      expect(result.recipientEmail).toBe('vp@acme.com')
    })

    it('should not log email body in plaintext for analytics (ADR-008)', async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue({
        id: 'msg-1',
        recipientEmail: 'vp@acme.com',
        status: 'sent',
        sentTimestamp: new Date(),
        personalizationUsed: ['Series B'],
        voiceConfidenceScore: 0.91,
      } as never)

      const analyticsRecord = await emailSendingService.getAnalyticsRecord('msg-1')
      expect((analyticsRecord as Record<string, unknown>)?.body).toBeUndefined()
      expect((analyticsRecord as Record<string, unknown>)?.bodyHash).toBeDefined()
      expect((analyticsRecord as Record<string, unknown>)?.personalizationSignals).toBeDefined()
    })
  })

  describe('Compliance Footer', () => {
    it('should append CAN-SPAM footer to every outbound email', async () => {
      const prepared = emailSendingService.prepareForSend(validMessage)
      expect(prepared.body).toContain('unsubscribe')
      expect(prepared.body).toMatch(/\d+.*(?:street|st|ave|avenue|blvd|main)/i)
    })
  })
})
