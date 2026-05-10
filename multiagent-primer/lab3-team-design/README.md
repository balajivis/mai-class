# Lab 3 — Team Design

**Time:** 35 min (3 rounds · 1 min reset between · 5 min compare-and-debrief)
**Lessons it reinforces:** §9 Team Design (Pillar 3), with §6 Negotiation and §15 Evaluation as felt gaps.
**Where this fits:** third lab of the [multi-agent primer](../). Block B of the [mai-class day](../../README.md). Builds on Labs 1 and 2.

---

## What you are about to do

Three rounds. **Same task. Same three Claude agents. Three different topologies.**

| Round | Topology | Roles | Apparatus |
|---|---|---|---|
| 1 | **Supervisor** | agent-1 = boss · agent-2/3 = workers (only act on directives) | `round1-supervisor/CLAUDE.md` |
| 2 | **Pipeline** | agent-1 → agent-2 → agent-3 (each transforms upstream) | `round2-pipeline/CLAUDE.md` |
| 3 | **Swarm** | three peers, no roles (= Lab 1) | `round3-swarm/CLAUDE.md` |

The brief is `task.md` — *plan a 3-day Lisbon trip for 2, ≤ €1500*. Identical across rounds. Only the topology changes.

You will see the same partitions (Transport · Lodging · Activities · Budget) fill differently each time. That contrast is the whole lesson.

---

## Prereqs

Same as Lab 1: POSIX shell, `claude`, `tmux`, `python3`. If Lab 1 ran on your machine, Lab 3 will too. See [Lab 1's README](../lab1-blackboard/README.md#prereqs) for the macOS / Linux / Windows-via-WSL paths.

---

## Setup (1 min per round)

Each round is one command:

```
./lab3-up.sh 1     # supervisor
./lab3-up.sh 2     # pipeline
./lab3-up.sh 3     # swarm
```

Between rounds:

```
./lab3-down.sh && ./lab3-up.sh 2
```

Each up-call:
1. Archives the previous round's `blackboard.md` to `runs/`
2. Resets the board from template
3. Symlinks the right `CLAUDE.md` (so claude picks up the round-specific protocol)
4. Spawns the same tmux layout as Lab 1 (3 agents · terminal mirror · web mirror at <http://localhost:8765/bb-mirror.html>)
5. Auto-pastes the kickoff prompt to each pane after 8s, staggered 5s apart

**tmux survival kit** — same as Lab 1: `Ctrl-b` then arrow / `z` (zoom) / `d` (detach).

---

## During each round (10 min)

Watch the live mirror. Note (on paper) for each round:

- **Who's writing?** Is the load balanced or skewed?
- **What's empty?** Are any of the four partitions starving?
- **What's the bottleneck?** Where does work pile up?
- **What does the final output look like?** Coherent · contradictory · nonexistent?

**Do not intervene.** Let each topology play out — the failure modes are the data.

---

## After all three rounds (5 min compare)

Open `runs/` and put the three archived boards side-by-side. For each round, answer:

1. **Was the topology right for this task?** (Hint: pre-reveal answer below.)
2. **Where did the topology hurt the most?**
3. **Which round produced the best itinerary?** Why?
4. **Which round produced the most agent activity?** Is "more activity" the same as "better output"?

The lesson: there is no universally right topology. The cost of a *mismatch* is the entire point.

---

## What good looks like

| Round | Healthy outcome | Common failure |
|---|---|---|
| 1 supervisor | Workers wait for directives, supervisor integrates a clean itinerary | Supervisor is the bottleneck — workers idle 50% of the time |
| 2 pipeline | Each stage produces clean output, agent-3 ships final itinerary | agent-1's bad transport pick locks in agent-2/3; serial death if agent-1 hangs |
| 3 swarm | Same chaos as Lab 1 but on a richer task — duplication, drift, no convergence | Three sub-itineraries that don't agree |

If round 1 finishes way faster than round 2 — that's a *valid* finding, not a bug. Pipelines pay a tax.

---

## Files

```
lab3-team-design/
├── README.md                  ← this file
├── task.md                    ← shared brief (same across rounds)
├── blackboard.template.md     ← empty board (reset target)
├── blackboard.md              ← active board (auto-managed)
├── CLAUDE.md                  ← symlink, points at the active round's protocol
├── round1-supervisor/CLAUDE.md
├── round2-pipeline/CLAUDE.md
├── round3-swarm/CLAUDE.md
├── lab3-up.sh / lab3-down.sh
├── bb-watch.sh / bb-mirror.html / bb-serve.sh
├── .claude/settings.json      ← pre-granted Bash + WebFetch + WebSearch
└── runs/                      ← auto-archive of each round's final board
```

---

## Then proceed to the architecture-workshop big exercise.
