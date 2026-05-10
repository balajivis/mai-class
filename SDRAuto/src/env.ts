import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(16),
  NEXTAUTH_SECRET: z.string().min(16),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AZURE_CLIENT_ID: z.string().optional(),
  AZURE_CLIENT_SECRET: z.string().optional(),

  ANTHROPIC_API_KEY: z.string(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SENDER_EMAIL: z.string().email(),

  HUBSPOT_API_KEY: z.string().optional(),

  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  COMPANY_NAME: z.string().default('Your Company Inc.'),
  COMPANY_ADDRESS: z.string().default('123 Main St, City, State 12345'),
  UNSUBSCRIBE_URL: z.string().url().default('https://example.com/unsubscribe'),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.format()
    console.error('Invalid environment variables:', formatted)
    throw new Error('Invalid environment variables')
  }
  return result.data
}

export const env = loadEnv()
