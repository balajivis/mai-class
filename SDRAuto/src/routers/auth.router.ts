import { z } from 'zod'
import bcrypt from 'bcrypt'
import { router, publicProcedure, protectedProcedure } from '../trpc.js'
import { TRPCError } from '@trpc/server'
import { db } from '../lib/db.js'
import { emailSchema, passwordSchema } from '../lib/validation.js'
import { generateToken } from '../middleware/auth.middleware.js'
import { logger } from '../lib/logger.js'

const SALT_ROUNDS = 12

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({
      email: emailSchema,
      password: passwordSchema,
    }))
    .mutation(async ({ input }) => {
      const existing = await db.user.findUnique({ where: { email: input.email } })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User with this email already exists' })
      }

      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

      const user = await db.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: 'founder',
          autonomyLevel: 'L2',
          dailyEmailCap: 20,
        },
      })

      const token = generateToken({ id: user.id, email: user.email, role: user.role as 'founder' | 'admin' })

      logger.info('User signed up', { userId: user.id, email: user.email })

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        token,
        settings: {
          autonomyLevel: user.autonomyLevel,
          dailyCap: user.dailyEmailCap,
        },
      }
    }),

  login: publicProcedure
    .input(z.object({
      email: emailSchema,
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const user = await db.user.findUnique({ where: { email: input.email } })
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash)
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role as 'founder' | 'admin' })

      return {
        userId: user.id,
        email: user.email,
        token,
        settings: {
          autonomyLevel: user.autonomyLevel,
          dailyCap: user.dailyEmailCap,
        },
      }
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          autonomyLevel: true,
          dailyEmailCap: true,
          domainEmailCap: true,
          createdAt: true,
        },
      })

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      return {
        ...user,
        settings: {
          autonomyLevel: user.autonomyLevel,
          dailyCap: user.dailyEmailCap,
          domainCap: user.domainEmailCap,
        },
      }
    }),
})
