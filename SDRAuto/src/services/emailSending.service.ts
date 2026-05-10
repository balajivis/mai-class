import { db } from '../lib/db.js'
import { redis } from '../lib/redis.js'
import { sendEmail } from '../lib/email.js'
import { logger } from '../lib/logger.js'
import { emailSchema } from '../lib/validation.js'
import type { SendCapStatus, BounceType } from '../types/index.js'
import crypto from 'crypto'

const DEFAULT_DAILY_CAP = 20
const DEFAULT_DOMAIN_CAP = 5
const BOUNCE_PAUSE_THRESHOLD = 0.05 // 5%

export class EmailSendingService {
  async send(
    message: { id: string; recipientEmail: string; subject: string; body: string; senderEmail: string },
    context: { userId: string }
  ) {
    const canSend = await this.checkCanSend(context.userId, message.recipientEmail)
    if (!canSend.allowed) {
      throw new Error(canSend.reason ?? 'Send not allowed')
    }

    const prepared = this.prepareForSend(message)

    const result = await sendEmail({
      to: prepared.recipientEmail,
      from: prepared.senderEmail,
      subject: prepared.subject,
      body: prepared.body,
    })

    if (result.success) {
      await this.recordSend(context.userId, message.recipientEmail)

      await db.message.update({
        where: { id: message.id },
        data: {
          status: 'sent',
          sentTimestamp: new Date(),
        },
      })
    }

    return {
      success: result.success,
      messageId: result.messageId,
      sentTimestamp: result.success ? new Date().toISOString() : undefined,
      recipientEmail: message.recipientEmail,
      error: result.error,
    }
  }

  async checkCanSend(userId: string, recipientEmail: string): Promise<SendCapStatus> {
    // Validate email format
    const emailValid = emailSchema.safeParse(recipientEmail)
    if (!emailValid.success) {
      return { allowed: false, dailyRemaining: 0, domainRemaining: 0, reason: 'invalid email format' }
    }

    // Check if previously bounced
    const domain = recipientEmail.split('@')[1]
    const bounced = await this.isBounced(userId, recipientEmail)
    if (bounced) {
      return { allowed: false, dailyRemaining: 0, domainRemaining: 0, reason: 'previously bounced email' }
    }

    // Check unsubscribe list
    const unsubscribed = await db.unsubscribeList.findUnique({
      where: { userId_email: { userId, email: recipientEmail } },
    })
    if (unsubscribed) {
      return { allowed: false, dailyRemaining: 0, domainRemaining: 0, reason: 'recipient unsubscribed' }
    }

    // Check domain health
    const domainHealth = await this.checkDomainHealth(domain, userId)
    if (domainHealth.paused) {
      return { allowed: false, dailyRemaining: 0, domainRemaining: 0, reason: domainHealth.reason }
    }

    // Get user caps
    const user = await db.user.findUnique({ where: { id: userId }, select: { dailyEmailCap: true, domainEmailCap: true } })
    const dailyCap = user?.dailyEmailCap ?? DEFAULT_DAILY_CAP
    const domainCap = user?.domainEmailCap ?? DEFAULT_DOMAIN_CAP

    // Check daily cap
    const dailyCount = await this.getDailySendCount(userId)
    if (dailyCount >= dailyCap) {
      return { allowed: false, dailyRemaining: 0, domainRemaining: 0, reason: 'Daily send cap reached' }
    }

    // Check domain cap
    const domainCount = await this.getDomainSendCount(userId, domain)
    if (domainCount >= domainCap) {
      return { allowed: false, dailyRemaining: dailyCap - dailyCount, domainRemaining: 0, reason: 'Domain send cap reached' }
    }

    return {
      allowed: true,
      dailyRemaining: dailyCap - dailyCount,
      domainRemaining: domainCap - domainCount,
    }
  }

  async getDailySendCount(userId: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10)
    const key = `sendcount:daily:${userId}:${today}`
    const count = await redis.get(key)
    return count ? parseInt(count, 10) : 0
  }

  async getDomainSendCount(userId: string, domain: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10)
    const key = `sendcount:domain:${userId}:${domain}:${today}`
    const count = await redis.get(key)
    return count ? parseInt(count, 10) : 0
  }

  private async recordSend(userId: string, recipientEmail: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10)
    const domain = recipientEmail.split('@')[1]
    const ttl = 86400 // 24 hours

    const dailyKey = `sendcount:daily:${userId}:${today}`
    const domainKey = `sendcount:domain:${userId}:${domain}:${today}`

    const pipeline = redis.pipeline()
    pipeline.incr(dailyKey)
    pipeline.expire(dailyKey, ttl)
    pipeline.incr(domainKey)
    pipeline.expire(domainKey, ttl)
    await pipeline.exec()
  }

  async handleBounce(messageId: string, bounceType: BounceType) {
    const message = await db.message.findUnique({ where: { id: messageId } })
    if (!message) throw new Error('Message not found')

    if (bounceType === 'soft') {
      // Retry once for soft bounces
      const retryResult = await sendEmail({
        to: message.recipientEmail,
        from: message.senderEmail,
        subject: message.subject,
        body: message.body,
      })

      if (retryResult.success) {
        return { messageStatus: 'sent', retried: true }
      }
    }

    await db.message.update({
      where: { id: messageId },
      data: { status: 'bounced', bouncedTimestamp: new Date() },
    })

    // Record bounce for domain tracking
    const domain = message.recipientEmail.split('@')[1]
    const today = new Date().toISOString().slice(0, 10)
    await redis.incr(`bounces:${domain}:${today}`)

    return { messageStatus: 'bounced', retried: bounceType === 'soft' }
  }

  async checkDomainHealth(domain: string, userId: string): Promise<{ paused: boolean; reason?: string }> {
    // Check for spam complaints
    const spamKey = `spam:${userId}:${domain}`
    const spamFlag = await redis.get(spamKey)
    if (spamFlag) {
      return { paused: true, reason: 'Domain paused due to spam complaint' }
    }

    // Check bounce rate
    const today = new Date().toISOString().slice(0, 10)
    const bounceCount = parseInt(await redis.get(`bounces:${domain}:${today}`) ?? '0', 10)
    const sendCount = parseInt(await redis.get(`sendcount:domain:${userId}:${domain}:${today}`) ?? '0', 10)

    if (sendCount > 0 && bounceCount / sendCount > BOUNCE_PAUSE_THRESHOLD) {
      return { paused: true, reason: `Domain paused: bounce rate ${((bounceCount / sendCount) * 100).toFixed(1)}% exceeds 5% threshold` }
    }

    return { paused: false }
  }

  async handleSpamComplaint(userId: string, domain: string): Promise<void> {
    const key = `spam:${userId}:${domain}`
    await redis.set(key, '1')
    logger.warn('Spam complaint recorded — domain paused', { userId, domain })
  }

  private async isBounced(userId: string, email: string): Promise<boolean> {
    const bouncedMessage = await db.message.findFirst({
      where: { recipientEmail: email, status: 'bounced' },
    })
    return !!bouncedMessage
  }

  validateDailyCap(cap: number): { valid: boolean } {
    if (cap < 1 || cap > 100) {
      throw new Error('Daily cap must be between 1 and 100')
    }
    return { valid: true }
  }

  prepareForSend(message: { recipientEmail: string; senderEmail: string; subject: string; body: string }) {
    const companyName = process.env.COMPANY_NAME ?? 'Your Company Inc.'
    const companyAddress = process.env.COMPANY_ADDRESS ?? '123 Main St, City, State 12345'
    const unsubscribeUrl = process.env.UNSUBSCRIBE_URL ?? 'https://example.com/unsubscribe'

    const footer = `\n\n---\n${companyName} | ${companyAddress}\nTo unsubscribe: ${unsubscribeUrl}`

    return {
      ...message,
      body: message.body + footer,
    }
  }

  getAnalyticsRecord(messageId: string) {
    // Returns analytics-safe record (no plaintext body per ADR-008)
    return db.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        recipientEmail: true,
        status: true,
        sentTimestamp: true,
        personalizationUsed: true,
        voiceConfidenceScore: true,
      },
    }).then(msg => {
      if (!msg) return null
      return {
        ...msg,
        bodyHash: crypto.createHash('sha256').update(messageId).digest('hex'),
        personalizationSignals: msg.personalizationUsed,
      }
    })
  }
}

export const emailSendingService = new EmailSendingService()
