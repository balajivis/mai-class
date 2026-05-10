# Instructor Runbook · Multiagents-v2 Hands-on

This is your minute-by-minute playbook for running the blackboard-classroom workshop.

## Equipment

- Projector showing `https://bb.modernaipro.com/master`
- Laptop with the **instructor token** in clipboard (do **not** show on screen — it can override every team)
- Backup Anthropic API keys for ~2 students who'll show up unconfigured

## 7 days before

```bash
ssh kapi-prod 'cd ~/apps/blackboard-classroom && npm run tokens'
```

This prints 5 fresh team tokens. Save them; email each enrolled student their team's token + the `WK_*` env block 24h before class.

## 24 hours before

- One-team friendly dry-run with 3 volunteers + 6 agents on a real (but throwaway) project
- Confirm rollback works
- Confirm `https://bb.modernaipro.com/healthz` returns 200
- Confirm topology graphs render in the master view (open with `?token=<instructor>` for cross-team read)

## On the day · 90-minute exercise

### T-15 → T-0 · Setup (15 min)

- Project assignments randomised on whiteboard (which team gets which of: tiny-crm-cli, pokemon-combat-engine, markdown-static-site-gen, tiny-task-queue, refactor-spaghetti-500loc)
- Each team picks a corner / table
- Walk students through:
  1. `claude plugins install Kapi-IDE/workshop-kit`
  2. `export WK_*` (project for them on slide)
  3. `claude --agent frontend` (statusline should show 🟢)
- Open dashboard projector. Brief everyone: *"All you do is post tasks, claim tasks, and watch what happens. No PM. No coordinator. The blackboard is the medium."*

### T+0 → T+15 · Round 1 — Mode A (Free-for-all) (15 min)

- All teams default to Mode A
- Goal: ship anything
- Watch the master view. **Predict aloud**: cherry-picking, conflicts, redundancy
- After ~12 min, pause and discuss — what did the dashboard show?

### T+15 → T+45 · Round 2 — Mode B + C (30 min)

- Each team's PM (whoever the team picks) toggles their mode to **B** for 10 min, then **C** for 20 min
- Watch L3 conflicts drop, L3 channels rise
- **Stigmergic moment**: at minute ~30 surface one team's `lessons` log on the projector. Point out a downstream bidder reading it before bidding.

### T+45 → T+75 · Round 3 — Mode D + chaos (30 min)

- All teams to Mode D
- Inject "chaos events" via instructor controls:
  - `POST /api/instructor/p/team3/freeze` → freeze one team to demonstrate dependency
  - `POST /api/instructor/p/team1/broadcast` text="security audit incoming" → simulated escalation
- Coordination-tax counter explodes
- This is where lessons §5 (coordination crisis) lands the hardest

### T+75 → T+90 · Wrap (15 min)

- Open `/projects/<winner>/replay` on projector — scrub through the winning team's coordination
- Discuss the master scoreboard: did the team with fewest conflicts win?
- Show one team's L1/L2/L3 — discuss the case where L1 + L2 looked healthy but L3 hid a failure (or vice versa)
- Capture the lessons that emerged for the alumni channel

## During the exercise — instructor controls

```bash
# Everything below uses the instructor token (set as env var BB_INSTRUCTOR_TOKEN on the server,
# or pass it as `Authorization: Bearer ...` here)
INST=$YOUR_INSTRUCTOR_TOKEN

# Force a team's allocation mode
curl -X PATCH https://bb.modernaipro.com/api/instructor/p/team3/mode \
  -H "Authorization: Bearer $INST" -H 'Content-Type: application/json' \
  -d '{"mode":"C"}'

# Freeze a team (no new tasks accept claims while frozen)
curl -X PATCH https://bb.modernaipro.com/api/instructor/p/team3/freeze \
  -H "Authorization: Bearer $INST" -H 'Content-Type: application/json' \
  -d '{"frozen":true}'

# Broadcast a high-priority message
curl -X POST https://bb.modernaipro.com/api/instructor/p/team3/broadcast \
  -H "Authorization: Bearer $INST" -H 'Content-Type: application/json' \
  -d '{"text":"Production is down. CI red. Triage now."}'

# Kill a runaway agent
curl -X POST https://bb.modernaipro.com/api/instructor/p/team3/kill-agent \
  -H "Authorization: Bearer $INST" -H 'Content-Type: application/json' \
  -d '{"agent":"alice-frontend"}'
```

## Failure modes & quick fixes

| Symptom | Fix |
|---|---|
| Student's statusline shows `BB🔴` | Wrong token. Check the env block; reissue if needed. |
| One team's task board is empty | Seed 5–10 starter tasks via `curl POST /api/p/teamN/tasks` from instructor token to kick-start. |
| Master view shows 0 ev/min everywhere | Server may be down; check `pm2 logs bb-modernaipro`. |
| Topology graph stays empty | Need agents to use `refs` field when posting events. Show one team how. |
| Two students on same team disagree publicly | Good — that's the coordination crisis. Don't intervene; let the data settle it. |

## What "success" looks like for the workshop

- ≥3 of 5 teams ship a working artefact (build passes)
- ≥1 team experiences a stigmergic-learning save (a `lessons` field they didn't write themselves prevented a redo)
- ≥1 team voluntarily shifts modes mid-exercise without you prompting
- Every student writes the phrase **"L3 silently failed"** or equivalent in the post-mortem
