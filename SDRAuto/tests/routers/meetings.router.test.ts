import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockDb, mockMeetingBookingService, mockCrmService } = vi.hoisted(() => {
  const mockDb = {
    outreach: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    calendarProposal: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    bookedMeeting: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    campaign: {
      update: vi.fn(),
    },
  }

  const mockMeetingBookingService = {
    proposeSlots: vi.fn(),
    handleResponse: vi.fn(),
  }

  const mockCrmService = {
    syncBookedMeeting: vi.fn(),
  }

  return { mockDb, mockMeetingBookingService, mockCrmService }
})

vi.mock('../../src/lib/db.js', () => ({ db: mockDb }))
vi.mock('../../src/services/meetingBooking.service.js', () => ({
  meetingBookingService: mockMeetingBookingService,
}))
vi.mock('../../src/services/crm.service.js', () => ({
  crmService: mockCrmService,
}))

import { appRouter } from '../../src/routers/index.js'
import type { Context } from '../../src/trpc.js'

/**
 * TDD Test Suite: Meetings Router
 *
 * Tests meeting CRUD, slot proposals, acceptance, and CRM sync.
 * Spec refs: Technical Spec §2.1 Stage 5, PRD F7, App Flow §2.E
 */

describe('MeetingsRouter', () => {
  const ctx: Context = {
    req: {} as any,
    user: { id: 'user-1', email: 'test@test.com', role: 'founder' },
  }
  const caller = appRouter.createCaller(ctx)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('proposeSlots', () => {
    it('should return a calendar proposal with 3-5 slots', async () => {
      mockDb.outreach.findFirst.mockResolvedValue({
        id: 'outreach-1',
        userId: 'user-1',
        status: 'engaged',
        buyerEmail: 'vp@acme.com',
      })

      const now = new Date()
      const slots = [
        { datetime: new Date(now.getTime() + 86400000).toISOString(), durationMin: 30, timezone: 'America/New_York' },
        { datetime: new Date(now.getTime() + 172800000).toISOString(), durationMin: 30, timezone: 'America/New_York' },
        { datetime: new Date(now.getTime() + 259200000).toISOString(), durationMin: 30, timezone: 'America/New_York' },
        { datetime: new Date(now.getTime() + 345600000).toISOString(), durationMin: 30, timezone: 'America/New_York' },
      ]

      mockMeetingBookingService.proposeSlots.mockResolvedValue({
        proposalId: 'proposal-1',
        proposedSlots: slots,
        prospectTimezone: 'America/New_York',
        fallback: false,
      })

      const result = await caller.meetings.proposeSlots({ outreachId: 'outreach-1' })
      expect(result.proposedSlots.length).toBeGreaterThanOrEqual(3)
      expect(result.proposedSlots.length).toBeLessThanOrEqual(5)
    })

    it('should require an active outreach in "engaged" state', async () => {
      mockDb.outreach.findFirst.mockResolvedValue(null)

      await expect(
        caller.meetings.proposeSlots({ outreachId: 'outreach-in-draft' })
      ).rejects.toThrow()
    })
  })

  describe('acceptSlot', () => {
    it('should book the meeting and update outreach to "booked"', async () => {
      mockDb.calendarProposal.findFirst.mockResolvedValue({
        id: 'proposal-1',
        outreachId: 'outreach-1',
        outreach: {
          accountName: 'Acme Corp',
          buyerEmail: 'vp@acme.com',
          buyerName: 'John Doe',
          campaignId: 'camp-1',
          userId: 'user-1',
        },
      })

      mockMeetingBookingService.handleResponse.mockResolvedValue({
        status: 'booked',
        bookedMeetingId: 'meeting-1',
      })

      mockDb.bookedMeeting.findUnique.mockResolvedValue({
        id: 'meeting-1',
        outreachId: 'outreach-1',
        scheduledAt: new Date(),
        durationMinutes: 30,
        conversationSummary: 'Meeting booked.',
        nextSteps: '',
      })

      mockCrmService.syncBookedMeeting.mockResolvedValue({ syncedToCrm: true, crmRecordId: 'hs_123' })

      const result = await caller.meetings.acceptSlot({
        proposalId: 'proposal-1',
        slotIndex: 0,
      })
      expect(result.status).toBe('booked')
      expect(result.bookedMeetingId).toBeDefined()
    })

    it('should trigger CRM sync after booking', async () => {
      mockDb.calendarProposal.findFirst.mockResolvedValue({
        id: 'proposal-1',
        outreachId: 'outreach-1',
        outreach: {
          accountName: 'Acme Corp',
          buyerEmail: 'vp@acme.com',
          buyerName: 'John Doe',
          campaignId: 'camp-1',
          userId: 'user-1',
        },
      })

      mockMeetingBookingService.handleResponse.mockResolvedValue({
        status: 'booked',
        bookedMeetingId: 'meeting-1',
      })

      mockDb.bookedMeeting.findUnique.mockResolvedValue({
        id: 'meeting-1',
        outreachId: 'outreach-1',
        scheduledAt: new Date(),
        durationMinutes: 30,
        conversationSummary: 'Meeting booked.',
        nextSteps: '',
      })

      mockCrmService.syncBookedMeeting.mockResolvedValue({ syncedToCrm: true, crmRecordId: 'hs_123' })

      const result = await caller.meetings.acceptSlot({
        proposalId: 'proposal-1',
        slotIndex: 0,
      })
      expect(result.syncedToCrm).toBe(true)
    })
  })

  describe('list', () => {
    it('should return booked meetings for the authenticated user', async () => {
      const meetings = [
        {
          id: 'meeting-1',
          outreachId: 'outreach-1',
          scheduledAt: new Date(),
          durationMinutes: 30,
          meetingSource: 'autonomous_bdr',
          outreach: { campaignId: 'camp-1', accountName: 'Acme Corp' },
        },
      ]
      mockDb.bookedMeeting.findMany.mockResolvedValue(meetings)

      const results = await caller.meetings.list()
      results.forEach(m => {
        expect(m.scheduledAt).toBeDefined()
      })
    })
  })
})
