# HANDOFF · Blackboard Classroom + workshop-kit

> A thorough briefing for the next agent / engineer picking up this project.
> Read top to bottom before touching anything.

## What this project is

A live-classroom hands-on for the Modern AI Pro **multiagents-v2** course (13 lessons, 16-pillar framework). 50 students per cohort, ~35 coding live, partitioned into **5 teams of 7**. Each team gets a different real coding project. Every student spawns 2–3 Claude Code "agents" — `.claude/agents/<role>.md` Agent Team definitions — and the whole team coordinates through a shared per-team **blackboard** server with contract-net task allocation, stigmergic learning, and a 3-tier evaluation dashboard.

Designed to land **7 of 13 lessons** and **9 of 16 pillars** in one 90-minute exercise.

The build was **state-of-the-art** with respect to recent Claude Code features: it uses **Plugins, Agent Teams, HTTP-style PostToolUse hooks, Monitors with SSE streaming, Statuslines, and Skills**.

## Two pieces, one project

```
/Users/bv/Code/mai-class/
├── blackboard-classroom/      ← Node/Express/SQLite/SSE server. Deploys to bb.modernaipro.com.
└── workshop-kit/              ← Claude Code plugin. Distributed via `claude plugins install Kapi-IDE/workshop-kit`.
```

`blackboard-classroom` is the server; `workshop-kit` is what every student installs locally to participate.

## Status: 11 of 11 build slices complete and verified end-to-end

| # | Slice | Status |
|---|---|---|
| 1 | Server core + auth + DB | ✅ curl round-trip |
| 2 | Team dashboard + SSE | ✅ live frame within 1s |
| 3 | Plugin manifest + 3 agents + statusline | ✅ statusline 🟢 with live task count |
| 4 | PostToolUse hook + 8 skills | ✅ hook→blackboard event landed |
| 5 | MCP stdio server + monitor SSE wiring | ✅ handshake + capability-matched task offers |
| 6 | 4 allocation modes (A/B/C/D) | ✅ all 4 routed correctly |
| 7 | Pillars #5/#9/#15 (performatives + lessons + 3-tier eval) | ✅ stigmergic trace surfaces |
| 8 | Master dashboard + d3-force topology + replay | ✅ leaderboard + topology render |
| 9 | Autocommit + rollback (snapshot endpoint) | ✅ POST/GET round-trip |
| 10 | Deploy artefacts (PM2 + workflow + DEPLOY.md) | ✅ prod start command works |
| 11 | Handout + 60 seeded tasks + INSTRUCTOR-RUNBOOK | ✅ master scoreboard renders 5 teams |

## What's NOT done (deferred / open follow-ups)

| Item | Why deferred | Effort |
|---|---|---|
| **Pillar #6 Negotiation** (proper conflict-resolution flow when bids collide) | Time-boxed; current Mode C does highest-bid-wins; full §6 wants explicit negotiation rounds | ~1 hr |
| **Pillar #8 Cross-session memory** (`SessionStart` hook pulls last-known agent state from blackboard) | Plugin hook is registered but doesn't do the catch-up read yet | ~1 hr |
| **Plugin distribution to GitHub** | The plugin lives at `workshop-kit/`. To enable `claude plugins install Kapi-IDE/workshop-kit`, the dir needs to be its own git repo at github.com/Kapi-IDE/workshop-kit | ~30 min (git subtree split + push) |
| **Friendly dry-run** with 3 volunteers, 1 project, 30 min | Not yet executed | n/a |
| **Real prod deploy** (DNS + nginx + first PM2 start) | Per MAI rules, the user must trigger this; artefacts are ready | n/a |
| **Topology graph in *team* dashboard** (currently only in master) | Lower priority; team feed shows agent dynamics through activity feed alone | ~1 hr |

Do not re-do work that is already done. Verify the smoke tests below before adding anything.

## How to run locally (5 minutes)

```bash
cd /Users/bv/Code/mai-class/blackboard-classroom

# Already installed if you just relocated; otherwise:
npm install

# Generate fresh team tokens (idempotent — overwrites prior tokens). Save these.
npm run tokens

# Pre-seed 60 starter tasks across the 5 teams.
npm run seed

# Run the dev server. Port defaults to 3007 — set BB_BID_WINDOW_MS=2000 for fast Mode C/D smoke tests.
PORT=3007 BB_BID_WINDOW_MS=2000 npm run dev
```

Then in another terminal, smoke-test:

```bash
TOKEN=$(grep -oE 'team1-[A-Z0-9]+' /tmp/last-tokens-print 2>/dev/null || echo "team1-FROM-tokens-OUTPUT")
curl -s http://127.0.0.1:3007/healthz                                           # → {"ok":true,...}
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:3007/master"          # → 200
open  "http://127.0.0.1:3007/projects/team1?token=$TOKEN"                        # team dashboard
open  "http://127.0.0.1:3007/master?token=instructor-dev-token"                  # master view (master-eval is currently no-auth dev path)
```

## How to test the plugin against the local server

```bash
# In any directory you want to "be the team's project workspace":
cd /tmp/test-project && git init && touch README.md && git add -A && git commit -m init

# Tell CC where the plugin is + which team you are:
export WK_API=http://127.0.0.1:3007
export WK_TEAM=team1
export WK_TOKEN=team1-XXXXXXXXXXXX     # your real team1 token from `npm run tokens`
export WK_AGENT=alice-frontend
export CLAUDE_PLUGIN_ROOT=/Users/bv/Code/mai-class/workshop-kit  # for hook/monitor scripts that interpolate this

# Either: install the plugin (preferred path)
claude plugins install /Users/bv/Code/mai-class/workshop-kit

# Or: tell claude to use the plugin dir directly
claude --plugin-dir /Users/bv/Code/mai-class/workshop-kit --agent frontend
```

Watch the dashboard. Statusline should show `🤖 alice-frontend · team1 · tasks 0 · BB🟢` and tool-uses should appear in the activity feed within ~1s.

## File map

### Server (`blackboard-classroom/`, 27 files)

```
src/
├── server.ts                 Express bootstrap, route mounting, auction sweeper
├── db.ts                     better-sqlite3 + WAL + schema bootstrap
├── auth.ts                   per-team-token + instructor-token middleware
├── sse.ts                    SSE fan-out hub (channels: p:<proj>, a:<proj>:<agent>)
├── routes/
│   ├── events.ts             POST/GET /events  (hook landing pad + agent autoreg)
│   ├── tasks.ts              POST /tasks, PATCH /tasks/:id/{claim,complete}, POST /tasks/:id/bid
│   ├── state.ts              GET /state (snapshot)
│   ├── stream.ts             SSE: project + per-agent
│   ├── lessons.ts            GET /lessons (stigmergic learning, pillar #9)
│   ├── eval.ts               GET /eval (L1/L2/L3) + GET /eval/master (5-team scoreboard)
│   ├── snapshot.ts           POST/GET /snapshots (autocommit/rollback trail)
│   └── instructor.ts         PATCH /mode, /freeze, POST /broadcast, /kill-agent
├── allocation/
│   └── index.ts              4 modes: A free / B cap-matched / C contract-net / D reputation
└── eval/
    └── index.ts              L1 per-agent · L2 combined output · L3 coordination metrics

public/
├── projects.html             team dashboard (vanilla, d3 from CDN, fetch-streamed SSE)
├── master.html               5-team master view + topology graphs + leaderboard
├── replay.html               post-mortem scrubber
└── style.css                 zinc/amber theme (matches MAI brand)

scripts/
├── generate-tokens.ts        npm run tokens — issues 5 team tokens
└── seed-tasks.ts             npm run seed — 60 starter tasks across 5 projects

db/
└── schema.sql                projects, agents, tasks, bids, events, snapshots

DEPLOY.md                     one-time prod bootstrap (nginx vhost + cert + token)
INSTRUCTOR-RUNBOOK.md         workshop-day playbook + chaos-control commands
.github/workflows/deploy-bb.yml   CI deploy (rsync + pm2 reload)
```

### Plugin (`workshop-kit/`, 21 files)

```
.claude-plugin/plugin.json           manifest
agents/{frontend,backend,tests}.md   Agent Team definitions (system prompt + tool restrictions)
hooks/hooks.json                     PostToolUse + SessionStart + Stop → bin/post-event.sh
monitors/monitors.json               watch SSE → CC notifications via bin/monitor-stream.sh
.mcp.json                            stdio config → mcp/server.mjs
mcp/server.mjs                       zero-dep MCP server with 5 tools
skills/<name>/SKILL.md               8 slash skills (post-task, claim, bid, complete, lessons, status, escalate, help)
bin/
├── statusline.sh                    `🤖 alice-frontend · team1 · tasks 2 · BB🟢`
├── post-event.sh                    PostToolUse hook target (curl POST to events endpoint)
├── monitor-stream.sh                long-lived SSE consumer that emits one notification per event
└── snapshot.sh                      30s autocommit daemon → POST /snapshot
README.md                            student-facing handout
```

## Architecture in 60 seconds

```
Student laptop                          bb.modernaipro.com (Node/Express/SQLite/SSE)
─────────────────                       ────────────────────────────────────────────
claude --agent frontend                 POST /api/p/:proj/events     ← hooks
  PostToolUse hook ───── HTTPS POST ──► POST /api/p/:proj/tasks
  Monitor SSE     ◄───── stream ─────── GET  /api/p/:proj/agents/:agent/stream
  MCP stdio ──── bb_*  ─── HTTPS ─────► /api/p/:proj/{state,events,tasks,...}
  Statusline (1s polls)                 GET  /api/eval/master  (master view)

                                        Allocation engine (sweepDueAuctions every 2s)
                                        ──────────────────────────────────────────────
                                        A · first-claim wins
                                        B · auto-route by capability overlap
                                        C · gather bids (BB_BID_WINDOW_MS), award by
                                            confidence × eta⁻¹ − cost
                                        D · same as C but score *= reputation^1.0
```

Key invariant: the **server never executes commands on student machines**. It collects events, surfaces task offers, and computes evaluation. All work happens in CC sessions; the blackboard is a coordination substrate, not an orchestrator.

## Known gotchas

1. **`requires` field shape**. In SQLite it's a JSON string; the routes decode it on read. Always go through `parseRequires()` in `src/allocation/index.ts:67` rather than `JSON.parse` directly — there was a bug where `tryAutoMatchModeB` got an already-decoded array. Already fixed; keep using the helper.
2. **Mode A is the default at seed time**. Toggle via the instructor endpoint or directly in `db/blackboard.db` if needed.
3. **`set -u` + `${VAR:-}` in shell scripts**. The plugin's bash scripts run with `set -u` for safety — always use `${VAR:-}` when reading optional env vars (otherwise an unset var aborts the hook and breaks the host CC).
4. **Master view's per-team topology fetch** uses `GET /api/p/:proj/state`, which requires a team token. The current `master.html` reads tokens from URL params (`?team1-token=...&team2-token=...`). If the user only gives a single instructor token, topology will be empty — fine, the leaderboard still works. Improvement opportunity: have the master endpoint expose a stripped topology directly so master-view doesn't need per-team tokens.
5. **better-sqlite3 + native build**. The package builds a native addon on `npm install`. On a fresh kapi-prod, ensure `python3` + `make` + `g++` are present. The first deploy will fail loudly if not.
6. **SSE through nginx**. The DEPLOY.md vhost includes `proxy_buffering off` + `proxy_read_timeout 24h` — both are required. If SSE silently disconnects in prod, that's the first thing to check.
7. **Hook is fire-and-forget**. `bin/post-event.sh` swallows curl errors so a flaky network never breaks CC. This means students won't see hook failures locally; check the dashboard to confirm telemetry is flowing.
8. **Plugin distribution**. The plugin currently lives at `/Users/bv/Code/mai-class/workshop-kit/`. To make `claude plugins install Kapi-IDE/workshop-kit` work, that dir needs to become its own git repo at `github.com/Kapi-IDE/workshop-kit`. Use `git subtree split --prefix=workshop-kit -b workshop-kit-only` from a git-init'd parent, then push that branch as the new repo's main.

## What to do next, in order

1. **Initialise as git repos**. Both `blackboard-classroom/` and `workshop-kit/` should each be their own git repo (independent deploy lifecycles). Run:
   ```bash
   cd /Users/bv/Code/mai-class/blackboard-classroom && git init && git add -A && git commit -m "Initial: blackboard-classroom v0.1.0"
   cd /Users/bv/Code/mai-class/workshop-kit         && git init && git add -A && git commit -m "Initial: workshop-kit plugin v0.1.0"
   ```
2. **Push** to:
   - `github.com/Kapi-IDE/blackboard-classroom` (private OK)
   - `github.com/Kapi-IDE/workshop-kit` (must be public for plugin install)
3. **Run a friendly dry-run** with 3 volunteers per `INSTRUCTOR-RUNBOOK.md` 24h before the first real workshop.
4. **Bootstrap kapi-prod**: nginx vhost + certbot + ecosystem entry + initial token, all per `DEPLOY.md`.
5. **First prod deploy**: GitHub Actions → "Deploy Blackboard Classroom" → confirm `deploy-bb` → target `production`.
6. **(Optional)** Implement deferred pillars #6 and #8 (~2 hr combined) before the second cohort.

## Pedagogical mapping (do not lose this)

This single 90-min exercise is designed to land:

**Lessons (7 of 13)**: §2 Agent Anatomy · §5 Coordination Crisis · §8 Shared State · §9 Team Design · §10 Architecture Workshop · §11 Frontier (norm formation) · §12 Task Allocation · §13 HITL (optional self-imposed)

**Pillars (9 of 16 hands-on; 11 if v2 deferred lands)**: #1 Shared state · #2 Task allocation (all 4 modes) · #3 Team design · #4 Result sharing · #5 Performatives · #9 Stigmergic learning · #10 HITL · #12 Trust & reputation · #15 Three-level eval. (#6, #8 deferred. #11/#14/#16 N/A or lecture-only.)

If a future change drops below this coverage, **flag it before merging**.

## Key references

- `INSTRUCTOR-RUNBOOK.md` — workshop-day playbook
- `DEPLOY.md` — one-time prod setup
- `workshop-kit/README.md` — student handout
- `/Users/bv/Code/active/modernaipro/class-platform/app/paths/multiagents-v2/_lessons/*.tsx` — original lesson source
- Original plan file: `/Users/bv/.claude/plans/i-agree-let-s-make-partitioned-llama.md`
- The conversation that designed this is the source of truth on intent. Re-read the design decisions in the plan file if you're unsure why something was chosen.

## Final note — what NOT to drift on

The user explicitly chose:
- **Self-organising teams (no PM tier)** — every team-member token is equal. *Do not add a PM role.*
- **Plugin distribution** (one-command install) — *do not regress to setup scripts.*
- **State-of-the-art CC features** (Plugins, Agent Teams, hooks, Monitors, Statusline) — *do not fall back to plain settings.json hooks.*
- **kapi-prod hosting via subdomain** — *do not move to a separate VPS or container platform without explicit ask.*
- **Students BYO Anthropic auth** — *do not start vending API keys without an explicit decision.*

Welcome aboard.
