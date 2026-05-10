# ADR-005: Transparent Reasoning Log as a Core Feature, Not a Nice-to-Have

## Status
ACCEPTED

## Context
Most sales automation tools operate as black boxes — they send emails and report metrics, but don't explain why a particular message was sent, why a reply was classified a certain way, or why the agent chose to escalate vs. auto-respond. This is fine when the tool is a dumb template engine, but an autonomous agent making judgment calls (reply classification, objection rebuttals, meeting proposals) without explanation will lose user trust.

The pitch deck states: "Reps who can't see what the agent is doing will route around it. A glass-box UI showing every action and its rationale is non-negotiable." The PRD targets >80% of users viewing the reasoning log at least once as a Phase 1 success metric.

## Decision
Every agent action must include a human-readable reasoning log explaining: (1) what signal triggered the action, (2) what rule or model applied, (3) why this specific message/classification/proposal was chosen, and (4) what happens next. This is a Phase 1 SHOULD-priority feature, not a post-launch polish item.

## Consequences
- **Easier**: Builds trust with both founders (who need to understand what their "virtual SDR" is doing) and SDR managers (who need auditability). Creates a natural feedback loop — users who can see reasoning can coach the agent. Differentiates from every competitor.
- **Harder**: Every pipeline stage must emit structured reasoning metadata, adding complexity to research, outreach, reply classification, and booking flows. Reasoning logs must be human-readable, not raw model outputs — this requires prompt engineering and possibly a summarization step.
- **Follow-up needed**: Define the reasoning log schema per stage. Decide storage and retention policy (reasoning logs contain PII-adjacent data about prospects). Determine whether reasoning data feeds the self-improvement loop in Phase 2.
