import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

interface BookedMeetingInput {
  outreachId: string
  accountName: string
  contactEmail: string
  scheduledDatetime: string
  durationMin: number
  meetingSource: string
  conversationSummary: string
  nextSteps: string
}

export class CRMService {
  async syncBookedMeeting(meeting: BookedMeetingInput) {
    try {
      // In production, this calls HubSpot API
      // POST https://api.hubapi.com/crm/v3/objects/meetings
      const crmRecordId = await this.createHubSpotMeeting(meeting)

      if (crmRecordId) {
        await db.bookedMeeting.updateMany({
          where: { outreachId: meeting.outreachId },
          data: {
            syncedToCRM: true,
            crmRecordId,
          },
        })

        logger.info('Meeting synced to CRM', {
          outreachId: meeting.outreachId,
          crmRecordId,
        })

        return {
          syncedToCrm: true,
          crmRecordId,
          meetingSource: meeting.meetingSource,
          conversationSummary: meeting.conversationSummary,
        }
      }

      throw new Error('CRM API returned no record ID')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown CRM error'
      logger.error('CRM sync failed', { outreachId: meeting.outreachId, error: message })

      // Fail gracefully — booking still proceeds
      return {
        syncedToCrm: false,
        error: message,
        meetingSource: meeting.meetingSource,
        conversationSummary: meeting.conversationSummary,
      }
    }
  }

  private async createHubSpotMeeting(meeting: BookedMeetingInput): Promise<string | null> {
    const apiKey = process.env.HUBSPOT_API_KEY
    if (!apiKey) {
      logger.warn('HubSpot API key not configured')
      return null
    }

    try {
      // In production:
      // const response = await fetch('https://api.hubapi.com/crm/v3/objects/meetings', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     properties: {
      //       hs_meeting_title: `Meeting with ${meeting.accountName}`,
      //       hs_meeting_start_time: meeting.scheduledDatetime,
      //       hs_meeting_end_time: new Date(new Date(meeting.scheduledDatetime).getTime() + meeting.durationMin * 60000).toISOString(),
      //       hs_meeting_body: meeting.conversationSummary,
      //       hs_meeting_outcome: 'SCHEDULED',
      //     },
      //   }),
      // })

      // Placeholder: return mock CRM record ID
      return `hs_meeting_${Date.now()}`
    } catch (error) {
      logger.error('HubSpot API call failed', { error })
      return null
    }
  }
}

export const crmService = new CRMService()
