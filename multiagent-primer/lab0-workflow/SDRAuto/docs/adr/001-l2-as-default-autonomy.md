# ADR-001: L2 (First Touch Approval) as Default Autonomy Level

## Status
ACCEPTED

## Context
The system supports four autonomy levels (L1–L4), ranging from "human approves every message" to "fully autonomous end-to-end." Choosing the default is a high-stakes product decision: too conservative (L1) and users see no time savings; too aggressive (L4) and a single bad email burns trust, domain reputation, or triggers compliance violations.

Founders (the Phase 1 primary persona) lean toward L4, but enterprise SDR teams — the revenue path — need guardrails. The default sets the anchor for most users who won't tune it themselves.

## Decision
Default to L2: the agent auto-generates and auto-sends follow-ups, but a human must approve every first-touch email before it goes out.

This gives the agent enough surface area to prove value (follow-ups are 60–70% of outbound volume) while keeping the highest-risk action — the first impression — under human control. L4 remains available as an opt-in for founders who accept the risk.

## Consequences
- **Easier**: Safer launch; first-touch approval catches voice cloning errors, factual mistakes, and over-personalization before prospects see them. Builds user trust incrementally.
- **Harder**: L2 creates an approval bottleneck — users who don't check the queue daily will stall their own pipeline. The approval UX must be fast (batch approve, mobile-friendly) or it becomes friction.
- **Follow-up needed**: Define what "first touch" means when a prospect re-enters a new campaign. Decide whether to allow per-campaign autonomy overrides vs. a single account-level setting.
