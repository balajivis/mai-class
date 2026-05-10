# workshop-kit

> **Modern AI Pro · Multiagents-v2 hands-on**
> Tools for the live blackboard-classroom workshop. Bundles Agent Team
> definitions, hooks, MCP server, monitor SSE, statusline, and slash skills
> into one Claude Code plugin.

## What this is

A Claude Code **plugin**. After installing it, your `claude` CLI gains:

- **6 Agent Team definitions** — `frontend`, `backend`, `tests`, `db`, `docs`, `devops` (use 2–3 per session in separate terminals)
- **8 slash skills** — `/wk:post-task`, `/wk:claim`, `/wk:bid`, `/wk:complete`, `/wk:lessons`, `/wk:status`, `/wk:escalate`, `/wk:help`
- **5 MCP tools** — `bb_read`, `bb_write`, `bb_claim`, `bb_bid`, `bb_recent_lessons`
- **Auto-telemetry** — every tool use posts to your team's blackboard via a `PostToolUse` hook
- **Live notifications** — a Monitor streams capability-matched task offers as native CC notifications
- **Statusline** — every session shows `🤖 your-agent · team1 · tasks 2 · BB🟢`

## Install

Two commands, **inside your `claude` shell** (slash commands, not bash):

```text
/plugin marketplace add Kapi-IDE/workshop-kit
/plugin install workshop-kit@mai-workshop
```

The first registers this repo as a Claude Code marketplace; the second installs the plugin from it. Quit and relaunch `claude` after install so the agents, hooks, monitors, statusline, MCP, and skills all activate.

### Alternative · zero-install (one session)

```bash
git clone https://github.com/Kapi-IDE/workshop-kit.git
cd /path/to/your/team-project
claude --plugin-dir /path/to/workshop-kit
```

`--plugin-dir` loads the plugin for that one session only — nothing is registered globally. Useful for quick tests.

## Configure

Before launching CC, export the four workshop env vars. Your instructor hands
you the token on the day.

```bash
export WK_API=https://bb.modernaipro.com
export WK_TEAM=team3                          # your team id
export WK_TOKEN=team3-XXXXXXXXXXXX            # team token
export WK_AGENT=alice-frontend                # whatever name you pick — show
                                              # the role suffix (frontend / backend /
                                              # tests / db / docs / devops) so the
                                              # statusline colour-codes you correctly
```

Put these in `.envrc` or your shell rc so each new terminal inherits them.

## Run your team

Open 2–3 terminals. In each one:

```bash
cd ~/projects/team3-tiny-crm-cli       # your team's project dir (instructor seeds)
claude --agent frontend                # this terminal becomes the frontend agent
```

In another:

```bash
claude --agent tests                   # tests agent
```

In another (optional):

```bash
claude --agent docs                    # docs agent
```

Every session has its own colour, its own restricted tool belt, its own worktree.

## What the agent does

Each Agent Team `.md` includes **blackboard discipline** in its system prompt:

1. Before bidding/claiming a task: `bb_recent_lessons` for the task's tags
2. When starting work: post an `inform` performative with the files you'll touch
3. When done: call `/wk:complete` with a one-line result + (if failed) a one-line `lessons`
4. When blocked: post a `block` performative

You don't have to micromanage the agent — the system prompt nudges it. Your job
is to **review what it's doing on the dashboard** and intervene when needed.

## The dashboards

### Your team
```
https://bb.modernaipro.com/projects/team3?token=team3-XXXXXXXXXXXX
```
- Live task board (open / claimed / done / failed)
- Live activity feed with performative tags
- Agent grid showing who's working on what

### Master view (projector)
```
https://bb.modernaipro.com/master
```
- 5-team leaderboard
- L1 (per-agent), L2 (combined output), L3 (coordination) tiers
- Coordination-tax counter (events/min cohort total)

### Replay
```
https://bb.modernaipro.com/projects/team3/replay?token=team3-XXXXXXXXXXXX
```
- Scrub through your team's run after the fact

## Allocation modes

Your team can switch its allocation mode mid-exercise (instructor controls the toggle):

| Mode | What | When |
|---|---|---|
| **A** Free-for-all | First-claim wins | Default · feel the cherry-picking failure |
| **B** Capability-matched | Server auto-routes by tag | When A breaks, switch here |
| **C** Contract-net | Bid → server awards highest score | Mature teams |
| **D** Reputation-weighted | C + reputation prior | Mode C with a memory |

## When things break

- **Statusline shows `BB🔴`** → your `WK_TOKEN` is wrong, or the server is down. Check `curl $WK_API/healthz`.
- **Monitor not firing** → confirm your agent's capabilities match a posted task's `requires`. Use `bb_read` to check.
- **Hook spamming nothing** → check `WK_TOKEN` again. The hook is fire-and-forget; no errors will surface in CC.
- **Workspace got clobbered by another agent** → use the rollback button on your team dashboard. Snapshots are taken every 30s.

## What this is teaching

This single exercise hits **7 of the 13 lessons** in multiagents-v2 and **9 of the 16 pillars** of the framework. By the end:

- You've felt the **coordination crisis** (lesson §5) when 7 humans + 14 agents flood one board
- You've watched a **stigmergic learning** trail (pillar §9) save the next bidder from a known failure
- You've seen the **3-tier evaluation** (pillar §15) reveal an L3 collapse while L1/L2 looked healthy
- You've shifted **allocation modes** (pillar §2) and felt cherry-picking break in Mode A and resolve in Mode C

Open the dashboards. Watch the topology graph form. The lesson is in the data.
