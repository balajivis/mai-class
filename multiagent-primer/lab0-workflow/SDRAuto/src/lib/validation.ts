import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address').min(1)

export const domainSchema = z.string().regex(
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
  'Invalid domain'
).min(1)

export const uuidSchema = z.string().uuid('Invalid UUID')

export const autonomyLevelSchema = z.enum(['L1', 'L2', 'L3', 'L4'])

export const dailyCapSchema = z.number().int().min(1, 'Daily cap must be at least 1').max(100, 'Daily cap cannot exceed 100')

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const campaignCreateSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  icpDefinition: z.record(z.any()),
  autonomyLevel: autonomyLevelSchema.default('L2'),
})

export const csvRowSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  company_name: z.string().min(1, 'Company name is required'),
  buyer_email: z.string().email('Invalid email').optional().or(z.literal('')),
})
