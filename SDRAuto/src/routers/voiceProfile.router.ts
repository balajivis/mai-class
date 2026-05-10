import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { TRPCError } from '@trpc/server'
import { db } from '../lib/db.js'
import { voiceCloningService } from '../services/voiceCloning.service.js'

export const voiceProfileRouter = router({
  get: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await db.voiceProfile.findFirst({
        where: { id: input.profileId, userId: ctx.user.id },
      })
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Voice profile not found' })
      }
      return profile
    }),

  upload: protectedProcedure
    .input(z.object({
      emails: z.array(z.string()).min(30, 'Minimum 30 email samples required'),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await voiceCloningService.extractProfile(ctx.user.id, input.emails)
      return {
        profileId: profile.id,
        confidenceScore: profile.confidenceScore,
        tone: profile.tone,
        sourceEmailCount: profile.sourceEmailCount,
      }
    }),

  validate: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await db.voiceProfile.findFirst({
        where: { id: input.profileId, userId: ctx.user.id },
      })
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Voice profile not found' })
      }

      return voiceCloningService.validateProfile(input.profileId)
    }),

  preview: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await db.voiceProfile.findFirst({
        where: { id: input.profileId, userId: ctx.user.id },
      })
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Voice profile not found' })
      }

      return voiceCloningService.getPreview(input.profileId)
    }),

  testGeneration: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.voiceProfile.findFirst({
        where: { id: input.profileId, userId: ctx.user.id },
      })
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Voice profile not found' })
      }

      return voiceCloningService.testGeneration(input.profileId)
    }),

  removeEmails: protectedProcedure
    .input(z.object({
      profileId: z.string(),
      emailIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.voiceProfile.findFirst({
        where: { id: input.profileId, userId: ctx.user.id },
      })
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Voice profile not found' })
      }

      return voiceCloningService.removeEmails(input.profileId, input.emailIds)
    }),

  approve: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.voiceProfile.findFirst({
        where: { id: input.profileId, userId: ctx.user.id },
      })
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Voice profile not found' })
      }

      return voiceCloningService.approveProfile(input.profileId)
    }),
})
