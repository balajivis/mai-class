# Autonomous BDR — App Flow Document

**Version**: 1.0
**Date**: 2026-03-28
**Status**: Reference for Phase 1 Implementation

---

## 1. Overview

The Autonomous BDR app orchestrates a complete outbound sales cycle through six core user flows. All flows are designed for L2 autonomy (first touch approval) as the Phase 1 default, with branching paths for different autonomy levels.

### Major User Flows
1. **Onboarding Flow** — Sign up → Configure voice → Setup campaigns
2. **Campaign Creation Flow** — Create campaign → Define targets → Upload accounts → Research → Ready
3. **Email Approval Flow** — Review first touches → Approve or edit → Auto-schedule follow-ups
4. **Reply Handling Flow** — Monitor inbox → Classify replies → User decision or auto-action
5. **Meeting Booking Flow** — Positive reply → Calendar proposal → Prospect accepts/declines
6. **Dashboard Flow** — Overview of campaigns, reply queue, reasoning, and settings

---

## 2. Core User Flows

### A. Onboarding Flow

**Duration**: ~10 minutes | **Autonomy**: Setup phase (no autonomy yet)

```mermaid
flowchart TD
    A["Sign Up<br/>Email + Password"] --> B["Connect Email<br/>OAuth2 Gmail/Outlook"]
    B --> C{Email Connected?}
    C -->|No| D["Retry or Skip for Now"]
    D --> B
    C -->|Yes| E["Define ICP<br/>Industry, Company Size,<br/>Tech Stack, Pain Points"]
    E --> F["Set Value Prop<br/>1-2 Key Differentiators"]
    F --> G["Clone Voice<br/>Upload 30-50 Rep Emails"]
    G --> H{Voice Confidence<br/>≥ 70%?}
    H -->|No| I["Add More Emails<br/>or Refine Profile"]
    I --> G
    H -->|Yes| J["Choose Autonomy Level<br/>L1/L2/L3/L4<br/>Default: L2"]
    J --> K["Upload Leads<br/>CSV: Account Domains/Names"]
    K --> L["Review First Email<br/>Template Approval"]
    L --> M["Setup Complete<br/>Ready to Create Campaign"]
```

**Steps**:
1. User signs up with email and password
2. Connect inbox via OAuth2 (Gmail or Outlook for reply monitoring)
3. Define ICP: industry, company size range, revenue signals, tech stack
4. Set value prop: 2–3 key differentiators for personalization
5. Clone voice: upload 30–50 sent emails from rep (system extracts tone, templates, sign-off)
6. **Decision**: If confidence < 70%, request additional emails (system will retry analysis)
7. Choose autonomy level (L1 = human approves all, L2 = auto follow-ups, default L2)
8. Upload leads: CSV with account domains and/or company names
9. Review template: system shows first email template for user approval
10. Onboarding complete: proceed to campaign creation

---

### B. Campaign Creation Flow

**Duration**: ~5 minutes | **Autonomy**: User defines scope

```mermaid
flowchart TD
    A["Create New Campaign"] --> B["Name Campaign<br/>+ Link Voice Profile"]
    B --> C["Define ICP for Campaign<br/>Company Size, Industry,<br/>Tech Stack, Exclude List"]
    C --> D["Upload CSV<br/>Account List"]
    D --> E{CSV Valid?}
    E -->|No| F["Show Validation Errors<br/>Empty rows, invalid emails"]
    F --> G["Allow Fix & Re-upload"]
    G --> D
    E -->|Yes| H["Preview Account Matches<br/>Show ICP Fit Scores"]
    H --> I{Total Accounts<br/> ≤ 500?}
    I -->|No| J["Warn: ICP Too Broad<br/>Recommend Narrower Filters"]
    J --> K["User Refines ICP<br/>or Proceeds"]
    K --> H
    I -->|Yes| L["Research Phase<br/>Fetch Org Chart, News,<br/>Pain Indicators"]
    L --> M["Generate Research Briefs<br/>Per Account"]
    M --> N["Confirm Campaign<br/>Ready for Outreach"]
    N --> O["Status: Ready for Outreach"]
```

**Steps**:
1. User clicks "Create New Campaign"
2. Name campaign and select or create voice profile
3. Define campaign-specific ICP (may differ from global)
4. Upload CSV: account domains, company names, optional buyer email
5. **Validation**: Check for empty rows, invalid emails; show errors if found
6. **Decision**: If ICP matches > 500 accounts, warn user (too broad) and recommend narrowing
7. Preview: show matched accounts with ICP fit scores (0.0–1.0)
8. Research phase: system fetches org chart, recent news, pain indicators for each account
9. Generate research briefs: per-account context (max 2–3 KB) for personalization
10. Confirm and activate: status changes to "ready for outreach"

---

### C. Email Approval Flow (L2 Autonomy)

**Duration**: ~1 minute per email | **Autonomy**: Human approves first touch only

```mermaid
flowchart TD
    A["First Touch Email Generated<br/>Per Account"] --> B["Show User:<br/>Original Research Brief<br/>Voice Confidence<br/>Personalization Used"]
    B --> C{User Decision}
    C -->|Approve| D["Email Sent Immediately<br/>Log Message + Timestamp"]
    C -->|Edit| E["User Modifies<br/>Subject/Body"]
    C -->|Reject| F["Log Rejection Reason<br/>Improve Voice Profile"]
    E --> G["Re-Check Message<br/>Quality + Tone"]
    G --> H{Pass Quality Gate?}
    H -->|No| E
    H -->|Yes| D
    D --> I["Auto-Schedule Follow-ups<br/>Per Cadence Rules<br/>No Further Approval"]
    I --> J["Status: First Touch Sent<br/>Awaiting Reply"]
    F --> K["Pause Account<br/>or Rethink Voice Profile"]
```

**Steps**:
1. System generates first touch email based on research brief and voice profile
2. Display to user:
   - Original research brief (company news, hiring signals, pain indicators)
   - Voice cloning confidence score
   - Personalization techniques used (e.g., "funding news", "product fit")
3. **User decision**:
   - **Approve**: Send immediately, log message, advance to follow-up scheduling
   - **Edit**: Modify subject/body; system re-validates for tone/quality; resubmit
   - **Reject**: Log reason, flag for voice profile improvement, pause account
4. After approval: auto-schedule follow-ups per cadence (e.g., 3 days, 7 days)
5. Status: "first_touch_sent" → monitor for replies

---

### D. Reply Handling Flow (L2 Autonomy)

**Duration**: ~2 minutes per reply (escalations) | **Autonomy**: Auto-handles 40–50% of replies

```mermaid
flowchart TD
    A["Inbox Monitor<br/>Find Reply<br/>Poll Every 5 min"]
    A --> B["Classify Reply<br/>Positive/Objection/<br/>Unsubscribe/Noise/Unclear"]
    B --> C["Extract Sentiment<br/>+ Intent"]
    C --> D{Classification<br/>Confidence?}
    D -->|< 70%| E["Escalate to User<br/>Show Classification<br/>+ Full Reply Text"]
    D -->|≥ 70%| F{Classification}
    F -->|Unsubscribe| G["Auto: Pause Sequence<br/>Mark in CRM<br/>Log Action"]
    F -->|Noise| H["Auto: Archive Reply"]
    F -->|Positive| I["Escalate to User<br/>Show: Sentiment,<br/>Extracted Intent,<br/>Recommended Action"]
    F -->|Objection| J["Escalate to User<br/>Show: Objection Type,<br/>Sentiment, Context"]
    E --> K["User Reviews<br/>& Chooses Action"]
    I --> L{User Decision}
    J --> L
    L -->|Escalate| M["Log Manual Action<br/>Improve Classifier"]
    L -->|Accept Recommended| N["Execute Action"]
    G --> O["Status: Paused<br/>End Sequence"]
    H --> P["Status: Archived<br/>Do Not Reply"]
    N --> Q{Action Type}
    Q -->|Positive| R["Proceed to<br/>Meeting Booking"]
    Q -->|Objection| S["Log Context<br/>for Follow-up"]
```

**Steps**:
1. Inbox monitor polls every 5 minutes for inbound replies
2. Classify reply:
   - **Positive**: Shows interest or willingness to discuss
   - **Objection**: Raises concern (price, timing, fit, competitor)
   - **Unsubscribe**: Explicit opt-out ("stop emailing")
   - **Noise**: Out-of-office, bounce, spam complaint
   - **Unclear**: Classification uncertain (low confidence)
3. Extract sentiment and intent from reply
4. **Decision point**:
   - **Confidence ≥ 70%**:
     - Unsubscribe → Auto-pause sequence, mark in CRM
     - Noise → Auto-archive
     - Positive/Objection → Escalate to user (show confidence, context, recommended action)
   - **Confidence < 70%** → Always escalate to user
5. **User action**:
   - Accept recommendation → Execute (book meeting for positive, prepare rebuttal for objection)
   - Override → Log reason, improve classifier
6. Log all actions and reasoning

---

### E. Meeting Booking Flow

**Duration**: ~3 minutes | **Autonomy**: System proposes, user/prospect confirms

```mermaid
flowchart TD
    A["Prospect Reply<br/>Classified as Positive"] --> B["System Checks<br/>Rep's Calendar"]
    B --> C{Calendar<br/>Available?}
    C -->|No| D["Escalate to Rep<br/>Let Rep Propose Times"]
    C -->|Yes| E["Identify Prospect Timezone<br/>From IP or Company Location"]
    E --> F["Propose 3-5 Meeting Slots<br/>Preference: 10am-2pm,<br/>Tue-Thu, Prospect TZ"]
    F --> G["Show User:<br/>Proposed Slots<br/>Rep Availability<br/>Prospect Timezone"]
    G --> H["Send Proposal to Prospect<br/>Via Reply"]
    H --> I{Prospect Response}
    I -->|Accepts Slot| J["Log to CRM<br/>Meeting Confirmed<br/>Conversation Summary"]
    I -->|Rejects All| K["Escalate to Rep<br/>Handle Rescheduling"]
    I -->|Requests Different Time| K
    I -->|No Response| L["Re-ping in 2 Days<br/>or Pause"]
    J --> M["Status: Booked<br/>Meeting Logged"]
```

**Steps**:
1. Prospect sends positive reply
2. System checks rep's calendar availability (read via Google Calendar API or Outlook)
3. **Decision**: If calendar unavailable, escalate to rep for manual proposal
4. Detect prospect timezone (via IP geolocation or inferred from company location)
5. Propose 3–5 meeting slots:
   - Preferred times: 10:00 AM – 2:00 PM local time
   - Preferred days: Tuesday–Thursday
   - Show slots in prospect's timezone
6. Display proposal to user (show slots, rep availability, prospect timezone)
7. Send proposal to prospect via email reply
8. **Prospect decision**:
   - Accepts slot → Log to CRM with conversation summary, status = "booked"
   - Rejects/requests different time → Escalate to rep (manual handling)
   - No response → Re-ping in 2 days or pause sequence
9. Status: "booked" → conversation context and next steps logged

---

### F. Dashboard Flow

**Duration**: Always available | **Autonomy**: Visibility and control

```mermaid
flowchart TD
    A["User Lands on Dashboard"] --> B["Overview Cards<br/>Active Campaigns<br/>First Touches Sent<br/>Replies Received<br/>Meetings Booked"]
    B --> C{User Action}
    C -->|View Campaigns| D["List Active Campaigns<br/>Show KPIs:<br/>Reply Rate %, Velocity,<br/>Booked Rate %<br/>Status: Active/Paused"]
    C -->|View Reply Queue| E["List Pending Replies<br/>Classified by Type<br/>Show Confidence,<br/>Suggested Action"]
    C -->|View Reasoning| F["Click Any Action<br/>See: Signal Triggered,<br/>Rule Applied,<br/>Message Generated,<br/>Next Steps"]
    C -->|Settings| G["Update Autonomy Level<br/>Daily Send Cap<br/>ICP Filters<br/>Voice Profile"]
    D --> H["Click Campaign<br/>See Accounts,<br/>Messages, Replies"]
    E --> I["Click Reply<br/>Review + Escalate<br/>or Auto-Handle"]
    F --> J["Transparent Reasoning<br/>Why was this action taken?"]
    G --> K["Save Changes<br/>Apply to New Messages"]
    H --> L["Monitor Progress<br/>Adjust ICP/Autonomy"]
    I --> M["Take Action<br/>Log Decision"]
    J --> N["Build User Trust"]
    L --> O["Improve Campaign"]
    M --> P["Update Reply Status"]
    N --> Q["Stay on Dashboard"]
    O --> Q
    P --> Q
```

**Dashboard Components**:
1. **Overview Cards**:
   - Active campaigns count + recent status
   - First touches sent (this month/all-time)
   - Replies received (pending/handled)
   - Meetings booked (this month/pipeline)

2. **Active Campaigns**:
   - List view: name, ICP, status, KPIs
   - KPIs: reply rate %, meeting rate %, velocity (touches/day)
   - Click to drill into campaign details (accounts, messages, replies)

3. **Reply Queue**:
   - Pending replies awaiting action
   - Show: reply text, classification, confidence, suggested action
   - Click to escalate or execute auto-action
   - Filter by classification (positive, objection, unclear, etc.)

4. **Reasoning Log**:
   - Click any message, reply, or action to see explanation
   - Show: what signal triggered it, what rule applied, why this action
   - Build trust through transparency (Section 6.3 in tech-spec)

5. **Settings**:
   - Autonomy level (L1/L2/L3/L4)
   - Daily send cap (default 20, per-domain cap 5)
   - ICP filters (global defaults)
   - Voice profile (select, edit, or create new)

---

## 3. Error & Edge Case Flows

### Email Send Failure

```mermaid
flowchart TD
    A["Email Send Initiated"] --> B{Send Success?}
    B -->|Yes| C["Log Sent Message"]
    B -->|No| D{Error Type?}
    D -->|Bounce| E["Check if Hard/Soft Bounce"]
    D -->|Invalid Email| F["Mark Email Invalid"]
    D -->|Other| G["Log Error"]
    E -->|Hard Bounce| H["Retry Once"]
    E -->|Soft Bounce| H
    H --> I{Retry Success?}
    I -->|Yes| C
    I -->|No| J["Fail Message<br/>Log Error<br/>Skip Account"]
    F --> K["Skip Account<br/>Log Invalid Email"]
    G --> L["Escalate to User<br/>Log for Investigation"]
```

**Logic**:
- Send email via SMTP
- If send fails (bounce, invalid, timeout):
  - Retry once after 1 minute
  - If retry succeeds, log as sent
  - If retry fails, log as failed, skip account, notify user if pattern emerges

---

### OAuth Disconnection

```mermaid
flowchart TD
    A["Scheduled Inbox Poll"] --> B{OAuth Token Valid?}
    B -->|Yes| C["Poll Inbox for Replies"]
    B -->|No| D["Token Expired/Revoked"]
    D --> E["Prompt User:<br/>Re-connect Email<br/>Show: Gmail/Outlook"]
    E --> F["User Re-authorizes<br/>OAuth Flow"]
    F --> G{Authorized?}
    G -->|Yes| H["Resume Polling<br/>Backfill Missed Replies"]
    G -->|No| I["Pause Campaign<br/>Notify User"]
```

**Logic**:
- When polling inbox, check token validity
- If invalid/expired, interrupt polling and show user re-connect prompt
- User re-authorizes via OAuth2 flow (Gmail, Outlook, or custom IMAP)
- Resume polling and backfill any missed replies since disconnect

---

### Inbox Polling Timeout

```mermaid
flowchart TD
    A["Inbox Poll Scheduled<br/>5 min Interval"] --> B{Poll Completes<br/>in Time?}
    B -->|Yes| C["Process Replies<br/>Classify + Action"]
    B -->|No| D["Timeout Error<br/>Log Issue"]
    D --> E["Retry in 5 Minutes"]
    E --> F{Consecutive<br/>Failures > 3?}
    F -->|No| G["Continue Retrying"]
    F -->|Yes| H["Escalate to User<br/>Check Connection<br/>Possible Outage"]
    G --> A
```

**Logic**:
- Poll inbox every 5 minutes
- If poll times out, log error and retry in 5 minutes
- If 3+ consecutive timeouts, escalate to user (possible API outage or connection issue)
- Do not pause campaign; keep retrying with backoff

---

### Calendar API Unavailable

```mermaid
flowchart TD
    A["Meeting Booking Flow<br/>Check Rep Calendar"] --> B{Calendar API<br/>Available?}
    B -->|Yes| C["Fetch Availability<br/>Propose Slots"]
    B -->|No| D["API Unavailable<br/>Graceful Fallback"]
    D --> E["Escalate to Rep<br/>Do Not Auto-Propose<br/>Show Prospect Reply"]
    E --> F["Rep Manually<br/>Proposes Times"]
    F --> G["Continue Booking Flow"]
```

**Logic**:
- If calendar API is down, do not attempt to auto-propose slots
- Escalate to rep with prospect reply and context
- Rep manually suggests times and sends proposal
- System logs when calendar was unavailable; no auto-booking for this prospect

---

### CSV Upload Validation

```mermaid
flowchart TD
    A["User Uploads CSV"] --> B{Validate CSV}
    B -->|Empty Rows| C["Show Errors:<br/>Row Numbers"]
    B -->|Invalid Emails| C
    B -->|Missing Columns| C
    B -->|Valid| D["Import Accounts<br/>Begin Research"]
    C --> E["Show Error Summary<br/>+ Examples"]
    E --> F["Allow User Fix<br/>Download Template<br/>Re-upload"]
    F --> A
```

**Logic**:
- Validate CSV on upload: check for empty rows, invalid email format, required columns
- Show user errors with line numbers and examples
- Allow re-upload after fixing
- Once valid, import and begin research phase

---

### Voice Profile Confidence Too Low

```mermaid
flowchart TD
    A["Voice Profile Confidence < 50%"] --> B["Warn User:<br/>Profile May Not Capture<br/>Tone Accurately"]
    B --> C{User Action}
    C -->|Add More Emails| D["Upload Additional<br/>Email Samples<br/>≥ 20 More"]
    C -->|Continue| E["Proceed with Low Confidence<br/>Flag All Messages<br/>For Manual Review"]
    D --> F["Re-analyze Voice Profile"]
    F --> G{Confidence<br/>≥ 70%?}
    G -->|Yes| H["Profile Updated<br/>Ready for Campaign"]
    G -->|No| I["Still Below Threshold<br/>Offer More Options"]
    E --> J["All Generated Emails<br/>Require User Approval"]
```

**Logic**:
- If voice profile confidence < 50%, warn user
- Offer two paths:
  1. Add more email samples (20+) and re-analyze
  2. Proceed but flag all generated emails for user review (no auto-send)
- Retry analysis after adding emails
- If still < 70%, recommend discontinuing or using L1 autonomy (human approval all)

---

## 4. Outreach State Machine

**All possible states for an Outreach object**:

```mermaid
stateDiagram-v2
    [*] --> researched: Campaign Created<br/>Research Complete

    researched --> first_touch_pending: Research Brief Ready<br/>Awaiting First Email

    first_touch_pending --> first_touch_sent: L1/L2: User Approves<br/>L3/L4: Auto-Send

    first_touch_sent --> awaiting_reply: Email Sent<br/>Awaiting Response

    awaiting_reply --> engaged: Positive Reply<br/>Received
    awaiting_reply --> paused: Unsubscribe<br/>or User Pauses
    awaiting_reply --> awaiting_reply: Follow-up Sent<br/>Per Cadence

    engaged --> booked: Prospect Accepts<br/>Meeting Slot
    engaged --> awaiting_reply: Objection<br/>Handled / Rebuttal Sent

    booked --> completed: Meeting Held<br/>or Manually Closed
    booked --> paused: Prospect Cancels<br/>or Unsubscribes

    paused --> awaiting_reply: User Resumes<br/>Sequence
    paused --> [*]: Sequence Ended

    completed --> [*]: Sales Cycle Complete

    note right of researched
        Account has research brief,
        ready to generate first touch
    end note

    note right of awaiting_reply
        Waiting for prospect response
        to email sent
    end note

    note right of paused
        Sequence paused by user or
        unsubscribe; can resume
    end note

    note right of booked
        Meeting on calendar with
        prospect; awaiting execution
    end note
```

**State Transitions**:
1. **researched** → first_touch_pending: Research phase complete, brief generated
2. **first_touch_pending** → first_touch_sent: User approves (L1/L2) or system auto-sends (L3/L4)
3. **first_touch_sent** → awaiting_reply: Email delivered, monitoring for responses
4. **awaiting_reply** → engaged: Positive reply classified
5. **awaiting_reply** → paused: Unsubscribe received or user manually pauses
6. **awaiting_reply** → awaiting_reply: Follow-up auto-sent per cadence (cycle continues)
7. **engaged** → booked: Prospect accepts meeting proposal
8. **engaged** → awaiting_reply: Objection rebuttal sent; continue conversation
9. **booked** → completed: Meeting held or opportunity closed
10. **paused** → awaiting_reply: User resumes sequence
11. **paused** → [*]: Sequence ended (final unsubscribe or user decision)

---

## 5. Integration Touchpoints

### Email Service (SMTP / OAuth2)
- **Outbound**: SMTP via rep's domain or sender alias
- **Inbound**: OAuth2 to Gmail/Outlook for reply monitoring
- **Compliance**: SPF/DKIM validation, bounce handling, daily/domain caps
- **Trigger**: Every outreach action

### Calendar Service (Google Calendar / Outlook)
- **Read**: Fetch rep availability for meeting proposals
- **Write**: Log booked meetings to rep's calendar
- **Fallback**: If API unavailable, escalate to rep
- **Trigger**: When prospect reply is positive

### CRM Integration (HubSpot / Salesforce)
- **Write**: Log booked meetings with conversation summary and next steps
- **Read**: Optional, to enrich account context (Phase 2+)
- **Sync**: Batch writes after booking; real-time in Phase 2+
- **Trigger**: When meeting confirmed

### Data Enrichment (Phase 2+)
- LinkedIn, Crunchbase, BuiltWith, etc.
- Fetch org charts, funding signals, tech stack
- Feed into research briefs
- Trigger: Campaign creation or real-time signal monitoring

---

## 6. Key Metrics & Monitoring

**Per-Campaign KPIs**:
- **Reply Rate**: Replies received ÷ first touches sent (target ≥15%)
- **Meeting Rate**: Meetings booked ÷ replies received (target ≥20%)
- **Velocity**: Touches sent per day (configurable, default 5–20/day)
- **Confidence Scores**: Voice profile, reply classification, message quality

**System Health**:
- Email send success rate (target ≥98%)
- Inbox polling uptime (target ≥99%)
- Reply classification accuracy (target ≥90%)
- Spam complaint rate (target <0.1%)

**User Engagement**:
- % of users viewing reasoning log (target ≥80%)
- % of users editing/rejecting messages (engagement indicator)
- % of users adjusting ICP/autonomy level (customization)

---

## Appendix: Decision Tree Quick Reference

| Scenario | Autonomy L1 | L2 | L3 | L4 |
|----------|---|---|---|---|
| **First Touch** | Approve all | User approves | Auto-send | Auto-send |
| **Follow-ups** | Approve all | Auto-send | Auto-send | Auto-send |
| **Positive Reply** | Escalate | Escalate to user; system proposes slots | System proposes slots | System books meeting |
| **Objection** | Escalate | Escalate + context | Auto-rebuttal if confident | Auto-rebuttal |
| **Unsubscribe** | Escalate | Auto-pause | Auto-pause | Auto-pause |
| **Noise** | Escalate | Auto-archive | Auto-archive | Auto-archive |
| **Unclear** | Escalate | Escalate | Escalate | Escalate if confidence < 70% |

---

**End of Document**

---

*This App Flow document serves as a reference for frontend design, backend workflow orchestration, and user experience validation. For implementation details, refer to technical-spec.md Sections 2–4.*
