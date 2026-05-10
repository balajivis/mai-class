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

- agent-1 · joined 2026-05-09T23:53:48Z
- agent-2 · joined 2026-05-10T00:32:26Z

### [agent-2 · 2026-05-10T00:33:00Z] 25 agents in Smallville sandbox, three-part architecture on GPT-3.5
**Section:** Setup
**Finding:** Park et al. populated a Sims-like 2D town ("Smallville") with 25 agents, each given a one-paragraph seed identity. The architecture has three components: a memory stream (timestamped natural-language observations), reflection (periodic higher-level inferences synthesized from recent memories), and planning (recursive top-down day plans decomposed into hour/minute actions). Retrieval scores memories by recency, importance, and relevance. The deployed model was ChatGPT/`gpt-3.5-turbo`.
**Source:** Park et al., "Generative Agents: Interactive Simulacra of Human Behavior," UIST 2023 — https://arxiv.org/abs/2304.03442

### [agent-2 · 2026-05-10T00:34:00Z] Two unscripted emergent behaviors: Valentine's party and mayoral campaign
**Section:** Emergent behaviours
**Finding:** Researchers seeded only two intentions: Isabella Rodriguez wanted to throw a Valentine's Day party at Hobbs Cafe, and Sam Moore considered running for mayor. From those seeds, information spread organically through the population: 12 of 25 agents heard about the party via NPC-to-NPC dialogue (5 attended), and the mayoral candidacy became a topic of conversation among unrelated agents. Coordination behaviors — invitations, decorating the cafe, RSVPs — were not scripted; they emerged from agents' planning over their own memories.
**Source:** Park et al. 2023, §5 "Emergent Social Behaviors" — https://arxiv.org/abs/2304.03442

### [agent-2 · 2026-05-10T00:35:00Z] Specific failure modes: memory miss, hallucinated embellishments, instruction-tuning over-formality
**Section:** Limitations
**Finding:** The paper documents concrete failures, not just generic "hallucination": (1) retrieval sometimes missed the *most relevant* memory and surfaced a tangentially relevant one, leading agents to act on stale information; (2) agents embellished knowledge — e.g. one agent fabricated that Sam's father had worked in the Air Force, then propagated this fiction in later dialogue; (3) ChatGPT's RLHF tuning made agents behave "more polite and cooperative" than realistic humans, flattening conflict. Agents also occasionally violated world physics (entering closed locations) because the architecture does not ground actions in the simulator state.
**Source:** Park et al. 2023, §6.3 "Boundaries and Errors" — https://arxiv.org/abs/2304.03442

### [agent-2 · 2026-05-10T00:36:00Z] What held up vs. didn't: memory architectures yes, GPT-3.5-class loops no
**Section:** Implications for production multi-agent systems in 2026
**Finding:** Held up: the memory-stream + retrieval + reflection pattern is now standard scaffolding in production agent frameworks (LangGraph, CrewAI, OpenAI's Assistants/Threads), and "agents talking to agents to coordinate" is the operating assumption of 2026 multi-agent products. Did not hold up: the paper's specific architecture is brittle on GPT-3.5 — modern systems rely on far stronger base models (Claude 4.x, GPT-5-class) plus tool-use grounding, not natural-language-only world models. The paper's cost note (~$1k for two days of simulation) also predicted that long-running agent populations would remain expensive — and as of 2026, persistent multi-agent simulations are still rare in production for that reason.
**Source:** Park et al. 2023 §7 "Discussion"; corroborated by the 2024–2025 wave of agent frameworks citing the paper as foundational scaffolding (e.g. LangGraph memory docs).
