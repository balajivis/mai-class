# ADR-008: No Plaintext Email Body Logging for Analytics

## Status
ACCEPTED

## Context
Email bodies contain prospect PII (names, companies, pain points) and potentially sensitive business context. For an autonomous agent that generates and sends hundreds of emails, storing all message bodies in plaintext creates a large attack surface — a single data breach exposes every prospect interaction.

At the same time, the system needs analytics: which subject lines get opens, which personalizations drive replies, which voice profile traits correlate with engagement. The self-improvement loop (Phase 2) depends on learning from past messages.

## Decision
Email bodies are not logged in plaintext for analytics purposes. Instead, hash or redact bodies before storing for analytical queries. Full message content is retained in the operational data store (Message entity) for the reasoning log and audit trail, but analytics pipelines operate on structured metadata (personalization signals used, subject line variant, send time, outcome) rather than raw text.

## Consequences
- **Easier**: Reduces PII exposure in analytics/reporting systems. Simplifies GDPR deletion requests (delete the operational record, analytics are already anonymized). Limits blast radius of a breach in the analytics layer.
- **Harder**: Debugging email quality issues requires access to the operational store, not analytics. The self-improvement loop in Phase 2 needs to learn from message content — will need a privacy-preserving approach (e.g., extract features at generation time, discard raw text in the learning pipeline).
- **Follow-up needed**: Define which structured features are extracted from emails at send time for analytics. Clarify retention policy for the operational Message store (1-year audit trail per PRD). Design the GDPR deletion flow across both stores.
