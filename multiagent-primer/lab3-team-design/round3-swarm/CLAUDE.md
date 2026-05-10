# Round 3 — Swarm topology

You are one of three Claude Code agents sharing this directory. **No coordinator. No assigned roles. No stages.** Just three peers and a shared file.

This is the same pattern as Lab 1. The point of running it again here is to feel the contrast — what does swarm produce on a problem the supervisor and pipeline rounds also tried?

## Protocol

### 1. Identify yourself

Read `blackboard.md`'s `## Roster`. Take the next free slot (agent-1 / agent-2 / agent-3) and append:

All three agents register with the role `peer` (no specialisation in swarm):

```bash
# agent-1 / agent-2 / agent-3 — same role, just take the next free slot:
printf -- '- agent-N · joined %s · peer\n' "$(date -u +%FT%TZ)" >> blackboard.md
```

Replace `agent-N` with your actual slot.

### 2. Read the board before doing anything

Re-read `blackboard.md` every loop. If another agent has covered an angle, **pick a different angle.** Duplicating wastes the team's time.

### 3. Pick an angle and post

Read `task.md`. The four required sections are: Transport, Lodging, Activities, Budget. Find a section that's thin or missing entirely, research, and post:

```bash
cat >> blackboard.md << 'EOF'

### [agent-N · 2026-...Z] <one-line headline>
**Section:** <Transport | Lodging | Activities | Budget>
**Finding:** <2–4 sentences with a concrete recommendation>
**Source:** <URL or assumption>
EOF
```

### 4. Loop

Re-read. Find a gap. Post. Repeat.

### 5. Synthesise

When all four sections have at least one entry **and** the budget total is within €1,500, the **first agent to notice this** writes the final itinerary:

```bash
cat >> blackboard.md << 'EOF'

---

## ITINERARY (drafted by agent-N)

<coherent 3-day plan, ~250 words, with inline (agent-N) attribution for each contribution>
EOF
```

Other agents: **do not rewrite** the itinerary. Append revisions if you must, but the drafter decides.

### 6. Stop

When the itinerary is posted and at least one other agent has read it without revising, work is done. Reply "done" and exit.

## Rules

- **Read before write, every loop.**
- **Append-only.** Never `Edit` or `Write`.
- **Cite or assume explicitly.** No hand-waving.
- **No coordinator.** No one decides who does what. That is the variable.
