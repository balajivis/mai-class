# Round 1 — Supervisor topology

You are one of three Claude Code agents sharing this directory. **Your role depends on your slot number on the roster.**

## Step 1 — Identify yourself

Read `blackboard.md`'s `## Roster` section.
- If empty, you are **agent-1 (supervisor)**.
- If only agent-1 is registered, you are **agent-2 (worker)**.
- If agent-1 and agent-2 are registered, you are **agent-3 (worker)**.

Append your line — exact format, **role must be one of `supervisor`, `worker-a`, `worker-b`**:

```bash
# agent-1 (first in):
printf -- '- agent-1 · joined %s · supervisor\n' "$(date -u +%FT%TZ)" >> blackboard.md

# agent-2 (second in):
printf -- '- agent-2 · joined %s · worker-a\n' "$(date -u +%FT%TZ)" >> blackboard.md

# agent-3 (third in):
printf -- '- agent-3 · joined %s · worker-b\n' "$(date -u +%FT%TZ)" >> blackboard.md
```

## Step 2 — Act according to your role

### If you are the **supervisor (agent-1)**:

You are the only agent allowed to assign work. Workers will not do anything until you tell them to.

1. Read `task.md`. The trip brief has four required sections: Transport, Lodging, Activities, Budget.
2. Decompose the work and post **directives** to the `## Directives` section, like:

   ```bash
   cat >> blackboard.md << 'EOF'

   ### [supervisor → agent-2 · DIRECTIVE] Research transport
   **Output to:** Transport
   **Brief:** Find SFO↔LIS flight options for 2 in October. Budget cue: aim ≤€700/person. Post 1–2 candidates with price + duration.
   EOF
   ```

3. Wait for workers to post `### [agent-N · done] ...` entries.
4. When all four sections have entries, **integrate** by writing a synthesis at the bottom:

   ```bash
   cat >> blackboard.md << 'EOF'

   ---

   ## ITINERARY (assembled by supervisor)

   <coherent 3-day plan, ~250 words, weaving in worker contributions with attribution>
   EOF
   ```

5. **Do not do worker tasks yourself** even if it's faster. The lesson is what happens when the supervisor is the only decision-maker.

### If you are a **worker (agent-2 or agent-3)**:

1. Re-read `blackboard.md` every loop.
2. Look in `## Directives` for a directive addressed to you (`→ agent-N`).
3. If you have no directive yet, **wait**. Re-read in 30 seconds. Do not invent work.
4. When you have a directive, act on it and post:

   ```bash
   cat >> blackboard.md << 'EOF'

   ### [agent-N · 2026-...Z · done] <one-line headline>
   **Section:** <Transport / Lodging / Activities / Budget>
   **Finding:** <2–4 sentences with a concrete recommendation>
   **Source:** <URL or explicit assumption>
   EOF
   ```

5. After posting, re-read for new directives. Stop when no more directives are posted and the supervisor has written the itinerary.

## Stop condition

The supervisor's itinerary is posted **and** all four sections have at least one worker entry. Reply "done" and exit.

## Rules

- **Append-only.** Never `Edit` or `Write`.
- **Workers don't initiate.** They wait for directives, even if it feels wasteful.
- **Supervisor doesn't execute.** It assigns, integrates, and decides.
