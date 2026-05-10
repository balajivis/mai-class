# Backend Guidelines: Autonomous BDR (Node.js + Express + tRPC)

**Version**: 1.0
**Last Updated**: 2026-03-28
**Status**: Ready for Phase 1 Implementation

---

## 1. Architecture Overview

The Autonomous BDR backend is built on a modern, async-first TypeScript stack designed for rapid iteration, type safety, and operational simplicity. The stack emphasizes end-to-end type checking, transparent AI orchestration, and compliance-safe defaults.

### 1.1 Core Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18+ LTS | Async-first, V8 performance, TypeScript support |
| Framework | Express.js | 4.18+ | Minimal middleware-based HTTP server |
| RPC Layer | tRPC | 10+ | Type-safe RPC, zero code generation |
| Database | PostgreSQL | 14+ | Relational integrity, JSONB, read replicas |
| ORM | Prisma | 5+ | Type-safe queries, auto migrations |
| Job Queue | Bull + Redis | Latest | Async task scheduling, email sending, LLM processing |
| Auth | NextAuth.js | v4+ | OAuth2 (Gmail/Outlook), JWT sessions |
| LLM | Anthropic Claude | 3.5+ (Sonnet) | Voice cloning, email generation, reply classification |
| Email | AWS SES / Mailgun | Latest | SMTP sending, bounce handling, deliverability |
| Logging | Winston | Latest | Structured logs, error tracking (Sentry integration) |

### 1.2 Core Principles

1. **Type Safety End-to-End**: TypeScript throughout; tRPC ensures frontend ↔ backend type consistency
2. **Transparency by Default**: Every decision logged with reasoning; audit trail for compliance
3. **Async-First Architecture**: Email, LLM, and inbox polling all non-blocking via Bull queues
4. **Fail-Safe Defaults**: L2 autonomy default, human approval gates, conservative classifier
5. **Minimal Operational Overhead**: Stateless API, managed PostgreSQL/Redis, Docker-ready

---

## 2. Directory Structure

```
src/
├── server.ts                          # Express setup, tRPC router mount, middleware chain
├── trpc.ts                            # tRPC procedure builder, context type, error formatter
├── env.ts                             # Environment variable validation (Zod)
│
├── routers/                           # tRPC routers by feature domain
│  ├── auth.router.ts                  # login, signup, logout, refresh, me
│  ├── campaigns.router.ts             # create, list, get, update, delete, stats
│  ├── outreach.router.ts              # list, get-by-id, approve (L2), reject
│  ├── replies.router.ts               # list, escalate, update-status, mark-reviewed
│  ├── meetings.router.ts              # list, get, propose-slots, accept, reject, sync-crm
│  ├── voiceProfile.router.ts          # get, upload, validate, preview, test
│  └── index.ts                        # Merge all routers into root appRouter
│
├── services/                          # Business logic + external integrations
│  ├── voiceCloning.service.ts         # Extract tone, patterns, confidence from email samples
│  ├── emailGeneration.service.ts      # LangChain few-shot + Claude for personalization
│  ├── replyClassification.service.ts  # Classify positive/objection/unsubscribe/noise/unclear
│  ├── outreach.service.ts             # Orchestrate research → voice → email → approval → send
│  ├── enrichment.service.ts           # Fetch org chart, news, pain indicators (Phase 2)
│  ├── research.service.ts             # Build per-account brief from external APIs
│  ├── crm.service.ts                  # HubSpot OAuth2, write booked meetings
│  ├── emailSending.service.ts         # AWS SES/Mailgun SMTP, bounce handling
│  └── inbox.service.ts                # Gmail/Outlook OAuth2, fetch new messages
│
├── jobs/                              # Bull job handlers (async task workers)
│  ├── emailSender.job.ts              # Send email via SES, validate, log, handle bounces
│  ├── inboxPoller.job.ts              # Poll Gmail/Outlook every 5 min, queue replies
│  ├── replyClassifier.job.ts          # Classify reply, escalate or auto-handle per autonomy
│  ├── followUpScheduler.job.ts        # Check for follow-ups ready, regenerate email, queue send
│  ├── accountResearch.job.ts          # Run research brief, enrich account with data
│  └── queue.ts                        # Queue initialization, job registration
│
├── middleware/                        # Express middleware
│  ├── auth.middleware.ts              # Verify JWT, attach user to ctx, handle refresh
│  ├── errorHandler.middleware.ts      # Catch async errors, format as tRPC error, log
│  ├── rateLimit.middleware.ts         # Per-user rate limiting (100 req/min, 20 emails/day)
│  ├── logging.middleware.ts           # Winston request/response logging
│  └── validation.middleware.ts        # Input validation schema checking
│
├── lib/                               # Utilities & clients
│  ├── anthropic.ts                    # Anthropic client init, streaming setup, retry logic
│  ├── db.ts                           # Prisma client singleton, transaction helpers
│  ├── redis.ts                        # Redis client, cache get/set/delete helpers
│  ├── email.ts                        # SMTP client (SES/Mailgun), send abstraction
│  ├── oauth.ts                        # Gmail/Outlook OAuth helpers, token refresh
│  ├── validation.ts                   # Shared Zod schemas (email, url, uuid, etc.)
│  └── logger.ts                       # Winston logger config, transport setup
│
├── db/
│  ├── schema.prisma                   # Prisma schema: all models, relations, indexes
│  └── migrations/                     # Auto-generated Prisma migrations
│
└── types/
   ├── index.ts                        # Shared TypeScript types (User, Campaign, Reply, etc.)
   └── auth.ts                         # NextAuth session type extensions
```

---

## 3. tRPC Router Structure

Each router exports a router object with type-safe procedures. All routers are merged into a root `appRouter` in `routers/index.ts`, which is mounted on Express as middleware.

### 3.1 Router Pattern

```typescript
// routers/campaigns.router.ts
import { router, publicProcedure, protectedProcedure } from '@/trpc'
import { z } from 'zod'

export const campaignsRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      icpDefinition: z.record(z.any()),
      autonomyLevel: z.enum(['L1', 'L2', 'L3', 'L4']).default('L2'),
    }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await campaignsService.create(ctx.user.id, input)
      return campaign
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      const campaigns = await db.campaign.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
      })
      return campaigns
    }),

  stats: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const stats = await campaignsService.getStats(ctx.user.id, input.campaignId)
      return stats // { accountsAdded, firstTouchesSent, repliesReceived, meetingsBooked, replyRate }
    }),
})
```

### 3.2 Phase 1 Routers

| Router | Key Procedures | Autonomy Behavior |
|--------|----------------|-------------------|
| **auth** | login, signup, logout, refresh, me | NextAuth.js session, OAuth2 Gmail/Outlook |
| **campaigns** | create, list, get, update, delete, stats | Basic CRUD, no campaign-level sharing (Phase 1) |
| **outreach** | list, get-by-id, approve (L2 only), reject, resume, pause | L2 requires human approval on first touch; auto-send follow-ups |
| **replies** | list, escalate, update-status, mark-reviewed | Filter by pending/escalated/resolved; L2 escalates all |
| **meetings** | list, get, propose-slots, accept-slot, reject-slot, sync-to-crm | Generate 3–5 slots; log to HubSpot |
| **voiceProfile** | get, upload-emails, validate, preview, test-generation | Extract tone from email samples, validate confidence ≥0.85 |

### 3.3 Error Handling

tRPC procedures return typed errors via `throw new TRPCError`:

```typescript
import { TRPCError } from '@trpc/server'

if (!campaign) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Campaign not found',
  })
}

if (input.dailyCap < 1 || input.dailyCap > 100) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Daily cap must be between 1 and 100',
  })
}

if (!ctx.user) {
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'User not authenticated',
  })
}
```

Errors are caught by `errorHandler.middleware.ts`, logged, and returned to frontend with user-friendly messages.

---

## 4. Authentication & Authorization

### 4.1 NextAuth.js Setup

NextAuth.js handles authentication via OAuth2 (Gmail, Outlook) and credential providers. Configuration in `/pages/api/auth/[...nextauth].ts`:

```typescript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
        },
      },
    }),
    AzureADProvider({
      clientId: env.AZURE_CLIENT_ID,
      clientSecret: env.AZURE_CLIENT_SECRET,
      tenantId: 'common',
      authorization: {
        params: {
          scope: 'openid email profile Mail.Read Calendar.Read',
        },
      },
    }),
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const user = await db.user.findUnique({ where: { email: credentials.email } })
        if (user && await bcrypt.compare(credentials.password, user.passwordHash)) {
          return { id: user.id, email: user.email, name: user.name }
        }
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: env.NEXTAUTH_SECRET,
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        // Store OAuth tokens encrypted in DB for later refresh
        await storeOAuthToken(token.id as string, {
          provider: account.provider,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        })
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      return session
    },
  },
}

export default NextAuth(authOptions)
```

### 4.2 tRPC Context & Middleware

tRPC context extracts user from NextAuth session:

```typescript
// trpc.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export const createTRPCContext = async (opts?: { session: Session | null }) => {
  const session = opts?.session ?? await getServerSession(authOptions)

  return {
    db,
    redis,
    user: session?.user,
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

// Define protected vs. public procedures
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // narrowed to non-null
    },
  })
})
```

### 4.3 JWT Refresh & Token Expiry

OAuth access tokens from Gmail/Outlook expire after 1 hour. Before inbox polling, refresh if needed:

```typescript
// lib/oauth.ts
export async function refreshGmailToken(userId: string) {
  const token = await db.oAuthToken.findFirst({
    where: { userId, provider: 'google' },
  })

  if (!token) throw new Error('No Gmail token found')
  if (token.expiresAt && token.expiresAt > new Date()) {
    return token.accessToken // Still valid
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: token.refreshToken!,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json()
  await db.oAuthToken.update({
    where: { id: token.id },
    data: {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  })

  return data.access_token
}
```

### 4.4 Roles & Permissions

Phase 1: Single role "user" (founder or SDR rep). Phase 2+: Add "admin" for multi-team management.

```typescript
// types/auth.ts
export type UserRole = 'user' | 'admin'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: UserRole
    }
  }
}
```

---

## 5. Database Schema (Prisma)

The Prisma schema lives in `src/db/schema.prisma`. Key models for Phase 1:

### 5.1 Core Models

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  passwordHash      String?   // For credentials provider
  name              String?
  role              String    @default("user") // "user" | "admin"

  // Settings
  autonomyLevel     String    @default("L2") // "L1" | "L2" | "L3" | "L4"
  dailyEmailCap     Int       @default(20)   // Configurable 1-100
  domainEmailCap    Int       @default(5)    // Per-domain daily cap

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  campaigns         Campaign[]
  outreach          Outreach[]
  voiceProfiles     VoiceProfile[]
  oauthTokens       OAuthToken[]

  @@index([email])
}

model Campaign {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  name              String
  icpDefinition     Json      // { company_size: [min, max], industry: [...], ... }
  status            String    @default("draft") // "draft" | "active" | "paused" | "completed"

  // Stats (denormalized for fast access)
  accountsAdded     Int       @default(0)
  firstTouchesSent  Int       @default(0)
  repliesReceived   Int       @default(0)
  meetingsBooked    Int       @default(0)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  outreach          Outreach[]

  @@index([userId, status])
  @@index([createdAt])
}

model VoiceProfile {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Extracted characteristics
  tone              String    // e.g., "direct, data-driven, casual"
  sentenceStructure String    // e.g., "short punchy lines"
  emojiUsage        Boolean
  avgMessageLength  Int       // words
  commonOpeners     String[]  // Array of opening lines
  signOffPatterns   String[]  // Array of sign-off styles
  valuePropStyle    String    // e.g., "ROI-focused" vs "time-to-value"

  // Quality metrics
  confidenceScore   Float     // 0.0-1.0; must be ≥0.85 to use
  sourceEmailCount  Int       // How many emails analyzed
  validatedByUser   Boolean   @default(false)

  // Raw data (JSONB for future improvements)
  extractedFeatures Json      // Full extraction result from Claude

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
}

model Outreach {
  id                String    @id @default(cuid())
  campaignId        String
  campaign          Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Account info
  accountId         String    // User-provided domain or company ID
  accountName       String
  buyerEmail        String
  buyerName         String?

  // Research & voice
  researchBrief     Json      // { org_chart, news, pain_indicators, buyer_persona, icp_fit_score, ... }
  voiceProfileId    String?   // Which voice profile was used

  // Status tracking
  status            String    @default("researched") // researched | first_touch_pending | first_touch_sent | awaiting_reply | engaged | booked | paused
  autonomyAtCreation String   @default("L2")

  // Message references
  firstTouchId      String?   // ID of first message sent
  followUpIds       String[]  @default([])

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  messages          Message[]
  replies           Reply[]
  calendarProposal  CalendarProposal?
  bookedMeeting     BookedMeeting?

  @@index([campaignId, status])
  @@index([userId, status])
  @@index([updatedAt])
}

model Message {
  id                String    @id @default(cuid())
  outreachId        String
  outreach          Outreach  @relation(fields: [outreachId], references: [id], onDelete: Cascade)

  messageType       String    // "first_touch" | "follow_up" | "objection_rebuttal"
  direction         String    // "outbound" | "inbound"

  senderEmail       String
  recipientEmail    String
  subject           String
  body              String    @db.Text

  // Personalization tracking
  personalizationUsed String[] // ["company_news", "hiring_signal", "funding_event"]
  voiceConfidenceScore Float?  // 0.0-1.0 confidence in voice match

  status            String    @default("draft") // "draft" | "approved" | "sent" | "bounced" | "failed"
  approvalBy        String?   // User ID who approved (if L1/L2)

  sentTimestamp     DateTime?
  bouncedTimestamp  DateTime?

  // Metadata
  openTracked       Boolean   @default(false)
  replyReceived     Boolean   @default(false)

  reasoningLog      String    @db.Text // Why this message was generated/sent
  metadata          Json?     // Additional tracking data

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  reply             Reply?

  @@index([outreachId, direction])
  @@index([status, sentTimestamp])
  @@index([recipientEmail])
}

model Reply {
  id                String    @id @default(cuid())
  messageId         String    @unique
  message           Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)
  outreachId        String
  outreach          Outreach  @relation(fields: [outreachId], references: [id], onDelete: Cascade)

  receivedTimestamp DateTime
  senderEmail       String
  subject           String
  body              String    @db.Text

  // Classification
  classification    String    // "positive" | "objection" | "unsubscribe" | "noise" | "unclear"
  confidence        Float     // 0.0-1.0
  objectionType     String?   // "already_using_competitor" | "budget_constraint" | etc.
  extractedSentiment String?   // "interested", "frustrated", "curious"
  extractedIntent   String?   // Free text summary of what prospect wants

  // Action taken
  actionTaken       String?   // "escalated" | "auto_rebuttal_sent" | "paused" | "archived"
  reasoningLog      String    @db.Text

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([outreachId, classification])
  @@index([receivedTimestamp])
  @@index([confidence])
}

model CalendarProposal {
  id                String    @id @default(cuid())
  outreachId        String    @unique
  outreach          Outreach  @relation(fields: [outreachId], references: [id], onDelete: Cascade)

  proposedSlots     Json      // [{ datetime, duration_min, timezone }]
  proposedAt        DateTime

  prospectResponse  String    @default("pending") // "pending" | "accepted" | "rejected" | "rescheduled"
  acceptedSlot      DateTime?
  bookedMeetingId   String?

  reasoningLog      String    @db.Text

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model BookedMeeting {
  id                String    @id @default(cuid())
  outreachId        String    @unique
  outreach          Outreach  @relation(fields: [outreachId], references: [id], onDelete: Cascade)

  accountName       String
  contactEmail      String
  contactName       String?

  scheduledAt       DateTime
  durationMinutes   Int       @default(30)

  meetingSource     String    @default("autonomous_bdr")
  conversationSummary String  @db.Text // All messages + sentiment
  nextSteps         String?   // Suggested follow-up from rep

  syncedToCRM       Boolean   @default(false)
  crmRecordId       String?   // External HubSpot deal/contact ID

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([outreachId])
  @@index([scheduledAt])
}

model OAuthToken {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider          String    // "google" | "azure" | "hubspot"
  accessToken       String    @db.Text
  refreshToken      String?   @db.Text
  expiresAt         DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([userId, provider])
  @@index([userId])
}

model UnsubscribeList {
  id                String    @id @default(cuid())
  userId            String
  email             String
  domain            String    // For per-domain pause logic
  reason            String?   // "unsubscribe" | "bounce" | "complaint"

  createdAt         DateTime  @default(now())

  @@unique([userId, email])
  @@index([userId, domain])
}
```

### 5.2 Indexes & Performance

Key indexes for Phase 1:
- `Outreach(userId, status, updatedAt)` — Fast dashboard queries
- `Message(outreachId, direction)` — Conversation threads
- `Reply(outreachId, classification)` — Reply queue filtering
- `Reply(receivedTimestamp)` — Inbox polling results

---

## 6. Service Layer (Business Logic)

Services encapsulate domain logic and external integrations. Each service is imported by routers and jobs.

### 6.1 voiceCloning.service.ts

Extracts voice profile from 30–50 sample emails using Claude:

```typescript
// services/voiceCloning.service.ts
import { Anthropic } from '@anthropic-ai/sdk'
import { db } from '@/lib/db'

export class VoiceCloningService {
  private client: Anthropic

  constructor(client: Anthropic) {
    this.client = client
  }

  async extractProfile(userId: string, emailTexts: string[]): Promise<VoiceProfile> {
    if (emailTexts.length < 30) {
      throw new Error('Minimum 30 email samples required')
    }

    const emailsText = emailTexts.slice(0, 50).join('\n---\n')

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `You are an expert at analyzing writing style and tone. Extract the voice profile from these emails.
Return valid JSON only with these fields:
{
  "tone": "description of tone (max 100 chars)",
  "sentence_structure": "description (max 100 chars)",
  "emoji_usage": boolean,
  "avg_message_length": number (words),
  "common_openers": ["array", "of", "opening", "styles"],
  "sign_off_patterns": ["array", "of", "sign-offs"],
  "value_prop_style": "description (max 100 chars)",
  "confidence_score": number (0.0-1.0)
}`,
      messages: [{
        role: 'user',
        content: `Extract voice profile from these ${emailTexts.length} emails:\n\n${emailsText}`,
      }],
    })

    const profileText = response.content[0].type === 'text' ? response.content[0].text : ''
    const profile = JSON.parse(profileText)

    // Validate confidence
    if (profile.confidence_score < 0.85) {
      throw new Error(`Voice profile confidence too low: ${profile.confidence_score}`)
    }

    // Save to DB
    const voiceProfile = await db.voiceProfile.create({
      data: {
        userId,
        tone: profile.tone,
        sentenceStructure: profile.sentence_structure,
        emojiUsage: profile.emoji_usage,
        avgMessageLength: profile.avg_message_length,
        commonOpeners: profile.common_openers,
        signOffPatterns: profile.sign_off_patterns,
        valuePropStyle: profile.value_prop_style,
        confidenceScore: profile.confidence_score,
        sourceEmailCount: emailTexts.length,
        extractedFeatures: profile,
      },
    })

    return voiceProfile
  }
}
```

### 6.2 emailGeneration.service.ts

Generates personalized emails using Claude with voice profile + research brief:

```typescript
// services/emailGeneration.service.ts
export class EmailGenerationService {
  async generateEmail(
    voiceProfile: VoiceProfile,
    researchBrief: ResearchBrief,
    valueProp: string,
  ): Promise<{ subjects: string[]; body: string; cta: string }> {
    const prompt = `
You are an expert sales email writer. Generate a first-touch email in this voice:

VOICE PROFILE:
Tone: ${voiceProfile.tone}
Sentence Structure: ${voiceProfile.sentenceStructure}
Emoji Usage: ${voiceProfile.emojiUsage ? 'Yes' : 'No'}
Sign-off Style: ${voiceProfile.signOffPatterns[0]}

TARGET ACCOUNT:
Company: ${researchBrief.accountName}
Buyer Role: ${researchBrief.buyerPersona.role}
Recent News: ${researchBrief.recentNews[0]?.headline || 'None'}

VALUE PROPOSITION: ${valueProp}

RULES:
- DO NOT mention that this is AI-generated
- DO NOT use clichés like "quick question" or "thought of you"
- Include 1-2 specific company signals (news, hiring, funding)
- Short lines, punchy (match sentence structure)
- Clear CTA: "Reply yes/no if curious"
- Max 150 words

Return JSON:
{
  "subjects": ["subject 1", "subject 2", "subject 3"],
  "body": "email body here",
  "cta": "reply yes/no if curious"
}
`

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    return JSON.parse((response.content[0] as any).text)
  }
}
```

### 6.3 replyClassification.service.ts

Classifies incoming replies using Claude with confidence scoring:

```typescript
// services/replyClassification.service.ts
export class ReplyClassificationService {
  async classify(
    replyBody: string,
    context: { originalEmail: string; researchBrief: ResearchBrief },
  ): Promise<Reply> {
    const prompt = `
Classify this reply to an outbound sales email:

ORIGINAL EMAIL:
${context.originalEmail}

RESEARCH CONTEXT:
Company: ${context.researchBrief.accountName}
${context.researchBrief.recentNews.map(n => \`- News: \${n.headline}\`).join('\n')}

INBOUND REPLY:
${replyBody}

Classify as one of: positive | objection | unsubscribe | noise | unclear

If objection, identify type: price | timing | already_using | use_case_fit | budget | other

Return JSON:
{
  "classification": "positive|objection|unsubscribe|noise|unclear",
  "confidence": 0.85,
  "objection_type": "type or null",
  "sentiment": "interested|frustrated|curious|dismissive|neutral",
  "extracted_intent": "what does prospect want or need?",
  "reasoning": "brief explanation of classification"
}
`

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    return JSON.parse((response.content[0] as any).text)
  }
}
```

### 6.4 outreach.service.ts

Orchestrates the full outreach pipeline: research → voice → email → approval → send.

```typescript
// services/outreach.service.ts
export class OutreachService {
  async sendFirstTouch(userId: string, outreachId: string): Promise<void> {
    const outreach = await db.outreach.findUnique({ where: { id: outreachId } })
    const user = await db.user.findUnique({ where: { id: userId } })

    // Check daily cap
    const emailsSentToday = await db.message.count({
      where: {
        outreach: { userId },
        sentTimestamp: { gte: startOfDay(new Date()) },
      },
    })

    if (emailsSentToday >= user.dailyEmailCap) {
      throw new Error('Daily email cap reached')
    }

    // Check domain cap
    const domainEmailsToday = await db.message.count({
      where: {
        outreach: { userId },
        recipientEmail: { endsWith: `@${getDomain(outreach.buyerEmail)}` },
        sentTimestamp: { gte: startOfDay(new Date()) },
      },
    })

    if (domainEmailsToday >= user.domainEmailCap) {
      throw new Error(`Domain cap reached for ${getDomain(outreach.buyerEmail)}`)
    }

    // Generate email (if not already approved)
    const message = await db.message.findFirst({
      where: { outreachId, messageType: 'first_touch' },
    })

    if (!message || message.status === 'draft') {
      // Generate from scratch
      const voiceProfile = await db.voiceProfile.findUnique({
        where: { id: user.voiceProfileId },
      })
      const emailData = await emailGenerationService.generateEmail(
        voiceProfile,
        outreach.researchBrief,
        user.valueProp,
      )

      await db.message.create({
        data: {
          outreachId,
          messageType: 'first_touch',
          direction: 'outbound',
          subject: emailData.subjects[0],
          body: emailData.body,
          senderEmail: user.sendFromEmail,
          recipientEmail: outreach.buyerEmail,
          personalizationUsed: ['company_news'], // Infer from brief
          status: user.autonomyLevel === 'L2' ? 'draft' : 'approved',
          reasoningLog: 'Auto-generated for first touch',
        },
      })
    }

    // If L2, require approval before sending
    if (user.autonomyLevel === 'L2' && message?.status === 'draft') {
      return // Await approval
    }

    // Send via email-sender queue
    const messageToSend = await db.message.findFirst({
      where: { outreachId, messageType: 'first_touch', status: 'approved' },
    })

    await emailSenderQueue.add(
      { messageId: messageToSend.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    )
  }
}
```

### 6.5 inbox.service.ts

Polls Gmail/Outlook for new messages every 5 minutes:

```typescript
// services/inbox.service.ts
export class InboxService {
  async pollGmail(userId: string): Promise<void> {
    const token = await refreshGmailToken(userId)

    const response = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread',
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const { messages = [] } = await response.json()

    for (const msg of messages) {
      const full = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const msgData = await full.json()

      // Parse email
      const subject = msgData.payload.headers.find((h) => h.name === 'Subject')?.value || ''
      const fromEmail = msgData.payload.headers.find((h) => h.name === 'From')?.value || ''

      // Check if reply to outreach
      const outreach = await findOutreachByReplyTo(userId, subject)
      if (!outreach) continue

      // Queue for classification
      await replyClassifierQueue.add({ messageId: msg.id, userId, outreachId: outreach.id })
    }
  }
}
```

---

## 7. Job Queue (Bull + Redis)

Bull queues handle async tasks: email sending, inbox polling, reply classification, follow-up scheduling.

### 7.1 Queue Initialization

```typescript
// lib/queue.ts
import Bull from 'bull'
import { redis } from '@/lib/redis'

export const emailSenderQueue = new Bull('email-sender', {
  redis: env.REDIS_URL,
})

export const inboxPollerQueue = new Bull('inbox-poller', {
  redis: env.REDIS_URL,
})

export const replyClassifierQueue = new Bull('reply-classifier', {
  redis: env.REDIS_URL,
})

export const followUpSchedulerQueue = new Bull('follow-up-scheduler', {
  redis: env.REDIS_URL,
})

export const accountResearchQueue = new Bull('account-research', {
  redis: env.REDIS_URL,
})
```

### 7.2 Email Sender Job

```typescript
// jobs/emailSender.job.ts
export async function emailSenderJob(job: Bull.Job) {
  const { messageId } = job.data

  const message = await db.message.findUnique({ where: { id: messageId } })
  const outreach = await db.outreach.findUnique({ where: { id: message.outreachId } })
  const user = await db.user.findUnique({ where: { id: outreach.userId } })

  try {
    // Validate recipient
    if (!isValidEmail(message.recipientEmail)) {
      throw new Error('Invalid email address')
    }

    // Check bounce list
    const unsubscribed = await db.unsubscribeList.findFirst({
      where: { userId: user.id, email: message.recipientEmail },
    })
    if (unsubscribed) {
      throw new Error('Recipient unsubscribed')
    }

    // Send via SES
    const params = {
      Source: message.senderEmail,
      Destination: { ToAddresses: [message.recipientEmail] },
      Message: {
        Subject: { Data: message.subject },
        Body: { Html: { Data: addCampaignFooter(message.body) } },
      },
      Tags: [
        { Name: 'campaign_id', Value: outreach.campaignId },
        { Name: 'outreach_id', Value: outreach.id },
      ],
    }

    const result = await sesClient.sendEmail(params)

    // Update message
    await db.message.update({
      where: { id: messageId },
      data: {
        status: 'sent',
        sentTimestamp: new Date(),
        metadata: { sesMessageId: result.MessageId },
      },
    })

    // Update outreach
    await db.outreach.update({
      where: { id: outreach.id },
      data: { status: 'first_touch_sent' },
    })

    // Schedule follow-ups based on autonomy level
    if (outreach.autonomyAtCreation !== 'L1') {
      await followUpSchedulerQueue.add(
        { outreachId: outreach.id, dayOffset: 3 },
        { delay: 3 * 24 * 60 * 60 * 1000 }, // 3 days
      )
    }

    logger.info('Email sent', { messageId, outreachId: outreach.id })
  } catch (error) {
    logger.error('Failed to send email', { messageId, error })

    // Handle SES bounces
    if (error.statusCode === 400) {
      await db.message.update({
        where: { id: messageId },
        data: { status: 'bounced', bouncedTimestamp: new Date() },
      })

      // Increment bounce count for domain
      const domain = getDomain(message.recipientEmail)
      const bounceCount = await db.message.count({
        where: {
          recipientEmail: { endsWith: `@${domain}` },
          status: 'bounced',
          sentTimestamp: { gte: subDays(new Date(), 30) },
        },
      })

      const sentCount = await db.message.count({
        where: {
          recipientEmail: { endsWith: `@${domain}` },
          status: 'sent',
          sentTimestamp: { gte: subDays(new Date(), 30) },
        },
      })

      if (bounceCount / (bounceCount + sentCount) > 0.05) {
        // >5% bounce rate
        await db.campaign.updateMany({
          where: { userId: user.id },
          data: { status: 'paused' },
        })
        logger.warn('Campaign paused due to high bounce rate', { domain, bounceRate: bounceCount / (bounceCount + sentCount) })
      }
    }

    throw error // Re-queue with backoff
  }
}

emailSenderQueue.process(emailSenderJob)
emailSenderQueue.on('failed', (job, error) => {
  logger.error('Email sender job failed', { jobId: job.id, error })
})
```

### 7.3 Inbox Poller Job

```typescript
// jobs/inboxPoller.job.ts
export async function inboxPollerJob(job: Bull.Job) {
  const { userId } = job.data

  try {
    const user = await db.user.findUnique({ where: { id: userId } })
    const token = await refreshGmailToken(userId)

    // Fetch unread messages
    const messages = await inboxService.pollGmail(token)

    for (const msg of messages) {
      const outreachId = await findOutreachIdFromReply(userId, msg.subject)
      if (!outreachId) continue

      // Queue for classification
      await replyClassifierQueue.add({
        messageId: msg.id,
        userId,
        outreachId,
        body: msg.body,
        subject: msg.subject,
      })
    }

    logger.info('Inbox polled', { userId, messageCount: messages.length })
  } catch (error) {
    logger.error('Inbox poller failed', { userId, error })
    throw error
  }
}

// Run every 5 minutes (configurable)
inboxPollerQueue.setDefaultRepeatOptions({
  repeat: { cron: '*/5 * * * *' }, // Every 5 minutes
})

setInterval(() => {
  inboxPollerQueue.add({}, { jobId: `poll-${Date.now()}` })
}, 5 * 60 * 1000)
```

---

## 8. Error Handling & Logging

### 8.1 Winston Logger

```typescript
// lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'autonomous-bdr-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}

if (env.SENTRY_DSN) {
  const Sentry = require('@sentry/node')
  Sentry.init({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.1 })
}

export { logger }
```

### 8.2 Error Handler Middleware

```typescript
// middleware/errorHandler.middleware.ts
export function errorHandlerMiddleware(
  err: Error | TRPCError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof TRPCError) {
    logger.warn('tRPC error', {
      code: err.code,
      message: err.message,
      path: req.path,
    })
    // Already formatted for client
    return
  }

  // Catch unhandled errors
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  })

  // Return generic error to client (never expose internals)
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  })
}

app.use(errorHandlerMiddleware)
```

---

## 9. Rate Limiting & Abuse Prevention

```typescript
// middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests/minute per user
  keyGenerator: (req) => req.user?.id || req.ip,
})

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // 5 attempts/minute
  skipSuccessfulRequests: true,
})

app.use('/api/trpc', limiter)
app.use('/auth/login', loginLimiter)
```

---

## 10. Caching Strategy

```typescript
// lib/redis.ts
const redis = new Redis(env.REDIS_URL)

export async function getCachedUserSession(userId: string) {
  const key = `session:${userId}`
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

export async function setCachedUserSession(userId: string, session: any) {
  const key = `session:${userId}`
  await redis.setex(key, 24 * 60 * 60, JSON.stringify(session)) // 24 hours
}

export async function invalidateCampaignCache(campaignId: string) {
  const key = `campaign:${campaignId}`
  await redis.del(key)
}
```

---

## 11. Environment Configuration

```typescript
// env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM_EMAIL: z.string().email(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  AZURE_CLIENT_ID: z.string(),
  AZURE_CLIENT_SECRET: z.string(),
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url(),
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

export const env = envSchema.parse(process.env)
```

Store in `.env.local` (gitignored) for local development. Use AWS Secrets Manager for production.

---

## 12. Testing Strategy

### 12.1 Unit Tests (Vitest)

```typescript
// services/__tests__/voiceCloning.test.ts
import { describe, it, expect, vi } from 'vitest'
import { VoiceCloningService } from '../voiceCloning.service'

describe('VoiceCloningService', () => {
  it('should extract voice profile from 30+ emails', async () => {
    const mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              tone: 'direct',
              confidence_score: 0.88,
            }),
          }],
        }),
      },
    }

    const service = new VoiceCloningService(mockClient as any)
    const emails = Array(30).fill('Sample email text')
    const profile = await service.extractProfile('user-123', emails)

    expect(profile.tone).toBe('direct')
    expect(profile.confidenceScore).toBe(0.88)
  })

  it('should reject < 30 emails', async () => {
    const service = new VoiceCloningService({} as any)
    await expect(service.extractProfile('user-123', [])).rejects.toThrow()
  })
})
```

### 12.2 Integration Tests (Supertest)

```typescript
// routes/__tests__/campaigns.test.ts
import { describe, it, expect } from 'vitest'
import { supertest } from '@/test/setup'

describe('POST /api/trpc/campaigns.create', () => {
  it('should create campaign for authenticated user', async () => {
    const res = await supertest
      .post('/api/trpc/campaigns.create')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Test Campaign',
        icpDefinition: { industry: ['SaaS'] },
      })

    expect(res.status).toBe(200)
    expect(res.body.result.data.id).toBeDefined()
  })
})
```

### 12.3 Target Coverage

- Services: 70%+ coverage (mock external APIs)
- Routers: 60%+ coverage (focus on critical paths)
- Jobs: 50%+ coverage (mock queues)

---

## 13. Deployment & Operations

### 13.1 Docker Image

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["pnpm", "start:server"]
```

### 13.2 Health Check Endpoint

```typescript
// server.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: await healthCheck.db(),
      redis: await healthCheck.redis(),
    },
  })
})
```

### 13.3 Graceful Shutdown

```typescript
// server.ts
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`)

  // Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed')
  })

  // Drain job queues
  await emailSenderQueue.drain()
  await inboxPollerQueue.drain()
  await replyClassifierQueue.drain()
  await followUpSchedulerQueue.drain()
  await accountResearchQueue.drain()

  // Close DB connections
  await db.$disconnect()
  await redis.quit()

  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
```

---

## 14. Security Checklist

- [ ] **HTTPS**: All API traffic over TLS 1.2+
- [ ] **OAuth2**: Gmail/Outlook via `@next-auth` (no password storage for external accounts)
- [ ] **Secrets**: SMTP, API keys in AWS Secrets Manager (rotate quarterly)
- [ ] **Input Validation**: Zod schemas on all tRPC inputs
- [ ] **SQL Injection**: Prisma prevents via parameterized queries
- [ ] **CORS**: Restrict to frontend domain only
- [ ] **Rate Limiting**: Per-user, per-endpoint via Redis
- [ ] **Audit Trail**: All messages queryable; 1-year retention minimum
- [ ] **Email Compliance**: CAN-SPAM footer, unsubscribe handling, bounce monitoring
- [ ] **PII Protection**: No email bodies logged in plaintext; hash for analytics
- [ ] **Sentry Integration**: Capture errors on production, mask PII in breadcrumbs

---

## 15. Phase 1 Feature Checklist

**Core Loop**:
- [ ] Upload CSV of accounts (BYOL)
- [ ] Upload 30–50 rep emails for voice cloning
- [ ] Extract voice profile (tone, patterns) with ≥0.85 confidence
- [ ] Generate personalized first-touch emails (3 subject variants, 1 body)
- [ ] Approve/reject first touch (L2 mode)
- [ ] Send via AWS SES with tracking
- [ ] Poll Gmail/Outlook every 5 minutes
- [ ] Classify replies (positive, objection, unsubscribe, noise, unclear) with ≥90% accuracy
- [ ] Escalate per autonomy level

**UI/Dashboard**:
- [ ] Campaign creation & management
- [ ] Outreach approval queue
- [ ] Reply queue with classification
- [ ] Reasoning log viewer (per action)
- [ ] Settings: autonomy level, daily cap, domain cap

**Compliance**:
- [ ] CAN-SPAM footer on all emails
- [ ] Unsubscribe list enforcement
- [ ] Bounce monitoring & domain pause on >5% rate
- [ ] Audit trail (searchable by domain, date, recipient)
- [ ] Email validation (SPF/DKIM on sending domain)

**Operations**:
- [ ] Docker image for backend
- [ ] PostgreSQL migrations on startup
- [ ] Health check endpoint
- [ ] Graceful shutdown
- [ ] Winston logging + Sentry integration
- [ ] Environment configuration via .env or Secrets Manager

---

**Document Version**: 1.0
**Last Updated**: 2026-03-28
**Status**: Ready for Phase 1 Development

For questions or clarifications, contact the Autonomous BDR backend team.
