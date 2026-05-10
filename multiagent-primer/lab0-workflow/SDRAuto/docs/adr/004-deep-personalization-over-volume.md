# ADR-004: Deep Per-Account Personalization Over High-Volume Templated Sends

## Status
ACCEPTED

## Context
Outbound tools generally fall into two camps: (1) high-volume template engines that send thousands of lightly-personalized emails, and (2) deep-research tools that produce fewer, highly-tailored messages. These are fundamentally different products with different unit economics, deliverability profiles, and buyer expectations.

The pitch deck explicitly calls this out: "Deep per-account research vs. high-volume templated sends are different products. Trying to do both dilutes both."

## Decision
The product is a deep-personalization tool. Every outreach requires a per-account research brief (org chart, news, pain indicators, buyer persona) before email generation. Emails must include at least 2 company-specific signals. The daily send cap defaults to 20 emails/day — deliberately low to force quality over quantity.

## Consequences
- **Easier**: Higher reply rates (target: 15% vs. industry 2–5% cold baseline). Better deliverability because low volume + high engagement = positive domain reputation signals. Differentiates clearly from template-based incumbents.
- **Harder**: Research is the bottleneck — <2 min per account means the system caps at ~700 accounts/day even at maximum throughput. Users expecting to blast 1,000+ emails/day will be disappointed. The 20/day default may frustrate power users.
- **Follow-up needed**: Define the minimum viable research brief (what if public data is sparse for a given account?). Decide whether to allow "lite mode" sends with less personalization for follow-ups vs. first touches.
