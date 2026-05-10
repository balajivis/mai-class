# Lab 5 — The Build Sprint

**Time:** 75 min (5 setup · 60 work · 10 reflect)
**Lessons it reinforces:** §2 Agent Anatomy · §5 Coordination Crisis · §8 Shared State · §12 Task Allocation · §15 Three-tier Evaluation
**Pillars covered:** 1, 2, 3, 4, 5, 9, 15
**Where this fits:** comes after Labs 1–3 in the [multi-agent primer](../). The capstone of the workshop. Read [`../PROJECT.md`](../PROJECT.md) first.

---

## What you are about to do

Run **three Claude Code agents** with **distinct roles** (frontend, backend, tests) on a real coding sprint — building `tiny-crm-cli`, a small JSON-backed lead-management CLI. Each agent has a different system prompt and a restricted tool belt. They share:

- **`blackboard.md`** — typed performative messages (`[REQUEST]`, `[INFORM]`, `[COMMIT]`, `[BLOCK]`, `[ESCALATE]`, `[LESSON]`)
- **`tasks.json`** — managed by `task-cli`, atomic claims, capability tags
- **`project/`** — the actual code they're shipping

After 60 minutes you run **`./eval-self.sh`** — a debrief script that prints **L1 / L2 / L3 metrics** computed straight from the blackboard and tasks. That readout is the lesson §15 made flesh.

---

## How this lab differs from Labs 1–3

| | Lab 1 | Lab 2 | Lab 3 | **Lab 5** |
|---|---|---|---|---|
| Agent identity | identical peers | identical peers | identical peers | **role-specialists** |
| Shared state | markdown only | tasks.json | markdown only | **markdown + tasks.json** |
| Communication | append-only | claims via CLI | append-only | **typed performatives** |
| Failure recovery | none | none | none | **stigmergic lessons** |
| Output | research brief | sprint outputs | research with topology | **real working code** |
| Eval | qualitative | finish counts | finish counts | **L1/L2/L3 metrics** |

Labs 1–3 made you feel one primitive at a time. Lab 5 puts seven of them on the field at once.

---

## Prereqs

Same as Lab 2: `tmux`, `claude`, `node` ≥ 18, POSIX shell. Plus `jq` (for `eval-self.sh`).

```
tmux -V && claude --version && node --version && jq --version
```

If `jq` is missing: `brew install jq` (macOS) / `apt install jq` (Linux).

---

## Setup (5 min)

```
cd /path/to/multiagent-primer/lab5-build-sprint
./lab5-up.sh
```

This:

1. Archives any previous run (`runs/<ts>-blackboard.md` + `runs/<ts>-tasks.json`)
2. Resets `blackboard.md` from `blackboard.template.md` and `tasks.json` from `tasks.template.json`
3. Resets `project/` to its starter state (just `package.json` + `src/cli.ts` stub)
4. Opens tmux with 4 panes:
   - top-left: live mirror (`bb-watch.sh`)
   - other three: `claude --agent frontend` / `--agent backend` / `--agent tests`
5. After 8s warm-up, auto-pastes the kickoff into each agent

Each agent's system prompt comes from `.claude/agents/<role>.md` — they already know their role, the blackboard protocol, and the lessons-on-failure discipline.

---

## Work (60 min)

The agents will:

1. **Read `tasks.json` (`task-cli/task list --open`)** to see open tasks, their `requires` tags, and any prior `lessons`.
2. **Claim only tasks matching their role's capabilities** — capability discipline like Lab 2 Round 3 (the CLI does *not* enforce; cheating is visible in the output).
3. **Post performative-prefixed messages to `blackboard.md`** — `[REQUEST]` to ask another agent, `[INFORM]` when starting work on a file, `[COMMIT]` when proposing an interface, `[BLOCK]` when stuck, `[ESCALATE]` for urgent.
4. **On failure**, post `[LESSON]` with a one-line gotcha. Future bidders read `[LESSON]` entries before claiming the same task type.
5. **Loop** until tasks are exhausted or 60 min elapses.

Watch the live mirror. You'll see:
- The performative mix shift over time (early: lots of `[REQUEST]`, later: lots of `[COMMIT]` and `[INFORM]`)
- Stigmergic learning when a task fails and the next bidder cites the lesson
- Idle detection when an agent stops posting

---

## Reflect (10 min)

```
./eval-self.sh
```

Prints three tiers, computed from `blackboard.md` and `tasks.json`:

```
=== L1 · Per-agent ===
  alice-frontend  done=3 failed=1 events=42 perf:request=8 inform=12 block=1 commit=4
  bob-backend     done=5 failed=0 events=51 perf:request=6 inform=18 block=0 commit=7
  carol-tests     done=2 failed=2 events=28 perf:request=4 inform=7 block=2 commit=2

=== L2 · Combined output ===
  total tasks: 12  done: 10  failed: 3  open: 2
  completion rate: 77%
  build markers: ✓  tests: 14/22

=== L3 · Coordination ===
  events/min: 5.2 (over 23 min)
  conflicts: 2 (orphaned claims)
  idle agents: 1 (no events in last 90s)
  redundancy: 0 (duplicate task titles)
  channels: 7 (cross-agent refs)
  performative mix: 18 request · 37 inform · 13 commit · 3 block · 1 escalate

=== Verdict ===
  L1: healthy distribution (no agent dominates >50%)
  L2: ✓ 77% completion is above target
  L3: ⚠ 1 agent went idle — silent-failure pattern from §15
```

Compare with your neighbour's run. **Same project, same starter tasks — different coordination patterns.** That's lesson §15: L1 and L2 can both look healthy while L3 silently fails.

Then write your one-line answer: *"What single change would you make to your team's coordination if you ran this again?"* Hold it. That's the design brief for the next workshop where you build this **with a centralised coordination server** (the production version of what you just simulated with markdown).

---

## Files

- `CLAUDE.md` — base agent protocol (performatives, lessons, claim discipline)
- `task.md` — the build brief (tiny-crm-cli)
- `blackboard.template.md` — starter blackboard with sections
- `tasks.template.json` — 12 starter tasks with `requires` tags
- `project/` — starter code (package.json + src/cli.ts stub)
- `task-cli/task` — atomic claim CLI (lifted from Lab 2)
- `bb-watch.sh` — live mirror of blackboard.md
- `eval-self.sh` — debrief metrics script (L1 / L2 / L3)
- `.claude/agents/{frontend,backend,tests}.md` — role-specific system prompts
- `lab5-up.sh` / `lab5-down.sh` — bootstrap / archive
- `runs/` — archived runs

---

## What you should NOT do

- Don't bypass the task-cli. Markdown-only claims race; the CLI is the contract.
- Don't skip the `[LESSON]` entry on failure. The next bidder relies on it. (And `eval-self.sh` counts them — silent failures show up as L1 anomalies.)
- Don't let one agent claim all the tasks. Role discipline is half the lesson.
