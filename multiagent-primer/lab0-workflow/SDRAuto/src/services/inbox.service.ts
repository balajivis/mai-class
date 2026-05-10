import { db } from '../lib/db.js'
import { getOAuthToken, refreshOAuthToken, isTokenValid } from '../lib/oauth.js'
import { logger } from '../lib/logger.js'

interface InboxReply {
  id: string
  senderEmail: string
  subject: string
  body: string
  receivedTimestamp: string
}

interface MatchedReply extends InboxReply {
  outreachId: string
  originalMessageId: string
}

export class InboxService {
  async pollInbox(userId: string, lastPollTimestamp?: Date): Promise<InboxReply[]> {
    const token = await getOAuthToken(userId, 'google')
    if (!token) {
      const azureToken = await getOAuthToken(userId, 'azure')
      if (!azureToken) {
        throw new Error('No email OAuth token available')
      }
      return this.pollOutlookInbox(azureToken, lastPollTimestamp)
    }
    return this.pollGmailInbox(token, lastPollTimestamp)
  }

  private async pollGmailInbox(accessToken: string, since?: Date): Promise<InboxReply[]> {
    // In production, this calls Gmail API
    // GET https://gmail.googleapis.com/gmail/v1/users/me/messages?q=after:timestamp
    logger.info('Polling Gmail inbox', { since: since?.toISOString() })

    // Placeholder: In production, parse Gmail API response
    return []
  }

  private async pollOutlookInbox(accessToken: string, since?: Date): Promise<InboxReply[]> {
    // In production, this calls MS Graph API
    // GET https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge 'timestamp'
    logger.info('Polling Outlook inbox', { since: since?.toISOString() })

    return []
  }

  async matchToOutreach(replies: InboxReply[]): Promise<MatchedReply[]> {
    const matched: MatchedReply[] = []

    for (const reply of replies) {
      // Match by sender email to an existing outreach recipient
      const outreach = await db.outreach.findFirst({
        where: { buyerEmail: reply.senderEmail },
        include: {
          messages: {
            where: { direction: 'outbound' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      if (outreach && outreach.messages.length > 0) {
        matched.push({
          ...reply,
          outreachId: outreach.id,
          originalMessageId: outreach.messages[0].id,
        })
      }
    }

    return matched
  }

  async isTokenValid(userId: string): Promise<boolean> {
    const googleValid = await isTokenValid(userId, 'google')
    if (googleValid) return true

    const azureValid = await isTokenValid(userId, 'azure')
    return azureValid
  }

  async refreshToken(userId: string): Promise<{ success: boolean; newToken?: string; action?: string }> {
    // Try Google first, then Azure
    for (const provider of ['google', 'azure']) {
      const token = await db.oAuthToken.findUnique({
        where: { userId_provider: { userId, provider } },
      })

      if (token) {
        const newToken = await refreshOAuthToken(userId, provider)
        if (newToken) {
          return { success: true, newToken }
        }
        // If refresh fails, token is likely revoked
        return { success: false, action: 'pause_and_notify' }
      }
    }

    return { success: false, action: 'pause_and_notify' }
  }

  async backfillReplies(userId: string, disconnectedAt: Date): Promise<InboxReply[]> {
    logger.info('Backfilling replies since disconnect', { userId, since: disconnectedAt.toISOString() })
    return this.pollInbox(userId, disconnectedAt)
  }

  async pollWithRetry(
    userId: string,
    options?: { consecutiveFailures?: number; lastPollTimestamp?: Date }
  ): Promise<{ replies: InboxReply[]; retried: boolean; escalated: boolean }> {
    const maxRetries = 3
    const failures = options?.consecutiveFailures ?? 0

    if (failures >= maxRetries) {
      logger.warn('Inbox polling: max consecutive failures reached, escalating', { userId })
      return { replies: [], retried: false, escalated: true }
    }

    try {
      const replies = await this.pollInbox(userId, options?.lastPollTimestamp)
      return { replies, retried: failures > 0, escalated: false }
    } catch (error) {
      logger.warn('Inbox poll failed, will retry', { userId, failures: failures + 1, error })
      return { replies: [], retried: true, escalated: false }
    }
  }
}

export const inboxService = new InboxService()
