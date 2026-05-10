# Multi-Agent Primer

A **5-lab, ~3-hour primer** that teaches the *primitives* of multi-agent systems by having students feel them — duplication, races, staleness, allocation bias, topology mismatch — using nothing but markdown files and a few Claude Code sessions.

For the design rationale, the 16-pillar mapping, and what NOT to do here, read [`PROJECT.md`](./PROJECT.md). This README is the student-and-instructor entry point.

---

## The labs

Run them in order. Each lab's own README has setup, prompts, and a post-mortem.

| Lab | Time | Pain it teaches | Pillars |
|---|---|---|---|
| [**0 — Workflow Rhythm**](./lab0-workflow/) | 45 min | *(no pain — sets the baseline)* a single agent + good roles already ships real work | sets up §2, §16 |
| [**1 — The Blackboard**](./lab1-blackboard/) | 25 min | Three peers, one shared file, no roles → duplication, races, synthesis bottleneck | §1, §4 |
| [**2 — Task Allocation**](./lab2-task-allocation/) | 30 min | Same three agents through three topologies (free-for-all → first-claim → contract-net) | §12, surfaces §6 |
| [**3 — Team Design**](./lab3-team-design/) | 35 min | Same task, three topologies (supervisor / pipeline / swarm) — what changes? | §3, surfaces §7, §15 |
| [**4 — Real Channel** *(optional)*](./lab4-openclaw-optional/) | 45 min | One agent on a real Telegram bot — auth, HITL, governance | §10, surfaces §5, §13 |

**Total core (Labs 0–3):** ~135 min. **With Lab 4:** ~180 min.

---

## Why this order matters

```
Lab 0          Lab 1            Labs 2–3              Lab 4
single        coordination      patches for          agent on a
agent     →   crisis        →   the chaos        →   real channel
ships         appears           (allocation,         (HITL,
clean         (the ceiling)     topology)            governance)
```

Lab 0 establishes the *baseline* — what one agent with good roles already gets you. Without that baseline, Lab 1's coordination crisis looks contrived. With it, Lab 1 lands as the *next* problem you'd hit on Monday.

Skip Labs 0 or 1 at your peril — Labs 2 and 3 don't make sense without them.

---

## Prereqs

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and logged in
- An Anthropic Pro/Max subscription or API key
- macOS / Linux / WSL — `bash`, `git`, `tmux`
- Node.js 18+ (for Lab 2's `task-cli`)
- Bun v1.0+ (for Lab 0's gstack toolkit)
- A Groq account (free) — *only* if you do Lab 4

The only network requirement is outbound HTTPS to `api.anthropic.com` (and Groq + Telegram for Lab 4).

---

## Audience

Senior professionals — engineers, tech leads, technical founders. The labs assume you already ship code with single-agent Claude Code / Cursor / similar. The point is to give you *judgment* about when multi-agent helps, when it hurts, and what failure modes to expect — not to teach you what an agent is.

---

## Bundled toolkits

Lab 0 bundles three things students need but shouldn't have to install separately:

- [`lab0-workflow/gstack/`](./lab0-workflow/gstack/) — Garry Tan's [gstack](https://github.com/garrytan/gstack) (MIT) — single-agent slash-command toolkit
- [`lab0-workflow/SDRAuto/`](./lab0-workflow/SDRAuto/) — sandbox: a real Node/TS BDR product
- [`lab0-workflow/docvault-legacy/`](./lab0-workflow/docvault-legacy/) — sandbox: fake legacy Spring/Java app with a graded bug list

Lab 4 bundles [`lab4-openclaw-optional/openclaw/`](./lab4-openclaw-optional/openclaw/) — a self-hosted agent gateway connecting Claude/Groq agents to chat channels.

---

## After the primer

Students who finish here will have **personally implemented ~7 of 16 pillars** and **felt the absence of another ~6**. That's enough fluency to read framework docs (LangGraph, CrewAI, AutoGen) critically — and to know which problems they actually solve.

The next step is the **blackboard-classroom big exercise** (separate folder, separate Claude session): 5 teams × 7 students, real coding projects, contract-net allocation, stigmergic learning. Without this primer, students don't survive that exercise. With it, they do.

---

## Status

| Lab | State |
|---|---|
| Lab 0 | ✅ Built (gstack + SDRAuto + docvault-legacy bundled) |
| Lab 1 | ✅ Built and smoke-tested |
| Lab 2 | ✅ Built (CLAUDE.md + `task-cli/` + 3 rounds) |
| Lab 3 | 🟡 Partially built (round1 CLAUDE.md present; round2/3 scaffolds in progress) |
| Lab 4 *(optional)* | ✅ Built (wraps openclaw) |

Last updated: 2026-05-09.
