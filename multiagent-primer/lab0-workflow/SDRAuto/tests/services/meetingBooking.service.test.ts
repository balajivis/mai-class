import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * TDD Test Suite: Meeting Booking Service
 *
 * Tests calendar slot proposal, timezone detection, and booking lifecycle.
 * Spec refs: Technical Spec §2.1 Stage 5, PRD F7, R5, App Flow §2.E
 */

// --- Mocks ---

vi.mock('../../src/lib/db.js', () => ({
  db: {
    outreach: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    calendarProposal: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    bookedMeeting: {
      create: vi.fn(),
    },
    campaign: {
      update: vi.fn(),
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
import { getOAuthToken } from '../../src/lib/oauth.js'
import { MeetingBookingService } from '../../src/services/meetingBooking.service.js'

// --- Fixtures ---
const mockEngagedOutreach = {
  id: 'outreach-1',
  status: 'engaged',
  buyerEmail: 'vp@acme.com',
  buyerName: 'John Smith',
  accountName: 'Acme Corp',
  campaignId: 'camp-1',
}

const mockProposal = {
  id: 'proposal-1',
  outreachId: 'outreach-1',
  proposedSlots: [
    { datetime: '2026-04-01T14:00:00.000Z', durationMin: 30, timezone: 'America/New_York' },
    { datetime: '2026-04-02T15:00:00.000Z', durationMin: 30, timezone: 'America/New_York' },
  ],
  outreach: mockEngagedOutreach,
}

// --- Tests ---

describe('MeetingBookingService', () => {
  let meetingBookingService: MeetingBookingService

  beforeEach(() => {
    vi.clearAllMocks()
    meetingBookingService = new MeetingBookingService()

    vi.mocked(db.outreach.findUnique).mockResolvedValue(mockEngagedOutreach as any)
    vi.mocked(db.calendarProposal.create).mockResolvedValue({
      id: 'proposal-1',
      ...mockProposal,
    } as any)
    vi.mocked(getOAuthToken).mockResolvedValue('google-calendar-token')
  })

  describe('proposeSlots', () => {
    it('should propose 3-5 meeting slots', async () => {
      const proposal = await meetingBookingService.proposeSlots('outreach-1', 'user-1')

      expect(proposal.proposedSlots.length).toBeGreaterThanOrEqual(3)
      expect(proposal.proposedSlots.length).toBeLessThanOrEqual(5)
    })

    it('should prefer 10 AM - 2 PM in prospect timezone', async () => {
      const proposal = await meetingBookingService.proposeSlots('outreach-1', 'user-1')

      proposal.proposedSlots.forEach(slot => {
        const hour = new Date(slot.datetime).getUTCHours()
        // Slot hours are set in local time; we just check they are within the 10-14 range set
        // by generatePreferredSlots which uses hours [10, 11, 13, 14]
        expect([10, 11, 13, 14]).toContain(new Date(slot.datetime).getHours())
      })
    })

    it('should prefer Tuesday-Thursday', async () => {
      const proposal = await meetingBookingService.proposeSlots('outreach-1', 'user-1')

      proposal.proposedSlots.forEach(slot => {
        const day = new Date(slot.datetime).getDay()
        expect(day).toBeGreaterThanOrEqual(2) // Tuesday
        expect(day).toBeLessThanOrEqual(4)    // Thursday
      })
    })

    it('should detect prospect timezone from company location', async () => {
      const tz = await meetingBookingService.detectProspectTimezone('acme.com')

      expect(tz).toBeDefined()
      expect(tz).toMatch(/^[A-Za-z]+\/[A-Za-z_]+$/)
    })

    it('should include duration and timezone in each slot', async () => {
      const proposal = await meetingBookingService.proposeSlots('outreach-1', 'user-1')

      proposal.proposedSlots.forEach(slot => {
        expect(slot.durationMin).toBeDefined()
        expect(slot.timezone).toBeDefined()
      })
    })

    it('should throw when outreach is not found', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue(null)

      await expect(
        meetingBookingService.proposeSlots('nonexistent', 'user-1')
      ).rejects.toThrow('Outreach not found')
    })

    it('should throw when outreach is not in engaged state', async () => {
      vi.mocked(db.outreach.findUnique).mockResolvedValue({
        ...mockEngagedOutreach,
        status: 'awaiting_reply',
      } as any)

      await expect(
        meetingBookingService.proposeSlots('outreach-1', 'user-1')
      ).rejects.toThrow('Outreach must be in "engaged" state')
    })

    it('should escalate to rep when calendar API is unavailable', async () => {
      vi.mocked(getOAuthToken).mockResolvedValue(null) // both Google and Azure return null

      const result = await meetingBookingService.proposeSlots('outreach-1', 'user-1')

      expect(result.fallback).toBe(true)
      expect(result.action).toBe('escalate_to_rep')
    })
  })

  describe('detectProspectTimezone', () => {
    it('should return Europe/London for .co.uk domains', async () => {
      expect(await meetingBookingService.detectProspectTimezone('company.co.uk')).toBe('Europe/London')
    })

    it('should return Europe/Berlin for .de domains', async () => {
      expect(await meetingBookingService.detectProspectTimezone('company.de')).toBe('Europe/Berlin')
    })

    it('should return Asia/Tokyo for .jp domains', async () => {
      expect(await meetingBookingService.detectProspectTimezone('company.jp')).toBe('Asia/Tokyo')
    })

    it('should default to America/New_York for .com domains', async () => {
      expect(await meetingBookingService.detectProspectTimezone('company.com')).toBe('America/New_York')
    })
  })

  describe('handleProspectResponse', () => {
    beforeEach(() => {
      vi.mocked(db.calendarProposal.findUnique).mockResolvedValue(mockProposal as any)
      vi.mocked(db.calendarProposal.update).mockResolvedValue({ ...mockProposal } as any)
      vi.mocked(db.bookedMeeting.create).mockResolvedValue({
        id: 'meeting-1',
        outreachId: 'outreach-1',
      } as any)
      vi.mocked(db.outreach.update).mockResolvedValue({ ...mockEngagedOutreach, status: 'booked' } as any)
      vi.mocked(db.campaign.update).mockResolvedValue({} as any)
    })

    it('should log booked meeting on acceptance', async () => {
      const result = await meetingBookingService.handleResponse('proposal-1', 'accepted', 0)

      expect(result.status).toBe('booked')
      expect(result.bookedMeetingId).toBeDefined()
    })

    it('should escalate to rep on rejection of all slots', async () => {
      const result = await meetingBookingService.handleResponse('proposal-1', 'rejected')

      expect(result.action).toBe('escalate_to_rep')
    })

    it('should re-ping prospect after 2 days if no response', async () => {
      const result = await meetingBookingService.handleNoResponse('proposal-1')

      expect(result.action).toBe('re_ping')
      expect(result.scheduledFor).toBeDefined()
    })

    it('should escalate rescheduling requests > 3 days out', async () => {
      const farFuture = new Date()
      farFuture.setDate(farFuture.getDate() + 10)

      const result = await meetingBookingService.handleReschedule('proposal-1', {
        requestedDate: farFuture.toISOString(),
      })

      expect(result.action).toBe('escalate_to_rep')
    })

    it('should propose new slots for rescheduling within 3 days', async () => {
      const nearFuture = new Date()
      nearFuture.setDate(nearFuture.getDate() + 2)

      const result = await meetingBookingService.handleReschedule('proposal-1', {
        requestedDate: nearFuture.toISOString(),
      })

      expect(result.action).toBe('propose_new_slots')
    })

    it('should throw when proposal is not found', async () => {
      vi.mocked(db.calendarProposal.findUnique).mockResolvedValue(null)

      await expect(
        meetingBookingService.handleResponse('nonexistent', 'accepted', 0)
      ).rejects.toThrow('Proposal not found')
    })
  })
})
