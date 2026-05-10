# Autonomous BDR Phase 1 Implementation Plan

**Version**: 1.0
**Date**: 2026-03-28
**Duration**: 4 weeks (28 business days)
**Status**: Ready for Execution

---

## Executive Summary

Phase 1 focuses on proving the core autonomous BDR loop with email-only, bring-your-own-list (BYOL) mode at L2 autonomy. Users upload target accounts, clone their voice from 30–50 sample emails, and the system generates personalized first-touch emails requiring user approval before send. Once sent, the system monitors for replies, classifies them with 90%+ accuracy, and escalates high-priority responses.

**Phase 1 Goal**: Ship a working MVP that demonstrates:
- ✓ Reply rate ≥ 15% (vs. 2–5% cold email baseline)
- ✓ 90%+ accuracy on reply classification
- ✓ Zero spam complaints on first 100 emails
- ✓ Users trust the system (>80% view reasoning logs)

**Timeline**: 4 weeks | **Team**: 4–5 FTE (2 backend, 2 frontend, 1 DevOps/part-time)

---

## 1. Phase 1 Goal & Success Criteria

### Primary Objective
**Email-only, BYOL, L2 autonomy. Prove core loop works.**

### Success Criteria
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Reply Rate** | ≥15% | Total replies ÷ first touches sent |
| **Reply Classification Accuracy** | ≥90% | Manual audit of 100+ classified replies (positive/unsubscribe focus) |
| **Spam Complaints** | 0 | Support tickets + abuse reports on first 100 emails |
| **User Adoption** | 50+ pilot users | New sign-ups + active campaign creation |
| **User Engagement** | >80% view reasoning log | Event tracking on reasoning log clicks |
| **Deployment Stability** | >99% uptime | Monitoring + error tracking (Sentry) |

### Go/No-Go Criteria for Phase 2
- ✓ 50+ active users (≥10 founders, ≥15 SDR teams)
- ✓ Reply rate ≥15% on first touches
- ✓ Zero compliance violations (CAN-SPAM, GDPR, spam complaints)
- ✓ >80% user engagement with reasoning log
- ✓ >90% reply classification accuracy
- ✓ Sustainable product (no critical bugs in top 10 user flows)

---

## 2. Week-by-Week Breakdown

### Week 1: Infrastructure & Authentication (4 business days)

**Goal**: Foundation ready. Users can sign up, log in, and database is provisioned.

**Deliverables**:
- PostgreSQL database (AWS RDS or self-hosted)
- Redis instance (AWS ElastiCache or Redis Cloud)
- NextAuth.js configured with email/password login
- Prisma schema (User, Session, VoiceProfile, Campaign models)
- GitHub Actions CI/CD pipeline (lint, test, deploy to staging)
- Secrets management (AWS Secrets Manager)
- Sentry error tracking configured

**Key Tasks**:
1. **Infrastructure Setup** (Backend lead + DevOps)
   - Provision AWS RDS PostgreSQL 14+
   - Provision AWS ElastiCache Redis
   - Set up AWS Secrets Manager for API keys, SMTP creds
   - Configure environment variables (.env.example, secrets rotation)

2. **NextAuth.js Authentication** (Backend lead)
   - Configure NextAuth.js v4+ with email/password provider
   - Implement `/auth/signin` and `/auth/signup` endpoints
   - Session storage in PostgreSQL (via NextAuth adapters)
   - CSRF protection, secure cookie settings
   - Middleware to protect `/api/trpc` routes

3. **Prisma Schema (Initial)** (Backend lead)
   - User model (id, email, password_hash, created_at, settings)
   - Session model (NextAuth.js storage)
   - VoiceProfile model (placeholder for Week 2)
   - Campaign model (placeholder for Week 2)
   - Database migrations (Prisma migrate)

4. **Frontend Auth Flow** (Frontend lead)
   - Login page (email, password, form validation)
   - Sign-up page (email, password confirmation, validation)
   - Auth error handling (invalid credentials, network errors)
   - Redirect to dashboard on successful login
   - Logout button + session management

5. **CI/CD Pipeline** (Backend lead + DevOps)
   - GitHub Actions workflow: lint (ESLint), test (Vitest), build
   - Auto-deploy to staging on main branch merge
   - Deployment checklist: Prisma migrate, secrets injection, health check

**Success Criteria**:
- Users can sign up and log in without errors
- Authenticated requests to `/api/trpc` work
- Database is provisioned and accessible
- CI/CD pipeline runs without failures
- Sentry captures errors from staging

**Blockers & Dependencies**:
- AWS credentials configured
- GitHub repo with Actions enabled
- Team agreement on database provider + region

**Estimated Effort**: 20 hours backend + 12 hours frontend + 8 hours DevOps = 40 hours

---

### Week 2: Data Models & Voice Cloning (5 business days)

**Goal**: Users can upload emails, define ICP, and clone voice. System returns voice profile with ≥70% confidence.

**Deliverables**:
- Campaign, VoiceProfile, Outreach, Message models in Prisma
- Voice cloning service (LangChain + Anthropic Claude)
- CSV account enrichment (domain validation, basic parsing)
- Onboarding steps 1–5 (ICP form, voice upload, CSV upload)
- Voice profile preview UI (confidence score, tone, sign-offs)

**Key Tasks**:

1. **Prisma Schema Extension** (Backend lead)
   - Campaign (id, user_id, name, icp_definition, status, stats)
   - VoiceProfile (id, user_id, source_emails, extracted_voice, confidence_score)
   - Account (id, campaign_id, domain, company_name, buyer_email)
   - Outreach (id, campaign_id, account_id, status, research_brief)
   - Message (id, outreach_id, direction, sender, subject, body, status)
   - Database migrations

2. **Voice Cloning Service** (1 backend engineer, LLM-focused)
   - Implement `VoiceProfileService.extractProfile(emails: string[])` → VoiceProfile
   - Parse email samples (extract tone, sentence structure, sign-offs, emoji usage, avg_message_length)
   - Use Claude API (Anthropic SDK) to analyze writing style
   - Return confidence score (0–1; target ≥0.7)
   - Store extracted profile in Prisma

3. **tRPC Endpoints** (Backend lead)
   - `campaigns.create(name, user_id)` → Campaign
   - `voiceProfiles.uploadEmails(campaign_id, email_samples[])` → VoiceProfile with confidence
   - `voiceProfiles.getProfile(voice_profile_id)` → return extracted voice data
   - `accounts.uploadCSV(campaign_id, csv_file)` → import accounts, validate domains

4. **CSV Parsing & Validation** (1 backend engineer)
   - Parse CSV (domain, company_name, buyer_role, buyer_email)
   - Validate domains (basic regex, DNS check if time allows)
   - Skip empty rows, handle duplicates
   - Return import summary (success count, validation errors)

5. **Onboarding UI** (1 frontend engineer)
   - Step 1: ICP wizard (industry, company size, revenue stage, tech stack dropdowns)
   - Step 2: Value prop form (free-text, 100–300 characters)
   - Step 3: Voice upload (drag-and-drop or paste email samples)
   - Step 4: Voice profile preview (show confidence score, tone, sign-offs)
   - Step 5: CSV upload (account list)
   - Progress indicator, error handling, ability to go back

6. **Account Enrichment (Basic)** (1 backend engineer)
   - Domain-to-company mapping (use public DNS, free APIs)
   - No external enrichment API yet; use free tools (ICP match against uploaded list)
   - Validate email formats

**Success Criteria**:
- Voice profile extracted for test emails with confidence ≥0.7 (or ≥0.65 if LLM struggles)
- CSV import validates domains and shows summary
- Onboarding flow completes without crashes
- tRPC endpoints tested (Vitest unit tests)

**Blockers & Dependencies**:
- Anthropic API access (already assumed in tech-spec)
- Free or low-cost domain validation service

**Estimated Effort**: 25 hours backend (LLM) + 18 hours frontend (forms) + 7 hours testing = 50 hours

---

### Week 3: Email Generation & Sending (5 business days)

**Goal**: System generates personalized first-touch emails, users approve them, and emails are sent with zero bounces on test domain.

**Deliverables**:
- Email generation service (Claude + LangChain)
- Email-sender job queue (Bull + Redis)
- SMTP integration (AWS SES)
- First-touch approval UI (L2 autonomy)
- Campaign dashboard (KPI cards, campaign list)
- Bounce handling, daily send cap enforcement

**Key Tasks**:

1. **Email Generation Service** (1 backend engineer, LLM-focused)
   - Implement `EmailGenerationService.generateFirstTouch(outreach_id)` → Message
   - Inputs: research brief (company name, news, hiring signals), voice profile, ICP definition
   - Generate subject (1 variant; Phase 2: 3 variants with scoring)
   - Generate body (personalized, includes 2+ company-specific signals, sign-off in voice)
   - Use Claude API with few-shot examples
   - Add compliance footer (CAN-SPAM: company name, address, unsubscribe link)
   - Quality gate: check for obvious AI markers ("As an AI", repetitive phrases)
   - Log personalization sources + reasoning

2. **Email-Sender Job Queue** (1 backend engineer)
   - Bull queue: `email-send-queue` with Redis backend
   - Job: send single email (outreach_id, recipient_email, subject, body)
   - Retry logic: 3 retries with exponential backoff (1 min, 5 min, 15 min)
   - Daily cap enforcement: check user settings (default 20/day, 5/domain)
   - Per-domain send delay (respect deliverability rules)
   - Log send timestamp, status, bounce info

3. **SMTP Integration** (1 backend engineer)
   - AWS SES client setup (or Mailgun fallback)
   - Send email via SMTP
   - Handle bounces (hard/soft), invalid emails
   - Log bounce reason + update account status
   - Domain reputation check (flag if bounce rate > 5%)

4. **Research Brief Service** (1 backend engineer, LLM-focused)
   - Stub for Phase 1: basic research brief from uploaded CSV + ICP match
   - Output: account_id, company_name, research_brief (org_chart_snapshot, recent_news, pain_indicators, buyer_persona, icp_fit_score)
   - Use free/public data sources (no external API calls yet)
   - Phase 2: integrate BuiltWith, Crunchbase API

5. **First-Touch Approval UI** (1 frontend engineer)
   - Approval queue page (max 10 emails per batch)
   - Show: generated email (subject + body), research brief, voice confidence, personalization sources
   - Actions: Approve (send immediately), Edit (regenerate with feedback), Reject (skip account)
   - Once approved: auto-schedule follow-ups per cadence
   - Show send status (pending → sent → awaiting_reply)

6. **Campaign Dashboard** (1 frontend engineer)
   - Overview cards: active campaigns, first touches sent (this month), replies received, meetings booked
   - Campaign list: name, ICP, status, KPIs (reply rate %, velocity)
   - Click to drill into campaign details
   - Real-time updates via TanStack Query (auto-refetch on window focus)

**Success Criteria**:
- Generate 10+ test emails with Claude; all pass quality gate
- Send 100+ emails to test domain with <1% bounce rate
- Approval UI works without crashes
- Daily cap enforced correctly (e.g., 20 emails sent, 21st queued for next day)
- Dashboard shows accurate KPIs

**Blockers & Dependencies**:
- AWS SES account configured + verified domain
- Claude API rate limits respected (use batch API for voice cloning if needed)

**Estimated Effort**: 30 hours backend (LLM + queue) + 20 hours frontend (approval UI + dashboard) + 10 hours testing = 60 hours

---

### Week 4: Reply Handling & Integration (5 business days)

**Goal**: System monitors inbox, classifies replies with ≥90% accuracy, escalates intelligently, and logs meetings.

**Deliverables**:
- Inbox poller job (Gmail/Outlook OAuth2)
- Reply classification service (Claude + LangChain)
- Reply handling logic per L2 autonomy (auto-handle unsubscribe, escalate positive/objection)
- Reply queue page (pending replies with classification)
- Reasoning log (click any action to see why)
- HubSpot integration (basic meeting logging)
- Calendar proposal logic (generate 3–5 slots)

**Key Tasks**:

1. **Inbox Poller Job** (1 backend engineer)
   - Bull job: `inbox-poll` scheduled every 5 minutes per user
   - OAuth2 to Gmail/Outlook API (use NextAuth.js credentials)
   - Fetch new messages since last poll (use message timestamps)
   - Match inbound email to outreach (recipient_email ↔ sent_message)
   - Store as Reply object (sender, subject, body, received_timestamp)
   - Handle OAuth token refresh + error cases

2. **Reply Classification Service** (1 backend engineer, LLM-focused)
   - Implement `ReplyClassifierService.classify(reply_body)` → Reply
   - Classify into: positive, objection, unsubscribe, noise, unclear
   - Extract sentiment + intent from reply
   - Identify objection type (budget, timing, competitor, use-case fit) if objection
   - Use Claude API with few-shot examples (train on 20+ real replies if available)
   - Return confidence (0–1); target ≥0.9 on positive/unsubscribe
   - Log reasoning (why this classification)

3. **Reply Handling Logic (L2)** (1 backend engineer)
   - Confidence ≥ 0.7:
     - **Unsubscribe** → Auto-pause sequence, add to unsubscribe list, log action
     - **Noise** → Auto-archive reply, do not escalate
     - **Positive/Objection** → Escalate to user, show classification + context
   - Confidence < 0.7:
     - Always escalate to user with low-confidence warning
   - Log all actions for audit trail + agent learning

4. **tRPC Endpoints** (1 backend engineer)
   - `replies.listPending(user_id)` → [Reply] sorted by classification + confidence
   - `replies.escalate(reply_id, action)` → execute user's decision (accept recommendation, override)
   - `replies.getReasoningLog(action_id)` → return detailed reasoning for any action

5. **Reply Queue UI** (1 frontend engineer)
   - Dashboard page: "Replies Waiting for Me"
   - List: sort by classification (positive first, objections, unclear last)
   - Show: reply text, classification, confidence %, suggested action
   - Click reply to expand:
     - Full reply context
     - Original outreach email
     - Research brief + buyer persona
     - Suggested action (e.g., "Escalate for discussion" or "Auto-pause")
   - Actions: Accept recommendation, Override, Archive
   - Unread badge + notification

6. **Reasoning Log UI** (1 frontend engineer)
   - Available on every outreach, reply, and action
   - Click to expand detailed reasoning:
     - **For outreach**: "Sent because of ICP match (0.88) + voice confidence (0.91) + funding signal"
     - **For reply**: "Classified as positive (conf 0.92) because sentiment shows willingness to discuss"
     - **For action**: "Escalated because confidence < 0.7; human review needed"
   - Display as human-readable text (not token dump)
   - Log stored in Message/Reply object as `reasoning_log` field

7. **HubSpot Integration (Basic)** (1 backend engineer)
   - When meeting booked → create/update HubSpot Contact + Deal
   - OAuth2 to HubSpot API (store refresh token securely)
   - Map fields: account_name → Company, contact_email → Email, scheduled_datetime → Close Date
   - Include conversation summary in deal notes
   - Batch writes (Phase 1); real-time (Phase 2)

8. **Calendar Proposal Logic** (1 backend engineer)
   - When positive reply → check rep's Google Calendar availability
   - Identify prospect timezone (from IP geolocation or company location)
   - Generate 3–5 proposed slots:
     - Preferred: 10 AM–2 PM local prospect time
     - Preferred days: Tuesday–Thursday
     - 30-min duration, spaced 1–2 days apart
   - If calendar unavailable → escalate to rep
   - Log proposal with slots, timezone, rep availability

**Success Criteria**:
- Classify 50+ real replies with ≥90% accuracy on positive/unsubscribe (manual audit)
- Unsubscribe/noise auto-handled without escalation (50+ test cases)
- Positive/objection escalated with full context + suggested action
- Reasoning log visible on every action
- HubSpot sync works (test meeting logged with contact info)
- Calendar proposal generates 3–5 slots in prospect timezone

**Blockers & Dependencies**:
- Gmail/Outlook OAuth2 configured in NextAuth.js
- HubSpot API credentials + sandbox account
- Real reply data (20+ examples for classification training)
- Google Calendar API credentials

**Estimated Effort**: 35 hours backend (LLM + integrations) + 18 hours frontend (reply queue + reasoning) + 7 hours testing = 60 hours

---

## 3. Task Breakdown by Feature

### Dependency Map

```
Week 1: Auth & Infrastructure
├─ Postgres + Redis setup
├─ NextAuth.js config
├─ CI/CD pipeline
└─ Sentry error tracking
    ↓
Week 2: Data Models & Voice Cloning
├─ Prisma schema extension
├─ Voice cloning service
├─ CSV parsing + account enrichment
└─ Onboarding UI (5 steps)
    ↓
Week 3: Email Generation & Sending
├─ Email generation service
├─ Email-sender job queue
├─ SMTP integration (AWS SES)
├─ Research brief service
├─ First-touch approval UI
└─ Campaign dashboard
    ↓
Week 4: Reply Handling & Integration
├─ Inbox poller job
├─ Reply classification service
├─ Reply handling logic (L2)
├─ Reply queue UI
├─ Reasoning log viewer
├─ HubSpot integration
└─ Calendar proposal logic
```

### Task Breakdown Table

| Task | Week | Owner | Depends On | Story | Status |
|------|------|-------|-----------|-------|--------|
| **Setup AWS RDS PostgreSQL** | 1 | Backend/DevOps | — | F1, M1 | Pending |
| **Setup AWS ElastiCache Redis** | 1 | Backend/DevOps | — | — | Pending |
| **Setup AWS Secrets Manager** | 1 | Backend/DevOps | — | — | Pending |
| **Configure NextAuth.js** | 1 | Backend | AWS setup | F1, R1 | Pending |
| **Implement /auth/signin endpoint** | 1 | Backend | NextAuth.js | F1 | Pending |
| **Implement /auth/signup endpoint** | 1 | Backend | NextAuth.js | F1 | Pending |
| **Implement auth middleware** | 1 | Backend | NextAuth.js | — | Pending |
| **Design Prisma schema (initial)** | 1 | Backend | — | — | Pending |
| **Create login page** | 1 | Frontend | NextAuth.js | F1 | Pending |
| **Create signup page** | 1 | Frontend | NextAuth.js | F1 | Pending |
| **Setup GitHub Actions CI/CD** | 1 | Backend/DevOps | Repo setup | — | Pending |
| **Configure Sentry** | 1 | Backend | AWS setup | — | Pending |
| **Extend Prisma schema** | 2 | Backend | Week 1 schema | F2, M1 | Pending |
| **Implement voice cloning service** | 2 | Backend (LLM) | Claude API | F2 | Pending |
| **Implement VoiceProfile tRPC endpoints** | 2 | Backend | Prisma schema | F2, R1 | Pending |
| **CSV parser + validator** | 2 | Backend | Prisma schema | F1 | Pending |
| **Implement Account upload endpoint** | 2 | Backend | CSV parser | F1 | Pending |
| **ICP wizard form** | 2 | Frontend | — | M1 | Pending |
| **Voice upload & preview UI** | 2 | Frontend | Voice service | F2 | Pending |
| **CSV upload form** | 2 | Frontend | CSV parser | F1 | Pending |
| **Onboarding progress indicator** | 2 | Frontend | All forms | — | Pending |
| **Email generation service** | 3 | Backend (LLM) | Research brief, Voice | F3 | Pending |
| **Email-sender job queue** | 3 | Backend | Prisma, Redis | F3 | Pending |
| **AWS SES integration** | 3 | Backend | SES setup | F3 | Pending |
| **Daily send cap enforcement** | 3 | Backend | Job queue | F8 | Pending |
| **Bounce handling** | 3 | Backend | SMTP | — | Pending |
| **Research brief service** | 3 | Backend (LLM) | Prisma | F3 | Pending |
| **Email approval UI** | 3 | Frontend | Email service | F3, R2 | Pending |
| **Campaign dashboard** | 3 | Frontend | Campaigns endpoint | M3 | Pending |
| **Inbox poller job** | 4 | Backend | OAuth2, Redis | F5 | Pending |
| **Reply classification service** | 4 | Backend (LLM) | Claude API | F5 | Pending |
| **Reply handling logic (L2)** | 4 | Backend | Classification | F5, R6 | Pending |
| **tRPC reply endpoints** | 4 | Backend | Prisma | F5 | Pending |
| **Reply queue UI** | 4 | Frontend | Reply service | R3 | Pending |
| **Reasoning log viewer** | 4 | Frontend | All services | F6, R4 | Pending |
| **HubSpot integration** | 4 | Backend | OAuth2, API | — | Pending |
| **Calendar proposal logic** | 4 | Backend | Google Calendar API | F7 | Pending |
| **Unit tests (Vitest)** | 1–4 | Backend/Frontend | Code | — | Pending |
| **E2E tests (Playwright)** | 4 | QA/Frontend | All flows | — | Pending |
| **Load test (k6)** | 4 | Backend/DevOps | Email sender | — | Pending |

---

## 4. Definition of Done

### Code Quality
- [ ] Code reviewed by 2+ team members (feedback addressed)
- [ ] ESLint + Prettier passes without warnings
- [ ] TypeScript compilation succeeds (no `any` types)
- [ ] No console.logs left in production code
- [ ] Error handling implemented (try/catch, validation)

### Testing
- [ ] Unit tests written (Vitest); ≥70% coverage target for services
- [ ] Integration tests for critical paths (tRPC endpoints)
- [ ] E2E smoke tests for happy path (Playwright)
- [ ] Manual QA in staging (daily testing of new features)

### Documentation
- [ ] README updated with new endpoints/features
- [ ] tRPC schema auto-documented (types visible in IDE)
- [ ] API routes documented in code comments
- [ ] User-facing features documented in onboarding

### Deployment
- [ ] All code merged to `main` branch
- [ ] CI/CD pipeline passes (lint, test, build)
- [ ] Deployed to staging environment
- [ ] Tested in staging (no critical bugs)
- [ ] No breaking changes to existing APIs

### Acceptance Criteria
- [ ] All user story acceptance criteria from PRD met
- [ ] No P0 or P1 bugs blocking the feature
- [ ] Performance targets met (e.g., <2 sec API response, <30 sec voice cloning)

---

## 5. Testing Strategy

### Unit Tests (Vitest)

**Scope**: Services, utilities, hooks

**Target Coverage**: ≥70% for critical services (voice cloning, reply classification, email generation)

**Examples**:
- `VoiceProfileService.extractProfile()` with mock email data
- `ReplyClassifierService.classify()` with test replies
- `EmailGenerationService.generateFirstTouch()` with mock research brief
- Utility functions: CSV parsing, domain validation, timezone detection

**Execution**: `npm run test` (fast, parallel, 5–10 min total)

### Integration Tests

**Scope**: tRPC endpoints with mock database + Redis

**Target Coverage**: All critical endpoints (create campaign, generate email, classify reply)

**Examples**:
- `campaigns.create()` → verify stored in DB
- `voiceProfiles.uploadEmails()` → verify extracted voice profile
- `replies.listPending()` → verify correct filtering + sorting

**Framework**: Supertest + Vitest with `@testing-library/react` for hooks

**Execution**: `npm run test:integration` (15–20 min total)

### E2E Tests (Playwright)

**Scope**: Critical user flows (auth, onboarding, email approval, reply handling)

**Target Coverage**: Happy path only (Phase 1); Phase 2+ comprehensive + visual regression

**Examples**:
- Signup → Login → Logout
- Onboarding: ICP form → Voice upload → CSV upload → Complete
- Campaign creation: Name → ICP → Review first email → Approve → Verify sent
- Reply monitoring: Receive test reply → Classify → Escalate → View reasoning log

**Execution**: `npm run test:e2e` (staging environment, 10–15 min total)

### Load Testing (k6)

**Scope**: Email sending throughput

**Target**: 100+ emails/min send capacity

**Scenario**: Simulate 50 concurrent users sending 20 emails each (1000 total)

**Execution**: `npm run test:load` (staging environment, 5 min test)

### Manual QA

**Daily Testing Schedule**:
- **EOD**: QA engineer tests new features in staging
- **Focus**: Signup flow, voice cloning, email approval, reply classification
- **Checklist**: No crashes, expected behavior, reasonable latency (<2 sec API calls)

---

## 6. Deployment & Rollback Strategy

### Deployment Pipeline

```
Local Development
    ↓ (git push)
GitHub Actions (lint, test, build)
    ↓ (merge to main)
Auto-deploy to Staging (Vercel frontend + AWS ECS backend)
    ↓ (manual trigger or scheduled)
Manual Approval → Auto-deploy to Production
```

### Frontend Deployment (Vercel)

- **Trigger**: Merge to `main` branch
- **Process**: Vercel auto-builds Next.js, runs E2E tests, deploys to preview URL + production
- **Rollback**: Git revert + redeploy (5 min downtime)

### Backend Deployment (AWS ECS)

- **Trigger**: Merge to `main` branch
- **Process**:
  1. GitHub Actions builds Docker image (Node.js + Express)
  2. Push to AWS ECR
  3. Trigger ECS deployment (blue-green, rolling update)
  4. Auto health-check (5 min)
- **Database Migration**: Prisma migrate runs before deployment (with auto-backup)
- **Rollback**: ECS task rollback to previous image (2–3 min downtime)

### Secrets & Deployment

- **Secrets Storage**: AWS Secrets Manager (rotated weekly)
- **Secrets Injection**: GitHub Actions → ECS environment variables
- **Database Backup**: Auto-backup before each Prisma migrate (retention: 7 days)

### Rollback Procedure

| Scenario | Action | Downtime |
|----------|--------|----------|
| **Frontend bug** | Git revert → Vercel auto-redeploy | <2 min |
| **Backend bug** | ECS task rollback to previous image | 2–3 min |
| **Database migration fail** | Restore from backup, revert migration | <5 min |
| **Critical outage** | Kill deployment, revert both frontend + backend | <5 min |

---

## 7. Milestones & Checkpoints

### End of Week 1: Auth & Database Ready
- ✓ Users can sign up and log in
- ✓ Database schema finalized and tested
- ✓ CI/CD pipeline fully functional
- ✓ Staging environment available
- **Checkpoint**: Team deploys dummy endpoint to staging

### End of Week 2: Onboarding Partially Working
- ✓ Voice cloning MVP generates profiles with ≥70% confidence
- ✓ CSV import validates accounts (95%+ success rate)
- ✓ Onboarding UI complete (ICP → voice → CSV)
- ✓ Prisma schema extended with Campaign, VoiceProfile, Account
- **Checkpoint**: Internal user can complete onboarding and create campaign

### End of Week 3: Email Generation & Sending MVP
- ✓ First-touch emails generated and sent (100+)
- ✓ Zero bounces on test domain
- ✓ Approval UI works, users approve before send
- ✓ Campaign dashboard shows accurate KPIs (reply rate, velocity)
- **Checkpoint**: Invite 5 pilot users to test email generation

### End of Week 4: Reply Handling MVP & Pilot Ready
- ✓ Inbox polling works (5-min cadence)
- ✓ Replies classified with ≥90% accuracy (50+ test replies)
- ✓ Reasoning log visible for all actions
- ✓ HubSpot integration logs meetings
- ✓ Ready for 50-user pilot launch
- **Checkpoint**: Run full E2E test (signup → send → receive reply → escalate)

---

## 8. Resource Allocation

### Team Composition

| Role | FTE | Week 1 | Week 2 | Week 3 | Week 4 | Responsibilities |
|------|-----|--------|--------|--------|--------|---|
| **Backend Lead** | 1.0 | Auth, Prisma | Prisma extension, CSV parsing | Email generation, job queue, SMTP | Reply classification, integrations | Architecture, API design, LLM work |
| **Backend (LLM)** | 0.5 | — | Voice cloning service | Email generation + research brief | Reply classification | Prompt engineering, Claude API |
| **Backend (Queue/Infra)** | 0.5 | — | — | Email-sender job queue, bounce handling | Inbox poller, calendar logic | Job orchestration, reliability |
| **Frontend Lead** | 1.0 | Auth pages | Onboarding forms, ICP wizard | Approval UI, campaign dashboard | Reply queue, reasoning log | UI/UX, component architecture |
| **Frontend (State)** | 0.5 | — | Voice upload UI, form validation | Real-time dashboard updates | Reply escalation UI | State management, integrations |
| **DevOps / Infra** | 0.5 | AWS setup, CI/CD, Secrets Mgmt | Database setup, monitoring | Deployment pipeline, alerts | Load testing, rollback procedures | Infrastructure, reliability |

**Total**: 4.5 FTE (can scale down to 4 FTE by combining frontend roles)

### Optional Roles (Recommended)

| Role | FTE | Responsibilities |
|------|-----|---|
| **Product Manager** | 0.5 | Coordination, stakeholder updates, priority arbitration |
| **QA Engineer** | 0.5 | Manual testing, bug reporting, test case creation |

---

## 9. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **LLM API rate limits** | Medium | High | Batch processing for voice cloning; prioritize first-touches; fallback to Anthropic batch API (async) |
| **Email deliverability (spam folder)** | High | Critical | Pre-launch testing (Mail Tester score ≥8/10); gradual warmup (5 emails/day first week); compliance footer mandatory |
| **OAuth token failures (Gmail/Outlook)** | Medium | Medium | Extensive testing of token refresh; graceful error messages; fallback to manual email polling if needed |
| **Database performance** | Low | Medium | Postgres indexes on campaign_id, user_id, status; Redis caching for campaign KPIs; monitor slow queries |
| **Reply classification accuracy** | Medium | High | Train on 20+ real replies; conservative threshold (escalate if <70% confidence); manual audit weekly |
| **Domain reputation damage** | Medium | Critical | Strict daily/domain caps; bounce monitoring; auto-pause on complaints; compliance footer; pre-launch testing |
| **Voice cloning misses rep style** | Medium | Medium | Minimum 50 email samples; user can curate samples; manual override option; auto-flag low confidence |
| **Team attrition** | Low | High | Clear onboarding docs; code comments; pair programming for LLM work; weekly syncs |

---

## 10. Success Metrics & Monitoring

### Daily Monitoring

- **Deploy count**: GitHub Actions dashboard (target: 1–2 deploys/day)
- **Error rate**: Sentry (target: <0.1% of requests)
- **Email send rate**: CloudWatch (target: ≥100 emails/day by EOW3)
- **Inbox poll success**: CloudWatch (target: ≥99% poll completion)

### Weekly Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Feature completion %** | ≥95% on-time | vs. task breakdown schedule |
| **Test coverage %** | ≥70% critical services | Vitest coverage report |
| **Reply classification accuracy** | ≥90% on positive/unsubscribe | Manual audit of 20+ replies |
| **Email send success %** | ≥98% | (sent + bounced) / attempts |
| **P0 bugs** | 0 | Critical bugs blocking users |
| **Code review turnaround** | <4 hours | Time from PR open to first review |

### Phase End Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Reply rate** | ≥15% | Total replies ÷ first touches sent |
| **Spam complaints** | 0 | Support tickets on first 100 emails |
| **Pilot user adoption** | 50+ | Active users with ≥1 campaign |
| **User engagement** | >80% view reasoning log | Event tracking |
| **Uptime** | >99.5% | Monitoring data |
| **User NPS** | ≥40 | Post-pilot survey |

---

## 11. Post-Phase-1 Handoff

### Feedback Collection
- Survey 50+ pilot users (Net Promoter Score, feature requests)
- Track reply rate + booking rate per user cohort
- Identify top user stories for Phase 2

### Metrics Review
- ✓ Reply rate ≥15%? (vs. 2–5% cold email baseline)
- ✓ Classification accuracy ≥90%?
- ✓ Zero spam complaints?
- ✓ >80% reasoning log engagement?

### Phase 2 Kickoff
If metrics met:
- **Goal**: Add signal-based sourcing + real-time trigger outreach
- **Deliverables**: Intent APIs (funding, hiring), self-improvement loop, cadence automation
- **Duration**: Months 2–3
- **Success Metric**: 5× higher reply rate on signal-triggered emails

---

## 12. Communication Plan

### Daily Standups
- **When**: 10 AM PT, 15 min
- **Attendees**: Backend (2), Frontend (2), DevOps (1), optional PM/QA
- **Format**: What did you finish? What's next? Blockers?
- **Cadence**: Every business day

### Weekly Sync
- **When**: Friday 4 PM PT, 30 min
- **Attendees**: Full team + stakeholders
- **Format**: Weekly metrics, milestone review, next week priorities
- **Cadence**: Every Friday (EOW)

### Stakeholder Updates
- **When**: Monday morning (stakeholder-only sync)
- **Format**: Milestone progress, risks, go/no-go status
- **Cadence**: Every Monday

### Escalation Protocol
- **P0 (Critical)**: Slack + immediate call
- **P1 (Blocker)**: Daily standup escalation
- **P2 (Non-blocking)**: Weekly sync review

---

## Appendix: Tech Debt & Phase 2 Prep

### Intentional Phase 1 Shortcuts (For Speed)

| Shortcut | Phase 1 Impact | Phase 2 Plan |
|----------|---|---|
| **No external enrichment API** | Accounts only matched against uploaded list | Integrate BuiltWith, Crunchbase, LinkedIn APIs |
| **Single subject line variant** | Email generation less optimized | A/B test 3 variants, score by predicted open rate |
| **Batch CRM writes** | Booked meetings synced once/day | Real-time sync via webhooks |
| **Basic inbox polling** | 5-min latency, potential misses | Implement Gmail push notifications (webhooks) |
| **No follow-up sequences** | User manually approves follow-ups | Auto-generate cadence per user settings (L3+) |
| **No outcome labeling** | Cannot improve email generation | Add user feedback loop (good/bad reply labels) |

### Code Cleanup Checklist (Before Phase 2)
- [ ] Extract LLM prompts to shared configuration file
- [ ] Create data enrichment abstraction (ready for API integration)
- [ ] Add integration tests for all new endpoints
- [ ] Document tRPC router structure
- [ ] Add Playwright visual regression tests
- [ ] Increase unit test coverage to 80%+

---

## Summary

**Phase 1 is a 4-week sprint to prove the core autonomous BDR loop works.** The team will build an email-only BYOL system with L2 autonomy (user approves first touches, auto-handles replies). Success means 50+ pilot users, ≥15% reply rate, ≥90% classification accuracy, and zero spam complaints.

**Key Constraints**:
- No lead sourcing or multi-channel outreach
- L2 autonomy only (no L3/L4 in Phase 1)
- Free/basic data enrichment (no paid APIs yet)
- Batch CRM sync (not real-time)

**Key Success Factors**:
- High-quality voice cloning (≥70% confidence target)
- Accurate reply classification (≥90% on positive/unsubscribe)
- Transparent reasoning logs (build trust with users)
- Strict compliance + deliverability controls (avoid spam folder)

**Next Steps**:
1. Kick off Week 1 infrastructure setup (Monday)
2. Daily standups starting Tuesday
3. Weekly stakeholder updates every Friday
4. End-of-week checkpoints to validate progress

---

**Document Version**: 1.0
**Last Updated**: 2026-03-28
**Status**: Ready for Implementation
