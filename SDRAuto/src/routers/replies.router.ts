import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { TRPCError } from '@trpc/server'
import { db } from '../lib/db.js'

const CLASSIFICATION_PRIORITY: Record<string, number> = {
  positive: 1,
  objection: 2,
  unclear: 3,
  noise: 4,
  unsubscribe: 5,
}

export const repliesRouter = router({
  list: protectedProcedure
    .input(z.object({
      classification: z.enum(['positive', 'objection', 'unsubscribe', 'noise', 'unclear']).optional(),
      status: z.enum(['pending', 'escalated', 'resolved']).optional(),
      sort: z.enum(['priority', 'date']).default('date'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        outreach: { userId: ctx.user.id },
      }

      if (input?.classification) {
        where.classification = input.classification
      }

      if (input?.status === 'pending') {
        where.actionTaken = null
      } else if (input?.status === 'escalated') {
        where.actionTaken = 'escalated'
      } else if (input?.status === 'resolved') {
        where.actionTaken = { not: null }
      }

      const replies = await db.reply.findMany({
        where,
        include: {
          outreach: { select: { accountName: true, campaignId: true } },
          message: { select: { subject: true } },
        },
        orderBy: input?.sort === 'priority'
          ? { confidence: 'desc' }
          : { receivedTimestamp: 'desc' },
      })

      if (input?.sort === 'priority') {
        replies.sort((a, b) => {
          const priorityA = CLASSIFICATION_PRIORITY[a.classification] ?? 99
          const priorityB = CLASSIFICATION_PRIORITY[b.classification] ?? 99
          return priorityA - priorityB
        })
      }

      return replies
    }),

  escalate: protectedProcedure
    .input(z.object({
      replyId: z.string(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reply = await db.reply.findFirst({
        where: { id: input.replyId, outreach: { userId: ctx.user.id } },
      })
      if (!reply) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reply not found' })
      }

      return db.reply.update({
        where: { id: input.replyId },
        data: { actionTaken: 'escalated' },
      })
    }),

  markReviewed: protectedProcedure
    .input(z.object({
      replyId: z.string(),
      correctClassification: z.enum(['positive', 'objection', 'unsubscribe', 'noise', 'unclear']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reply = await db.reply.findFirst({
        where: { id: input.replyId, outreach: { userId: ctx.user.id } },
      })
      if (!reply) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reply not found' })
      }

      const updateData: Record<string, unknown> = {
        actionTaken: 'reviewed',
      }

      if (input.correctClassification) {
        updateData.classifierFeedback = {
          originalClassification: reply.classification,
          correctedClassification: input.correctClassification,
          correctedAt: new Date().toISOString(),
          correctedBy: ctx.user.id,
        }
      }

      return db.reply.update({
        where: { id: input.replyId },
        data: updateData,
      })
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      replyId: z.string(),
      action: z.enum(['escalated', 'archived', 'auto_rebuttal_sent', 'paused', 'reviewed']),
    }))
    .mutation(async ({ ctx, input }) => {
      const reply = await db.reply.findFirst({
        where: { id: input.replyId, outreach: { userId: ctx.user.id } },
      })
      if (!reply) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reply not found' })
      }

      return db.reply.update({
        where: { id: input.replyId },
        data: { actionTaken: input.action },
      })
    }),
})
