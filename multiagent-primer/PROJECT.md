# Multi-Agent Primer — Design Doc

> **For future Claude sessions and human contributors.**
> This file holds the *why* — pedagogical thesis, the 16-pillar mapping, anti-patterns to avoid, and what to build next. For the *what* (folder list, time budget, prereqs, where students start), read [`README.md`](./README.md) first.

---

## Pedagogical thesis

> **Frameworks hide the primitives. The primitives are the lesson.**

Multi-agent education is overrun with framework demos (LangGraph, CrewAI, AutoGen). Students build a notebook demo, ship nothing real, and walk out thinking "multi-agent = framework." That's the failure mode this entire course exists to fix.

Our counter-bet: have students **feel** the primitives — staleness, races, duplication, bottlenecks, the coordination tax — using the simplest possible apparatus (markdown files + multiple Claude Code sessions). Once they've felt the pain in 25 minutes of free-for-all, the patterns make sense; the frameworks become *recognisable as packaging*.

### Note on frameworks (revised 2026-05-09)

The original directive was **no framework code in the labs.** That has been narrowed: it now applies specifically to **multi-agent coordination frameworks** (LangGraph, CrewAI, AutoGen) — anything that hides the primitives Labs 1–3 are designed to make students feel.

**Single-agent workflow toolkits are allowed**, and Lab 0 uses one (gstack). Reasoning: a single-agent workflow library is not a multi-agent coordination framework — it has no shared state, no task allocation, no topology. It packages role-prompts and a sprint rhythm for one agent. Showing students this *first* establishes the baseline ("one agent + good roles ships real work") that makes Lab 1's coordination crisis land. Without it, students who already use Cursor/Claude Code daily will dismiss Lab 1 as a contrived problem.

A LangGraph comparison remains a take-home bonus *after* the labs — that one is genuinely a coordination framework and would short-circuit the lesson.

---

## Where this fits in the course

This is part of **Modern AI Pro's "Multi-Agent Systems v2" path** (`class-platform/app/paths/multiagents-v2/_lessons/`):

```
1.  what-is-an-agent
2.  agent-anatomy            (R/A/O loop)        ← Lab 0 sets up
3.  why-multi-agent
4.  agentic-rag
5.  coordination-crisis      ← Lab 1 lands this
6.  16-pillar-framework      ← see below
7.  model-inflection
8.  shared-state             ← Lab 1's PRIMARY target
9.  team-design              ← Lab 3's PRIMARY target
10. architecture-workshop    ← the BIG exercise (separate folder)
11. architecture-frontier
12. task-allocation          ← Lab 2's PRIMARY target
13. hitl-design              ← Lab 4's PRIMARY target (optional)
```

The primer covers lessons **2, 5, 8, 9, 10, 12** in microcosm. The big exercise extends to **2, 9, 10, 12, 13**.

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

### Maturity ladder

- **≤8 covered** → notebook demo. Coordination layer not yet built.
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
| Lab 4 — openclaw *(optional)* | 10 | 5 (channel = real intent), 13 (governance for a public bot) |
| Lab 5 — build sprint *(capstone)* | 1, 2, 3, 4, 5, 9, 15 | 8 (memory across rounds via lessons) |
| Big exercise (separate repo) | 1, 2, 3, 8, 10, 13, 15 | 9, 14 |

After all labs + big exercise, students have **personally implemented ~7 of 16 pillars** and **felt the absence** of another ~6. Enough fluency to read framework docs critically.

---

## Scaffolding policy

- **Pure prompt engineering** (CLAUDE.md only, no code) — when the agent's behaviour *is* the lesson. → Labs 1 and 3.
- **CLAUDE.md + small code helpers** — when raw markdown editing would race so badly it masks the lesson. → Lab 2 (`task-cli` for atomic claims).
- **Bundled third-party toolkit** — when a single-agent workflow toolkit is needed to set up the inversion. → Lab 0 (gstack).
- **Bundled service** — when the lesson requires a real channel. → Lab 4 (openclaw).
- **No web UI in the primer.** The web UI lives in the big classroom-server exercise (separate folder). Here, the file *is* the UI; `bb-watch.sh` is sugar.

---

## Status snapshot (date when updating)

| Component | State |
|---|---|
| `lab0-workflow/` | ✅ Built. Bundles `gstack/` toolkit + `docvault-legacy/` (default) and `SDRAuto/` (alt) sandboxes. |
| `lab1-blackboard/` | ✅ Built and smoke-tested. |
| `lab2-task-allocation/` | ✅ Built. CLAUDE.md + `task-cli/` (Node) + 3 rounds (free-for-all → first-claim → contract-net). |
| `lab3-team-design/` | ✅ Built. Three round folders (`round1-supervisor/`, `round2-pipeline/`, `round3-swarm/`), each with its own CLAUDE.md; same `task.md`. |
| `lab4-openclaw-optional/` | ✅ Built. Wrapper README + bundled `openclaw/` agent gateway. |
| `lab5-build-sprint/` | ✅ Built. Role-specialized agents (frontend/backend/tests), typed performatives, `task-cli/` with capability tags, `eval-self.sh` for 3-tier evaluation. |
| `bonus-langgraph/` | ⏳ Designed, not built. Same coordination problem in ~60 LOC of LangGraph. |
| `README.md` (student entry point) | ✅ |
| `PROJECT.md` (this file — design doc) | ✅ |

Last updated: 2026-05-09.

---

## Workshop logistics this primer assumes

- **Class size:** ~50 students live, ~35 actively coding
- **Format:** in-person classroom, projected leaderboard during the big exercise
- **Tooling on every laptop:** Claude Code installed, an Anthropic Pro/Max subscription or API key, terminal with `bash + awk + grep + sed + tmux` (default on macOS/Linux/WSL), Node 18+, Bun v1.0+
- **Network:** outbound HTTPS to `api.anthropic.com` is sufficient for Labs 0–3. Lab 4 also needs Groq + Telegram. The big exercise also needs outbound to the kapi-prod blackboard server.
- **Total class block this primer occupies:** ~135 min for Labs 0–3 (or ~180 min including Lab 4), then a 15-min debrief, then transition into the big exercise.

---

## What future Claude should NOT do

1. **Do not introduce a multi-agent coordination framework into the labs.** The pedagogical bet is "primitives over frameworks." Single-agent workflow toolkits (gstack-class) are fine in Lab 0; LangGraph/CrewAI/AutoGen are not.
2. **Do not collapse the labs into one.** The progression is the lesson. Lab 0 → "one agent ships fine" → Lab 1 → "now three at once is chaos" → Lab 2 → "tasks fix the chaos" → Lab 3 → "topology shapes the outcome."
3. **Do not add a web UI inside the primer.** That's the big exercise's job. The terminal + markdown + `bb-watch.sh` is the right surface area.
4. **Do not edit `lab1-blackboard/blackboard.md`** to add example findings. It must stay an empty template — students populate it.
5. **Do not touch `class-platform/`** when working on the primer. Different concern, different deploy lifecycle.
6. **Do not duplicate README content into PROJECT.md.** README = action-oriented student entry point. PROJECT.md = design rationale and future-contributor guide. Keep them complementary.

---

## What future Claude SHOULD do, if asked to continue building

1. **Build the LangGraph bonus.** ~60 LOC, runnable in Python, side-by-side with one of the labs (probably Lab 5 since that's the most framework-like in scope). The student's reaction should be *"oh — the framework is just packaging the patterns we invented."* That's the perfect inversion.
2. **Update the Status snapshot** above every time you build or change a lab.
3. **Update README.md's lab table** if you add, remove, or rename a lab. The two docs reference the same labs — keep them in sync.
4. **Re-test `bb-watch.sh`** if you change the blackboard template — the script's grep patterns are coupled to the template's section names.
5. **Don't renumber the labs.** Lab 5 sits after Lab 4 in numbering but *runs before it* in the recommended order. Renumbering would break dozens of cross-references.

---

## Anchor docs (paths from this folder)

- This file: `./PROJECT.md`
- Student entry point: `./README.md`
- Big exercise (separate repo, separate Claude session): the blackboard-classroom server has been moved out of this repo to its own deploy lifecycle.
- Workshop-kit (student plugin for the big exercise): now at `github.com/Kapi-IDE/workshop-kit` so `claude plugins install Kapi-IDE/workshop-kit` works.
- Course lesson source (when present): `../../class-platform/app/paths/multiagents-v2/_lessons/`
- The 16 Pillars lesson source: `class-platform/app/paths/multiagents-v2/_lessons/sixteen-pillar-framework.tsx`

If the folder has been moved or the lesson sources aren't present: the 16 pillars are reproduced in this file verbatim — work from this file, not the lesson source.
