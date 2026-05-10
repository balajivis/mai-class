# Lab 0 — Single-Agent Workflow Rhythm

**Time:** 45 min (10 setup · 30 work · 5 reflect)
**Lessons it sets up:** §2 Agent Anatomy (R/A/O loop) and the inversion that lands in Lab 1.
**Where this fits:** the warmup. First lab of the [multi-agent primer](../). Block A of the [mai-class day](../../README.md). Read [`PROJECT.md`](../../PROJECT.md) for the full pedagogical thesis.

---

## Why this exists

Before you feel the pain of *coordinating* three agents (Lab 1), you need a clean baseline of what *one* agent with good roles already gets you. Most "AI agent" products in production today are exactly this: a single agent walking through a structured workflow. If you skip this lab, Lab 1's coordination crisis will look like a contrived problem. After this lab, it will look like the *next* problem you'd hit on Monday.

You'll run one Claude Code session through a packaged sprint workflow — Office hours → Plan → Build → Review → Ship → Retro — using **gstack**, an open-source slash-command toolkit. Notice the rhythm. Notice the ceiling. *Then* Lab 1 lifts you over it.

---

## Apparatus

This lab bundles [`./gstack/`](./gstack/) — a single-agent workflow library by Garry Tan. ~20 specialist slash commands, no coordination machinery. See [`gstack-reference.md`](./gstack-reference.md) for the full catalog.

(Wondering "why a framework in the no-framework primer?" — see *Note on frameworks* in [`../../PROJECT.md`](../../PROJECT.md). Short version: gstack is single-agent workflow scaffolding, not multi-agent coordination. The primer's no-framework rule is about the latter.)

---

## Setup (10 min)

### Prereqs

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and logged in
- [Git](https://git-scm.com/) and [Bun](https://bun.sh/) v1.0+
- macOS / Linux / WSL shell

### Step 1 — Install gstack globally (one-time)

Open a Claude Code session anywhere and paste this single message:

> Install gstack: run `git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`. Then verify by listing the slash commands available. When done, exit.

Claude will run the install, build the Bun binary (~58MB) and headless Chromium daemon (~5 min on a fresh laptop), and register the slash commands. Once you see `/office-hours`, `/plan-eng-review`, `/review`, `/ship`, etc. listed, **exit that Claude session**.

> **Note for Claude reading this:** if the user has the local copy at `./gstack/` and prefers not to clone from GitHub, run `cp -Rf ./gstack ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup` instead. The local copy is current and works the same way.

### Step 2 — Pick your sandbox

You need a small repo to act on. Pick **one**:

| Sandbox | Path | Notes |
|---|---|---|
| **SDRAuto** *(default)* | `./SDRAuto/` | A real Node/TS BDR product. **Read-only — do not push.** Drop a small fix, run `/ship` *without* the actual push, then revert. |
| Brownfield DocVault *(optional)* | `../../brownfield/docvault-legacy/` | Legacy Java app with a published bug list in `REVIEW.yaml`. Pick one bug and walk it through. |
| Your own repo | anywhere on your laptop | < 5k LOC ideally |

### Step 3 — Open one Claude Code session in that sandbox

```bash
cd ./SDRAuto    # or whichever sandbox you picked
claude
```

**One** session. Not three. Three is Lab 1's job.

---

## Work (30 min)

Run a single small change end-to-end through the gstack sprint loop. Pick a *tiny* scope: fix one bug, add one input validator, rename one confusing function. The point is to feel the rhythm, not to ship a feature.

### The loop

| Step | Slash command | What it does | Time |
|---|---|---|---|
| 0 | `/office-hours` | Reframes your idea before you write code. Challenges premises. | 5 min |
| 1 | `/plan-eng-review` | Locks architecture, data flow, edge cases, and a test plan for the change. | 5 min |
| 2 | *(you implement)* | Make the change. The plan from step 1 is your guardrail. | 10 min |
| 3 | `/review` | Pre-landing review. Finds bugs that pass CI but break in prod. | 5 min |
| 4 | `/qa-only` | Headless browser sanity check. *Skip if your change has no UI.* | 3 min |
| 5 | `/ship` | Runs tests, opens a PR. **Don't actually push if you're in SDRAuto.** | 5 min |
| 6 | `/retro` | Two-minute retrospective on the loop you just ran. | 2 min |

### Notes for the Claude session

- Use the slash commands by name. Each one loads a SKILL.md that gives you a specialist persona for that step.
- Stay in scope. If `/plan-eng-review` produces a plan with 12 items, pick *one* and ship that one. Resist the temptation to do everything.
- If a command isn't recognized, gstack didn't install correctly — go back to Setup Step 1.

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

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `/office-hours` not recognized | gstack didn't install or didn't register | Re-run Setup Step 1; check `ls ~/.claude/skills/gstack` |
| `bun: command not found` during install | Bun missing | `curl -fsSL https://bun.sh/install \| bash` then re-run install |
| `/qa-only` errors with "no browser" | First-run Chromium download didn't finish | Run `cd ~/.claude/skills/gstack && ./setup` again |
| `/ship` wants to push but you're in SDRAuto | gstack defaults to push | Tell it "draft only, do not push" in the same message |

---

## Then proceed to [Lab 1 →](../lab1-blackboard/)
