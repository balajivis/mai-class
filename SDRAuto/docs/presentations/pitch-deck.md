# Autonomous BDR — Slide Deck

---

## Slide 1 — Title

**The Autonomous BDR**

An AI agent that sources leads, personalises outreach, handles replies, and books meetings — with human review gates.

> Tags: Concept Brief · Lead Sourcing · Style Cloning · Reply Handling · Meeting Booking

---

## Slide 2 — Why Now

**The window is open**

| Stat | Label | Context |
|------|-------|---------|
| 70% | of SDR time | spent on non-selling tasks (research, logging, sequencing) |
| 5× | higher convert rate | when outreach is triggered by a live buying signal vs. cold list |
| 0 | SDR hires needed | for an early-stage startup to test GTM fit with an autonomous agent |

> LLMs can now extract rep voice from 30–50 emails and replicate it at scale — that was impossible 18 months ago. This is the enabling technology.

---

## Slide 3 — What It Does

**Core loop: 5 stages**

1. **Source** — Monitors job boards, funding signals, LinkedIn, and tech-stack data to find in-market accounts matching your ICP
2. **Research** — Builds a per-account brief: org chart signals, recent news, pain indicators, and a persona read on the buyer
3. **Outreach** — Writes and sends personalised first touches in the rep's cloned voice across email and LinkedIn, with timing intelligence
4. **Reply** — Classifies inbound replies: interest, objection, unsubscribe. Handles or escalates based on configured autonomy level
5. **Book** — Proposes calendar slots, handles rescheduling, logs the booked meeting to CRM with full conversation context

---

## Slide 4 — Key Design Decisions

**The choices that define the product**

### Foundational
- **Human-in-the-loop design** — Approve every message → approve first touch only → fully autonomous. The default must be opinionated; most teams won't tune it themselves.
- **Sender identity & deliverability** — Real rep alias or branded persona? Domain warmup, SPF/DKIM, and daily caps must be designed in on day one.
- **Stateful memory across touches** — The agent remembers what it sent, what was replied, and what was rejected — across all channels — without any rep logging.

### Strategic
- **Lead sourcing vs. BYOL** — Build-in lead finding (stronger moat, harder) vs. bring-your-own-list (faster to ship). Most products start BYOL.
- **Personalisation depth vs. scale** — Deep per-account research vs. high-volume templated sends are different products. Trying to do both dilutes both.
- **Channel scope** — Email only is safest to start. Each additional channel (LinkedIn, phone) multiplies state machine complexity significantly.

---

## Slide 5 — Style Cloning Feasibility

**What's actually clonable — and what isn't**

| Capability | Data needed | Feasibility | Difficulty |
|---|---|---|---|
| Voice & tone | ~30–50 sent emails | 88% | Easy |
| Subject line patterns | ~20 sent emails | 85% | Easy |
| Sign-off & formatting | ~10 sent emails | 92% | Easy |
| Cadence & follow-up timing | Emails + CRM timestamps | 65% | Medium |
| Value prop emphasis | Emails + win/loss data | 58% | Medium |
| Objection handling style | Reply threads + call transcripts | 50% | Medium |
| When to push vs. ease off | Requires outcome labels | 28% | Hard |
| Relationship reading | Likely not learnable | 14% | Hard |

> **Key insight:** Surface style is clonable on day one with ~50 emails. Deep sales judgment requires outcome data at scale — and some of it may never be learnable from text alone.

---

## Slide 6 — Pitfalls

**Where autonomous BDRs fail**

### High Risk
- **Spam at scale** — A misconfigured agent can burn a domain in days. Daily caps, bounce monitoring, and auto-pause must be bulletproof before launch.
- **The "obviously AI" problem** — Prospects increasingly detect AI-written email. Quality must clear a human-written bar, not just a grammar check.
- **Regulatory exposure** — GDPR, CAN-SPAM, and CCPA all constrain automated outreach. Operating across regions without consent management is a compliance time bomb.

### Watch Out
- **Rep adoption failure** — Reps who can't see what the agent is doing will route around it. A glass-box UI showing every action and its rationale is non-negotiable.
- **Runaway reply handling** — An "unsubscribe" reply that triggers a follow-up is a brand disaster. Reply classification and graceful escalation are harder than they look.
- **Attribution ambiguity** — Without clear attribution, customers can't justify spend and you can't improve the product. Build it in from day one.

---

## Slide 7 — 10× Differentiators

**What makes this 10× better than existing tools**

1. **Learns your best rep** — Studies top rep's sent emails and call recordings, extracts their voice and patterns, writes in their style — not generic templates.
2. **Real-time signal response** — Prospect just got funded? Opened 3 times? Agent responds in minutes, not on the next scheduled cadence day.
3. **Self-improving via outcomes** — Tracks which messages, subject lines, and send times produce replies, then systematically improves. Gets measurably better over 30/60/90 days.
4. **Intelligent reply handling** — When a prospect replies "we use X already," the agent rebuttals with a specific, context-aware response before escalating to a human.
5. **CEO mode for small teams** — Founder sets ICP + value prop once. Agent runs outbound indefinitely with a weekly digest. Zero SDR hire needed to test GTM fit.
6. **Transparent reasoning log** — Every action has a visible rationale: the signal it saw, the rule it applied, the message it chose. Builds trust — feels different from a black box.

---

## Slide 8 — Autonomy Spectrum

**Choose your control level**

| Level | Label | Description | Best For | Risk | Value |
|---|---|---|---|---|---|
| L1 | Approve everything | Agent drafts; human sends every message | Compliance-sensitive teams | Low | Low |
| **L2** | **First touch approval** | **Auto-follow-up; human approves only first contact** | **Most enterprise SDR teams** | **Low-Med** | **Med** |
| L3 | Auto-send, review replies | All outreach automated; human handles replies only | Growth-stage scale-ups | Med | High |
| L4 | Fully autonomous | Agent handles sourcing, outreach, replies, booking end-to-end | Founders / early-stage startups | High | Highest |

> **Recommended default: L2.** Safe enough to launch, autonomous enough to save real time.

---

## Slide 9 — Recommended Build Path

**Start narrow. Prove value fast. Expand with confidence.**

### Phase 1 · Weeks 1–4
Email-only, BYOL, L2 autonomy. Use ~50 emails to clone rep style. Approve first touch, auto-follow-up. Prove reply rates before adding complexity.

### Phase 2 · Months 2–3
Add signal-based lead sourcing. Layer in intent signals (funding, hiring, job changes). Introduce real-time trigger outreach as a distinct flow.

### Phase 3 · Months 4–6
Expand channels + raise autonomy. Add LinkedIn. Move toward L3/L4 as trust is built. Ship the transparent reasoning log and self-improvement loop.

> **Open question:** Are you targeting founders doing their own outbound, or SDR teams at scale-ups? This shapes almost every decision above.