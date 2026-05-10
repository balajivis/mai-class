# Autonomous BDR — Tech Stack Document

**Version**: 1.0
**Last Updated**: 2026-03-28
**Status**: Ready for Phase 1 Implementation

---

## Executive Summary

The Autonomous BDR tech stack is designed to deliver an AI-powered, type-safe, full-stack application that automates the sales outreach loop while maintaining human oversight and compliance safety. The stack emphasizes **end-to-end TypeScript**, **type-safe APIs via tRPC**, **AI-first orchestration with Anthropic Claude**, and **proven, battle-tested frameworks** to minimize implementation risk.

**Core Principle**: Build fast, stay safe, remain transparent. Every decision optimizes for early-stage startup constraints: rapid iteration, minimal operational overhead, regulatory compliance, and maintainability.

---

## 1. Tech Stack at a Glance

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend Framework** | Next.js | 14+ (App Router) | Full-stack React, SSR/SSG, built-in API routes, Vercel deployment, unified TypeScript |
| **Frontend Runtime** | React | 18+ | Industry standard, rich ecosystem, mature state management options |
| **Frontend Language** | TypeScript | 5.3+ | Type safety across entire stack (frontend ↔ backend), catches errors at dev time |
| **UI Component Lib** | shadcn/ui | Latest | Headless, composable, unstyled (Tailwind-first), Material Design 3 compatibility, accessible by default |
| **Styling** | Tailwind CSS | 3+ | Utility-first, dark mode support (Material Design 3), minimal CSS output, fast iteration |
| **Server State** | TanStack Query | v5 | Auto caching, deduplication, background sync; reduces backend load; sync with tRPC mutations |
| **Local UI State** | Zustand or React Context | Latest | Lightweight, zero boilerplate; Zustand for complex state, Context for simple flags |
| **HTTP Client** | tRPC client | Latest | Auto-generated types, no manual schema, integrated with mutations/queries |
| **Frontend Testing** | Vitest | Latest | ESM-first, fast, works with React Testing Library, mirrors Jest API |
| **E2E Testing** | Playwright | Latest | Modern, cross-browser, visual regression support (Phase 2), headless-by-default |
| **Backend Runtime** | Node.js | 18+ LTS | Async-first, V8 performance, excellent TypeScript support, Docker-friendly |
| **Backend Framework** | Express | 4.18+ | Minimal, middleware-based, vast ecosystem, battle-tested at scale |
| **RPC Framework** | tRPC | 10+ | Type-safe RPC with zero code generation, auto-generated client, perfect for Next.js |
| **Backend Language** | TypeScript | 5.3+ | Full end-to-end type safety, catches bugs before runtime |
| **Database** | PostgreSQL | 14+ | Relational integrity, JSONB support (for research briefs, reasoning logs), read replicas (Phase 2 scale) |
| **ORM** | Prisma | 5+ | Type-safe queries, auto migrations, intuitive schema, native PostgreSQL support |
| **Async Jobs** | Bull + Redis | Latest | Distributed task queue, retry logic, priority queues; essential for email scheduling, LLM processing |
| **Authentication** | NextAuth.js | v4+ | OAuth2 for Gmail/Outlook, session management, CSRF protection built-in |
| **LLM** | Anthropic Claude | 3.5+  | Superior instruction following, deterministic outputs for email/classification tasks, vision support (Phase 2) |
| **LLM SDK** | Anthropic SDK | Latest | Official SDK, streaming support, tool use for structured outputs, no vendor lock-in |
| **Email Sending** | AWS SES / Mailgun | Latest | High deliverability, DKIM/SPF validation, bounce handling, compliance-ready |
| **Inbox Monitoring** | Gmail OAuth2 / MS Graph | Latest | Native OAuth flows, webhook support (Phase 2), IMAP fallback |
| **Calendar Integration** | Google Calendar / MS Graph | Latest | Read availability, timezone support, 3-way sync (prospect accept → calendar → CRM) |
| **CRM Sync** | HubSpot v1 / Salesforce REST | Latest | Phase 1: HubSpot (simpler), Phase 2: Salesforce (enterprise) |
| **Hosting (Frontend)** | Vercel | Latest | Optimized for Next.js, edge functions, preview deployments, auto scaling |
| **Hosting (Backend)** | AWS/Azure/GCP + Docker | Latest | Container-based, auto-scaling, managed RDS PostgreSQL, secrets management |
| **Secrets Management** | AWS Secrets Manager | Latest | Audit trails, rotation, IAM integration, no hardcoded credentials |
| **Message Queue** | Redis Cloud / AWS ElastiCache | Latest | In-memory, sub-ms latency, persistence for critical jobs |
| **Package Manager** | pnpm | 8+ | Monorepo-friendly, faster installs, disk-efficient (hard links), workspace support |
| **Task Runner** | Turborepo | Latest | Build caching, parallel execution, workspace orchestration, minimal config |
| **Linter** | ESLint | 8+ | Configured for TypeScript, React, tRPC patterns; enforces consistency |
| **Code Formatter** | Prettier | Latest | Opinionated (no debates), integrated with ESLint, auto-fix on save |
| **CI/CD Platform** | GitHub Actions | Latest | Free, integrated with GitHub, YAML-based, sufficient for Phase 1 |
| **Error Tracking** | Sentry | Latest | Frontend + backend errors, source maps, error grouping, session replay (Phase 2) |
| **Logging** | Winston (backend) + browser console | Latest | Structured logs (JSON), log levels, transports (file, Sentry), searchable |

---

## 2. Frontend Layer — Web Application

### 2.1 Framework Stack: Next.js 14+ App Router

**Why Next.js?**
- **Unified TypeScript**: Single codebase, shared types between frontend and tRPC backend
- **App Router**: Modern server components, better code splitting, streaming support
- **Built-in API Routes**: tRPC can live in `/app/api/trpc/[trpc].ts`
- **Vercel Deployment**: Optimized for Next.js, instant preview URLs, zero-config
- **SEO & Performance**: Image optimization, dynamic imports, ISR (for dashboard caching)
- **Development Experience**: Fast refresh, hot module reloading, zero config TypeScript

### 2.2 UI Component Library: shadcn/ui + Tailwind CSS

**Why shadcn/ui?**
- **Composable & Headless**: No opinionated styling locked in; full control via Tailwind
- **Accessible by Default**: Built on Radix UI (WAI-ARIA compliant)
- **Material Design 3 Compatible**: Dark theme included; aligns with spec's "dark theme" requirement
- **Copy-Paste, Not NPM**: Components live in your repo; modify freely, no vendor lock-in
- **Works with Tailwind Dark Mode**: Easy to implement `<html class="dark">` for theme toggle

**Tailwind CSS 3+:**
- **Utility-first**: Rapid iteration (no context switching between HTML & CSS files)
- **Dark Mode Support**: Built-in `dark:` prefix for Material Design 3 dark theme
- **JIT Compilation**: Only CSS for used utilities shipped
- **Plugin Ecosystem**: Extend with custom utilities as needed (e.g., custom animations for reply transitions)

### 2.3 State Management

**Server State (TanStack Query v5)**
- **Why**: Handles caching, deduplication, background sync, and invalidation for API calls
- **Rationale**: Integrates seamlessly with tRPC; prevents stale UI data; reduces re-renders
- **Usage**: Wrap tRPC calls in `useQuery()` and `useMutation()` hooks; Query Client handles the rest
- **Example**: Fetch campaign list, auto-refetch on window focus, manual invalidate on new outreach

**Local UI State (Zustand or React Context)**
- **Zustand**: For modal open/close, sidebar collapse, theme toggle — lightweight, no provider wrapping
- **React Context**: For authenticated user (from NextAuth.js session), shared across app
- **Rationale**: Keep it simple; Zustand for isolated component state, Context for truly global state

### 2.4 API Integration: tRPC

**Why tRPC?**
- **Zero Code Generation**: Types flow directly from backend to frontend; no schema file to maintain
- **Type Safety**: TypeScript catches wrong API calls at compile time
- **Auto-Complete**: IDE knows every endpoint and its parameters
- **Perfect for Next.js**: Run backend in `/app/api/trpc/...`, call from frontend with `trpc.useQuery()`
- **No Serialization Issues**: TRPC handles Date, BigInt, custom types transparently

**tRPC Router Structure** (Phase 1):
```
/src/server/routers/
├─ campaigns.router.ts   (create, list, pause, resume)
├─ outreach.router.ts    (research, send, get-by-id, list-by-campaign)
├─ replies.router.ts     (list pending, classify, escalate)
├─ books.router.ts       (propose slots, accept/reject, sync to CRM)
├─ users.router.ts       (get profile, update settings, voice profile CRUD)
└─ index.ts              (root router, combines all)
```

### 2.5 Testing

**Unit & Integration Testing (Vitest)**
- **Why Vitest**: ESM-first, near-Jest API, fast, excellent TypeScript support
- **Scope**: Test individual component logic, utils, hooks (not UI rendering)
- **Example**: Test `useOutreachForm` hook with mock tRPC responses

**E2E Testing (Playwright)**
- **Why Playwright**: Modern, cross-browser, can test real tRPC calls, no mocking
- **Scope**: Critical user flows: signup → voice clone → send email → view reply → propose meeting
- **Phase 1**: Smoke tests only (happy path); Phase 2+: comprehensive coverage + visual regression
- **Example**: Login → upload CSV → approve first email → verify sent to inbox simulator

---

## 3. Backend Layer — API & Orchestration

### 3.1 Runtime & Framework: Node.js 18+ + Express

**Why Node.js 18+ LTS?**
- **Async-first**: Native `async/await`, non-blocking I/O; critical for email polling + LLM calls
- **TypeScript Support**: `tsx` or `esbuild` for fast compilation, excellent IDE support
- **Docker-friendly**: Lightweight images, fast startup (critical for container orchestration)
- **Ecosystem**: Bull (job queue), Prisma, Winston (logging), NextAuth.js all mature

**Why Express?**
- **Minimal & Middleware-based**: Only pay for what you use; tRPC sits on top as middleware
- **Battle-tested**: Decades of production use, vast middleware ecosystem
- **Fast**: Lightweight routing, perfect for request handling
- **tRPC Integration**: Express adapter provided; runs as middleware

### 3.2 Type-Safe API: tRPC 10+

**Why tRPC (not REST/GraphQL)?**
- **Zero Schema Duplication**: Types live in one place (backend); automatically flow to frontend
- **No Serialization Boilerplate**: Complex types (Dates, BigInt, custom classes) handled transparently
- **Perfect for Full-Stack TS**: End-to-end type checking catches client-server mismatches
- **Simpler than GraphQL**: No query language to learn; just function calls
- **Better DX**: IDE autocomplete for API args, return types, and errors

**tRPC Error Handling (Built-in)**
- Custom error codes: `UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, custom app errors
- Frontend catches typed errors; can show user-friendly messages
- Logging integration: Errors auto-logged to Winston + Sentry

### 3.3 Async Job Queue: Bull + Redis

**Why Bull + Redis?**
- **Distributed Task Queue**: Essential for email scheduling (send at 9 AM in prospect's timezone), LLM processing, inbox polling
- **Retry Logic**: Automatic exponential backoff for transient failures (SMTP timeout, rate-limit)
- **Priority Queues**: High-priority replies escalated before routine follow-ups
- **Job Persistence**: If worker crashes, job resumes on restart (critical for compliance)
- **Scalability**: Add workers horizontally; Redis acts as coordination point

**Bull Job Types** (Phase 1):
- `research-account`: Fetch company data, run LLM research brief
- `generate-email`: Clone voice, personalize, return draft for approval
- `send-email`: Execute SMTP send, log, schedule follow-up
- `poll-inbox`: Read Gmail/Outlook, fetch new replies
- `classify-reply`: Run LLM classifier, log decision + rationale
- `propose-calendar`: Check rep's calendar, generate slots, send proposal

### 3.4 Authentication: NextAuth.js v4+

**Why NextAuth.js?**
- **Built for Next.js**: Seamless integration with Next.js API routes + tRPC
- **OAuth2 Flow**: Gmail/Outlook login → read inbox + calendar (via OAuth scopes)
- **Session Management**: JWT + database sessions, CSRF protection built-in
- **Type Safety**: Next.js types for `getSession()`, `signIn()`, etc.
- **No External Auth Service**: Self-hosted, no third-party vendor lock-in

**Phase 1 OAuth Flows**:
1. **Google OAuth**: Email + `gmail.readonly` scope (read replies) + `calendar.readonly` (check availability)
2. **Microsoft OAuth**: Email + `Mail.Read` scope + `Calendar.Read` scope
3. **Fallback**: Email/password for testing, but OAuth preferred for production

**Session Storage**: Database (PostgreSQL) with Prisma adapter; survives server restarts

---

## 4. Database Layer — PostgreSQL + Prisma

### 4.1 PostgreSQL 14+

**Why PostgreSQL?**
- **Relational Integrity**: Foreign keys ensure no orphaned records (critical for compliance audit trails)
- **JSONB Support**: Store nested research briefs, reasoning logs, voice profiles without normalization
- **Full-Text Search**: Phase 2 feature (search emails, replies by content)
- **Arrays & Enums**: Native support for status enums (`"draft" | "sent" | "bounced"`)
- **Read Replicas**: Built-in replication for scaling reads (Phase 2)
- **Managed Options**: AWS RDS, Azure Database, Google Cloud SQL all offer turnkey PostgreSQL

**Data Safety**:
- **Transactions**: Email send + outreach record update in single transaction (no partial failures)
- **Backups**: Automated daily via RDS; 30-day retention minimum
- **Encryption**: TLS for connections, encryption at rest via cloud provider

### 4.2 Prisma 5+

**Why Prisma?**
- **Type-Safe Queries**: TypeScript knows schema at compile time; prevents SQL injection
- **Auto-Migrations**: `prisma migrate` generates migration files; version control friendly
- **Generated Client**: `prisma.outreach.findMany()` type-checked before runtime
- **Relation Loading**: Specify exactly which relations to load (N+1 query prevention)
- **Time-Travel Debugging**: Inspect all queries via `DEBUG=prisma:*`

**Schema Highlights** (See `/src/server/prisma/schema.prisma`):
- **User** (auth via NextAuth.js)
- **Campaign** (ICP definition, autonomy level, status)
- **VoiceProfile** (extracted tone, templates, confidence)
- **Outreach** (per-account outreach, status, research brief as JSONB)
- **Message** (sent/inbound, personalization used, reasoning log)
- **Reply** (classification, confidence, action taken)
- **CalendarProposal** (slots proposed, prospect response)
- **BookedMeeting** (CRM-synced, meeting context)
- **UnsubscribeList** (for CAN-SPAM compliance)

**Phase 1 Indices**:
- `Outreach` by `campaign_id + status` (fast query for dashboard)
- `Message` by `outreach_id + direction` (fast query for conversation threads)
- `Reply` by `received_timestamp` (recent replies for reply queue)

---

## 5. AI/LLM Layer — Anthropic Claude

### 5.1 Why Anthropic Claude?

**Instruction Following & Determinism**:
- **Superior at Following Rules**: Research brief extraction, voice cloning, email generation all have strict structural requirements (JSON, specific tone, no AI markers)
- **Longer Context**: 200K token window enables full email history + research brief in single call
- **Vision Support**: Phase 2 feature (parse company logos, analyze screenshots)
- **Strong Constitution**: Likely refuses harmful requests (spam, manipulation) out of the box

**vs. Competitors**:
- **vs. GPT-4**: Similar capability, but Claude has better "tone" following (voice cloning)
- **vs. Open-Source (Llama)**: Self-hosted Llama requires GPU infra; Anthropic API is cheaper at scale (pay-per-token)
- **vs. Gemini**: Anthropic has clearer safety stance; good for compliance-heavy product

### 5.2 Anthropic SDK Integration

**Installation**:
```bash
npm install @anthropic-ai/sdk
```

**Usage Patterns**:

1. **Voice Cloning** (extract tone from emails):
```typescript
const client = new Anthropic();
const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Extract voice profile from these emails:\n${emailSamples}\n\nReturn JSON: { tone, sentence_structure, emoji_usage, avg_message_length, confidence_score }`
  }]
});
```

2. **Email Generation** (personalize with voice):
```typescript
const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 500,
  messages: [{
    role: "user",
    content: `Generate email in this voice:\n${voiceProfile}\n\nWith research:\n${researchBrief}\n\nReturn JSON: { subject_lines, body, cta }`
  }]
});
```

3. **Reply Classification** (label inbound):
```typescript
const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 256,
  messages: [{
    role: "user",
    content: `Classify reply:\n${replyText}\n\nReturn JSON: { classification, confidence, objection_type, reasoning }`
  }]
});
```

### 5.3 LangChain (Optional, Phase 2+)

**Rationale for Delaying**:
- Phase 1 focuses on simple chains: email sample → voice profile, research brief + voice → email
- Direct Anthropic SDK calls are sufficient
- Phase 2+: LangChain useful for chaining multiple LLM calls, memory management, structured output parsing

**When to Introduce**:
- Multi-step reasoning (research → personalization → objection response chain)
- Memory/context management for long conversations
- Structured output parsing (guaranteed JSON format)

---

## 6. Email & Communications

### 6.1 SMTP: AWS SES or Mailgun

**Why AWS SES?**
- **Cost**: Extremely cheap at scale ($0.10 per 1,000 emails after free tier)
- **Deliverability**: Amazon's infrastructure; good reputation
- **Compliance**: Built-in bounce handling, complaint feedback loops
- **DKIM/SPF**: Integrated; easy to verify domain ownership

**Why Mailgun (Alternative)?**
- **Webhooks**: Real-time bounce/complaint feedback (SES requires polling)
- **Sandbox**: Free tier for testing without domain verification
- **Better for Testing**: Easier rapid iteration during Phase 1

**Phase 1 Approach**:
- **Development**: Ethereal (fake SMTP) for local testing; no real email sent
- **Staging**: Mailgun (free tier) for QA
- **Production**: AWS SES (once domain warmed up)

### 6.2 Inbox Monitoring: Gmail OAuth2 + Microsoft Graph

**Why OAuth2 (not IMAP)?**
- **Security**: User never shares password; tokens are scoped and revocable
- **Webhook Support**: Real-time notifications (Phase 2)
- **Scalability**: API-based, works at 10K emails/day
- **Compliance**: Audit trail of what we access

**Implementation**:
- **Gmail**: `gmail.readonly` scope via NextAuth.js; use Gmail API to poll labels (e.g., `INBOX`, `SENT`)
- **Outlook**: `Mail.Read` scope via Microsoft Graph; poll inbox folder
- **Polling Frequency**: Every 5 minutes (Phase 1); webhook-based (Phase 2+)

### 6.3 Calendar Integration: Google Calendar + MS Graph

**Why Both?**
- **Coverage**: Most sales reps use either Google or Outlook; support both
- **One API**: Google Calendar API, Microsoft Graph Calendar endpoint; both straightforward

**Implementation**:
- **Read Availability**: Fetch `calendar.readonly` scope; list events for rep's email
- **Identify Gaps**: Parse events, find 30–60 min gaps between 10 AM–4 PM
- **Propose Slots**: Return 3–5 options to frontend; user clicks "send" to email prospect
- **Phase 2**: Auto-accept prospect acceptance; create event on rep's calendar

**Timezone Handling**:
- Detect prospect timezone via IP lookup (Phase 1) or infer from company location
- Propose times in prospect's local timezone (e.g., "Tuesday 10 AM PT")

---

## 7. CRM Integration

### 7.1 Phase 1: HubSpot v1 API

**Why HubSpot (Phase 1)?**
- **Simpler API**: REST endpoints for contacts, deals, companies
- **Easier to Learn**: Smaller surface area than Salesforce
- **Free Tier**: Test without enterprise agreement
- **OAuth2 Support**: User can authorize app in one click

**Integration Scope**:
- **Create Deal**: When meeting booked → create deal in HubSpot with conversation summary
- **Create Contact**: If email not in HubSpot, create new contact record
- **Update Contact**: Add "autonomous_bdr_source" tag; add custom field "last_bdr_outreach_date"

**Data Flow**:
```
Meeting Booked (in app)
  → Extract: account_name, contact_email, meeting_datetime, conversation_summary
  → Call: POST /crm/v3/objects/deals with name="Booked via Autonomous BDR"
  → Store: crm_record_id in BookedMeeting table (for audit)
```

### 7.2 Phase 2: Salesforce REST API

**Why Salesforce (Phase 2)?**
- **Enterprise Adoption**: Most large SDR teams use Salesforce
- **Complexity**: Larger surface area justifies Phase 2 (post-MVP)
- **Workflow Integration**: Trigger Salesforce flows when deal created (e.g., auto-assign)

**Delay Rationale**: Phase 1 founders mostly use HubSpot or Pipedrive; Salesforce can wait

---

## 8. Infrastructure & Deployment

### 8.1 Frontend: Vercel

**Why Vercel?**
- **Next.js Native**: Built by Vercel; zero-config deployment
- **Edge Functions**: Run code near users (for future A/B testing, caching)
- **Preview Deployments**: Every GitHub PR gets a preview URL
- **Environment Variables**: Secure secret storage (API keys, DB URL)
- **Auto-Scaling**: Traffic spikes handled automatically
- **Observability**: Integrated logs, monitoring

**Phase 1 Setup**:
- Connect GitHub repo
- Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY` in Vercel dashboard
- Auto-deploy on push to `main` (production)
- Auto-preview on pull requests

### 8.2 Backend: Cloud Container Hosting (AWS/Azure/GCP)

**Recommended: AWS ECS + RDS PostgreSQL**

**Why ECS (vs. Lambda/Serverless)?**
- **Long-Running Jobs**: Bull workers need persistent connection to Redis; Lambda has 15-min timeout
- **Simpler Architecture**: Single Docker container for Express app + Bull workers (Phase 1)
- **Cost Predictable**: ECS Fargate pay-per-minute; no surprise cold-start penalties

**Architecture**:
```
AWS ECS Fargate (Node.js container)
  ├─ Express server (port 3000)
  │  └─ tRPC router mounted at /api/trpc
  └─ Bull worker (consumes job queue)

AWS RDS PostgreSQL 14+
  └─ Prisma ORM + migrations

AWS ElastiCache Redis
  └─ Bull job queue + session store

AWS Secrets Manager
  └─ ANTHROPIC_API_KEY, DATABASE_URL, OAUTH_SECRETS, MAILGUN_KEY, etc.

AWS S3 (future)
  └─ Email samples, reasoning logs (audit trail)
```

**Cost Estimate (Phase 1)**:
- ECS Fargate: ~$50–100/month (0.25 CPU, 512 MB RAM)
- RDS PostgreSQL: ~$20/month (free tier, or $50+ for production)
- ElastiCache Redis: ~$20/month (free tier, or $50+ for 1GB)
- **Total**: ~$90–170/month (very startup-friendly)

### 8.3 Secrets Management: AWS Secrets Manager

**What Goes in Secrets?**
- `ANTHROPIC_API_KEY`: Anthropic API key (keep safe!)
- `DATABASE_URL`: PostgreSQL connection string (userpass included)
- `OAUTH_GITHUB_ID`, `OAUTH_GITHUB_SECRET`: For NextAuth.js
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`: OAuth credentials
- `MAILGUN_KEY`: Email sending API key
- `NEXTAUTH_SECRET`: Random string for session encryption
- `SENTRY_DSN`: Error tracking endpoint

**Why Secrets Manager (not `.env`)?**
- **Audit Trails**: Who accessed what, when
- **Rotation**: Automatic key rotation (Phase 2)
- **IAM Integration**: Only the ECS task can read; Lambda has no access
- **No Hardcoding**: Zero risk of secrets in Git history

**Phase 1 Setup**: AWS CLI or Terraform to create secrets; fetch at container startup

---

## 9. Developer Tooling

### 9.1 Package Manager: pnpm 8+

**Why pnpm?**
- **Monorepo Support**: With Turborepo, manage frontend + backend + shared types in one repo
- **Faster Installs**: Hard links to deduplicated packages (saves disk space)
- **Stricter Dependency**: Catches implicit dependencies not in `package.json`
- **Workspace Feature**: Share types between frontend & backend without npm publishing

**Monorepo Structure**:
```
sdrauto/
├─ apps/
│  ├─ web/           (Next.js frontend)
│  │  └─ package.json
│  └─ api/           (Express backend)
│     └─ package.json
├─ packages/
│  ├─ db/            (Prisma schema + migrations)
│  │  └─ package.json
│  ├─ types/         (Shared TS types)
│  │  └─ package.json
│  └─ utils/         (Shared utility functions)
│     └─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

**Benefits**:
- **Shared Types**: Frontend imports from `@sdrauto/types` (no API schema generation)
- **Shared DB**: Both apps import Prisma client from `@sdrauto/db`
- **Single `pnpm install`**: Installs all workspaces in one command

### 9.2 Task Runner: Turborepo

**Why Turborepo?**
- **Build Caching**: If frontend code doesn't change, skip rebuild
- **Parallel Execution**: Run tests + linting + type-check simultaneously
- **Workspace Orchestration**: Run commands across all packages in dependency order
- **Remote Caching**: Phase 2 (cache results across CI runs)

**turbo.json**:
```json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**"],
      "cache": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "cache": true
    }
  }
}
```

**Commands**:
- `pnpm run build`: Build all packages (respects dependency order)
- `pnpm run test`: Run tests in parallel
- `pnpm run lint`: Lint all packages in parallel

### 9.3 Linting & Formatting

**ESLint 8+**:
- **Config**: TypeScript rules, React hooks, tRPC patterns (once mature rules exist)
- **Rules**: Enforce no `any`, no unused variables, import sorting
- **Example `.eslintrc.json`**:
```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/strict"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

**Prettier 3+**:
- **Config**: 2-space indentation, single quotes, semicolons (opinionated; no debates)
- **Integration**: Auto-format on save (VS Code + Prettier extension)
- **Pre-commit Hook**: Enforce with Husky (Phase 2)

### 9.4 Type Checking

**TypeScript 5.3+**:
- **Strict Mode**: `"strict": true` in `tsconfig.json`
- **No Implicit Any**: `"noImplicitAny": true`
- **Exact Optional Properties**: `"exactOptionalPropertyTypes": true` (catch `: string | undefined` mismatches)
- **Incremental Builds**: TypeScript caches to speed up subsequent checks

**Type-Checking in CI**:
```bash
pnpm run type-check  # Run tsc without emitting code
```

---

## 10. CI/CD Pipeline — GitHub Actions

### 10.1 Why GitHub Actions?

- **Free**: Included with GitHub (no vendor lock-in)
- **Integrated**: Triggers on push, PR, release; no separate tool
- **YAML Syntax**: Easy to read and debug
- **Sufficient for Phase 1**: No need for Jenkins/GitLab CI yet

### 10.2 Pipeline Stages

**Trigger**: Push to `main` (production) or PR (staging)

**Stage 1: Lint** (~2 min)
```bash
pnpm run lint
```
Fail if any ESLint violations found.

**Stage 2: Type Check** (~3 min)
```bash
pnpm run type-check
```
Fail if any TypeScript errors; catches errors before tests.

**Stage 3: Unit & Integration Tests** (~5 min)
```bash
pnpm run test
```
Vitest with coverage reporting; fail if <80% coverage on critical files.

**Stage 4: E2E Tests** (~10 min, only on `main` or PR with `e2e` label)
```bash
pnpm run test:e2e -- --reporter=html
```
Playwright tests against staging environment; fail if any critical flow broken.

**Stage 5: Build** (~5 min)
```bash
pnpm run build
```
Emit frontend static + backend production code; fail if any build errors.

**Stage 6: Deploy to Staging** (~2 min, on PR merge to `main`)
- Push backend Docker image to ECR
- Deploy to ECS staging environment
- Deploy frontend to Vercel preview

**Stage 7: Manual Promotion to Production** (manual approval)
- Slack notification: "Build ready for production. Approve in GitHub?"
- On approval: tag commit as release, push Docker image to prod ECR, deploy ECS production

### 10.3 Secrets in CI

**Use GitHub Secrets for**:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (for ECS deployment)
- `VERCEL_TOKEN` (for Vercel deployment)
- `DOCKER_REGISTRY_URL`, `DOCKER_USERNAME` (if using private registry)

**Never Commit**:
- API keys, database URLs, OAuth secrets (GitHub Actions fetches from Secrets tab)

---

## 11. Observability & Monitoring

### 11.1 Logging: Winston (Backend) + Browser Console (Frontend)

**Winston (Node.js)**:
- **Transports**: File, Sentry, Console
- **Levels**: error, warn, info, debug
- **Structured Logging**: JSON format (easy to grep + ELK stack later)

**Example Setup**:
```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  defaultMeta: { service: "autonomous-bdr" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// In Express middleware
logger.info("Email sent", { outreach_id, recipient, status: "sent" });
logger.error("Voice cloning failed", { error, campaign_id });
```

**Browser Console (Frontend)**:
- Keep it simple; frontend errors sent to Sentry
- Log user actions for debugging: "User clicked 'send email'" (only in dev/staging)

### 11.2 Error Tracking: Sentry

**Why Sentry?**
- **Auto-Capture**: Unhandled exceptions in frontend + backend
- **Grouping**: Groups similar errors (e.g., all "Database connection timeout" as one issue)
- **Source Maps**: JavaScript stack traces map back to TypeScript
- **Session Replay**: Replay user actions before error (Phase 2)
- **Alerts**: Slack notification on spike in errors

**Setup**:

Frontend (Next.js):
```typescript
// pages/_app.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

Backend (Express):
```typescript
import * as Sentry from "@sentry/node";

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 11.3 Analytics (Phase 2+)

**Recommended**: Posthog or Mixpanel
- **Posthog**: Open-source option (self-host), good privacy story
- **Mixpanel**: SaaS, simpler setup, good funnel analysis

**Phase 1 Scope**: Skip; focus on monitoring errors + system health

---

## 12. Third-Party SaaS (Phase 2+)

| Service | Purpose | Phase | Rationale |
|---------|---------|-------|-----------|
| **Hunter / Apollo / RocketReach** | Email enrichment | 2+ | Find additional emails when provided contact unavailable |
| **Crunchbase API** | Funding signals | 2+ | Detect Series A/B announcements for trigger outreach |
| **PitchBook API** | Funding signals | 2+ | Alternative to Crunchbase; better data for some regions |
| **BuiltWith API** | Tech stack changes | 2+ | Detect adoption of new tools (e.g., Slack → trigger outreach) |
| **LinkedIn API** | Job board + sourcing | 3+ | Monitor job postings, detect hiring signals |
| **Slack (Webhooks)** | Notifications | 2+ | Notify rep of high-priority replies, booked meetings |

---

## 13. Appendix: Development Workflow

### 13.1 Local Development Setup

```bash
# Clone + install
git clone https://github.com/yourorg/sdrauto
cd sdrauto
pnpm install

# Set up environment
cp .env.example .env.local
# Add ANTHROPIC_API_KEY, DATABASE_URL (local Postgres), NEXTAUTH_SECRET

# Database
pnpm -F db db:push  # Create tables locally

# Run dev servers
pnpm run dev        # Starts both Next.js (port 3000) and Express (port 3001) in parallel

# Open http://localhost:3000
```

### 13.2 Adding a New Feature

1. **Create DB schema**: Edit `packages/db/schema.prisma`, run `pnpm -F db db:push`
2. **Add tRPC router**: Create route in `apps/api/src/routers/myfeature.router.ts`
3. **Test backend**: Add test in `apps/api/src/__tests__/myfeature.test.ts`, run `pnpm test`
4. **Call from frontend**: Import `trpc.myfeature.query()` in React component
5. **Add UI**: Create component in `apps/web/src/components/`, wire up tRPC mutation
6. **E2E test**: Add test in `apps/web/e2e/myfeature.spec.ts`, run `pnpm test:e2e`
7. **Commit & push**: CI lint/type/test runs automatically; merge when green

---

## 14. Decision Rationale Summary

| Decision | Alternatives Rejected | Why Our Choice Wins |
|----------|---|---|
| **Next.js** | Remix, Nuxt, Astro | Unified TypeScript, tRPC first-class support, Vercel ecosystem |
| **React** | Vue, Svelte | Larger ecosystem, more talent, shadcn/ui integrations |
| **tRPC** | REST, GraphQL | Zero schema duplication, end-to-end type safety, simpler than GraphQL |
| **TypeScript** | JavaScript | Catches bugs at dev time; critical for distributed system (frontend ↔ backend) |
| **Prisma** | Drizzle, SQLAlchemy, Sequelize | Auto-migrations, generated client, excellent DX |
| **Anthropic Claude** | GPT-4, Llama, Gemini | Superior instruction following, long context, safety-first stance |
| **PostgreSQL** | MongoDB, Firestore | Relational integrity (compliance!), JSONB flexibility, read replicas |
| **AWS SES** | SendGrid, Twilio | Extreme cost efficiency, AWS ecosystem integration, compliance hooks |
| **GitHub Actions** | Jenkins, GitLab CI | Free, integrated, YAML simplicity |
| **Vercel** | Netlify, AWS Amplify | Next.js native, edge functions, preview deployments |
| **pnpm** | npm, yarn | Monorepo support, faster, disk-efficient |

---

## 15. Success Metrics (Tech Stack Perspective)

- **Build Time**: <5 min end-to-end (lint + type + test + build)
- **Time to Production**: <10 min from commit to deployed (front + back)
- **Error Rate**: <0.1% of requests cause unhandled exceptions
- **Type Safety**: 100% of tRPC endpoints have TypeScript types (compile-time verified)
- **Test Coverage**: >80% on critical paths (email gen, reply classification, send)
- **Database Integrity**: Zero data loss in production (transactions, backups)
- **API Response Time**: <200ms p99 for tRPC queries (cached) + <500ms p99 for mutations
- **Email Deliverability**: >98% emails reach inbox (not spam)
- **Compliance**: Zero security violations, 100% audit trail logged

---

**Document Complete**

**Ready for**:
- [x] Phase 1 Implementation Planning
- [x] Developer Onboarding
- [x] Architecture Review (before first sprint)

**Review by**: Engineering Lead, Security Officer (for secrets management + compliance)

**Next Steps**:
1. Approve this Tech Stack (signatures from stakeholders)
2. Set up Vercel + AWS accounts
3. Create monorepo scaffold with pnpm workspaces
4. Set up CI/CD pipeline (GitHub Actions)
5. Begin Phase 1 Sprint (see separate Implementation Roadmap)
