# ADR-002: Bring-Your-Own-List (BYOL) Instead of Built-In Lead Sourcing for Phase 1

## Status
ACCEPTED

## Context
Lead sourcing (monitoring job boards, funding signals, tech-stack changes) is the strongest long-term moat and a key 10x differentiator — real-time signal response drives 5x higher reply rates than cold lists. However, building reliable sourcing requires integrating multiple paid data APIs (LinkedIn, Crunchbase, BuiltWith, Hunter), handling rate limits, data freshness, and enrichment pipelines.

Meanwhile, every Phase 1 target user (founders, SDR teams) already has a list of accounts they want to reach. The core value hypothesis — "AI can write emails in your voice that get replies" — doesn't depend on where the list came from.

## Decision
Phase 1 ships with CSV upload only. No lead sourcing, no signal detection, no enrichment APIs. Users bring their own target account list.

Lead sourcing is deferred to Phase 2, where it becomes the primary new capability.

## Consequences
- **Easier**: Dramatically reduces Phase 1 scope (no third-party API contracts, no data pipeline, no relevance scoring). Allows the team to focus entirely on the core loop: research, outreach, reply handling.
- **Harder**: Phase 1 users must maintain their own lists, which limits the "set it and forget it" value prop. The product looks more like a smart email writer than an autonomous agent until Phase 2.
- **Follow-up needed**: Define the CSV schema and validation rules. Decide whether to allow list append/update after campaign start, or require a new campaign per upload.
