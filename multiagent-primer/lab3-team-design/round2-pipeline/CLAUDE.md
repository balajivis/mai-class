# Round 2 — Pipeline topology

You are one of three Claude Code agents in a **pipeline**: agent-1 → agent-2 → agent-3. Each stage transforms the previous stage's output. **Downstream stages must wait for upstream.**

## Step 1 — Identify yourself by slot

Read `blackboard.md`'s `## Roster`. Take the next free slot and register with your stage:

| Slot | Stage | Owns section | Reads |
|---|---|---|---|
| agent-1 | Transport | Transport + Budget v0 | task.md only |
| agent-2 | Lodging | Lodging + Budget v1 | task.md + agent-1's Transport entry |
| agent-3 | Activities | Activities + final Itinerary | task.md + agent-1 + agent-2 |

**Roles must be one of `transport`, `lodging`, `activities`** (matching the stage you own):

```bash
# agent-1 (first in):
printf -- '- agent-1 · joined %s · transport\n' "$(date -u +%FT%TZ)" >> blackboard.md

# agent-2 (second in):
printf -- '- agent-2 · joined %s · lodging\n' "$(date -u +%FT%TZ)" >> blackboard.md

# agent-3 (third in):
printf -- '- agent-3 · joined %s · activities\n' "$(date -u +%FT%TZ)" >> blackboard.md
```

## Step 2 — Wait for your turn

- **agent-1**: start immediately. Research SFO↔LIS October flights for 2. Post your Transport entry **and** an initial Budget v0 (just the flight cost so far).
- **agent-2**: re-read the board every 30 seconds. Do nothing until you see `### [agent-1 · ... DONE]` (the explicit done marker, not just any entry). Then read agent-1's Transport choice, pick lodging that fits the remaining budget, post Lodging + updated Budget v1.
- **agent-3**: same pattern — wait for `### [agent-2 · ... DONE]`. Then plan day-by-day Activities consistent with the chosen lodging neighbourhood, post Activities + final Budget + the final Itinerary.

## Step 3 — Post in the canonical format

Each stage posts one or more entries in this format:

```bash
cat >> blackboard.md << 'EOF'

### [agent-N · 2026-...Z] <one-line headline>
**Section:** <Transport | Lodging | Activities | Budget>
**Finding:** <2–4 sentences>
**Source:** <URL or assumption>
EOF
```

When you finish your stage, post a **DONE marker** so the next stage knows to start:

```bash
cat >> blackboard.md << 'EOF'

### [agent-N · 2026-...Z · DONE] stage-N complete
**Hands off to:** agent-(N+1)
**Summary for next stage:** <one sentence — what's locked in?>
EOF
```

## Stop condition

agent-3 posts the final Itinerary block **and** a `### [agent-3 · DONE] pipeline complete` marker. All three agents reply "done" and exit.

## Rules

- **Pipeline order is sacred.** agent-2 cannot research lodging before seeing agent-1's transport choice — even if waiting feels wasteful. The lesson is what serial dependency costs.
- **Don't do another stage's job.** If agent-1 is slow, agent-2 waits. Don't help.
- **Only forward flow.** No revising upstream stages. If agent-1's flight pick is bad, agent-2 must work with it.
- **Append-only.** Never `Edit` or `Write`.
