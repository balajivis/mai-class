# ADR-007: Voice Cloning from Rep's Actual Emails, Not Configurable Templates

## Status
ACCEPTED

## Context
The standard approach in sales tools is to provide email templates that users customize with merge fields ({first_name}, {company}, etc.). This is easy to build but produces generic-sounding outreach that prospects increasingly recognize as automated.

LLMs now make it feasible to extract writing style (tone, sentence structure, sign-off patterns, emoji usage, message length) from a corpus of real emails and generate new messages that sound like the author wrote them. This requires 30–50 sample emails as input — a meaningful onboarding cost.

## Decision
The primary personalization mechanism is voice cloning from the rep's own sent emails, not templates. Users upload 30–50 sent emails during onboarding, and the system extracts a voice profile (tone, structure, sign-offs, openers, value prop style). All generated outreach is written in this cloned voice. Templates are not offered as a fallback.

The feasibility matrix acknowledges limits: surface style (voice, tone, subject lines, sign-offs) is clonable at 85–92% feasibility. Deep sales judgment (when to push vs. ease off, relationship reading) is not — those are deferred to Phase 2–3 or marked as likely not learnable.

## Consequences
- **Easier**: Output quality is dramatically higher than template-based tools. "Sounds like me" is the core trust moment in onboarding. Reduces the "obviously AI" detection risk that the pitch deck flags as high-risk.
- **Harder**: 30–50 email minimum is a real onboarding barrier — new reps or founders without email history can't use the product. Voice profile quality depends on sample quality; garbage in, garbage out. Users need a way to curate samples and preview the profile before going live.
- **Follow-up needed**: Define the minimum viable voice profile (what if a user only has 15 emails?). Build the voice profile preview/validation UX. Decide whether to offer a "generic professional" fallback voice for users without enough samples.
