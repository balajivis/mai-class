# Lab 2 — Task Allocation

**Time:** 25 min (3 setup · 20 work split into 2 rounds · 2 reflect)
**Lessons it reinforces:** §12 Task Allocation. Surfaces §6 Negotiation and §12 Trust as felt gaps.
**Where this fits:** comes after [Lab 1 — The Blackboard](../lab1-blackboard/) — you've felt the chaos of unstructured shared state. Now we constrain it. Read [`../PROJECT.md`](../PROJECT.md) for the full pedagogical thesis.

---

## What you are about to do

Run **the same three Claude Code agents** through the same 8-task sprint backlog **twice**, changing one variable between rounds:

| Round | Topology | Time | What's new |
|---|---|---|---|
| 1 | First-claim | 10 min | Atomic CLI claims. Identical agents — fastest wins. |
| 2 | Contract-net | 10 min | Same CLI **plus** capability profiles per agent. |

You'll watch each round and notice what changes. The progression is the lesson. Lab 1 already covered the "raw chaos" round; we don't repeat it here.

---

## Prereqs

Same as [Lab 1](../lab1-blackboard/README.md#prereqs): tmux, claude, POSIX shell. Plus:

- **Node.js v18+** (for `task-cli`)
- **gstack installed** from [Lab 0](../lab0-workflow/) — Round 2 references gstack skills as capabilities (`/review`, `/qa`, `/investigate`, `/plan-eng-review`, `/document-release`, `/retro`). You don't need to *invoke* them in this lab; you need to *know what each does* so capability matching is real.

Verify:

```
tmux -V && claude --version && node --version
```

---

## Setup (3 min)

The launcher takes a round number:

```
./lab2-up.sh 1   # first-claim
./lab2-up.sh 2   # contract-net
```

Each launch:

1. Archives the previous run to `runs/YYYYMMDD-HHMMSSZ-*` (instructor data preserved).
2. Resets `tasks.json` from `tasks.template.json` and clears `outputs/`.
3. Opens tmux: `bb-watch.sh` mirror (window 0) + `bb-serve.sh` web mirror (window 1) + 3 `claude --model haiku` agents.
4. Auto-pastes the round-specific kickoff into each pane after an 8-second warmup, staggered 5s apart.
5. Browser tab opens to <http://localhost:8766/bb-mirror.html>.

Same tmux survival kit as Lab 1: `Ctrl-b` arrow to switch panes, `Ctrl-b 0`/`1` to switch windows, `Ctrl-b z` zoom, `Ctrl-b d` detach. Tear down: `./lab2-down.sh`.

---

## Round-by-round notes

### Round 1 — First-claim (10 min)

Agents use `./task-cli/task` to claim atomically. The CLI uses POSIX `O_EXCL` lock files so concurrent claims always produce one winner and clear losers. Capabilities exist in `tasks.json` but agents are told to ignore them.

**Watch for:** which agent finishes the most? Did they grab easy tasks first? Did some hard tasks get orphaned because agents didn't want them?

### Round 2 — Contract-net (10 min)

Same CLI, **but each agent now has a capability profile** baked into the kickoff message:

| Agent | Capabilities |
|---|---|
| agent-1 | `/plan-eng-review` + `/review` |
| agent-2 | `/qa` + `/investigate` |
| agent-3 | `/document-release` + `/retro` |

Each task in `tasks.json` has a `needs: [...]` list. Agents are asked to **only claim tasks whose needs match their capabilities**. The CLI does *not* enforce this — discipline is the point. Cheating is possible, and produces visible bad output (e.g. agent-3 claims a `/review` task and produces a vague non-review).

**Watch for:** orphaned tasks (no agent has the capability), capability cheating, and how Round 2 feels different even when the work is the same.

---

## After (2 min)

Look at three things:

1. **Round 1 vs 2 — finish counts.** Was the work distributed differently?
2. **Output quality.** Open `outputs/T-01-review.yaml` from each round. Does Round 2's review look more like a real `/review` output than Round 1's?
3. **Orphans.** Were any tasks left undone in Round 2? Why?

Then write your one-line answer to: **"What single change would you make to fix what Round 2 didn't?"** Hold it. That's Lab 3's design brief — *team design / topology*.

---

## Files

- `tasks.template.json` — the canonical 8-task backlog (both rounds reset from this)
- `task-cli/task` — atomic Node CLI: `list`, `claim`, `done`, `add`, `status`
- `sandbox/auth.ts`, `sandbox/api.ts` — small files with deliberate bugs for the review/QA/investigate tasks
- `outputs/` — agent-produced artifacts (cleared on each run)
- `runs/` — archives of prior runs
- `bb-watch.sh` — terminal task mirror
- `bb-mirror.html` + `bb-serve.sh` — editorial web mirror for projection

---

## Then proceed to Lab 3.
