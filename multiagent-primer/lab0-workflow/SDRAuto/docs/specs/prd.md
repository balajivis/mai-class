# Product Requirements Document: Autonomous BDR

**Version**: 1.0
**Date**: 2026-03-28
**Status**: Phase 1 Implementation

---

## 1. Executive Summary

**Vision**: Autonomous BDR is an AI-powered agent that automates the full outbound sales cycle—sourcing leads, personalizing outreach, handling replies, and booking meetings—enabling early-stage startups and SDR teams to run world-class outbound without hiring new representatives.

**Product Statement**: An intelligent agent learns your best rep's voice from 30–50 sample emails, then generates personalized first touches, monitors for replies, handles common objections, and proposes calendar slots—all with human review gates at configurable autonomy levels (L1–L4). Phase 1 focuses on email-only, bring-your-own-list (BYOL) mode with L2 autonomy, targeting 15%+ reply rates and zero compliance violations.

---

## 2. User Personas

| **Persona** | **Founder** | **SDR Manager** | **SDR Rep** |
|---|---|---|---|
| **Title** | Co-founder / CEO | VP Sales / Sales Operations | Account Executive (SDR) |
| **Company Size** | 2–50 employees | 50–500 employees | — |
| **Primary Goal** | Prove GTM fit without hiring sales staff | Reduce non-selling work, improve team velocity | Increase personalization at scale without burnout |
| **Key Challenge** | Spending 70% of time on non-selling tasks (research, logging, sequencing) | SDR team churning on manual work; low reply rates on generic outreach | Manual personalization doesn't scale; quality drops at volume |
| **Autonomy Preference** | L4 (fully autonomous) | L2 (approve first touch only) | L2–L3 (auto-send, review replies) |
| **Success Metric** | Booked 10+ qualified meetings in 4 weeks | 20% improvement in team reply rate YoY | Reduced time per email; improved conversation quality |
| **Tech Comfort** | Moderate | High | Moderate |

---

## 3. User Stories & Acceptance Criteria

### **3.1 Founder Personas**

| # | **User Story** | **Acceptance Criteria** |
|---|---|---|
| **F1** | As a founder, I want to upload a CSV of target accounts so that the agent can begin researching and outreaching on my behalf without manual list curation. | • CSV uploads with ≥3 columns (domain, company name, buyer role)<br>• Validates 95%+ of domains<br>• Displays import summary with validation errors<br>• Stores accounts in campaign for research queue |
| **F2** | As a founder, I want to upload 30–50 of my sent emails so that the agent learns my writing style and voice. | • Upload accepts .eml, .txt, or paste raw email text<br>• Extracts ≥30 emails minimum<br>• Displays voice profile preview (tone, length, sign-offs)<br>• User can curate/remove sample emails before finalizing<br>• Confidence score ≥0.85 to proceed |
| **F3** | As a founder, I want the agent to auto-research accounts and generate personalized first-touch emails so that I can send 20+ outreach emails per day without writing each one. | • Research completes per account in <2 min<br>• Email generation produces 1 subject + 1 body per account<br>• Personalization includes ≥2 company-specific signals (news, hiring, funding)<br>• Email text passes readability check (no obvious AI markers)<br>• User reviews generated emails before first send (L4 optional: auto-send) |
| **F4** | As a founder, I want the agent to auto-send follow-ups on a configurable cadence so that I don't have to manually schedule reminders. | • Follow-up sequences auto-generate after first touch<br>• Default cadence: Day 3, Day 7, Day 10 (configurable)<br>• Respects 20 emails/day cap + 5 emails/domain cap<br>• Pauses sequence if prospect replies or unsubscribes<br>• User can view/edit scheduled follow-ups before they send |
| **F5** | As a founder, I want the agent to monitor my inbox for replies and classify them as interested, objection, unsubscribe, or noise so that I focus only on real opportunities. | • Monitors Gmail/Outlook inbox every 5 min<br>• Classifies replies with ≥90% accuracy on positive/unsubscribe<br>• Extracts objection type (budget, timing, competitor, use-case fit) when present<br>• Escalates low-confidence replies (<0.7) for manual review<br>• Dashboard shows reply queue sorted by classification + confidence |
| **F6** | As a founder, I want to see reasoning logs for every action the agent takes so that I understand why it chose to send (or not send) a particular email. | • Every outreach action shows: trigger signal, ICP match score, personalization sources, voice profile confidence<br>• Every reply classification shows: extracted sentiment, objection type, recommended action, reasoning<br>• Logs are human-readable (not just token dumps)<br>• Click any action to expand detailed log |
| **F7** | As a founder, I want the agent to propose calendar slots and handle basic rescheduling so that meetings get booked without me manually coordinating. | • Calendar integration (Google Calendar) reads founder availability<br>• Proposes 3–5 slots (Tuesday–Thursday, 10 AM–2 PM local prospect time)<br>• Logs proposed slots in CRM<br>• Handles acceptance/rejection without founder intervention<br>• Escalates rescheduling requests >3 days out to founder for manual confirm |
| **F8** | As a founder, I want to set autonomy level (L1–L4) and adjust daily/domain caps so that the agent respects my risk tolerance and domain reputation. | • Settings panel allows toggle: L1, L2, L3, L4<br>• Default: L2 (approve first touch, auto follow-up)<br>• Daily cap default: 20 emails (configurable 1–100)<br>• Domain cap default: 5 emails/domain/day (configurable)<br>• Changes take effect immediately for new sends<br>• System prevents cap violations in real-time |

---

### **3.2 SDR Manager Personas**

| # | **User Story** | **Acceptance Criteria** |
|---|---|---|
| **M1** | As an SDR manager, I want to define my team's ICP (company size, industry, tech stack, revenue signals) once so that the agent targets the right accounts across all campaigns. | • ICP wizard with dropdowns: company size, industry, revenue stage, employee count<br>• Free-text fields for tech stack and pain points<br>• Save as template and apply to multiple campaigns<br>• Display ICP match score in campaign/outreach views<br>• Allow per-campaign overrides |
| **M2** | As an SDR manager, I want to configure the autonomy level for my team so that reps follow company brand and compliance guidelines. | • Admin panel restricts team to ≤ specified autonomy level (e.g., max L2)<br>• Individual reps cannot override team setting<br>• Audit log tracks who changed autonomy settings + when<br>• Default: L2 across team |
| **M3** | As an SDR manager, I want to see team-wide metrics (reply rate, meeting rate, velocity) in a dashboard so that I can optimize team performance and coaching. | • Dashboard shows: total accounts in-flight, first touches sent, replies received, meeting rate<br>• Compare period-over-period (week, month, quarter)<br>• Drill-down by campaign, rep, or account cohort<br>• Trend line for reply rate + booking rate<br>• Export CSV for external analysis |
| **M4** | As an SDR manager, I want to assign campaigns to specific reps so that each rep owns their outbound and can approve first touches before sending. | • Campaign creation includes "assigned_rep" field<br>• Assigned rep receives notification of pending approvals<br>• Reps see only their own campaigns in dashboard<br>• Manager can reassign campaigns or pause individual rep's sequences |
| **M5** | As an SDR manager, I want to track compliance: which emails were sent, which prospects unsubscribed, which domains have high bounce rates, so that we stay within regulatory requirements. | • Compliance report shows: domains with bounce rate >5%, unsubscribe list, CAN-SPAM footer presence<br>• Auto-pause domain if bounce rate exceeds threshold<br>• Export unsubscribe list monthly for compliance review<br>• Audit trail of all sent messages (searchable by domain, date, recipient) |
| **M6** | As an SDR manager, I want voice profiles curated per rep so that each rep's outbound retains their unique style. | • Assign voice profile to each rep during onboarding<br>• Manager can review/edit voice profile (tone, sign-offs, emoji usage)<br>• Option to freeze voice profile to prevent agent changes<br>• Re-train voice profile if rep's style changes significantly |

---

### **3.3 SDR Rep Personas**

| # | **User Story** | **Acceptance Criteria** |
|---|---|---|
| **R1** | As an SDR rep, I want to upload my sent emails (30–50 samples) during onboarding so that the agent learns my style. | • Email upload wizard (drag-and-drop, paste, or IMAP sync)<br>• Detects and extracts minimum 30 emails<br>• Shows preview of extracted voice profile<br>• Allows rep to remove outlier emails before final submission<br>• Success message + voice profile summary |
| **R2** | As an SDR rep, I want to approve first-touch emails before they're sent (L2 mode) so that I maintain quality control and brand consistency. | • Approval queue shows pending emails (max 10 per batch)<br>• Rep sees: generated email + personalization sources + voice profile confidence<br>• Approve, reject, or request edit (regenerate with feedback)<br>• Approved emails auto-send per schedule<br>• Rejected emails return to draft, can be reworked |
| **R3** | As an SDR rep, I want to see a reply queue sorted by priority (positive first, objections grouped) so that I respond quickly to interested prospects. | • Dashboard shows "Waiting for Me" replies (classified as positive/objection)<br>• Click reply to see full context: original email, research brief, buyer persona<br>• Reply composition box with suggested response template (if L3+)<br>• One-click "Mark as Closed" or "Send Follow-up"<br>• Unread notification badge |
| **R4** | As an SDR rep, I want to see why the agent sent a particular email (personalization signals, voice profile match, cadence rule) so that I can coach the agent and improve future sends. | • Reasoning log visible on every outreach record<br>• Breakdown: "Sent because of funding signal (conf 0.92) + ICP match (0.88) + voice match (0.91)"<br>• Suggest agent improvements (e.g., "Try emphasizing ROI, not time-to-value")<br>• Feedback logged for agent self-improvement (Phase 2+) |
| **R5** | As an SDR rep, I want to set my availability (calendar blocks, timezone) once so the agent books meetings in realistic time slots. | • Calendar integration (Google Calendar read-only)<br>• Rep blocks out lunch, internal meetings, admin time<br>• Timezone auto-detected, override if needed<br>• Agent proposes only available slots<br>• Confirm meeting before final calendar invite sent |
| **R6** | As an SDR rep, I want the agent to pause my sequences if a prospect explicitly unsubscribes so that I don't spam anyone. | • Unsubscribe detection triggers auto-pause<br>• Rep notified of pause (dashboard + optional email alert)<br>• Unsubscribed contact added to company unsubscribe list<br>• Audit trail: who unsubscribed, when, via which email |
| **R7** | As an SDR rep, I want to see a simple daily digest of outreach activity (emails sent, replies received, meetings booked) so I stay in the loop without constant dashboard checking. | • Optional daily/weekly digest email<br>• Summary: X emails sent, Y replies, Z meetings booked<br>• Quick links to approval queue, reply queue, booked meetings<br>• Configurable frequency (off, daily, weekly) |
| **R8** | As an SDR rep, I want to manually override the agent's decision (e.g., send a custom email, pause a sequence) so that I can handle edge cases. | • Manual override option in approval workflow<br>• Rep composes custom email, agent sends it<br>• Override logged for audit + agent learning<br>• Pause sequence for single prospect without affecting campaign |

---

## 4. MoSCoW Prioritization (Phase 1)

| **Category** | **Priority** | **Stories** | **Rationale** |
|---|---|---|---|
| **MUST** | Req'd for Phase 1 launch | F1, F2, F3, M1, R1, R2 | Core loop: upload accounts → clone voice → generate + approve emails. Non-negotiable. |
| **SHOULD** | High-value, fits timeline | F4, F5, F6, M3, M5, R3, R4 | Reply handling, reasoning logs, compliance tracking, manager visibility. Builds trust + safety. |
| **COULD** | Nice-to-have, post-launch | F7, F8, M2, M4, M6, R5, R6, R7, R8 | Calendar booking, granular autonomy control, voice profile management, override UX. Improves polish. |
| **WON'T** | Out of scope Phase 1 | Multi-channel (LinkedIn, phone), lead sourcing, CRM native integration, outcome labeling, self-improvement loop | Defer to Phase 2+. Reduces complexity, allows faster launch. |

---

## 5. Non-Functional Requirements

| **Category** | **Requirement** | **Target** |
|---|---|---|
| **Performance** | Voice profile extraction | <30 sec for 50 emails |
| | Email generation per account | <2 min (research + generation) |
| | Inbox polling latency | 5 min max; escalate if >10 min |
| | API p99 response time | <2 sec for all endpoints |
| **Security** | HTTPS for all API traffic | TLS 1.2+ mandatory |
| | OAuth2 for email/calendar auth | No password storage for external services |
| | Secret storage | AWS Secrets Manager / Vault for SMTP, API keys |
| | PII handling | No email bodies logged in plaintext; hash/redact for analytics |
| **Compliance** | Email footer | CAN-SPAM footer on all outreach (company name, address, unsubscribe link) |
| | Unsubscribe handling | Honor within 10 days; auto-pause sequences |
| | Audit trail | All sent messages queryable by domain, date, recipient; 1-year retention |
| | Spam testing | Pre-launch testing via Mail Tester, GlockApps; target score ≥8/10 |
| **Scalability** | Concurrent users | 1,000+ simultaneous active users |
| | Message throughput | 100+ emails/sec send capacity |
| | Data store | Support ≥100M outreach records + 1B messages |
| | Deployment | Stateless API for horizontal scaling; async job queue for long-running tasks |

---

## 6. Success Metrics (by Phase)

### **Phase 1 Metrics**

| **Metric** | **Target** | **Measurement** |
|---|---|---|
| **Adoption** | 50+ pilot users (mix of founders, SDR teams) | New user sign-ups + active campaign creation |
| **Engagement** | >80% of users send ≥1 first touch | Users with ≥1 outreach message sent |
| **Quality** | Reply rate ≥15% | Total replies / total first touches sent |
| **Safety** | Zero spam complaints | Support tickets + abuse reports |
| **Compliance** | Zero CAN-SPAM/GDPR violations | Audit review; legal sign-off |
| **Trust** | >80% of users view reasoning log ≥1x | Event tracking on reasoning log clicks |
| **Accuracy** | Reply classification ≥90% on positive/unsubscribe | Manual audit of 100+ classified replies |

### **Phase 2 Metrics**

| **Metric** | **Target** | **Measurement** |
|---|---|---|
| **Signal quality** | 5× higher reply rate on signal-triggered emails vs. cold outreach | A/B analysis of signal-triggered vs. BYOL campaigns |
| **Self-improvement** | Measurable 10%+ improvement in reply rate over 30 days | Trend analysis of reply rate by user over time |
| **Retention** | >60% of Phase 1 users active in Phase 2 | Monthly active users Phase 2 / Phase 1 cohort |

### **Phase 3 Metrics**

| **Metric** | **Target** | **Measurement** |
|---|---|---|
| **Autonomy adoption** | 30%+ of users move to L3/L4 | Users with autonomy_level in (L3, L4) / total users |
| **Booking rate** | 40%+ of replied meetings convert to booked meetings | Booked meetings / replied prospects |
| **NRR** | >120% (for paid tiers) | (Cohort revenue Month 12 - Churn) / Cohort revenue Month 1 |

---

## 7. Open Questions for Stakeholders

1. **Founder vs. SDR teams**: Who is the primary user for Phase 1? Founders doing their own outbound, or SDR teams at scale-ups? This shapes onboarding complexity, autonomy defaults, and GTM strategy.

2. **Pricing model**: Per-user ($100–500/mo), per-email-sent ($0.01–0.05/email), per-meeting-booked ($50–200/meeting), or tiered freemium (basic BYOL free, premium features $300+/mo)?

3. **Self-hosting**: Must customers run outreach on their own domain (setup complexity, better deliverability) or is a shared sending domain acceptable (simpler setup, less warmup time)?

4. **CRM integration priority**: Which CRM is most critical for Phase 1 launch? (HubSpot, Salesforce, Pipedrive, none—just export CSV?)

5. **Outcome labels**: Is the user willing to tag replies as "good lead," "not ICP," "wrong persona" for agent learning? (Required to power self-improvement loop in Phase 2.)

6. **Existing vendor stance**: Will Autonomous BDR replace Outreach/SalesLoft workflows, or integrate alongside them? Impacts onboarding narrative + CRM feature scope.

---

## 8. Success Definition (Phase 1 Exit Criteria)

**Go/No-Go for Phase 2 transition requires**:

- ✓ 50+ active users (mix: ≥10 founders, ≥15 SDR teams)
- ✓ Reply rate ≥15% on first touches (vs. 2–5% industry baseline)
- ✓ Zero compliance violations (CAN-SPAM, GDPR, spam complaints)
- ✓ >80% user engagement with reasoning log (trust signal)
- ✓ >90% reply classification accuracy (manual audit)
- ✓ Positive feedback on voice cloning quality (≥4/5 rating)
- ✓ Sustainable product (no critical bugs in top 10 user flows)
- ✓ Clear answer to stakeholder questions 1, 2, 4 (founder vs. SDR, pricing, CRM)

---

**Document Version**: 1.0
**Last Updated**: 2026-03-28
**Author**: Autonomous BDR Product Team
