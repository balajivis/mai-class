# ADR-003: Email-Only Channel Scope for Phase 1

## Status
ACCEPTED

## Context
Modern outbound sales is multi-channel: email, LinkedIn, and phone are the standard trifecta. Competitors like Outreach and SalesLoft support all three. However, each channel introduces its own state machine (connection requests, message limits, throttling, compliance rules), authentication model, and failure modes.

LinkedIn in particular carries platform risk — automated messaging violates ToS and accounts get banned. Phone requires real-time scheduling and a fundamentally different UX (call scripts vs. written messages).

## Decision
Phase 1 supports email only. LinkedIn and phone are explicitly out of scope until Phase 3.

## Consequences
- **Easier**: One channel means one state machine, one compliance framework (CAN-SPAM/GDPR for email), one delivery pipeline. Reply handling, sequence logic, and the approval UX are all dramatically simpler with a single channel.
- **Harder**: Limits effectiveness for personas where email alone has low response rates (e.g., senior executives who ignore cold email but respond on LinkedIn). The product may appear incomplete compared to multi-channel incumbents.
- **Follow-up needed**: When LinkedIn is added in Phase 3, the orchestration engine must support cross-channel state (e.g., "emailed on Day 1, LinkedIn on Day 3"). This should be designed for in the data model even if not implemented in Phase 1.
