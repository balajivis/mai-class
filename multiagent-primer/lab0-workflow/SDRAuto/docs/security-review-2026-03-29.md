# Security Review — 2026-03-29

**Reviewer:** OpenAI Codex (gpt-5.2-codex) via Claude Code
**Scope:** `src/`
**Status:** Findings documented, fixes pending

---

## Critical

### 1. Hardcoded JWT Secret Fallback
- **File:** `src/middleware/auth.middleware.ts:6`
- **Issue:** Falls back to a hardcoded JWT secret when `JWT_SECRET` env var is missing, making tokens predictable.
- **Recommendation:** Fail fast at startup if `JWT_SECRET` is not set. Never use a default secret.

### 2. Cross-Tenant Reply Attribution
- **File:** `src/services/inbox.service.ts:51-62`
- **Issue:** Matches replies by `buyerEmail` only. If multiple tenants share a prospect, replies can be attributed to the wrong user.
- **Recommendation:** Include `userId` or `tenantId` in the reply matching query.

### 3. Cross-Tenant Bounce Blocking
- **File:** `src/services/emailSending.service.ts:192-195`
- **Issue:** Bounce checks ignore `userId`, so one tenant's bounce history can block sends for another tenant.
- **Recommendation:** Scope bounce lookups by `userId`.

### 4. Stored XSS Risk
- **File:** `src/jobs/replyClassifier.job.ts:49-57`
- **Issue:** Raw reply bodies and subjects are stored without sanitization. If rendered as HTML anywhere in the UI, this enables stored XSS.
- **Recommendation:** Sanitize HTML on ingest or ensure all rendering uses plain text / escapes output.

## High

### 5. Permissive CORS
- **File:** `src/server.ts:22`
- **Issue:** CORS is configured permissively, allowing any origin.
- **Recommendation:** Restrict `Access-Control-Allow-Origin` to known frontend domains in production.

### 6. Ineffective Rate Limiting
- **File:** `src/middleware/rateLimit.middleware.ts:35`
- **Issue:** Rate limiting keys off `req.user`, which is never populated outside authenticated routes. Unauthenticated endpoints are unprotected.
- **Recommendation:** Key rate limiting on IP address for unauthenticated routes.

## Medium

### 7. Env Validation Not Enforced at Startup
- **File:** `src/env.ts`
- **Issue:** Env validation schema exists but is never imported in entrypoints (`server.ts`, job runners). Insecure defaults (like the hardcoded JWT secret) slip through.
- **Recommendation:** Import and run env validation at the top of all entrypoints to fail fast on misconfiguration.

### 8. Unguarded JSON.parse on LLM Output
- **File:** `src/lib/anthropic.ts:28-35`
- **Issue:** `JSON.parse` on LLM responses without try/catch can crash background jobs.
- **Recommendation:** Wrap in try/catch with structured error handling and retries.

---

## Performance Findings

| Severity | File | Issue |
|----------|------|-------|
| High | `inbox.service.ts:51-63` | N+1 queries per reply — batch with `IN (...)` |
| Medium | `outreach.router.ts:18-24`, `replies.router.ts:38-47` | Unbounded list returns — add pagination |
| Low | `replies.router.ts:49-54` | Redundant in-memory sort after DB ordering |

## Code Quality Findings

| File | Issue |
|------|-------|
| `campaigns.router.ts:5` | Unused `csvRowSchema` import |
| `rateLimit.middleware.ts:18-23` | Dead code: `ttl` lookup unused, `retryAfterMs` ignores actual TTL |
| `campaigns.router.ts:121-158` | Naive CSV parsing — doesn't handle quoted commas or blank lines |
| `meetingBooking.service.ts:102-111` | Unguarded `slotIndex` — no bounds check |

## Architecture Concern

- **Job processors in API process** (`server.ts:50-63`): Scaling the API horizontally duplicates job workers. Consider separating workers into their own process.
