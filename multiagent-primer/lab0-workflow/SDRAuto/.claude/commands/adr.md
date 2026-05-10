---
name: adr
description: Extract non-obvious architectural decisions from project docs and create ADR files
---

## Instructions

When the user runs /adr:

1. **Scan project documentation** — Read all files in `docs/` (specs, PRDs, pitch decks, design docs). Skip auto-generated or visual-only files.

2. **Identify non-obvious decisions** — Extract decisions that are:
   - Strategic tradeoffs (chose X over Y, with clear downsides accepted)
   - Opinionated defaults (a setting or behavior that could reasonably go another way)
   - Deliberate scope cuts (features deferred or excluded despite being valuable)
   - Constraints chosen for safety, compliance, or trust (hard limits, guardrails)
   - Skip anything that is standard practice or self-evident from the tech stack

3. **Check for existing ADRs** — Read `docs/adr/` to find the current highest ADR number and avoid duplicating decisions already recorded.

4. **Create ADR files** — For each new decision, write a file in `docs/adr/` using this format:

   ```
   # ADR-XXX: [Decision Title]

   ## Status
   PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED

   ## Context
   What is the issue? What forces are at play?
   (Include competing options, risks, and constraints that shaped the decision)

   ## Decision
   What is the change being proposed or made?
   (State the decision clearly. Include the reasoning — why this option over alternatives)

   ## Consequences
   What becomes easier? What becomes harder?
   What follow-up decisions are needed?
   (Use bullet points: Easier / Harder / Follow-up needed)
   ```

5. **Numbering** — Use zero-padded three-digit numbers (001, 002, ...) continuing from the last existing ADR. Use kebab-case filenames: `XXX-short-description.md`.

6. **Output a summary table** — After creating files, display a markdown table with columns: ADR number, decision title, and a one-line note on why it's non-obvious.

## Rules
- Default status to ACCEPTED unless the docs indicate it's still under discussion (use PROPOSED) or replaced (use SUPERSEDED).
- Keep Context and Decision sections to 1–2 paragraphs each. Consequences should have 3 bullets: Easier, Harder, Follow-up needed.
- Do not create ADRs for standard engineering practices (using HTTPS, storing secrets in a vault, etc.) — only decisions where a reasonable team could have gone the other way.
- If the user provides a specific decision to record, create a single ADR for it instead of scanning all docs.
