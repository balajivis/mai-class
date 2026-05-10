import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { TRPCError } from '@trpc/server'
import { db } from '../lib/db.js'
import { outreachService } from '../services/outreach.service.js'

export const outreachRouter = router({
  list: protectedProcedure
    .input(z.object({
      campaignId: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { userId: ctx.user.id }
      if (input?.campaignId) where.campaignId = input.campaignId
      if (input?.status) where.status = input.status

      return db.outreach.findMany({
        where,
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ outreachId: z.string() }))
    .query(async ({ ctx, input }) => {
      const outreach = await db.outreach.findFirst({
        where: { id: input.outreachId, userId: ctx.user.id },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          replies: { orderBy: { receivedTimestamp: 'desc' } },
          calendarProposal: true,
          bookedMeeting: true,
        },
      })

      if (!outreach) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Outreach not found' })
      }

      return outreach
    }),

  approve: protectedProcedure
    .input(z.object({ outreachId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const outreach = await db.outreach.findFirst({
        where: { id: input.outreachId, userId: ctx.user.id },
      })
      if (!outreach) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Outreach not found' })
      }

      return outreachService.approveFirstTouch(input.outreachId, ctx.user.id)
    }),

  reject: protectedProcedure
    .input(z.object({
      outreachId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const outreach = await db.outreach.findFirst({
        where: { id: input.outreachId, userId: ctx.user.id },
      })
      if (!outreach) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Outreach not found' })
      }

      return outreachService.rejectFirstTouch(input.outreachId, ctx.user.id, input.reason)
    }),

  pause: protectedProcedure
    .input(z.object({ outreachId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const outreach = await db.outreach.findFirst({
        where: { id: input.outreachId, userId: ctx.user.id },
      })
      if (!outreach) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Outreach not found' })
      }

      return db.outreach.update({
        where: { id: input.outreachId },
        data: { status: 'paused' },
      })
    }),

  resume: protectedProcedure
    .input(z.object({ outreachId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const outreach = await db.outreach.findFirst({
        where: { id: input.outreachId, userId: ctx.user.id },
      })
      if (!outreach) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Outreach not found' })
      }

      return outreachService.resume(input.outreachId)
    }),
})
