# Autonomous BDR

An AI-powered agent that automates the full outbound sales cycle: sourcing leads, personalizing outreach, handling replies, and booking meetings.

## Core Loop

1. **Source** - Find in-market accounts matching ICP (BYOL in Phase 1)
2. **Research** - Build per-account brief (org chart, news, pain signals)
3. **Outreach** - Write personalized emails in cloned rep voice
4. **Reply** - Classify inbound replies and handle or escalate
5. **Book** - Propose calendar slots and log meetings to CRM

## Project Structure

```
SDRAuto/
├── docs/
│   ├── specs/                 # Technical specifications
│   │   └── technical-spec.md  # Full product & architecture spec
│   ├── designs/               # Page flow & UI design SVGs
│   │   ├── 01-onboarding-flow.svg
│   │   ├── 02-core-dashboard.svg
│   │   ├── 03-core-loop-flow.svg
│   │   └── 04-reply-handling-flow.svg
│   └── presentations/         # Slide decks and pitch materials
│       ├── pitch-deck.md      # Pitch deck (markdown source)
│       └── pitch-deck.html    # Pitch deck (rendered)
├── src/                       # Application source code
└── README.md
```

## Phase Plan

- **Phase 1** (Weeks 1-4): Email-only BYOL, L2 autonomy. Prove core loop.
- **Phase 2** (Months 2-3): Signal-based sourcing, real-time triggers, self-improvement loop.
- **Phase 3** (Months 4-6): LinkedIn channel, L3/L4 autonomy, advanced reply handling.
