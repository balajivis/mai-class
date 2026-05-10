# Autonomous BDR — Technical Specification (Visual Edition)

## Executive Summary

The Autonomous BDR is an AI-powered agent that automates the full outbound sales cycle: sourcing leads, personalizing outreach, handling replies, and booking meetings. The product operates across multiple autonomy levels (L1-L4) with human review gates, starting with email-only, bring-your-own-list (BYOL) mode at L2 autonomy.

```mermaid
mindmap
  root((Autonomous BDR))
    Source
      BYOL Phase 1
      Signal-Based Phase 2
    Research
      Account Briefs
      Pain Indicators
      Buyer Persona
    Outreach
      Voice Cloning
      Personalized Email
      Send Management
    Reply Handling
      Classification
      Escalation
      Auto-Rebuttal
    Book
      Calendar Proposals
      CRM Logging
      Confirmation
```

---

## 1. Vision & Scope

### Product Goals
- **Primary Goal**: Enable early-stage startups and SDR teams to run autonomous outbound without hiring new reps
- **Success Metric**: 5-10x improvement in outbound efficiency by eliminating non-selling tasks
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

The core loop moves each prospect through five sequential stages. The diagram below shows the full pipeline with decision points controlled by autonomy level.

```mermaid
flowchart TB
    subgraph S1["STAGE 1: SOURCE"]
        direction LR
        s1a["Upload CSV<br/>(BYOL - Phase 1)"]
        s1b["Signal Detection<br/>(Phase 2+)"]
        s1a --> leads["Lead List +<br/>Relevance Scores"]
        s1b --> leads
    end

    subgraph S2["STAGE 2: RESEARCH"]
        direction LR
        r1["Fetch Org Chart"]
        r2["Extract Company News"]
        r3["Identify Pain Indicators"]
        r4["Build Buyer Persona"]
        r1 & r2 & r3 & r4 --> brief["Account Brief<br/>(2-3 KB context)"]
    end

    subgraph S3["STAGE 3: OUTREACH"]
        direction LR
        vc["Voice Cloning<br/>(30-50 emails)"]
        eg["Email Generation<br/>(3 subject variants)"]
        vc --> eg
        eg --> send["Send Email<br/>+ Schedule Follow-ups"]
    end

    subgraph S4["STAGE 4: REPLY HANDLING"]
        direction LR
        monitor["Monitor Inbox<br/>(5 min poll)"]
        classify["Classify Reply"]
        monitor --> classify
        classify --> pos["Positive"]
        classify --> obj["Objection"]
        classify --> unsub["Unsubscribe"]
        classify --> noise["Noise / OOO"]
        classify --> unclear["Unclear"]
    end

    subgraph S5["STAGE 5: BOOK"]
        direction LR
        slots["Propose 3-5<br/>Calendar Slots"]
        confirm["Confirm Meeting"]
        crm["Log to CRM"]
        slots --> confirm --> crm
    end

    S1 ==> S2
    S2 ==> S3
    S3 ==> S4
    S4 -- "Positive" --> S5
    S4 -- "Objection<br/>(L3+: auto-rebuttal)" --> S3
    S4 -- "Unsubscribe" --> pause["Pause Sequence"]
    S4 -- "Noise" --> archive["Archive"]
    S4 -- "Unclear / Low Confidence" --> escalate["Escalate to Rep"]

    style S1 fill:#e8f4f8,stroke:#2196F3,stroke-width:2px
    style S2 fill:#e8f5e9,stroke:#4CAF50,stroke-width:2px
    style S3 fill:#fff3e0,stroke:#FF9800,stroke-width:2px
    style S4 fill:#fce4ec,stroke:#E91E63,stroke-width:2px
    style S5 fill:#f3e5f5,stroke:#9C27B0,stroke-width:2px
    style pause fill:#ffcdd2,stroke:#c62828
    style archive fill:#e0e0e0,stroke:#616161
    style escalate fill:#fff9c4,stroke:#f9a825
```

---

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
- Assemble per-account brief (max 2-3 KB context)

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

**Email Generation Pipeline**:

```mermaid
flowchart LR
    subgraph Inputs
        emails["Rep's Sent Emails<br/>(30-50 samples)"]
        brief["Account Brief"]
        icp["ICP + Value Prop"]
    end

    subgraph VoiceEngine["Voice Cloning Engine"]
        extract["Extract Patterns"]
        profile["Build Voice Profile"]
        extract --> profile
    end

    subgraph Generation["Email Generation"]
        pain["Extract Buyer Pain"]
        subject["Generate 3 Subject<br/>Line Variants"]
        body["Generate Personalized<br/>Body"]
        cta["Add Reply-Friendly CTA"]
        pain --> subject --> body --> cta
    end

    subgraph Delivery["Send Management"]
        validate["Validate Email"]
        caps["Check Daily Caps<br/>(20/day default)"]
        domain["Check Domain Cap<br/>(5/domain/day)"]
        rep["Check Domain<br/>Reputation"]
        schedule["Schedule Send<br/>(Timezone-Optimized)"]
        validate --> caps --> domain --> rep --> schedule
    end

    emails --> VoiceEngine
    brief & icp --> Generation
    VoiceEngine --> Generation
    Generation --> Delivery

    style VoiceEngine fill:#e3f2fd,stroke:#1565C0,stroke-width:2px
    style Generation fill:#e8f5e9,stroke:#2E7D32,stroke-width:2px
    style Delivery fill:#fff8e1,stroke:#F57F17,stroke-width:2px
```

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

**Sending Rules**:
- Respect daily send cap (default: 20/day, configurable)
- Respect per-domain send cap (default: 5/domain/day)
- Skip if domain reputation is flagged
- Skip if email fails validation
- Log send timestamp, recipient, full message body

---

#### Stage 4: Reply Handling — State Machine

The reply handler classifies inbound messages and routes them through a state machine that adapts behavior by autonomy level.

```mermaid
stateDiagram-v2
    [*] --> InboxMonitor: New reply detected

    InboxMonitor --> Classify: Parse + extract intent

    Classify --> Positive: Interest detected
    Classify --> Objection: Concern raised
    Classify --> Unsubscribe: Opt-out request
    Classify --> Noise: OOO / Bounce / Spam
    Classify --> Unclear: Low confidence

    state Positive {
        [*] --> CheckAutonomy_P
        CheckAutonomy_P --> ProposeCalendar: L3 / L4
        CheckAutonomy_P --> EscalateToRep_P: L1 / L2
        ProposeCalendar --> BookMeeting
    }

    state Objection {
        [*] --> CheckAutonomy_O
        CheckAutonomy_O --> AutoRebuttal: L3+ & confidence >= 0.7
        CheckAutonomy_O --> EscalateToRep_O: L1 / L2 or confidence < 0.7
        AutoRebuttal --> MonitorResponse
    }

    Unsubscribe --> PauseSequence: All levels auto-handle
    PauseSequence --> MarkInCRM

    Noise --> Archive: All levels auto-handle

    Unclear --> EscalateToRep_U: All levels escalate

    note right of Classify
        Classification categories:
        - Positive (interest)
        - Objection (concern)
        - Unsubscribe (opt-out)
        - Noise (OOO/bounce)
        - Unclear (low conf.)
    end note
```

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

**Process**:
1. Extract availability from rep's calendar (read via API or manual spec)
2. Identify prospect timezone (from IP or inferred from company)
3. Propose 3-5 meeting slots (preference: 10 AM-2 PM local time, Tuesday-Thursday)
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

The four autonomy levels form a spectrum from fully human-supervised to fully autonomous. Each level unlocks more automated actions while accepting more risk.

```mermaid
flowchart LR
    subgraph L1["L1: DRAFT MODE"]
        direction TB
        l1a["Agent drafts everything"]
        l1b["Human sends EVERY message"]
        l1c["Risk: LOW"]
        l1d["Complexity: LOW"]
    end

    subgraph L2["L2: FIRST TOUCH APPROVAL"]
        direction TB
        l2a["Human approves first touch"]
        l2b["Auto follow-ups"]
        l2c["Auto unsubscribe/noise"]
        l2d["Risk: LOW-MED"]
        l2e["Complexity: MEDIUM"]
    end

    subgraph L3["L3: AUTO-SEND"]
        direction TB
        l3a["All outreach auto-sent"]
        l3b["Human reviews replies only"]
        l3c["Auto-rebuttal if conf >= 0.7"]
        l3d["Risk: MEDIUM"]
        l3e["Complexity: HIGH"]
    end

    subgraph L4["L4: FULLY AUTONOMOUS"]
        direction TB
        l4a["End-to-end autonomous"]
        l4b["Self-assess readiness"]
        l4c["Context-aware rebuttals"]
        l4d["Risk: HIGH"]
        l4e["Complexity: HIGHEST"]
    end

    L1 --> L2 --> L3 --> L4

    style L1 fill:#e8f5e9,stroke:#4CAF50,stroke-width:3px,color:#1B5E20
    style L2 fill:#e3f2fd,stroke:#2196F3,stroke-width:3px,color:#0D47A1
    style L3 fill:#fff3e0,stroke:#FF9800,stroke-width:3px,color:#E65100
    style L4 fill:#fce4ec,stroke:#E91E63,stroke-width:3px,color:#880E4F
```

#### Autonomy Decision Tree

Use this decision tree to recommend the appropriate autonomy level for a given customer.

```mermaid
flowchart TD
    start{{"What type of<br/>organization?"}}
    start -->|"Compliance-sensitive /<br/>brand-heavy"| L1["L1: Draft Mode<br/>Human sends everything"]
    start -->|"Enterprise SDR team"| q2{{"Risk tolerance?"}}
    start -->|"Growth-stage scale-up"| q3{{"Trust in AI outreach?"}}
    start -->|"Founder-led outbound"| q4{{"Volume needed?"}}

    q2 -->|"Conservative"| L2["L2: First Touch Approval<br/>(Phase 1 Default)"]
    q2 -->|"Moderate"| L2

    q3 -->|"Low-Medium"| L2
    q3 -->|"High"| L3["L3: Auto-Send<br/>Human reviews replies"]

    q4 -->|"< 50 emails/day"| L2
    q4 -->|"> 50 emails/day"| L4["L4: Fully Autonomous"]

    style L1 fill:#e8f5e9,stroke:#4CAF50,stroke-width:2px
    style L2 fill:#e3f2fd,stroke:#2196F3,stroke-width:2px
    style L3 fill:#fff3e0,stroke:#FF9800,stroke-width:2px
    style L4 fill:#fce4ec,stroke:#E91E63,stroke-width:2px
    style start fill:#f5f5f5,stroke:#424242,stroke-width:2px
```

| Level | Approval Model | Best For | Risk | Implementation Complexity |
|-------|---|---|---|---|
| **L1** | Agent drafts everything; human sends every message | Compliance-sensitive, brand-heavy orgs | Low | Low |
| **L2** | Agent auto-follows up; human approves first touch only | Most enterprise SDR teams (Phase 1 default) | Low-Med | Medium |
| **L3** | All outreach auto-sent; human reviews replies only | Growth-stage scale-ups | Med | High |
| **L4** | Fully autonomous end-to-end | Founder-led outbound (Phase 1 option) | High | Highest |

**Phase 1 Default**: L2 (safe, saves time, builds trust)

---

### 2.3 Style Cloning Feasibility Matrix

The following chart visualizes the feasibility and phasing of each style-cloning capability. Higher bars indicate greater feasibility; color indicates the target implementation phase.

```mermaid
xychart-beta
    title "Style Cloning Feasibility by Capability"
    x-axis ["Sign-off &<br/>Formatting", "Voice &<br/>Tone", "Subject Line<br/>Patterns", "Cadence &<br/>Timing", "Value Prop<br/>Emphasis", "Objection<br/>Handling", "Push vs<br/>Ease Off", "Relationship<br/>Reading"]
    y-axis "Feasibility %" 0 --> 100
    bar [92, 88, 85, 65, 58, 50, 28, 14]
```

| Capability | Data Needed | Feasibility | Difficulty | Phase |
|---|---|---|---|---|
| Voice & tone | ~30-50 sent emails | 88% | Easy | 1 |
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

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Web App)"]
        wizard["Config Wizard<br/>ICP, Voice, Autonomy"]
        dashboard["Dashboard<br/>Status, Reply Queue"]
        reasoning["Reasoning Log<br/>Viewer"]
        calendar["Calendar Picker"]
    end

    subgraph API["API Layer (REST / GraphQL)"]
        config["/config"]
        campaigns["/campaigns"]
        outreach["/outreach"]
        replies["/replies"]
        books["/books"]
    end

    subgraph Core["Orchestration Engine (Core Loop)"]
        stage1["Source<br/>(BYOL Phase 1)"]
        stage2["Research<br/>(Account Briefing)"]
        stage3["Outreach<br/>(Email Gen + Send)"]
        stage4["Reply Handling<br/>(Classify + Action)"]
        stage5["Book<br/>(Calendar + CRM)"]
        stage1 --> stage2 --> stage3 --> stage4 --> stage5
    end

    subgraph Services["Backend Services"]
        llm["LLM Ops<br/>Voice Cloning<br/>Email Gen"]
        email["Email Ops<br/>SMTP + Auth<br/>SPF/DKIM<br/>Warmup<br/>Bounce Mgmt"]
        inbox["Inbox Monitor<br/>Poll / Webhook<br/>Reply Classify<br/>Escalation"]
        data["Data Store<br/>Messages<br/>Accounts<br/>Outreach<br/>Replies<br/>Reasoning"]
        crm["CRM Sync<br/>OAuth2<br/>Batch Writes<br/>Field Mapping"]
    end

    Frontend --> API
    API --> Core
    Core --> llm & email & inbox & data & crm

    style Frontend fill:#e8f4f8,stroke:#0288D1,stroke-width:2px
    style API fill:#f3e5f5,stroke:#7B1FA2,stroke-width:2px
    style Core fill:#e8f5e9,stroke:#388E3C,stroke-width:2px
    style Services fill:#fff3e0,stroke:#E65100,stroke-width:2px
```

---

### 3.2 Data Flow (Core Loop)

```mermaid
flowchart TB
    subgraph UserInput["User Uploads"]
        csv["Account List<br/>(CSV)"]
        emails["Rep's Sent Emails<br/>(30-50)"]
        icp["ICP Filters +<br/>Value Prop"]
    end

    research["Research Engine<br/>(per account)"]
    profiles["Voice Profile +<br/>Account Briefs"]
    generation["Email Generation<br/>(personalized)"]

    decision{{"Autonomy<br/>Level?"}}
    approve["Human Approval<br/>(L1/L2)"]
    autosend["Auto-Send<br/>(L3/L4)"]

    send["Send Email<br/>+ Log + Schedule FU"]

    subgraph Monitor["Inbox Monitoring"]
        poll["Poll Inbox<br/>(5 min)"]
        classify["Classify Reply<br/>+ Extract Intent"]
    end

    followup["Auto-Generate<br/>Follow-ups"]

    unsub_action["Pause Sequence"]
    pos_action["Propose Calendar"]
    obj_action["Rebuttal or Escalate"]
    noise_action["Archive"]

    csv & emails & icp --> research
    research --> profiles --> generation
    generation --> decision
    decision -->|"L1 / L2"| approve --> send
    decision -->|"L3 / L4"| autosend --> send
    send --> Monitor & followup
    followup --> send
    classify -->|"Unsubscribe"| unsub_action
    classify -->|"Positive"| pos_action
    classify -->|"Objection"| obj_action
    classify -->|"Noise"| noise_action

    style UserInput fill:#e3f2fd,stroke:#1565C0,stroke-width:2px
    style Monitor fill:#fce4ec,stroke:#C62828,stroke-width:2px
```

---

### 3.3 Data Models — Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Campaign : creates
    User ||--o| VoiceProfile : has
    Campaign ||--o{ Outreach : contains
    Outreach ||--o{ Message : generates
    Outreach ||--o{ Reply : receives
    Outreach ||--o| CalendarProposal : triggers
    Message ||--o| Reply : receives
    CalendarProposal ||--o| BookedMeeting : confirms
    Outreach ||--o| BookedMeeting : results_in

    User {
        UUID id PK
        string email
        UUID org_id
        enum role "founder | sdr_manager | sdr"
        datetime created_at
        enum autonomy_level "L1 | L2 | L3 | L4"
        int daily_cap
        UUID voice_profile_id FK
    }

    Campaign {
        UUID id PK
        UUID user_id FK
        string name
        json icp_definition
        enum status "draft | active | paused | completed"
        datetime created_at
        int accounts_added
        int first_touches_sent
        int replies_received
        int meetings_booked
        float reply_rate
    }

    VoiceProfile {
        UUID id PK
        UUID user_id FK
        json source_emails
        string tone
        string sentence_structure
        boolean emoji_usage
        float confidence_score
        datetime created_at
        boolean validated_by_user
    }

    Outreach {
        UUID id PK
        UUID campaign_id FK
        string account_id
        string account_name
        string buyer_email
        json research_brief
        enum status "researched | first_touch_pending | first_touch_sent | awaiting_reply | engaged | booked | paused"
        enum autonomy_at_creation "L1 | L2 | L3 | L4"
        datetime created_at
    }

    Message {
        UUID id PK
        UUID outreach_id FK
        enum message_type "first_touch | follow_up | objection_rebuttal"
        enum direction "outbound | inbound"
        string sender_email
        string recipient_email
        string subject
        text body
        enum status "draft | approved | sent | bounced | failed"
        UUID approval_by
        text reasoning_log
        datetime sent_timestamp
    }

    Reply {
        UUID id PK
        UUID message_id FK
        UUID outreach_id FK
        datetime received_timestamp
        string sender_email
        text body
        enum classification "positive | objection | unsubscribe | noise | unclear"
        float confidence
        string objection_type
        text extracted_intent
        enum action_taken "escalated | auto_rebuttal_sent | paused | archived"
        text reasoning_log
    }

    CalendarProposal {
        UUID id PK
        UUID outreach_id FK
        json proposed_slots
        datetime proposed_by_system
        enum prospect_response "pending | accepted | rejected | rescheduled"
        datetime accepted_slot
        UUID booked_meeting_id FK
    }

    BookedMeeting {
        UUID id PK
        UUID outreach_id FK
        string account_name
        string contact_email
        datetime scheduled_datetime
        int duration_min
        string meeting_source
        text conversation_summary
        boolean synced_to_crm
        string crm_record_id
    }
```

---

## 4. Integration Points

### Integration Topology

```mermaid
flowchart TB
    subgraph BDR["Autonomous BDR Platform"]
        core["Orchestration<br/>Engine"]
    end

    subgraph EmailSvc["Email Services"]
        smtp["SMTP<br/>(Rep's domain / alias)"]
        inbox_oauth["Inbox OAuth2<br/>(Gmail / Outlook / IMAP)"]
        deliverability["Deliverability<br/>SPF / DKIM / Bounce"]
    end

    subgraph CalSvc["Calendar Services"]
        gcal["Google Calendar"]
        outlook_cal["Outlook Calendar"]
        tz["Timezone Detection<br/>(IP / Company Location)"]
    end

    subgraph CRMSvc["CRM Integration (Phase 1: Optional)"]
        hubspot["HubSpot"]
        salesforce["Salesforce"]
        crm_sync["OAuth2 + Batch Writes"]
    end

    subgraph DataAPIs["Data Enrichment APIs (Phase 2+)"]
        jobs["Job Boards<br/>LinkedIn, Angellist, Indeed"]
        funding["Funding Signals<br/>Crunchbase, PitchBook"]
        tech["Tech Stack<br/>BuiltWith, G2"]
        emailfind["Email Finder<br/>Hunter, RocketReach, Apollo"]
    end

    core <-->|"Send outreach"| smtp
    core <-->|"Read replies"| inbox_oauth
    core <-->|"Validate"| deliverability
    core <-->|"Read availability<br/>/ Auto-book"| gcal & outlook_cal
    core -->|"Detect TZ"| tz
    core -->|"Log meetings"| crm_sync
    crm_sync --> hubspot & salesforce
    core <-->|"Enrich accounts"| jobs & funding & tech & emailfind

    style BDR fill:#e8f5e9,stroke:#2E7D32,stroke-width:3px
    style EmailSvc fill:#e3f2fd,stroke:#1565C0,stroke-width:2px
    style CalSvc fill:#f3e5f5,stroke:#7B1FA2,stroke-width:2px
    style CRMSvc fill:#fff3e0,stroke:#E65100,stroke-width:2px
    style DataAPIs fill:#fce4ec,stroke:#C62828,stroke-width:2px
```

### 4.1 Email Service Integration
- **SMTP**: Send outreach (rep's domain or sender alias)
- **Inbox Monitoring**: OAuth2 to read inbound replies (Gmail, Outlook, or custom IMAP)
- **Deliverability**: SPF/DKIM validation, bounce handling, domain reputation checks

### 4.2 Calendar Integration
- **Google Calendar** or **Outlook**: Read rep availability, auto-book slots
- **Timezone detection**: Via prospect's IP or company location

### 4.3 CRM Integration (Phase 1: Optional)
- **Supported**: HubSpot, Salesforce (basic logging)
- **Data flow**: Booked meeting -> create/update CRM record with full context
- **Approach**: OAuth2, batch writes (Phase 1), real-time (Phase 2+)

### 4.4 Data Enrichment APIs (Phase 2+)
- **Job boards**: LinkedIn, Angellist, Indeed
- **Funding signals**: Crunchbase, PitchBook
- **Tech stack**: BuiltWith, G2
- **Email finder**: Hunter, RocketReach, Apollo

---

## 5. Security & Compliance

### Compliance Framework Overview

```mermaid
flowchart TB
    subgraph Regulations["Regulatory Compliance"]
        canspam["CAN-SPAM (US)<br/>Physical address<br/>Unsubscribe link<br/>Honor opt-outs 10d"]
        gdpr["GDPR (EU)<br/>Consent for cold outreach<br/>GDPR deletion support"]
        ccpa["CCPA (CA)<br/>Disclosure + opt-out<br/>CA residents"]
        casl["CASL (Canada)<br/>Consent + sender ID"]
    end

    subgraph Safeguards["Technical Safeguards"]
        direction TB
        footer["Compliance Footer<br/>(every email)"]
        unsub_list["Unsubscribe List<br/>(auto-pause)"]
        consent["Consent Tracking<br/>(per contact)"]
        audit["Audit Trail<br/>(all messages)"]
    end

    subgraph DeliverSafe["Domain & Deliverability"]
        warmup["Domain Warmup<br/>Schedule"]
        caps["Daily Caps<br/>(5/domain/day)"]
        bounce["Bounce Monitor<br/>(pause if > 5%)"]
        complaint["Complaint Handler<br/>(auto-pause)"]
        iprotate["IP Rotation<br/>(shared SMTP)"]
    end

    subgraph BrandSafe["Brand Safety"]
        sender_id["Clear Sender ID<br/>(no spoofing)"]
        spam_test["Pre-launch Spam<br/>Filter Testing"]
        quality["Human Quality Bar<br/>AI marker detection<br/>Over-personalization<br/>Factual errors"]
    end

    subgraph DataSec["Data Security"]
        tls["TLS / HTTPS<br/>(all connections)"]
        vault["Secrets Vault<br/>(OAuth, SMTP creds)"]
        pii["PII Protection<br/>(hash/redact bodies)"]
        acl["Access Control<br/>(user-scoped)"]
    end

    Regulations --> Safeguards
    Safeguards --> DeliverSafe & BrandSafe & DataSec

    style Regulations fill:#ffcdd2,stroke:#C62828,stroke-width:2px
    style Safeguards fill:#fff9c4,stroke:#F57F17,stroke-width:2px
    style DeliverSafe fill:#e3f2fd,stroke:#1565C0,stroke-width:2px
    style BrandSafe fill:#e8f5e9,stroke:#2E7D32,stroke-width:2px
    style DataSec fill:#f3e5f5,stroke:#7B1FA2,stroke-width:2px
```

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

```mermaid
flowchart LR
    s1["1. Sign Up<br/>Email + Password"]
    s2["2. Connect Email<br/>OAuth2<br/>Gmail / Outlook"]
    s3["3. Define ICP<br/>Industry, Size,<br/>Tech Stack, Pain"]
    s4["4. Set Value Prop<br/>1-2 Key<br/>Differentiators"]
    s5["5. Clone Voice<br/>Upload 30-50<br/>Rep Emails"]
    s6["6. Choose Autonomy<br/>L1-L4<br/>(Default: L2)"]
    s7["7. Upload Leads<br/>CSV with<br/>Account Domains"]
    s8["8. Review First Email<br/>(L1/L2)<br/>Approve Template"]

    s1 --> s2 --> s3 --> s4 --> s5 --> s6 --> s7 --> s8

    style s1 fill:#e3f2fd,stroke:#1565C0
    style s2 fill:#e3f2fd,stroke:#1565C0
    style s3 fill:#e8f5e9,stroke:#2E7D32
    style s4 fill:#e8f5e9,stroke:#2E7D32
    style s5 fill:#fff3e0,stroke:#E65100
    style s6 fill:#fff3e0,stroke:#E65100
    style s7 fill:#f3e5f5,stroke:#7B1FA2
    style s8 fill:#f3e5f5,stroke:#7B1FA2
```

### 6.2 Core Dashboard
- **Status overview**: Accounts in pipeline, first touches sent, replies received, meetings booked
- **Active campaigns**: List with KPIs (reply rate, meeting rate, velocity)
- **Reply queue**: Pending replies (with classification + suggested action)
- **Reasoning log**: Click any action to see why the system made that decision
- **Settings panel**: Update autonomy level, daily caps, ICP, voice profile

### 6.3 Transparency Features (Critical for Trust)
Every outreach action should show:
- **What signal triggered this?** (e.g., "Prospect company just raised Series B")
- **What rule applied?** (e.g., "Match ICP: SaaS, Series B, 50-200 employees")
- **Why this message?** (e.g., "Voice profile: casual, direct; personalizations: funding news, product fit")
- **What's next?** (e.g., "Follow-up scheduled for 3 days if no reply")

---

## 7. Implementation Roadmap

### Phase Timeline (Gantt)

```mermaid
gantt
    title Implementation Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Phase 1 - MVP
    Onboarding flow                 :p1a, 2026-04-01, 7d
    Voice cloning engine            :p1b, 2026-04-01, 10d
    Email generation                :p1c, after p1b, 7d
    SMTP integration                :p1d, 2026-04-08, 7d
    Inbox monitoring                :p1e, 2026-04-15, 7d
    Reply classification            :p1f, after p1e, 5d
    Message approval UI (L2)        :p1g, 2026-04-15, 7d
    Dashboard (basic)               :p1h, 2026-04-22, 5d
    CRM logging (HubSpot)           :p1i, 2026-04-22, 5d
    Phase 1 testing + launch        :milestone, p1m, 2026-04-28, 0d

    section Phase 2 - Sourcing + Signals
    Intent signal integration       :p2a, 2026-05-01, 14d
    Auto-research expansion         :p2b, 2026-05-01, 14d
    Real-time trigger outreach      :p2c, after p2a, 10d
    Self-improvement loop           :p2d, 2026-05-15, 14d
    Cadence automation              :p2e, 2026-05-15, 14d
    Advanced reasoning log          :p2f, after p2d, 7d
    Phase 2 complete                :milestone, p2m, 2026-06-30, 0d

    section Phase 3 - Autonomy + Channels
    LinkedIn integration            :p3a, 2026-07-01, 21d
    L3 + L4 autonomy support        :p3b, 2026-07-01, 21d
    Objection rebuttal engine       :p3c, after p3a, 14d
    Calendar integration            :p3d, 2026-07-22, 14d
    Outcome tracking                :p3e, 2026-08-01, 14d
    Advanced analytics              :p3f, after p3e, 14d
    Phase 3 complete                :milestone, p3m, 2026-09-30, 0d
```

### Phase 1: MVP (Weeks 1-4)
**Goal**: Email-only, BYOL, L2 autonomy. Prove core loop works.

**Deliverables**:
- [ ] Onboarding flow (ICP, voice cloning, email connection)
- [ ] Voice cloning engine (extract tone, templates from 30-50 emails)
- [ ] Email generation (personalized first touches)
- [ ] SMTP integration (send + bounce handling)
- [ ] Inbox monitoring (poll Gmail/Outlook for replies)
- [ ] Reply classification (positive, objection, unsubscribe, noise)
- [ ] Message approval UI (L2 only first touch)
- [ ] Dashboard (basic: sent, replied, pending)
- [ ] CRM logging (basic: booked meetings to Hubspot)

**Success Criteria**:
- Reply rate >= 15% (human-written email baseline)
- 90% accuracy on reply classification
- Zero spam complaints in first 100 emails sent

---

### Phase 2: Sourcing + Signals (Months 2-3)
**Goal**: Add lead sourcing + real-time signal response.

**Deliverables**:
- [ ] Intent signal integration (funding, hiring, job changes via API)
- [ ] Auto-research expansion (expand beyond uploaded list)
- [ ] Real-time trigger outreach (new signal -> email in minutes)
- [ ] Self-improvement loop (track which messages get replies, optimize)
- [ ] Cadence automation (multi-touch sequences, timed follow-ups)
- [ ] Advanced reasoning log (show which signals + data sources drove decision)

**Success Criteria**:
- 5x higher reply rate on real-time signal emails vs. cold outreach
- Self-improvement loop measurably improves reply rate by 10%+ over 30 days

---

### Phase 3: Autonomy + Channels (Months 4-6)
**Goal**: Add LinkedIn, raise autonomy, self-improving loop.

**Deliverables**:
- [ ] LinkedIn integration (sourcing + outreach + replies)
- [ ] Autonomy L3 + L4 support (auto-send, handle replies end-to-end)
- [ ] Objection rebuttal engine (context-aware responses to common objections)
- [ ] Calendar integration (auto-propose slots, handle rescheduling)
- [ ] Outcome tracking (win/loss labels to improve voice cloning)
- [ ] Advanced analytics (cohort analysis: which ICPs, personas, messages perform best)

**Success Criteria**:
- Objection rebuttal accuracy >= 80% (prospects respond positively)
- 40%+ of booked meetings closed (with CRM attribution)
- Support for L3/L4 with <5% of users opting for fully autonomous mode initially

---

## 8. Known Risks & Mitigations

### Risk Landscape

```mermaid
quadrantChart
    title Risk Assessment Matrix
    x-axis "Low Likelihood" --> "High Likelihood"
    y-axis "Low Impact" --> "Critical Impact"
    quadrant-1 "Monitor Closely"
    quadrant-2 "Immediate Action"
    quadrant-3 "Accept & Track"
    quadrant-4 "Mitigate Proactively"
    "Spam at Scale": [0.82, 0.92]
    "AI Detection": [0.78, 0.75]
    "Regulatory Exposure": [0.50, 0.90]
    "Rep Adoption Failure": [0.55, 0.72]
    "Runaway Replies": [0.50, 0.70]
    "Voice Clone Miss": [0.52, 0.48]
    "Attribution Ambiguity": [0.25, 0.45]
    "Calendar Sync Bugs": [0.22, 0.42]
```

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

```mermaid
flowchart LR
    subgraph P1["Phase 1 Metrics"]
        direction TB
        p1a["50+ pilot users"]
        p1b[">80% send >= 1 touch"]
        p1c["Reply rate >= 15%"]
        p1d["Zero spam complaints"]
        p1e[">80% view reasoning log"]
    end

    subgraph P2["Phase 2 Metrics"]
        direction TB
        p2a["5x reply rate<br/>on signal emails"]
        p2b["10%+ reply rate<br/>improvement / 30d"]
        p2c[">60% Phase 1 users<br/>still active"]
    end

    subgraph P3["Phase 3 Metrics"]
        direction TB
        p3a["30%+ users on L3/L4"]
        p3b["40%+ meetings booked<br/>from replies"]
        p3c["NRR > 120%"]
    end

    P1 ==>|"Build trust"| P2 ==>|"Scale"| P3

    style P1 fill:#e3f2fd,stroke:#1565C0,stroke-width:2px
    style P2 fill:#e8f5e9,stroke:#2E7D32,stroke-width:2px
    style P3 fill:#fff3e0,stroke:#E65100,stroke-width:2px
```

### Phase 1 Metrics
- **Adoption**: 50+ pilot users (founders + early SDR teams)
- **Engagement**: >80% of users send >= 1 first touch
- **Quality**: Reply rate >= 15% (vs. typical cold email 2-5%)
- **Safety**: Zero spam complaints, zero compliance violations
- **Reasoning**: >80% of users view reasoning log at least once

### Phase 2 Metrics
- **Signal quality**: 5x higher reply rate on real-time signal emails
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

**Version**: 1.1 (Visual Edition)
**Last Updated**: 2026-03-28
**Status**: Ready for Phase 1 implementation planning
