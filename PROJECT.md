# Multi-Agent Primer Labs — Project Vision

> **For future Claude sessions started in this directory after it has been moved.**
> This file gives you the full context. Read it before doing any work in this folder.

---

## What this folder is

A sequence of **three small hands-on labs** that teach the *primitives* of multi-agent systems before students attempt anything ambitious. Each lab runs **on a single student's laptop** using **multiple Claude Code instances** as the agents. No servers, no frameworks, no networking infrastructure — just shared markdown files and 2–3 terminal tabs.

The labs are a **primer for a much larger 5-team coding exercise** (the "blackboard-classroom" project, separate folder, separate Claude session). Students will not survive the big exercise without this primer. The primer earns them the right to attempt it.

---

## Where this fits in the course

This is part of **Modern AI Pro's "Multi-Agent Systems v2" path**, lessons in `class-platform/app/paths/multiagents-v2/_lessons/`:

```
1.  what-is-an-agent
2.  agent-anatomy            (R/A/O loop)
3.  why-multi-agent
4.  agentic-rag
5.  coordination-crisis      ← Lab 1 lands this
6.  16-pillar-framework      ← see "The 16 Pillars" below
7.  model-inflection
8.  shared-state             ← Lab 1's PRIMARY target
9.  team-design              ← Lab 3's PRIMARY target
10. architecture-workshop    ← the BIG exercise (other folder)
11. architecture-frontier
12. task-allocation          ← Lab 2's PRIMARY target
13. hitl-design
```

The primer labs cover lessons **5, 8, 9, 12** in microcosm. The big exercise extends to **2, 9, 10, 12, 13**.

---

## Pedagogical thesis

> **Frameworks hide the primitives. The primitives are the lesson.**

Multi-agent education is overrun with framework demos (LangGraph, CrewAI, AutoGen). Students build a notebook demo, ship nothing real, and walk out thinking "multi-agent = framework." That's the failure mode this entire course exists to fix.

Our counter-bet: have students **feel** the primitives — staleness, races, duplication, bottlenecks, the coordination tax — using the simplest possible apparatus (markdown files + multiple Claude Code sessions). Once they've felt the pain in 25 minutes of free-for-all, the patterns make sense; the frameworks become *recognisable as packaging*.

### Note on frameworks (revised 2026-05-09)

The original directive was **no framework code in the labs.** That has been narrowed: it now applies specifically to **multi-agent coordination frameworks** (LangGraph, CrewAI, AutoGen) — anything that hides the primitives Labs 1-3 are designed to make students feel.

**Single-agent workflow toolkits are allowed**, and Lab 0 uses one (gstack). Reasoning: a single-agent workflow library is not a multi-agent coordination framework — it has no shared state, no task allocation, no topology. It packages role-prompts and a sprint rhythm for one agent. Showing students this *first* establishes the baseline ("one agent + good roles ships real work") that makes Lab 1's coordination crisis land. Without it, students who already use Cursor/Claude Code daily will dismiss Lab 1 as a contrived problem.

A LangGraph comparison remains a take-home bonus *after* the labs — that one is genuinely a coordination framework and would short-circuit the lesson.

---

## The labs

### Lab 0 — `lab0-workflow/` ✅ BUILT (bridge to gstack)
- **Time:** 45 min (10 setup · 30 work · 5 reflect)
- **Topology:** 1 agent, structured workflow
- **Apparatus:** [`gstack`](../gstack-practice/gstack/) — single-agent slash-command toolkit (Plan → Review → Build → Ship → Retro)
- **Task:** run one tiny feature/fix end-to-end through the gstack sprint loop on a small sandbox repo
- **Lesson it sets up:** §2 Agent Anatomy and the inversion that lands in Lab 1 — students feel the *single-agent ceiling* before they meet the *coordination problem*
- **Pain it teaches:** none directly — the absence of pain is the point. This lab makes Lab 1's pain legible.

### Lab 1 — `lab1-blackboard/` ✅ BUILT
- **Time:** 25 min (5 setup · 15 work · 5 reflect)
- **Topology:** 3 peer agents, no roles, free-for-all
- **Apparatus:** one shared `blackboard.md`; `bb-watch.sh` for live mirror
- **Task:** research Stanford's *Smallville* generative-agents paper, produce a 400-word brief
- **Lesson it lands:** §8 Shared State (and lays the groundwork for §5 Coordination Crisis to land naturally)
- **Pain it teaches:** duplication, staleness, synthesis bottleneck, race conditions on writes
- **Status:** complete and smoke-tested

### Lab 2 — `lab2-task-allocation/` ⏳ NOT YET BUILT
- **Time:** 30 min
- **Builds on:** Lab 1 (assumes student has felt the free-for-all pain)
- **New apparatus:** tiny `task-cli` (~60 LOC Node) so claims are atomic — file-edit races on a tasks list would mask the contract-net lesson
- **Topologies to compare:** free-for-all (broken), first-claim, contract-net (capability-based)
- **Lesson it lands:** §12 Task Allocation
- **Pain it teaches:** cherry-picking, capability mismatches, claim races
- **Scaffolding plan:** `CLAUDE.md` + `task-cli/` (with `task list`, `task claim`, `task done`, `task add`)

### Lab 3 — `lab3-team-design/` ⏳ NOT YET BUILT
- **Time:** 35 min
- **Builds on:** Labs 1 + 2 (assumes shared state and task allocation are now intuitive)
- **Three short rounds, one variable:** supervisor / pipeline / swarm — same task, watch what changes
- **Apparatus:** 3 variant `CLAUDE.md` files (one per topology), no new code
- **Lesson it lands:** §9 Team Design
- **Pain it teaches:** topology-task mismatch, supervisor as bottleneck, pipeline as serial death, swarm as drift

After Lab 3, a **bonus take-home** (`bonus-langgraph/`) shows the same Smallville task in ~60 lines of LangGraph. The student's reaction should be *"oh — the framework is just packaging the patterns we invented."* That's the perfect inversion.

---

## The 16 Pillars

This framework is the spine of the course. Every lab and every design choice in the big exercise should be traceable to one of these. Reproduced verbatim from `class-platform/app/paths/multiagents-v2/_lessons/sixteen-pillar-framework.tsx`.

| # | Pillar | One-line summary |
|---|---|---|
| 1 | **Shared state · the blackboard** | A single workspace every agent reads from and writes to. Without it, three agents form three private worldviews and confidently disagree. |
| 2 | **Task allocation · the contract net** | Capability-based assignment, not first-available. Security task → security specialist, not the fastest agent in the queue. |
| 3 | **Team design · the topology** | Sequential → pipeline. Independent → fan-out. Heterogeneous specialists → supervisor + workers. Mismatching topology to problem is the highest-cost mistake. |
| 4 | **Result sharing · the publish step** | Every agent's output is published to shared state with provenance. Without it, two agents independently solve the same problem two different ways. |
| 5 | **Communication · intent, not tokens** | Typed messages with performatives — *request*, *inform*, *commit* — so the receiver knows what to *do*, not just what to read. |
| 6 | **Negotiation · resolving conflicts** | When two agents want incompatible things, a protocol resolves it. Without one, both proceed on their own assumption and the system silently splits. |
| 7 | **BDI architecture · goal persistence** | Beliefs, desires, intentions. Without it, an agent told to "fix the login bug" starts refactoring the entire auth module because it noticed code-quality issues. |
| 8 | **Memory · across sessions** | A constraint discovered in session 1 must reach session 2. Otherwise every new agent instance makes the same mistake — fresh, confidently, at scale. |
| 9 | **Learning · don't repeat yesterday** | The same integration test fails fifty deploys in a row. Stigmergic learning turns that into a one-time mistake. |
| 10 | **Human-in-the-loop · graduated autonomy** | Three levels: HITL (each step), HOTL (exceptions), HOOTL (outcomes). Rubber-stamp HITL is worse than no oversight — it manufactures false confidence. |
| 11 | **Embodied agents · physics is not optional** | A robot plans an optimal path that ignores it cannot reverse on a ramp. The model is fine; the physics is not. |
| 12 | **Trust & reputation · graduated access** | A new third-party agent earns trust over many interactions. Battle-tested ≠ fresh. Beta-reputation tracking makes that explicit. |
| 13 | **Governance · norms with teeth** | Rules constraining access scope, escalation paths, irreversible actions. In healthcare/finance/public sector this is not optional. |
| 14 | **Simulation · predict before deploying** | A 5-agent system works perfectly in testing. In prod with 50 agents, cascading retries burn $2,000 in 12 min. Simulate the *n+10* case before shipping the *n* case. |
| 15 | **Evaluation · output vs coordination** | Three-level eval: each agent's diff, the combined output, the coordination behaviour. The first two pass while the third silently fails — that is the failure mode this course exists to fix. |
| 16 | **Frameworks · the right tool** | LangGraph for routing/shared state. CrewAI for delegation. AutoGen for multi-agent dialogue. ADK for managed deployment. Demo-driven development is how you end up rewriting six months in. |

### Maturity ladder (from the same lesson)

- **≤8 covered** → notebook demo. Coordination layer not yet built. (Day 2 of the course is the construction project.)
- **9–12 covered** → in production, with outages clustering around the missing pillars.
- **13–15 covered** → mature. Remaining gaps are usually the unglamorous ones (simulation, governance, learning) — also the ones that cost most when they fail.
- **All 16** → either lying to yourself, or built something teachable. If the latter, write it up.

### How the labs map to the 16 pillars

| Lab | Pillars covered (directly) | Pillars introduced (implicitly) |
|---|---|---|
| Lab 0 — Workflow rhythm | — (sets the baseline; covers no pillar) | 7 (BDI made tangible at the single-agent level), 16 (frameworks as packaging) |
| Lab 1 — Blackboard | 1, 4 | 5, 6 (felt as pain, not solved) |
| Lab 2 — Task allocation | 2 | 6, 12 (negotiation and trust become obvious gaps) |
| Lab 3 — Team design | 3 | 7, 15 (BDI drift, coordination eval) |
| Big exercise (other folder) | 1, 2, 3, 8, 10, 13, 15 | 9, 14 |

After all three labs + big exercise, students have **personally implemented** ~7 of 16 pillars and **felt the absence** of another ~6. That is enough fluency to read framework docs critically.

---

## Scaffolding policy (the user's directive)

- **Some labs get only `CLAUDE.md`** — pure prompt engineering, no code. The agent's behaviour is the lesson. → Labs 1 and 3.
- **Some labs get `CLAUDE.md` + small code helpers** — when raw markdown editing would race so badly it masks the lesson. → Lab 2 (atomic task claims need a CLI).
- **No frameworks anywhere in the primer.** LangGraph appears only as a take-home comparison after Lab 3.
- **No web UI.** The web UI lives in the big classroom-server exercise (separate folder). Here, the file *is* the UI; `bb-watch.sh` is sugar.

---

## Status snapshot (date this when updating)

| Component | State |
|---|---|
| `lab0-workflow/` | ✅ Built 2026-05-09 (bridge README pointing at `../gstack-practice/`) |
| `lab1-blackboard/` | ✅ Built and smoke-tested 2026-05-09 |
| `lab2-task-allocation/` | ⏳ Designed, not built. Needs `CLAUDE.md` + `task-cli/` (~60 LOC Node) |
| `lab3-team-design/` | ⏳ Designed, not built. Three `CLAUDE.md` variants for three topologies |
| `bonus-langgraph/` | ⏳ Designed, not built. Same Smallville task in ~60 LOC of LangGraph |
| `PROJECT.md` (this file) | ✅ |

---

## Workshop logistics this primer assumes

- **Class size:** ~50 students live, ~35 actively coding
- **Format:** in-person classroom, projected leaderboard during the big exercise
- **Tooling on every laptop:** Claude Code installed, an Anthropic Pro/Max subscription or API key, terminal with bash + awk + grep + sed (default on macOS/Linux/WSL)
- **Network:** outbound HTTPS to `api.anthropic.com` is sufficient for the primer labs. (The big exercise also needs outbound to the kapi-prod blackboard server.)
- **Total class block this primer occupies:** ~90 min (Lab 1: 25 · Lab 2: 30 · Lab 3: 35), then a 15-min debrief, then transition into the big exercise.

---

## What future Claude should NOT do

1. **Do not introduce a framework into the labs.** The whole pedagogical bet is "primitives over frameworks." If a future Claude sees Lab 2 missing and thinks "I'll just use CrewAI" — read this file again, then don't.
2. **Do not collapse the three labs into one.** The progression is the lesson. Lab 1 → "this is chaos, we need tasks" → Lab 2 → "this is biased, we need topology" → Lab 3.
3. **Do not add a web UI inside the primer.** That's the big exercise's job. The terminal + markdown + `bb-watch.sh` is the right surface area.
4. **Do not edit `lab1-blackboard/blackboard.md`** to add example findings. It must stay an empty template — students are supposed to populate it.
5. **Do not touch `class-platform/`** when working on the primer. Different concern, different deploy lifecycle.

---

## What future Claude SHOULD do, if asked to continue building

1. **Build Lab 2 next.** See the design block above. The atomic-claim CLI is the load-bearing piece — without it, claim races dominate the lesson.
2. **Then Lab 3.** Three `CLAUDE.md` variants (`coordinator/`, `pipeline/`, `swarm/`), each a small directory the student `cd`s into. Same `task.md` across all three.
3. **Then the LangGraph bonus.** ~60 LOC, runnable in Python, side-by-side comparison.
4. **Update the Status snapshot above** every time you build a lab.
5. **Re-test `bb-watch.sh`** if you change the blackboard template — the script's grep patterns are coupled to the template's section names.

---

## Anchor docs (paths assume no folder move)

- This file: `/Users/bv/Code/active/modernaipro/multiagent-primer/PROJECT.md`
- Big exercise (separate Claude session): `/Users/bv/Code/active/modernaipro/blackboard-classroom/`
- Course lesson source: `/Users/bv/Code/active/modernaipro/class-platform/app/paths/multiagents-v2/_lessons/`
- The 16 Pillars lesson source: `class-platform/app/paths/multiagents-v2/_lessons/sixteen-pillar-framework.tsx`
- Project root CLAUDE.md (covers Kapi portfolio context): `/Users/bv/Code/active/CLAUDE.md`

If the folder has been moved: the lesson sources may no longer be at those paths. The 16 pillars are reproduced in this file verbatim — work from this file, not the lesson source.
