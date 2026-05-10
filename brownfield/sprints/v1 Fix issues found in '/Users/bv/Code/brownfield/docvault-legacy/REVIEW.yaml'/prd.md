# Sprint v1 Fix issues found in '/Users/bv/Code/brownfield/docvault-legacy/REVIEW.yaml' — Phase 1: Critical Fixes

**Goal**: Fix 6 high-impact issues from code review: remove PCI exposure, complete password reset, add API DTOs, fix cart race condition, replace in-memory queries with SQL.

**Sprint window**: 3 hours / 2–3 dev days

---

## Why This Sprint

The REVIEW identified 38 issues across 5 severity levels. This sprint targets Phase 1: the highest-impact blockers for production readiness. We're fixing payment data exposure (SEC-003), a completely broken feature (BUG-001), a critical API hygiene gap (ARCH-004), and three performance issues where Java aggregation loads entire datasets. This clears the path for a dedicated auth sprint (SEC-001) afterward.

---

## Scope

### In

- **SEC-003**: Remove raw `paymentToken` parameter from checkout (PCI exposure)
- **BUG-001**: Complete password reset — generate, store, validate token; add confirm endpoint
- **ARCH-004**: Add OrderDTO to prevent User entity (with passwordHash) serialization
- **PERF-002**: Replace in-memory product filter with SQL query
- **PERF-003+004**: Replace in-memory inventory & order stats with SQL aggregates
- **BUG-003**: Add pessimistic lock to cart stock check (race condition)

### Out

- **SEC-001** (authentication/authorization) — deferred to dedicated security sprint; requires session/JWT design, role model, all endpoints
- **ARCH-001–003, 005–006** — architectural refactoring (consolidate search, fix circular deps, DTOs for all models)
- **PERF-005** (pagination) — API contract change, lower urgency
- **DATA-002, DATA-004** — low impact (enum types, timezone handling)
- **TEST-001** — test hardening; defer until code stabilizes

---

## Acceptance Criteria

- [ ] SEC-003: `paymentToken` removed from `OrderController.checkout()` signature and `OrderService.processCheckout()`; payment stub no longer accepts it
- [ ] BUG-001: Password reset token generated as UUID, stored in `users` table with 24h TTL; POST `/api/auth/reset-password-confirm?token=...&newPassword=...` validates and completes reset
- [ ] ARCH-004: `OrderDTO` created; all Order endpoints (`GET /orders`, `GET /orders/{id}`) return DTO, not entity; no User or passwordHash in response
- [ ] PERF-002: `/api/products/filter` uses `ProductRepository.findWithFilters()` (SQL), not `SearchUtil.filterProducts()` (in-memory)
- [ ] PERF-003+004: `AdminController.getInventoryReport()` and `OrderService.getOrderStats()` use SQL aggregates, don't load full datasets
- [ ] BUG-003: `CartItem.addToCart()` acquires `@Lock(PESSIMISTIC_WRITE)` on product during stock check; concurrent requests properly serialize

---

## Risks

- **Password reset schema change**: Requires adding `reset_token` and `reset_token_expiry` columns to `users` table. Flyway/Liquibase migration needed.
- **Removing paymentToken**: May break clients that send it (unlikely — stub never stored it; safe to remove).
- **OrderDTO lazy loading**: Order entity has `@ManyToOne User` — ensure DTO mapping doesn't trigger n+1 queries on large lists.
- **Pessimistic lock contention**: PESSIMISTIC_WRITE on popular products may impact throughput during traffic spikes. Monitor.

---

## Decisions

- **Password reset storage**: New columns in `users` table (reset_token VARCHAR(255), reset_token_expiry TIMESTAMP), not a separate table. Simpler, fewer joins.
- **OrderDTO fields**: id, totalAmount, status, shippingAddress, paymentMethod, createdAt, userId only. No nested User, no derived fields.
- **SQL aggregates location**: OrderService methods, not database views. Keeps query logic with business logic; easier to refactor.
- **Pessimistic lock scope**: Acquired only during stock check in `addToCart()`, released at transaction end. Does not lock during checkout (separate transaction).
