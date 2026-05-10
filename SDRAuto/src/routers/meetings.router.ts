import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { TRPCError } from '@trpc/server'
import { db } from '../lib/db.js'
import { meetingBookingService } from '../services/meetingBooking.service.js'
import { crmService } from '../services/crm.service.js'

export const meetingsRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return db.bookedMeeting.findMany({
        where: { outreach: { userId: ctx.user.id } },
        include: {
          outreach: { select: { campaignId: true, accountName: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await db.bookedMeeting.findFirst({
        where: { id: input.meetingId, outreach: { userId: ctx.user.id } },
        include: { outreach: true },
      })

      if (!meeting) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Meeting not found' })
      }

      return meeting
    }),

  proposeSlots: protectedProcedure
    .input(z.object({ outreachId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const outreach = await db.outreach.findFirst({
        where: { id: input.outreachId, userId: ctx.user.id },
      })
      if (!outreach) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Outreach not found' })
      }

      return meetingBookingService.proposeSlots(input.outreachId, ctx.user.id)
    }),

  acceptSlot: protectedProcedure
    .input(z.object({
      proposalId: z.string(),
      slotIndex: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await db.calendarProposal.findFirst({
        where: { id: input.proposalId, outreach: { userId: ctx.user.id } },
        include: { outreach: true },
      })
      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' })
      }

      const result = await meetingBookingService.handleResponse(
        input.proposalId,
        'accepted',
        input.slotIndex
      )

      // Sync to CRM
      if (result.status === 'booked' && result.bookedMeetingId) {
        const meeting = await db.bookedMeeting.findUnique({ where: { id: result.bookedMeetingId } })
        if (meeting) {
          const syncResult = await crmService.syncBookedMeeting({
            outreachId: proposal.outreachId,
            accountName: proposal.outreach.accountName,
            contactEmail: proposal.outreach.buyerEmail,
            scheduledDatetime: meeting.scheduledAt.toISOString(),
            durationMin: meeting.durationMinutes,
            meetingSource: 'autonomous_bdr',
            conversationSummary: meeting.conversationSummary,
            nextSteps: meeting.nextSteps ?? '',
          })

          return { ...result, syncedToCrm: syncResult.syncedToCrm }
        }
      }

      return { ...result, syncedToCrm: false }
    }),

  rejectSlot: protectedProcedure
    .input(z.object({ proposalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await db.calendarProposal.findFirst({
        where: { id: input.proposalId, outreach: { userId: ctx.user.id } },
      })
      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' })
      }

      return meetingBookingService.handleResponse(input.proposalId, 'rejected')
    }),
})
