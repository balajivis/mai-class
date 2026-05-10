# Lab 0 — Single-Agent Workflow Rhythm

**Time:** 45 min (10 setup · 30 work · 5 reflect)
**Lessons it sets up:** §2 Agent Anatomy (R/A/O loop) and the inversion that lands in Lab 1.
**Where this fits:** the warmup. First lab of the [multi-agent primer](../). Block A of the [mai-class day](../../README.md).

---

## Why this exists

Before you feel the pain of *coordinating* three agents (Lab 1), you need a clean baseline of what *one* agent with good roles already gets you. Most "AI agent" products in production today are exactly this: a single agent walking through a structured workflow. If you skip this lab, Lab 1's coordination crisis will look like a contrived problem. After this lab, it will look like the *next* problem you'd hit on Monday.

Concretely: you'll run one Claude Code session through a packaged sprint workflow — Plan → Review → Build → Ship — using **gstack**, an open-source slash-command toolkit. You'll notice the rhythm. You'll notice the ceiling. *Then* Lab 1 lifts you over it.

---

## Apparatus

This lab uses [`./gstack/`](./gstack/) as the toolkit. It's a single-agent workflow library — 20 specialist slash commands, no coordination machinery. See [`gstack-reference.md`](./gstack-reference.md) for the full slash-command catalog.

(If you wondered "why are we using a framework in the no-framework primer?" — read the *Note on frameworks* in [`../../PROJECT.md`](../../PROJECT.md). Short answer: gstack is single-agent workflow scaffolding, not multi-agent coordination. The primer's no-framework rule is about the latter.)

---

## Setup (10 min)

1. **Install gstack** — follow the README in `./gstack/`. On first install you'll get a ~58MB compiled Bun binary plus a headless Chromium daemon. Budget ~5 min on a fresh laptop.

2. **Pick your sandbox.** You need a small repo to act on. Pick one:
   - `../../SDRAuto/` — a real Node/TS BDR product (read-only — *do not commit*)
   - `../../brownfield/docvault-legacy/` — a legacy Java app with a published bug list in `REVIEW.yaml`
   - Any small repo of your own, < 5k LOC

3. **Open one Claude Code session** in that repo. (One. Not three. That's Lab 1's job.)

---

## Work (30 min)

Run a single small feature or fix end-to-end through the gstack sprint loop:

| Step | Slash command | What it does |
|---|---|---|
| 1 | `/plan-eng-review` | Locks architecture, data flow, edge cases, test plan for the change you want to make |
| 2 | (you implement) | Make the change. The plan is your guardrail. |
| 3 | `/review` | Pre-landing review. Finds bugs that pass CI but break in prod. |
| 4 | `/qa-only` | Headless browser sanity check (skip if your change has no UI) |
| 5 | `/ship` | Runs tests, opens a PR (don't actually push if you're in SDRAuto) |
| 6 | `/retro` | A two-minute retrospective on the loop you just ran |

Pick a *tiny* scope — fix one bug, add one input validator, rename one confusing function. The point is to feel the rhythm, not to ship a feature.

---

## Reflect (5 min)

On paper, in one sentence each:

1. **What did the workflow give you that an unstructured agent wouldn't have?** (Be specific — "structure" doesn't count.)
2. **Where did you feel the ceiling?** What did you want a *second* agent for? (Even if the answer is "nothing" — note that too.)
3. **What is this workflow assuming about the world?** (Hint: serial work, single context window, one human reviewing one PR at a time.)

Hold onto your answer to question 2. **It is the hypothesis Lab 1 will test.**

---

## What good looks like

- One PR-shaped diff (even if you don't push it)
- A retro file with at least one observation that surprised you
- A clear gut feeling that *one agent + good workflow* is genuinely enough for a lot of real work

If you finished thinking "I don't need multi-agent for anything I do" — good. **Hold onto that thought through Lab 1.** The point of the primer is not to convince you multi-agent is always right. It's to give you the judgment to know when it's not.

---

## Then proceed to [Lab 1 →](../lab1-blackboard/)
