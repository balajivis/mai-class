# ADR-006: Strict Per-Domain Send Caps and Auto-Pause on Deliverability Signals

## Status
ACCEPTED

## Context
Domain reputation is the single most fragile asset in email outbound. A new domain can be blacklisted within days if bounce rates exceed ~5% or spam complaints occur. Most sales tools let users configure send limits but don't enforce hard caps or auto-pause on negative signals. This puts the burden on users who often don't understand deliverability.

The risk is asymmetric: one bad day can destroy months of domain warmup. For an autonomous agent that sends without human review (L3/L4), the consequences are even more severe because there's no human in the loop to notice a spike in bounces.

## Decision
Enforce strict, opinionated defaults that the system will not violate:
- 20 emails/day global cap (configurable 1–100)
- 5 emails/domain/day cap (prevents carpet-bombing a single company)
- Auto-pause domain if bounce rate exceeds 5%
- Auto-pause domain on any spam complaint
- Skip sends if email validation fails or domain reputation is flagged

These are hard limits enforced in real-time, not advisory warnings.

## Consequences
- **Easier**: Protects users from themselves. Zero spam complaints is a Phase 1 exit criterion — these caps make that achievable. Builds trust with email-savvy users who recognize the guardrails as best practice.
- **Harder**: Power users and high-volume teams will hit caps quickly and may perceive the product as too restrictive. The 5/domain/day cap means targeting a large company with multiple personas requires multi-day sequencing. Support burden from "why aren't my emails sending?" questions.
- **Follow-up needed**: Define the domain warmup schedule (graduated send increases over first 2–4 weeks). Decide whether caps are per-campaign or per-account (a user running 3 campaigns shouldn't get 3x the domain cap).
