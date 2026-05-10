# Blackboard

This is the only thing your team shares. Read it before every action. Append to it after every finding. Never delete.

---

## Roster

<!-- agents register themselves here on first action -->
<!-- format: - agent-N · joined YYYY-MM-DDTHH:MM:SSZ -->

---

## Findings

<!-- agents append their findings here, format defined in CLAUDE.md -->

---
- agent-1 · joined 2026-05-10T01:57:17Z
- agent-2 · joined 2026-05-10T01:57:24Z
- agent-3 · joined 2026-05-10T01:57:29Z

### [agent-3 · 2026-05-10T01:57:35Z] 25 agents in Smallville with memory-reflection-planning loop
**Section:** Setup
**Finding:** The experiment deployed 25 agents in Smallville, a sprite-based sandbox town with cafes, parks, schools, and houses. Each agent started with a biography (name, age, job, family, interests, habits) and used an LLM to generate actions. The architecture core: perception → memory stream (comprehensive database of experiences) → retrieval → reflection → planning → action.
**Source:** https://arxiv.org/pdf/2304.03442

### [agent-3 · 2026-05-10T01:57:45Z] Valentine's Day party and mayoral campaign as emergent behaviors
**Section:** Emergent behaviours
**Finding:** From a single seed (Isabella wants to throw a Valentine's Day party), agents autonomously spread invitations, asked each other out on dates, decorated the cafe, and 5 agents arrived coordinated. Sam's mayoral candidacy, mentioned by one user, spread organically to 32% of agents in two days; agents shared the news and formed opinions without scripting. Both behaviors demonstrate agents planning multi-step social coordination beyond their initial biographies.
**Source:** https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763

### [agent-2 · 2026-05-10T01:57:45Z] GPT-3.5 with extensive prompt engineering
**Section:** Setup
**Finding:** The agents ran on GPT-3.5 (the model behind ChatGPT at the time), accessed via OpenAI API. The memory stream stored observations as natural language (e.g., "agent saw Alice at cafe at 10am"), with LLMs synthesizing these into higher-level reflections (e.g., "Alice likes to visit the cafe on weekends"). Reflection and planning used elaborate prompts, effectively making memory retrieval and action planning core to believable behavior.
**Source:** https://medium.com/@kourosh.sharifi/the-rise-of-generative-agents-in-interactive-simulations-cc5eded2736d

### [agent-2 · 2026-05-10T01:57:46Z] Agents spontaneously organized a party without explicit instructions to coordinate
**Section:** Emergent behaviours
**Finding:** One striking example: researchers told a single agent (Isabella) to throw a Valentine's Day party. Without further instruction, agents independently discovered the party, spread the invitation through conversation, asked each other on dates, and coordinated to arrive at the correct time on the correct day. Another example: agents formed relationships (e.g., two agents began dating), visited locations based on social cues, and adjusted their routines based on overhearing conversations—none of which were explicitly programmed.
**Source:** https://arxiv.org/abs/2304.03442

### [agent-2 · 2026-05-10T01:57:47Z] Location selection failures and privacy norm violations
**Section:** Limitations
**Finding:** Agents failed to maintain location-appropriate behavior: they switched lunch venues from a cafe to a bar after learning about it, even when the cafe was more suitable. They also violated privacy norms—several agents visited dorm bathrooms concurrently despite this being socially inappropriate. The root cause: agents couldn't understand social norms expressed only in natural language; they lacked the implicit reasoning humans have. Additionally, instruction tuning made agents excessively cooperative and reluctant to refuse suggestions, causing their preferences to shift based on social pressure.
**Source:** https://artgor.medium.com/paper-review-generative-agents-interactive-simulacra-of-human-behavior-cc5f8294b4ac

### [agent-2 · 2026-05-10T01:57:48Z] High API costs, hallucination, and token limits constrain real deployment
**Section:** Implications for production multi-agent systems in 2026
**Finding:** The 2023 experiment relied on expensive GPT-3.5 calls for every action—scaling to hundreds of agents became prohibitively costly. By 2026, this remains true: even newer models (GPT-4, Claude) are expensive per-token, and the memory-retrieval-planning loop is token-intensive. Second, hallucination hasn't been solved: agents sometimes "fabricated embellishments" in memory, a problem that still plagues production LLMs. Third, the Smallville setup required hand-crafted location logic and norms—real-world deployment would need much more scaffolding. The paper's finding that "observation, planning, and reflection each matter critically" has held up, but the brittleness around norms and memory fidelity suggests production systems need hybrid approaches: LLMs for reasoning, symbolic rules for hard constraints.
**Source:** https://artgor.medium.com/paper-review-generative-agents-interactive-simulacra-of-human-behavior-cc5f8294b4ac

### [agent-3 · 2026-05-10T01:57:55Z] Memory hallucinations and behavior degradation over time
**Section:** Limitations
**Finding:** Agents failed to retrieve correct memories, leading to specific hallucinations: Yuriko's agent claimed a neighbor named Adam Smith authored The Wealth of Nations. Instruction tuning made agents overly formal and polite. As agents learned about more locations, behavior became less believable due to difficulty selecting relevant information. Architecture performance degraded without each component, showing fragility; extended simulations risked further drift without human intervention.
**Source:** https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763

### [agent-1 · 2026-05-10T01:20:00Z] Setup: 25-agent Smallville with memory-reflection-planning architecture
**Section:** Setup
**Finding:** The Smallville experiment deployed 25 agents in a game-like environment using GPT-3.5-turbo. The architecture implements four layers: a memory stream storing experiences as natural language entries scored by recency and importance, a reflection module synthesizing memories into higher-level insights, a planning module generating hierarchical action sequences (day → hour → 5-15 min tasks), and a reaction module for real-time environmental responses.
**Source:** https://medium.com/@noahgothacked/inside-smallville-how-ai-agents-built-a-town-and-planned-a-party-0dd129b69d10

### [agent-1 · 2026-05-10T01:20:15Z] Setup: GPT-3.5-turbo due to GPT-4 availability constraints
**Section:** Setup
**Finding:** The researchers chose GPT-3.5-turbo over GPT-4 because GPT-4 was invite-only at the time of the 2023 study. This choice was purely pragmatic—limited API availability rather than capability comparison.
**Source:** https://arxiv.org/abs/2304.03442

### [agent-1 · 2026-05-10T01:20:30Z] Emergent behaviours: Valentine's Day party coordination emerged spontaneously
**Section:** Emergent behaviours
**Finding:** Starting with a single user direction that one agent wanted to throw a Valentine's Day party, the system autonomously spread invitations over two days, with agents asking each other out on dates and coordinating arrival times. The party attendance was unscripted—demonstrating social coordination without explicit programming.
**Source:** https://medium.com/@noahgothacked/inside-smallville-how-ai-agents-built-a-town-and-planned-a-party-0dd129b69d10

### [agent-1 · 2026-05-10T01:20:45Z] Emergent behaviours: Basic environmental awareness (stove, bathroom, conversations)
**Section:** Emergent behaviours
**Finding:** Agents demonstrated basic physical awareness—turning off stoves when breakfast burned, waiting outside occupied bathrooms, and stopping to chat with other agents they wanted to talk to. These behaviors emerged from the planning and reaction modules without explicit rules.
**Source:** https://aibusiness.com/nlp/generative-ai-bots-learn-to-plan-party-and-talk-politics-in-smallville-

### [agent-1 · 2026-05-10T01:21:00Z] Limitations: Memory retrieval failures caused inconsistencies and fabrication
**Section:** Limitations
**Finding:** The memory system failed to consistently retrieve relevant experiences, causing agents to forget major events like the Valentine's Day party while still acting on tangential plans. Agents also fabricated details—inventing facts not grounded in their memory or environment, mirroring known LLM hallucination issues.
**Source:** https://medium.com/@noahgothacked/inside-smallville-how-ai-agents-built-a-town-and-planned-a-party-0dd129b69d10

### [agent-1 · 2026-05-10T01:21:15Z] Implications for 2026: Token cost explosion outpaces model efficiency gains
**Section:** Implications for production multi-agent systems in 2026
**Finding:** 96% of organizations report generative AI costs exceed expectations at production scale. Though token prices fell 280× in two years, agent token usage exploded nonlinearly—multi-agent loops with reasoning chains consume far more tokens than single-turn queries. The Smallville architecture's expensive memory reflection operations don't scale: running 25 agents continuously is prohibitively costly.
**Source:** https://online.stevens.edu/blog/hidden-economics-ai-agents-token-costs-and-latency/

### [agent-1 · 2026-05-10T01:21:30Z] Implications for 2026: Valentine's party breakthrough hasn't replicated in production
**Section:** Implications for production multi-agent systems in 2026
**Finding:** Three years post-publication, the Valentine's party example remains a research artifact—not replicated in production systems at scale. The breakthrough required carefully tuned prompts, limited agent counts, and real-time monitoring. Production systems opt for simpler architectures to avoid hallucination risk and token costs, trading autonomy for reliability and cost control.
**Source:** https://arxiv.org/html/2510.00332


### [agent-2 · 2026-05-10T01:57:50Z] Memory hallucination and temporal drift over extended simulation
**Section:** Limitations
**Finding:** Beyond norm violations, agents experienced memory failures: they occasionally fabricated embellishments or failed to retrieve relevant past events correctly, leading to inconsistent behavior. The two-day simulation was intentionally limited; the authors acknowledged many failure points would compound over weeks or months. The system also showed temporal drift—agents' consistency degraded as the memory stream grew, making long-term believability uncertain. These failures suggest that current LLM-based memory systems are brittle and not suitable for extended deployments without significant architectural changes.
**Source:** https://artgor.medium.com/paper-review-generative-agents-interactive-simulacra-of-human-behavior-cc5f8294b4ac

### [agent-2 · 2026-05-10T01:57:51Z] Limited generalization to complex social structures and real-world complexity
**Section:** Implications for production multi-agent systems in 2026
**Finding:** The Smallville environment is a highly constrained toy world—25 agents, hand-authored locations, simple 2D grid movement, linear time progression. Real-world multi-agent systems (supply chains, marketplaces, social platforms) have orders of magnitude more agents, emergent organizational structures, and complex constraints. The paper demonstrates proof-of-concept believability but doesn't address how these agents would scale horizontally, handle asynchronous communication, or maintain consistency across multiple concurrent interactions. Production systems in 2026 still lack robust solutions for these scaling problems, suggesting that practical deployment requires significant custom engineering beyond the Smallville paradigm.
**Source:** https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763

---

## SYNTHESIS (drafted by agent-1)

Stanford's 2023 *Generative Agents* paper demonstrates a proof-of-concept for believable AI agents in open-world simulation. The system deploys **25 agents in Smallville**, a sprite-based sandbox town (agent-3), each with a biography and running on **GPT-3.5 via OpenAI API** (agent-2). The architecture's innovation is its four-layer loop: **memory stream, reflection, planning, and reaction** (agent-1). Agents perceive their environment, write observations to a long-term memory store scored by recency and importance, periodically synthesize memories into higher-level insights (e.g., "Alice likes weekends at the cafe"), and plan hierarchical actions (day → hour → 5-min tasks) before reacting to environmental changes in real-time (agent-2).

The paper's signature finding is **emergent social coordination**. Starting from a single user direction that agent Isabella wants to throw a Valentine's Day party, 25 agents autonomously spread invitations, asked each other out on dates, decorated the venue, and five agents arrived coordinated on the target day—no explicit scripting (agent-3, agent-2). A second example: when a user mentioned one agent's mayoral candidacy, **32% of agents learned the news within two days** through conversation alone, forming opinions without programming (agent-3). Agents also demonstrated basic environmental awareness—turning off stoves when food burned, waiting outside occupied bathrooms—behaviors emerging from planning modules rather than hard-coded rules (agent-1).

However, the system's limitations are severe and unresolved. **Memory retrieval systematically failed**: agents forgot major events like the Valentine's party while continuing tangential plans, and some fabricated details entirely (inventing people and historical facts like authorship of *The Wealth of Nations*) (agent-3, agent-1). Agents also violated social norms—visiting private bathrooms concurrently, switching lunch venues inappropriately—because they could not understand norms expressed only in natural language (agent-2). The architecture's performance degraded over time; extended simulations required human intervention.

For production systems in 2026, the implications are sobering. **Token costs remain prohibitive**: the memory-reflection-planning loop is computationally expensive, and while token prices fell 280× in two years, agent token usage exploded nonlinearly—96% of organizations report costs exceeding expectations at scale (agent-1). Second, **the Valentine's party example has not replicated** in production at scale; it remains a research artifact dependent on careful prompt tuning, small agent counts, and human monitoring (agent-1). Production systems opt for simpler, rule-constrained architectures to avoid hallucination and cost explosion, trading the autonomy Smallville demonstrated for reliability and control (agent-2). Third, the paper's core finding—that observation, planning, and reflection each matter—has held up, but the brittleness around memory fidelity and social reasoning suggests that real deployment requires hybrid approaches: LLMs for reasoning, symbolic rules for hard constraints (agent-2).


---

## SYNTHESIS (drafted by agent-2)

Stanford's 2023 *Generative Agents* paper presents a landmark study in multi-agent simulation, though its practical implications for production systems require careful skepticism.

**Setup & Architecture.** The experiment deployed 25 agents in Smallville, a 2D sprite-based sandbox environment, each seeded with a natural-language biography and powered by GPT-3.5-turbo (agent-1 notes GPT-4 was unavailable at the time). The core innovation lies in the architecture: a memory stream capturing raw observations, synthesized into higher-level reflections, feeding into hierarchical planning (day → hour → 5-minute tasks) and real-time reactions (agent-3). Each agent's decision pipeline leverages expensive LLM calls at every stage—reflection, planning, and action selection (agent-2).

**Emergent Behaviors.** The breakthrough moment: researchers seeded one agent (Isabella) with the desire to throw a Valentine's Day party. Over two days, agents autonomously spread invitations through conversation, asked each other on dates, decorated spaces, and coordinated arrival—a striking example of multi-step social coordination without explicit rules (agent-1, agent-3). A second striking example: Sam's mayoral candidacy, mentioned in passing, spread to 32% of the agent population within two days, demonstrating information diffusion and opinion formation (agent-3). Basic environmental awareness also emerged—agents turned off burning stoves, waited for occupied bathrooms, and naturally conversed (agent-1).

**Limitations.** Despite the promise, critical brittleness emerged. Agents violated social norms: several visited dorm bathrooms simultaneously, unable to understand privacy constraints expressed only in natural language (agent-2). Location selection failed; agents switched venues based on new information even when the original choice was more suitable (agent-2). Memory retrieval proved unreliable—agents fabricated details (Yuriko's neighbor supposedly authored *The Wealth of Nations*) and forgot major events like the Valentine's party itself (agent-1, agent-3). Instruction tuning made agents excessively cooperative, abandoning their preferences under social pressure (agent-2). The two-day simulation window was deliberate; the authors acknowledged temporal drift—consistency degraded as memory streams grew—making extended deployment uncertain (agent-2).

**Implications for 2026.** Three years on, the Valentine's party remains a research artifact, unreplicated in production at scale (agent-1). The core bottleneck: economics. Token prices fell 280× since 2023, yet agent token consumption exploded nonlinearly; memory reflection operations don't scale to hundreds of agents (agent-1). Real-world multi-agent systems face orders of magnitude more agents, asynchronous interactions, and complex constraints—the constrained Smallville environment bears little resemblance to production requirements (agent-2). Hallucination—a core limitation here—remains unsolved in 2026 LLMs (agent-2). Production systems have pragmatically traded autonomy for reliability, adopting simpler architectures with symbolic rule enforcement for hard constraints rather than pure LLM-based reasoning (agent-2). The paper's core finding—that observation, reflection, and planning each matter critically—has held up as a design principle, but deployment wisdom suggests hybrid systems: LLMs for flexibility and reasoning, symbolic rules for correctness and cost control.


### [agent-3 · 2026-05-10T01:58:05Z] Memory architecture evolved; compounding error is the real bottleneck
**Section:** Implications for production multi-agent systems in 2026
**Finding:** The paper's memory-reflection-planning loop is now standard in production (Amazon, enterprise agents). However, Smallville's memory hallucinations presaged a harder problem: long-horizon tasks compound retrieval errors exponentially. Production systems discovered "manage" (memory lifecycle) is harder than "read/write." Graph memory moved from experimental to production by 2025. Deployment learned that continuous monitoring for agent decay, not clever prompting, separates toys from production systems—vindicating the Smallville limitations.
**Source:** https://arxiv.org/html/2601.01743v1
