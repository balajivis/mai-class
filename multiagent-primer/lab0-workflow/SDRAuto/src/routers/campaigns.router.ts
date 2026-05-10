import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { TRPCError } from '@trpc/server'
import { db } from '../lib/db.js'
import { autonomyLevelSchema, campaignCreateSchema, csvRowSchema, emailSchema } from '../lib/validation.js'
import type { CsvValidationError, CsvUploadResult } from '../types/index.js'

export const campaignsRouter = router({
  create: protectedProcedure
    .input(campaignCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const campaign = await db.campaign.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          icpDefinition: input.icpDefinition,
          autonomyLevel: input.autonomyLevel,
          status: 'draft',
        },
      })

      return campaign
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      return db.campaign.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await db.campaign.findFirst({
        where: { id: input.campaignId, userId: ctx.user.id },
      })

      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' })
      }

      return campaign
    }),

  update: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
      name: z.string().min(1).optional(),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      autonomyLevel: autonomyLevelSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { campaignId, ...data } = input

      const campaign = await db.campaign.findFirst({
        where: { id: campaignId, userId: ctx.user.id },
      })
      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' })
      }

      return db.campaign.update({
        where: { id: campaignId },
        data,
      })
    }),

  delete: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await db.campaign.findFirst({
        where: { id: input.campaignId, userId: ctx.user.id },
      })
      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' })
      }

      await db.campaign.delete({ where: { id: input.campaignId } })
      return { deleted: true }
    }),

  stats: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await db.campaign.findFirst({
        where: { id: input.campaignId, userId: ctx.user.id },
      })

      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' })
      }

      const replyRate = campaign.firstTouchesSent > 0
        ? campaign.repliesReceived / campaign.firstTouchesSent
        : 0

      return {
        accountsAdded: campaign.accountsAdded,
        firstTouchesSent: campaign.firstTouchesSent,
        repliesReceived: campaign.repliesReceived,
        meetingsBooked: campaign.meetingsBooked,
        replyRate,
      }
    }),

  uploadCSV: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
      csvContent: z.string(),
    }))
    .mutation(async ({ ctx, input }): Promise<CsvUploadResult> => {
      const campaign = await db.campaign.findFirst({
        where: { id: input.campaignId, userId: ctx.user.id },
      })
      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' })
      }

      const lines = input.csvContent.trim().split('\n')
      if (lines.length < 2) {
        return {
          accountsImported: 0,
          invalidAccounts: 0,
          validationErrors: [{ row: 1, field: 'csv', message: 'CSV must have a header and at least one data row' }],
          warnings: [],
        }
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

      // Check required columns
      if (!headers.includes('domain')) {
        return {
          accountsImported: 0,
          invalidAccounts: 0,
          validationErrors: [{ row: 1, field: 'domain', message: 'Missing required column: domain' }],
          warnings: [],
        }
      }
      if (!headers.includes('company_name')) {
        return {
          accountsImported: 0,
          invalidAccounts: 0,
          validationErrors: [{ row: 1, field: 'company_name', message: 'Missing required column: company_name' }],
          warnings: [],
        }
      }

      const errors: CsvValidationError[] = []
      const validAccounts: Array<{ domain: string; companyName: string; buyerEmail?: string }> = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })

        const rowNum = i + 1 // 1-indexed, header is row 1

        if (!row.domain || row.domain.length === 0) {
          errors.push({ row: rowNum, field: 'domain', message: 'Domain is required' })
          continue
        }

        if (!row.company_name || row.company_name.length === 0) {
          errors.push({ row: rowNum, field: 'company_name', message: 'Company name is required' })
          continue
        }

        if (row.buyer_email && row.buyer_email.length > 0) {
          const emailResult = emailSchema.safeParse(row.buyer_email)
          if (!emailResult.success) {
            errors.push({ row: rowNum, field: 'buyer_email', message: 'Invalid email format' })
            continue
          }
        }

        validAccounts.push({
          domain: row.domain,
          companyName: row.company_name,
          buyerEmail: row.buyer_email || undefined,
        })
      }

      // Bulk create accounts
      if (validAccounts.length > 0) {
        await db.account.createMany({
          data: validAccounts.map(a => ({
            campaignId: input.campaignId,
            domain: a.domain,
            companyName: a.companyName,
            buyerEmail: a.buyerEmail,
          })),
        })

        await db.campaign.update({
          where: { id: input.campaignId },
          data: { accountsAdded: { increment: validAccounts.length } },
        })
      }

      const warnings: Array<{ type: string; message: string }> = []
      if (validAccounts.length > 500) {
        warnings.push({
          type: 'too_many_accounts',
          message: `${validAccounts.length} accounts imported. Consider narrowing your ICP for better personalization.`,
        })
      }

      return {
        accountsImported: validAccounts.length,
        invalidAccounts: errors.length,
        validationErrors: errors,
        warnings,
      }
    }),
})
