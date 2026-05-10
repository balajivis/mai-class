import { db } from '../lib/db.js'
import { getOAuthToken } from '../lib/oauth.js'
import { logger } from '../lib/logger.js'
import type { ProposedSlot } from '../types/index.js'

export class MeetingBookingService {
  async proposeSlots(outreachId: string, userId: string) {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    if (!outreach) throw new Error('Outreach not found')

    if (outreach.status !== 'engaged') {
      throw new Error('Outreach must be in "engaged" state to propose meeting slots')
    }

    // Check calendar API availability
    const calendarToken = await getOAuthToken(userId, 'google')
    if (!calendarToken) {
      const azureToken = await getOAuthToken(userId, 'azure')
      if (!azureToken) {
        logger.warn('Calendar API unavailable, escalating to rep', { outreachId, userId })
        return { fallback: true, action: 'escalate_to_rep', proposedSlots: [] }
      }
    }

    // Detect prospect timezone
    const timezone = await this.detectProspectTimezone(outreach.buyerEmail.split('@')[1])

    // Generate slots: prefer Tue-Thu, 10AM-2PM in prospect timezone
    const slots = this.generatePreferredSlots(timezone)

    const proposal = await db.calendarProposal.create({
      data: {
        outreachId,
        proposedSlots: slots as unknown as Record<string, unknown>,
        proposedAt: new Date(),
        reasoningLog: `Generated ${slots.length} meeting slots. Preferred times: 10AM-2PM ${timezone}, Tue-Thu. Prospect domain: ${outreach.buyerEmail.split('@')[1]}`,
      },
    })

    return {
      proposalId: proposal.id,
      proposedSlots: slots,
      prospectTimezone: timezone,
      fallback: false,
    }
  }

  async detectProspectTimezone(domain: string): Promise<string> {
    // In production, use IP geolocation or company HQ location
    // For Phase 1, use a simple domain-based heuristic
    if (domain.endsWith('.co.uk') || domain.endsWith('.eu')) return 'Europe/London'
    if (domain.endsWith('.de')) return 'Europe/Berlin'
    if (domain.endsWith('.jp')) return 'Asia/Tokyo'
    if (domain.endsWith('.au')) return 'Australia/Sydney'

    // Default to US Eastern
    return 'America/New_York'
  }

  private generatePreferredSlots(timezone: string, count: number = 4): ProposedSlot[] {
    const slots: ProposedSlot[] = []
    const now = new Date()
    let daysChecked = 0

    while (slots.length < count && daysChecked < 14) {
      daysChecked++
      const date = new Date(now)
      date.setDate(date.getDate() + daysChecked)

      const dayOfWeek = date.getDay()
      // Prefer Tuesday (2), Wednesday (3), Thursday (4)
      if (dayOfWeek < 2 || dayOfWeek > 4) continue

      // Generate slots at 10AM, 11AM, 1PM, 2PM
      for (const hour of [10, 11, 13, 14]) {
        if (slots.length >= count) break
        const slotDate = new Date(date)
        slotDate.setHours(hour, 0, 0, 0)

        slots.push({
          datetime: slotDate.toISOString(),
          durationMin: 30,
          timezone,
        })
      }
    }

    return slots.slice(0, count)
  }

  async handleResponse(
    proposalId: string,
    response: 'accepted' | 'rejected',
    slotIndex?: number
  ) {
    const proposal = await db.calendarProposal.findUnique({
      where: { id: proposalId },
      include: { outreach: true },
    })
    if (!proposal) throw new Error('Proposal not found')

    if (response === 'accepted' && slotIndex !== undefined) {
      const slots = proposal.proposedSlots as unknown as ProposedSlot[]
      const acceptedSlot = slots[slotIndex]

      await db.calendarProposal.update({
        where: { id: proposalId },
        data: {
          prospectResponse: 'accepted',
          acceptedSlot: new Date(acceptedSlot.datetime),
        },
      })

      // Create booked meeting
      const meeting = await db.bookedMeeting.create({
        data: {
          outreachId: proposal.outreachId,
          accountName: proposal.outreach.accountName,
          contactEmail: proposal.outreach.buyerEmail,
          contactName: proposal.outreach.buyerName,
          scheduledAt: new Date(acceptedSlot.datetime),
          durationMinutes: acceptedSlot.durationMin,
          conversationSummary: 'Meeting booked via autonomous BDR system.',
        },
      })

      // Update outreach status
      await db.outreach.update({
        where: { id: proposal.outreachId },
        data: { status: 'booked' },
      })

      // Update campaign stats
      await db.campaign.update({
        where: { id: proposal.outreach.campaignId },
        data: { meetingsBooked: { increment: 1 } },
      })

      return { status: 'booked', bookedMeetingId: meeting.id }
    }

    await db.calendarProposal.update({
      where: { id: proposalId },
      data: { prospectResponse: 'rejected' },
    })

    return { status: 'rejected', action: 'escalate_to_rep' }
  }

  async handleNoResponse(proposalId: string) {
    const rePingDate = new Date()
    rePingDate.setDate(rePingDate.getDate() + 2)

    return { action: 're_ping', scheduledFor: rePingDate.toISOString() }
  }

  async handleReschedule(proposalId: string, data: { requestedDate: string }) {
    const requested = new Date(data.requestedDate)
    const now = new Date()
    const daysDiff = (requested.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff > 3) {
      return { action: 'escalate_to_rep' }
    }

    return { action: 'propose_new_slots' }
  }
}

export const meetingBookingService = new MeetingBookingService()
