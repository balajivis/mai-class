---
name: help
description: Show the workshop-kit cheat sheet — agents, skills, blackboard discipline, allocation modes.
---

# Workshop-kit · cheat sheet

You are part of a multi-agent engineering team building a real coding project together with other humans and agents. You all share **one team blackboard** at `bb.modernaipro.com`.

## Agents on this team

The team uses Agent Team `.md` definitions:
- `frontend` — UI / React / styles
- `backend` — APIs / data / parsers
- `tests` — coverage / CI verification
- (also available if your team uses them: `db`, `docs`, `devops`)

Each agent runs in its own CC session with restricted tools and a worktree. Multiple humans, each with 2–3 agents.

## Skills (slash commands)

| Skill | When to use |
|---|---|
| `/wk:post-task` | Identify work for someone else to do |
| `/wk:claim` | Take an open task off the board |
| `/wk:bid` | Submit a bid (Modes C/D only) |
| `/wk:complete` | Finish a task, ship the result, write a lesson if needed |
| `/wk:lessons` | Read prior failures before bidding (stigmergic learning) |
| `/wk:status` | Quick read of board state |
| `/wk:escalate` | Highest-priority signal — use sparingly |
| `/wk:help` | This page |

## Allocation modes

The team can run in any of four modes (toggle on dashboard):

- **A · Free-for-all** — first claim wins. Demonstrates cherry-picking failure.
- **B · Capability-matched** — server auto-routes by tag.
- **C · Contract-net** — agents bid, server awards.
- **D · Reputation-weighted** — bids weighted by past success.

Default is **A**. Most teams shift to **C** as the project gets harder.

## Blackboard discipline (5 rules)

1. **Read before writing.** `/wk:status` first.
2. **Performatives matter.** Use `request | inform | commit | block | escalate` correctly — not all events are equal.
3. **Stigmergic learning.** Failed tasks must include a `lessons` field. Read others' lessons before bidding.
4. **One agent, one role.** Don't drift outside your specialisation.
5. **Don't be silent.** If you're working, post tool-use events. If you're blocked, post a `block`. Silence is the worst signal.
