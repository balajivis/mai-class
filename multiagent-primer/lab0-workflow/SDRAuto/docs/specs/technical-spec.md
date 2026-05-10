# Autonomous BDR — Technical Specification

## Executive Summary

The Autonomous BDR is an AI-powered agent that automates the full outbound sales cycle: sourcing leads, personalizing outreach, handling replies, and booking meetings. The product operates across multiple autonomy levels (L1-L4) with human review gates, starting with email-only, bring-your-own-list (BYOL) mode at L2 autonomy.

---

## 1. Vision & Scope

### Product Goals
- **Primary Goal**: Enable early-stage startups and SDR teams to run autonomous outbound without hiring new reps
- **Success Metric**: 5–10× improvement in outbound efficiency by eliminating non-selling tasks
- **Key Enabler**: LLM-powered voice cloning from existing rep emails, enabling personalized scale

### Target Users (Phase 1)
- **Primary**: Founders doing their own outbound at early-stage startups
- **Secondary**: SDR teams at scale-ups (for future phases)

### Out of Scope (Phase 1)
- Multi-channel outreach (LinkedIn, phone)
- Lead sourcing/discovery
- CRM integration beyond basic meeting logging
- Native phone calling

---

## 2. Core Feature Specification

### 2.1 Five-Stage Core Loop

#### Stage 1: Source
**Status**: BYOL only in Phase 1. Sourcing enabled in Phase 2.

**Responsibilities (Phase 2+)**:
- Monitor job boards (LinkedIn, Angellist, hiring signals)
- Track funding announcements (Crunchbase, PitchBook)
- Detect hiring signals via LinkedIn job postings
- Identify tech-stack changes (BuiltWith, G2)

**Inputs**: ICP definition (company size, industry, tech stack, revenue signals)
**Outputs**: Lead list with relevance score, data freshness timestamp

**Phase 1 workaround**: Users upload CSV with target accounts

---

#### Stage 2: Research
**Status**: Core feature for Phase 1

**Responsibilities**:
- Fetch public org chart from LinkedIn/Hunter/Apollo
- Extract recent company news (Crunchbase, Twitter, press releases)
- Identify pain indicators (tech stack analysis, hiring patterns, funding stage)
- Build persona read on buyer (role, seniority, likely goals)
- Assemble per-account brief (max 2–3 KB context)

**Inputs**: Account domain, company name, known buyer email (optional)
**Outputs**:
```json
{
  "account_id": "str",
  "company_name": "str",
  "research_brief": {
    "org_chart_snapshot": ["name", "title", "linkedin_url"],
    "recent_news": ["headline", "date", "source_url"],
    "pain_indicators": ["signal", "confidence", "date"],
    "buyer_persona": {"role": "", "seniority": "", "likely_goals": []},
    "icp_fit_score": 0.85,
    "data_freshness": "timestamp"
  },
  "recommended_buyer": "email@domain.com"
}
```

---

#### Stage 3: Outreach
**Status**: Core feature for Phase 1

**Responsibilities**:
- Clone rep voice from provided email samples (~30–50 emails)
- Generate first-touch email with personalization
- Select send time based on timezone + deliverability rules
- Execute send (respect daily caps, warmup schedule, bounce monitoring)
- Log outreach action with full message context
- Generate follow-up sequence (auto-send per cadence rules in L3+)

**Voice Cloning Inputs**:
- Rep's sent emails (minimum 30–50 for style baseline)
- Call recordings (optional, for tone inference)

**Voice Cloning Outputs**:
```json
{
  "voice_profile": {
    "tone": "str (e.g., 'direct, data-driven, casual')",
    "sentence_structure": "str (e.g., 'short punchy lines')",
    "sign_off_pattern": "[str, ...]",
    "emoji_usage": "bool",
    "avg_message_length": "int (words)",
    "common_openers": "[str, ...]",
    "value_prop_style": "str",
    "confidence_score": 0.88
  }
}
```

**Personalized Email Generation**:
- Extract buyer pain from research brief
- Generate subject line (3 variants, scored by predicted open rate)
- Generate body (personalized: mentions specific company event, product fit reason)
- Include reply-friendly CTA (e.g., "Reply yes/no if curious")
- Sign off in cloned voice

**Sending Rules**:
- Respect daily send cap (default: 20/day, configurable)
- Respect per-domain send cap (default: 5/domain/day)
- Skip if domain reputation is flagged
- Skip if email fails validation
- Log send timestamp, recipient, full message body

---

#### Stage 4: Reply Handling
**Status**: Core feature for Phase 1 (with autonomy scaling)

**Responsibilities**:
- Monitor inbox for inbound replies (poll every 5 minutes or webhook)
- Classify reply into category:
  - **Positive**: Shows interest, ready to discuss
  - **Objection**: Concern raised (price, timing, use case fit, already using competitor)
  - **Unsubscribe**: Explicit opt-out or "stop emailing"
  - **Noise**: Out-of-office, bounce, spam complaint
  - **Unclear**: Low confidence classification

**Decision Logic (by Autonomy Level)**:
- **L1 (Approve everything)**: Flag all replies for human review
- **L2 (First touch approval)**:
  - Auto-handle unsubscribe/noise (pause sequence, mark in CRM)
  - Escalate positive/objection to rep with context
  - Log classification + rationale
- **L3 (Auto-send, review replies)**:
  - Auto-handle unsubscribe → pause + mark in CRM
  - Auto-generate objection rebuttal for common objections
  - Escalate unclear + objection to rep if confidence < 0.7
  - Positive → propose calendar slots (see Stage 5)
- **L4 (Fully autonomous)**:
  - All reply classifications auto-handled
  - Generate context-aware rebuttals for objections
  - Self-assess readiness for follow-up or escalation

**Reply Classification Outputs**:
```json
{
  "reply_id": "str",
  "received_timestamp": "datetime",
  "sender_email": "str",
  "classification": "positive|objection|unsubscribe|noise|unclear",
  "confidence": 0.92,
  "objection_type": "str (if applicable, e.g., 'already_using_competitor')",
  "extracted_sentiment": "str",
  "recommended_action": "escalate|auto_rebuttal|pause_sequence|book_meeting",
  "reasoning_log": "str (explain why this classification)"
}
```

---

#### Stage 5: Book
**Status**: Core feature for Phase 1

**Responsibilities (varies by autonomy level)**:
- **L1–L2**: Generate calendar proposal (rep reviews, sends manually)
- **L3+**: Auto-propose slots from rep's calendar, handle acceptance/rescheduling

**Process**:
1. Extract availability from rep's calendar (read via API or manual spec)
2. Identify prospect timezone (from IP or inferred from company)
3. Propose 3–5 meeting slots (preference: 10 AM–2 PM local time, Tuesday–Thursday)
4. Log proposal in CRM
5. Monitor for acceptance/rejection/reschedule
6. Auto-confirm or escalate if prospect pushes back

**Meeting Log Output** (to CRM):
```json
{
  "opportunity_id": "str",
  "account_name": "str",
  "contact_email": "str",
  "meeting_scheduled": "datetime",
  "meeting_source": "autonomous_bdr",
  "conversation_context": "str (summary of all prior exchanges)",
  "next_action": "str (rep's suggested follow-up)",
  "confidence_score": 0.85
}
```

---

### 2.2 Autonomy Levels

| Level | Approval Model | Best For | Risk | Implementation Complexity |
|-------|---|---|---|---|
| **L1** | Agent drafts everything; human sends every message | Compliance-sensitive, brand-heavy orgs | Low | Low |
| **L2** | Agent auto-follows up; human approves first touch only | Most enterprise SDR teams (Phase 1 default) | Low-Med | Medium |
| **L3** | All outreach auto-sent; human reviews replies only | Growth-stage scale-ups | Med | High |
| **L4** | Fully autonomous end-to-end | Founder-led outbound (Phase 1 option) | High | Highest |

**Phase 1 Default**: L2 (safe, saves time, builds trust)

---

### 2.3 Style Cloning Feasibility Matrix

| Capability | Data Needed | Feasibility | Difficulty | Phase |
|---|---|---|---|---|
| Voice & tone | ~30–50 sent emails | 88% | Easy | 1 |
| Subject line patterns | ~20 sent emails | 85% | Easy | 1 |
| Sign-off & formatting | ~10 sent emails | 92% | Easy | 1 |
| Cadence & follow-up timing | Emails + CRM timestamps | 65% | Medium | 2 |
| Value prop emphasis | Emails + win/loss data | 58% | Medium | 2 |
| Objection handling style | Reply threads + call transcripts | 50% | Medium | 2 |
| When to push vs. ease off | Requires outcome labels | 28% | Hard | 3 |
| Relationship reading | Likely not learnable | 14% | Hard | N/A (skip) |

**Phase 1 Baseline**: Voice + tone, subject lines, sign-off, formatting. Sufficient for 85%+ human-quality perception.

---

## 3. Technical Architecture

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Web App)                  │
│  • Config wizard (ICP, voice cloning, autonomy level)  │
│  • Dashboard (outreach status, reply queue)            │
│  • Transparent reasoning log viewer                    │
│  • Calendar picker for meeting booking                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              API Layer (REST/GraphQL)                   │
│  • /config, /campaigns, /outreach, /replies, /books   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Orchestration Engine (Core Loop)            │
│  ├─ Source stage (BYOL in Phase 1)                     │
│  ├─ Research stage (account briefing)                  │
│  ├─ Outreach stage (email generation + send)          │
│  ├─ Reply handling (classify + action)                │
│  └─ Book stage (calendar + CRM logging)               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                                                          │
├──────────────┬──────────────┬──────────────┬────────────┤
│              │              │              │            │
▼              ▼              ▼              ▼            ▼
LLM Ops   Email Ops      Inbox Monitor   Data Store   CRM Sync
├─Voice   ├─SMTP + Auth  ├─Poll / Webhook├─Messages   ├─OAuth2
│ cloning │├─SPF/DKIM    │├─Reply        │├─Accounts  │├─Batch
├─Email   │├─Warmup sched│ │  classify   │├─Outreach  │ │  writes
│ gen     │└─Bounce mgmt │└─Escalation   │├─Replies   │└─Mapping
└─        └─Caps/limits  └─              └─Reasoning  └─
```

### 3.2 Data Flow (Core Loop)

```
User uploads:           ┌─ Account list (BYOL)
Email samples          ─┤─ Rep's sent emails (voice clone)
ICP definition         └─ ICP filters + value prop

                              │
                              ▼
                    ┌─────────────────────┐
                    │  Research Engine    │
                    │  (per account)      │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Voice Profile +     │
                    │ Account Briefs      │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Email Generation    │
                    │ (personalized)      │
                    └─────────────────────┘
                              │
                              ▼
              (L1/L2: human approval)
              (L3/L4: auto-send)
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Send Email          │
                    │ + Log + Schedule FU │
                    └─────────────────────┘
                              │
        ┌─────────────────────┴──────────────┐
        │                                    │
        ▼                                    ▼
   Monitor Inbox             Auto-generate Follow-ups
   (5 min poll)              (per cadence rules)
        │                                    │
        ▼                                    ▼
   Classify Reply            Schedule Send
   + Extract Intent                │
        │                          ▼
        ├─ Unsubscribe ────►  Pause Sequence
        ├─ Positive    ────►  Propose Calendar
        ├─ Objection   ────►  (L2: escalate / L3+: rebuttal)
        └─ Noise       ────►  Archive
```

---

### 3.3 Data Models

#### Core Entities

```
User
├─ id: UUID
├─ email: str
├─ org_id: UUID (workspace)
├─ role: "founder" | "sdr_manager" | "sdr"
├─ created_at: datetime
└─ settings: {
   "autonomy_level": "L1" | "L2" | "L3" | "L4",
   "daily_cap": int (default 20),
   "voice_profile_id": UUID,
   "icp_filters": {...}
}

Campaign
├─ id: UUID
├─ user_id: UUID
├─ name: str
├─ icp_definition: {
│  "company_size": [min, max],
│  "industry": [str, ...],
│  "revenue_signals": [str, ...],
│  "tech_stack": [str, ...],
│  "exclude": {...}
│}
├─ status: "draft" | "active" | "paused" | "completed"
├─ created_at: datetime
├─ stats: {
│  "accounts_added": int,
│  "first_touches_sent": int,
│  "replies_received": int,
│  "meetings_booked": int,
│  "reply_rate": float
│}

VoiceProfile
├─ id: UUID
├─ user_id: UUID
├─ source_emails: [Email] (30–50 samples)
├─ extracted_voice: {
│  "tone": str,
│  "sentence_structure": str,
│  "emoji_usage": bool,
│  "sign_off_patterns": [str],
│  "avg_message_length": int,
│  "confidence_score": float (0–1)
│}
├─ created_at: datetime
└─ validated_by_user: bool

Outreach (Per Account)
├─ id: UUID
├─ campaign_id: UUID
├─ account_id: str (user-provided domain or ID)
├─ account_name: str
├─ buyer_email: str
├─ research_brief: {...} (see Stage 2 output)
├─ first_touch_id: Message (sent outreach)
├─ follow_ups: [Message] (scheduled / sent)
├─ status: "researched" | "first_touch_pending" | "first_touch_sent" | "awaiting_reply" | "engaged" | "booked" | "paused"
├─ autonomy_at_creation: "L1" | "L2" | "L3" | "L4"
├─ created_at: datetime
└─ updated_at: datetime

Message
├─ id: UUID
├─ outreach_id: UUID
├─ message_type: "first_touch" | "follow_up" | "objection_rebuttal"
├─ channel: "email" (LinkedIn in Phase 2+)
├─ direction: "outbound" | "inbound"
├─ sender_email: str
├─ recipient_email: str
├─ subject: str
├─ body: str
├─ personalization_used: [str] (e.g., "company_news", "hiring_signal")
├─ sent_timestamp: datetime
├─ status: "draft" | "approved" | "sent" | "bounced" | "failed"
├─ approval_by: UUID (user who approved, if L1/L2)
├─ reasoning_log: str (why this message was generated/sent)
└─ metadata: {
   "open_tracked": bool,
   "reply_received": bool,
   "reply_id": UUID (if inbound reply exists)
}

Reply
├─ id: UUID
├─ message_id: UUID (original outreach)
├─ outreach_id: UUID
├─ received_timestamp: datetime
├─ sender_email: str
├─ subject: str
├─ body: str
├─ classification: "positive" | "objection" | "unsubscribe" | "noise" | "unclear"
├─ confidence: float (0–1)
├─ objection_type: str (e.g., "already_using_competitor", "budget_constraint")
├─ extracted_intent: str (free text: what does prospect want?)
├─ action_taken: "escalated" | "auto_rebuttal_sent" | "paused" | "archived"
└─ reasoning_log: str (why this classification + action)

CalendarProposal
├─ id: UUID
├─ outreach_id: UUID
├─ proposed_slots: [
│  { "datetime": datetime, "duration_min": int, "timezone": str }
│]
├─ proposed_by_system: datetime (when proposal was sent)
├─ prospect_response: "pending" | "accepted" | "rejected" | "rescheduled"
├─ accepted_slot: datetime (if accepted)
└─ booked_meeting_id: UUID (once confirmed)

BookedMeeting (CRM-synced)
├─ id: UUID
├─ outreach_id: UUID
├─ account_name: str
├─ contact_email: str
├─ scheduled_datetime: datetime
├─ duration_min: int
├─ meeting_source: "autonomous_bdr"
├─ conversation_summary: str (all prior messages + sentiment)
├─ next_steps: str (rep's suggested follow-up)
├─ synced_to_crm: bool
├─ crm_record_id: str (external CRM ID)
└─ created_at: datetime
```

---

## 4. Integration Points

### 4.1 Email Service Integration
- **SMTP**: Send outreach (rep's domain or sender alias)
- **Inbox Monitoring**: OAuth2 to read inbound replies (Gmail, Outlook, or custom IMAP)
- **Deliverability**: SPF/DKIM validation, bounce handling, domain reputation checks

### 4.2 Calendar Integration
- **Google Calendar** or **Outlook**: Read rep availability, auto-book slots
- **Timezone detection**: Via prospect's IP or company location

### 4.3 CRM Integration (Phase 1: Optional)
- **Supported**: HubSpot, Salesforce (basic logging)
- **Data flow**: Booked meeting → create/update CRM record with full context
- **Approach**: OAuth2, batch writes (Phase 1), real-time (Phase 2+)

### 4.4 Data Enrichment APIs (Phase 2+)
- **Job boards**: LinkedIn, Angellist, Indeed
- **Funding signals**: Crunchbase, PitchBook
- **Tech stack**: BuiltWith, G2
- **Email finder**: Hunter, RocketReach, Apollo

---

## 5. Security & Compliance

### 5.1 Email Compliance
- **CAN-SPAM** (US): Provide physical address, clear unsubscribe, honor opt-outs within 10 days
- **GDPR** (EU): Consent requirement for cold outreach (except B2B under some conditions); respect GDPR deletion
- **CCPA** (CA): Disclosure + opt-out for CA residents
- **CASL** (Canada): Consent + clear identification of sender

**Implementation**:
- Add compliance footer (physical address, unsubscribe link) to every email
- Maintain unsubscribe list; pause agent on any unsubscribe
- Log consent status per contact
- Provide audit trail of all messages sent (for regulatory review)

### 5.2 Domain & Deliverability Safety
- **Domain warmup**: Manual or auto-warmup schedule before first outreach (avoid spam folder)
- **Daily caps**: Strict limits per domain (default: 5 emails/domain/day)
- **Bounce monitoring**: Skip bounced emails; pause domain if bounce rate > 5%
- **Complaint handling**: Pause domain on any spam complaint; escalate to user
- **IP rotation**: If using shared SMTP, rotate IPs for each domain

### 5.3 Brand Safety
- **Sender identification**: Every email clearly identifies the company and rep name (no spoofing)
- **Spam filter testing**: Pre-launch testing via Mail Tester, GlockApps
- **Human quality bar**: Generated emails must pass human review (L1/L2) or auto-validation against red flags:
  - Obvious AI markers ("As an AI", repetitive phrases)
  - Over-personalization (appears stalking-like)
  - Factual errors in research brief

### 5.4 Data Security
- **Encryption**: TLS for all SMTP/IMAP, HTTPS for API
- **Secrets**: OAuth tokens, SMTP creds stored in secure vault (Vault, AWS Secrets Manager)
- **PII handling**: Do not log email bodies in cleartext; hash or redact for analytics
- **Access control**: User can only see/manage their own campaigns + messages

---

## 6. UI/UX Requirements

### 6.1 Onboarding Flow
1. **Sign up** → email + password
2. **Connect email** → OAuth2 to Gmail/Outlook (for inbox monitoring)
3. **Define ICP** → industry, company size, tech stack, pain points
4. **Set value prop** → 1–2 key differentiators
5. **Clone voice** → upload 30–50 rep emails
6. **Choose autonomy** → L1, L2, L3, or L4 (default L2)
7. **Upload leads** → CSV with account domains/company names
8. **Review first email** (L1/L2) → approve template, then first touches auto-generate

### 6.2 Core Dashboard
- **Status overview**: Accounts in pipeline, first touches sent, replies received, meetings booked
- **Active campaigns**: List with KPIs (reply rate, meeting rate, velocity)
- **Reply queue**: Pending replies (with classification + suggested action)
- **Reasoning log**: Click any action to see why the system made that decision
- **Settings panel**: Update autonomy level, daily caps, ICP, voice profile

### 6.3 Transparency Features (Critical for Trust)
Every outreach action should show:
- **What signal triggered this?** (e.g., "Prospect company just raised Series B")
- **What rule applied?** (e.g., "Match ICP: SaaS, Series B, 50–200 employees")
- **Why this message?** (e.g., "Voice profile: casual, direct; personalizations: funding news, product fit")
- **What's next?** (e.g., "Follow-up scheduled for 3 days if no reply")

---

## 7. Implementation Roadmap

### Phase 1: MVP (Weeks 1–4)
**Goal**: Email-only, BYOL, L2 autonomy. Prove core loop works.

**Deliverables**:
- [ ] Onboarding flow (ICP, voice cloning, email connection)
- [ ] Voice cloning engine (extract tone, templates from 30–50 emails)
- [ ] Email generation (personalized first touches)
- [ ] SMTP integration (send + bounce handling)
- [ ] Inbox monitoring (poll Gmail/Outlook for replies)
- [ ] Reply classification (positive, objection, unsubscribe, noise)
- [ ] Message approval UI (L2 only first touch)
- [ ] Dashboard (basic: sent, replied, pending)
- [ ] CRM logging (basic: booked meetings to Hubspot)

**Success Criteria**:
- Reply rate ≥ 15% (human-written email baseline)
- 90% accuracy on reply classification
- Zero spam complaints in first 100 emails sent

---

### Phase 2: Sourcing + Signals (Months 2–3)
**Goal**: Add lead sourcing + real-time signal response.

**Deliverables**:
- [ ] Intent signal integration (funding, hiring, job changes via API)
- [ ] Auto-research expansion (expand beyond uploaded list)
- [ ] Real-time trigger outreach (new signal → email in minutes)
- [ ] Self-improvement loop (track which messages get replies, optimize)
- [ ] Cadence automation (multi-touch sequences, timed follow-ups)
- [ ] Advanced reasoning log (show which signals + data sources drove decision)

**Success Criteria**:
- 5× higher reply rate on real-time signal emails vs. cold outreach
- Self-improvement loop measurably improves reply rate by 10%+ over 30 days

---

### Phase 3: Autonomy + Channels (Months 4–6)
**Goal**: Add LinkedIn, raise autonomy, self-improving loop.

**Deliverables**:
- [ ] LinkedIn integration (sourcing + outreach + replies)
- [ ] Autonomy L3 + L4 support (auto-send, handle replies end-to-end)
- [ ] Objection rebuttal engine (context-aware responses to common objections)
- [ ] Calendar integration (auto-propose slots, handle rescheduling)
- [ ] Outcome tracking (win/loss labels to improve voice cloning)
- [ ] Advanced analytics (cohort analysis: which ICPs, personas, messages perform best)

**Success Criteria**:
- Objection rebuttal accuracy ≥ 80% (prospects respond positively)
- 40%+ of booked meetings closed (with CRM attribution)
- Support for L3/L4 with <5% of users opting for fully autonomous mode initially

---

## 8. Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Spam at scale** | High | Critical | Daily caps, bounce monitoring, auto-pause on complaints. Pre-launch testing. |
| **"Obviously AI" detection** | High | High | Human-quality bar in approval. Randomize formatting/signing. Train on human emails. |
| **Regulatory exposure** | Medium | Critical | Compliance footer, consent tracking, unsubscribe handling, audit trail. Geo-fence initially (US only). |
| **Rep adoption failure** | Medium | High | Transparent reasoning log (glass box). Approval gates (L2 default). Weekly digest for non-users. |
| **Runaway reply handling** | Medium | High | Conservative classifier. Escalate on low confidence. Manual review of "unsubscribe" handling. |
| **Attribution ambiguity** | Low | Medium | Tag every booking with source. CRM logging. Weekly report to user. |
| **Calendar sync bugs** | Low | Medium | Extensive testing. Manual confirmation flow for first 3 bookings. |
| **Voice cloning misses rep style** | Medium | Medium | 50-email minimum. User can curate samples. Allow manual override of voice profile. |

---

## 9. Success Metrics (by Phase)

### Phase 1 Metrics
- **Adoption**: 50+ pilot users (founders + early SDR teams)
- **Engagement**: >80% of users send ≥1 first touch
- **Quality**: Reply rate ≥ 15% (vs. typical cold email 2–5%)
- **Safety**: Zero spam complaints, zero compliance violations
- **Reasoning**: >80% of users view reasoning log at least once

### Phase 2 Metrics
- **Signal quality**: 5× higher reply rate on real-time signal emails
- **Self-improvement**: Measurable 10%+ improvement in reply rate over 30 days
- **Retention**: >60% of Phase 1 users active in Phase 2

### Phase 3 Metrics
- **Autonomy adoption**: 30%+ of users move to L3/L4
- **Booking rate**: 40%+ of replied meetings booked (CRM-tracked)
- **NRR**: Net revenue retention >120% (for paid tiers)

---

## 10. Appendix: Open Questions for Stakeholders

1. **Founder vs. SDR teams**: Who is the primary user for Phase 1? (Decision shapes onboarding, autonomy defaults, GTM)
2. **Pricing model**: Per-user, per-email-sent, per-meeting-booked, or tiered?
3. **Self-hosting**: Do customers need to run on their own domain, or is a shared sending domain acceptable?
4. **CRM integration priority**: Which CRM is most critical for Phase 1? (HubSpot, Salesforce, other?)
5. **Outcome labels**: Is user willing to tag replies as "good lead", "not ICP", etc.? (Required for self-improvement loop in Phase 2)
6. **Existing vendor stance**: Will this replace Outreach/SalesLoft, or integrate with them?

---

**Version**: 1.0
**Last Updated**: 2026-03-28
**Status**: Ready for Phase 1 implementation planning
