---
name: scorecard
description: "Multi-layer readiness audit. Audits actual code paths and writes scorecard.md with honest percentages. Use before /prd or after significant code changes."
allowed-tools: Read, Grep, Glob, Write
---

# /scorecard — Readiness Audit

Update `scorecard.md` by auditing the actual code paths for each layer defined in `layers/`.

## What You're Measuring

Three columns, each as an honest percentage:

| Column | Question |
|--------|----------|
| **Defined → Config** | Is the feature/layer properly defined and configured? |
| **Config → Runtime** | Does the runtime code actually read and use that config? |
| **End-to-End** | Both columns working together. Not an average — if either side is broken, E2E is low. |

Scoring guidance:
- **0%**: Not defined / not implemented at all
- **25%**: Partially defined or implemented but not functional
- **50%**: Defined and partially working, but with significant gaps or hardcoded fallbacks
- **75%**: Works end-to-end for common cases, some edge cases missing
- **95%**: Fully wired, only minor gaps

## Audit Protocol

For each layer, read the corresponding file at `layers/{NN}-{name}.md`. It lists the files to read and the key question to answer. Assess both sides independently, then write a one-sentence verdict that explains the biggest remaining gap.

## Output

After auditing all layers, write the updated scorecard using the format in `templates/output.md`.

Be honest. If something is 0%, say 0%. The scorecard is used to prioritize sprint work — optimism defeats its purpose.

## Blackboard Auto-Post

After completing the audit:
- If any layer's E2E score **dropped >20%** from the previous scorecard: pause and ask the human before continuing. Then post as `finding`.
- If the Top 3 Blockers changed significantly: auto-post as `finding`.
- If scores are stable: do NOT post — no news is good news.
