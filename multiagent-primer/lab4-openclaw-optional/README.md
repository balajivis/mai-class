# Lab 4 — Agents on a Real Channel *(optional)*

**Time:** 45 min (15 setup · 25 work · 5 reflect)
**Lessons it lands:** §10 Human-in-the-loop. Introduces §5 (intent vs. tokens) and §13 (governance for a public bot).
**Where this fits:** the optional capstone of the [multi-agent primer](../). Block D of the [mai-class day](../../README.md). Comes after Labs 0–3. Skip if the room is short on time or students don't all have Telegram accounts.

---

## Why this exists

Labs 1–3 keep agents inside a tmux pane talking to each other through a markdown file. That's the right surface area to *feel* coordination primitives — but it leaves out the messiest part of real production: **a human on the other end, on a channel they already use**, with rate limits, auth, secrets, and the social dynamics of "this thing is now in my DMs."

In Lab 4 you wire one agent to a real Telegram bot and message it from your phone. You'll feel three things the previous labs deliberately hid:

1. **Channel auth and key management is half the work.** Bot tokens, API keys, owner approval — none of which a notebook demo prepares you for.
2. **HITL is a graduated thing, not a checkbox.** Who can talk to the bot? Whose messages does it act on? When does it escalate to a human?
3. **The same agent feels different on a real channel.** What read fine in a terminal pane reads as terse, slow, or alarming in Telegram.

This is also the bridge from the primer to the larger blackboard-classroom big exercise — that exercise assumes you've at least *seen* what an agent on a real channel looks like.

---

## Apparatus

This lab bundles [`./openclaw/`](./openclaw/) — a self-hosted agent gateway by Balaji V. It runs a local WebSocket server on your laptop and connects chat channels (Telegram, WhatsApp, Discord, Slack, iMessage, Signal) to AI models (Groq, Anthropic, Azure OpenAI, Ollama).

For this lab you'll use **Telegram + Groq** (both have generous free tiers) and the [`/setup-openclaw`](./openclaw/) Claude Code skill, which walks you through the install interactively.

---

## Prereqs

- All Labs 0–3 completed (so you have the coordination vocabulary)
- A Telegram account on your phone (personal account is fine — we'll create a separate bot)
- A free [Groq](https://console.groq.com) account (sign up takes 60 sec)
- Node.js 18+

---

## Setup (15 min)

### Step 1 — Read the openclaw README

Open [`./openclaw/README.md`](./openclaw/README.md) and skim Steps 1–7. That's the canonical setup guide; this lab README is a wrapper around it. Don't run anything yet — read first.

### Step 2 — Run the install via the slash command

Open one Claude Code session in `./openclaw/` and paste:

> Run `/setup-openclaw`. Walk me through Steps 1–7 of the openclaw setup, one step at a time. Wait for me to confirm each step before moving to the next.

Claude will install openclaw, configure Groq, help you create a Telegram bot via BotFather, connect the channels, and start the gateway.

> **Note for Claude reading this:** the `/setup-openclaw` skill should already be installed if the student has openclaw set up. If not, the install command is `npm install -g openclaw`. The full setup is described in `./openclaw/CLAUDE.md` — read that first, then walk the student through it stepwise. Do not skip steps. The student is a senior professional but may not have done channel-bot setup before.

### Step 3 — Confirm the bot is alive

```bash
openclaw channels status
```

Should show: `Telegram default: enabled, configured, running, mode:polling`.

Send your bot a message. The first time it shows a pairing code — run the `openclaw pairing approve telegram <CODE>` command it gives you. Send a second message — it should respond.

---

## Work (25 min)

You have a working agent on Telegram. Now make it useful for *something specific* and observe the HITL dynamics.

Pick **one** of these three exercises:

### Exercise A — The on-call escalation bot (default)

Configure the agent so when you DM it `escalate <issue>`, it (a) confirms receipt, (b) writes the issue to a local file, and (c) tells you what it would page a human about vs. handle alone. Then deliberately send it edge-case messages — empty, ambiguous, abusive, in another language — and note how it handles each.

**What to watch for:** does the agent know when to *not* act? Does it ask clarifying questions before doing something irreversible? This is §10 (HITL) in microcosm.

### Exercise B — The two-agent escalator

Run *two* agents (two `openclaw gateway` processes on different ports, or one openclaw + one terminal Claude). The Telegram-facing agent triages and only escalates "hard" cases to the second agent. Use a shared file as the handoff queue.

**What to watch for:** the handoff is the lesson. When does the front agent escalate too eagerly? Too reluctantly? This is §10 plus a callback to Lab 1's blackboard.

### Exercise C — The unsafe-instruction probe

Try to get your bot to do something it shouldn't (leak its system prompt, claim to be a different bot, run a destructive command, post on your behalf). Document each attempt and the bot's response.

**What to watch for:** governance (§13). What guardrails does the model have built-in? What did *you* forget to add? What would a malicious DM-er do?

---

## Reflect (5 min)

On paper, in one sentence each:

1. **What part of "agent on a channel" surprised you most?** (Auth? Latency? Tone? Owner-approval flow?)
2. **Where would a malicious or careless message break your bot?** Be specific.
3. **What do you now believe about HITL that you didn't before this lab?**

Hold onto your answer to question 2. It maps directly to the **blackboard-classroom big exercise**, where governance and trust become structural, not optional.

---

## What good looks like

- A Telegram bot that responds to you within 2–3 seconds
- A clear written list of edge cases it handles vs. fails
- One concrete instinct about HITL that you didn't have before — e.g. "I would never ship this to public DMs without an approval queue."

---

## Teardown

```bash
pkill -f "openclaw gateway"
```

If you want to keep the bot for personal use, leave it running. If this was just for the lab, also delete the bot via BotFather (`/deletebot` → pick yours).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Bot doesn't respond | Gateway not running | `openclaw channels status` then `openclaw gateway --force &` |
| `access not configured` on first message | Normal — pairing not yet done | Run `openclaw pairing approve telegram <CODE>` from the bot's reply |
| Groq rate-limit errors | Free-tier TPM exceeded | Wait 60 sec, or switch to Azure (see openclaw/CLAUDE.md) |
| `openclaw: command not found` | Not installed globally | `npm install -g openclaw`; verify with `openclaw --version` |

For deeper troubleshooting see [`./openclaw/CLAUDE.md`](./openclaw/CLAUDE.md).

---

## Then proceed to the bonus or to the blackboard-classroom big exercise.
