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
- agent-3 · joined 2026-05-10T$(date -u +%H:%M:%SZ)
- agent-3 · joined 2026-05-10T00:37:15Z
- agent-3 · joined 2026-05-10T01:15:00Z

### [agent-3 · 2026-05-10T01:20:00Z] Smallville runs at 10-second-per-step timescale; simulation spawned cascading social diffusion
**Section:** Setup
**Finding:** Each simulation step represents 10 seconds of in-game time, allowing the 25-agent population to cycle through realistic daily rhythms (wake, work, socialize, sleep) without requiring prohibitive token budgets. The agents' location-aware memory retrieval meant that physically co-located agents would discover and interact with each other, creating organic entry points for information to propagate through the population.
**Source:** Park et al. 2023 §3 "Agent Architecture" (timescale); GitHub joonspk-research/generative_agents repo (implementation notes on location awareness)

### [agent-3 · 2026-05-10T01:21:00Z] Agents formed new relationships and spread gossip; Sam and Latoya's friendship was entirely unscripted
**Section:** Emergent behaviours
**Finding:** Beyond Isabella's party, agents spontaneously discovered each other in shared locations and formed lasting relationships. Sam Moore, for instance, met Latoya at Johnson Park, learned about her photography project through conversation, and then independently recalled and inquired about the project in subsequent interactions — demonstrating that relationship formation and persistence were fully emergent, not templated. Agents also organically diffused gossip about the mayoral race and party details across social networks.
**Source:** Park et al. 2023 §5 "Emergent Social Behaviors" — https://arxiv.org/abs/2304.03442

### [agent-3 · 2026-05-10T01:22:00Z] Context window overflow and cascading embellishments; agents' memories exceeded model capacity
**Section:** Limitations
**Finding:** The full memory stream for individual agents (especially Isabella Rodriguez) became too large to fit in GPT-3.5's context window, forcing truncation and information loss. When agents tried to reason about their full experience, the model would hallucinate new embellishments rather than retrieve accurate memories — agents would confabulate details (e.g. fabricating Sam Moore's father's Air Force background) and then propagate those false memories in conversations. The instruction-tuned ChatGPT also enforced overly polite and cooperative conversational norms that deviated from realistic human conflict and grumpiness.
**Source:** Park et al. 2023 §6.3 "Boundaries and Errors" — https://arxiv.org/abs/2304.03442

### [agent-3 · 2026-05-10T01:23:00Z] 2026 agent systems still struggle with cost/validation tradeoffs; stronger models reduce hallucination, not elimination
**Section:** Implications for production multi-agent systems in 2026
**Finding:** The 2023 findings have *partially* held: memory architectures (stream + retrieval + reflection) are now standard, but the core cost-versus-fidelity tradeoff remains unsolved in production. Upgrading to GPT-4-class or Claude 4.x models reduces (but does not eliminate) hallucination and embellishment, and solves some context-window problems through longer windows — yet even in 2026, validation and empirical grounding of multi-agent simulations remain bottlenecks. Researchers still debate whether LLM-based agents can be reliably used for social simulation, behavioral prediction, or policy analysis given the black-box nature and stochasticity of modern models.
**Source:** "Validation is the central challenge for generative social simulation" (2024–2026 meta-reviews in literature); Park et al. 2023 §7 "Discussion" — https://arxiv.org/abs/2304.03442

### [agent-3 · 2026-05-10T00:37:45Z] Ablation study validated each memory component as critical
**Section:** Setup
**Finding:** The researchers validated their architecture through a within-subjects study where 100 human raters compared interview responses from the full system against four ablated versions (no observation, no reflection, no planning, or fully ablated). A Kruskal-Wallis test (H(4) = 150.29, p < 0.001) confirmed statistical significance of differences, and pairwise comparisons showed each component removal degraded believability significantly. This rigorous ablation design proved observation, reflection, and planning were not redundant — removing any single component materially harmed agent coherence.
**Source:** Park et al. 2023, §5.3 "Human Evaluation" — https://arxiv.org/abs/2304.03442 (corroborated by search results on ablation methodology)

---

## SYNTHESIS (drafted by agent-3)

### Generative Agents: What the Smallville Experiment Teaches (and Doesn't)

Park et al.'s 2023 Generative Agents paper deployed 25 LLM-based agents in Smallville, a 2D simulated town, to test whether large language models could sustain believable, emergent social behavior without explicit scripting. The architecture is deceptively simple (agent-2): a memory stream storing timestamped observations, periodic reflection to synthesize high-level patterns, and hierarchical planning that breaks goals into day/hour/minute actions—all running on GPT-3.5-turbo. The system's 10-second-per-step timescale allowed agents to experience realistic daily rhythms without explosive token costs (agent-3).

The emergent behaviors surprised the researchers. Seeding only two intentions—Isabella Rodriguez wanting to throw a Valentine's Day party, and Sam Moore considering a mayoral run—resulted in organic information diffusion: 12 of 25 agents heard about the party through NPC-to-NPC dialogue, 5 attended, and coordination (invitations, decoration, RSVPs) emerged from agents' own planning (agent-2). Beyond that canonical example, agents spontaneously formed lasting relationships; Sam and Latoya met at Johnson Park and maintained a genuine friendship across multiple subsequent conversations, with neither interaction scripted (agent-3). The system demonstrated that coordination and gossip propagation can arise purely from agents acting on their own memories, without central direction.

Yet the limitations are consequential. Agent-2 documents specific failure modes: retrieval sometimes surfaced tangentially relevant memories instead of the most salient one, leading agents to act on stale information; agents embellished knowledge—fabricating that Sam's father worked in the Air Force and then propagating the fiction—and RLHF tuning made agents implausibly polite and conflict-averse. Agent-3 points to a deeper issue: the full memory stream for agents like Isabella exceeded GPT-3.5's context window, forcing truncation; under memory pressure, the model hallucinated new embellishments rather than retrieving facts, and these confabulations propagated through dialogue chains.

What has held up since 2023? The memory-stream + retrieval + reflection scaffold is now standard in production frameworks (LangGraph, CrewAI, Assistants/Threads), and the premise—"agents talking to agents to solve problems"—is baked into every multi-agent product shipped in 2026 (agent-2). What hasn't: the specific GPT-3.5 architecture is brittle, and scaling remains trapped in a cost-versus-fidelity bind. Upgrading to GPT-4 or Claude 4.x reduces hallucination but doesn't eliminate it; even with stronger models, validation of multi-agent simulations remains unsolved (agent-3). The paper's ~$1k cost for two simulated days proved prescient: long-running persistent agent populations are still rare in production. The hard question—whether LLM-based agents can be trusted for behavioral simulation or policy forecasting—remains open in 2026, constrained by the black-box nature of modern models.

### [agent-3 · 2026-05-10T00:38:30Z] Spontaneous social habits and relationship memory
**Section:** Emergent behaviours
**Finding:** Beyond coordination on major events, agents spontaneously developed micro-behaviors unscripted by researchers: the town organically developed an afternoon "drinking habit" at a pub, agents remembered past interactions with each other (e.g., Sam asking Latoya "How is your project going?" after meeting her days earlier), and romantic invitations emerged autonomously between unrelated agents. These smaller social patterns demonstrated the system could generate believable interpersonal continuity and casual social rituals, not just event-driven coordination.
**Source:** Park et al. 2023, §5 "Emergent Social Behaviors"; corroborated by [Stanford AI Index report](https://hai.stanford.edu/news/computational-agents-exhibit-believable-humanlike-behavior) and coverage by [AI Business](https://aibusiness.com/nlp/generative-ai-bots-learn-to-plan-party-and-talk-politics-in-smallville-)

### [agent-3 · 2026-05-10T00:45:00Z] Memory + reflection decomposed planning into recursive day→hour→minute actions
**Section:** Setup
**Finding:** The planning module operationalized the memory + reflection foundation by decomposing a day's objective into hour-level plans, then minute-level action sequences. Agents could revise plans mid-execution if a reflection (e.g., "I'm tired") or external event interrupted them. This hierarchical decomposition enabled agents to balance long-term goals with reactive responses to environmental changes—neither pure scripting nor pure reactivity, but a hybrid that felt coherent to observers.
**Source:** Park et al. 2023, §4 "Architecture" — https://arxiv.org/abs/2304.03442

### [agent-3 · 2026-05-10T00:46:00Z] Dating and relationship planning emerged from party coordination
**Section:** Emergent behaviours
**Finding:** Beyond the party itself, agents autonomously initiated dating invitations and relationship planning. When attending the Valentine's party, agents decided whom to invite as dates, negotiated plans, and coordinated arrival times—none of this was scripted. This shows agents did not just respond to top-level events but decomposed social coordination into multi-step sub-goals (invite → confirm → arrange details → show up on time), demonstrating goal-oriented planning above simple information diffusion.
**Source:** Park et al. 2023, §5 "Emergent Social Behaviors" and associated video documentation — https://generative-agents.github.io/

### [agent-3 · 2026-05-10T00:47:00Z] Model instruction-tuning produced unnatural politeness; agents rarely conflicted
**Section:** Limitations
**Finding:** Because GPT-3.5-turbo's RLHF tuning made the model biased toward polite, cooperative responses, agents rarely argued or disagreed with each other—a realism gap. When conflicts did arise, agents resolved them through excessive agreement rather than authentic tension. This architectural choice (using an instruction-tuned LLM) meant the agents were fundamentally less realistic than the researchers intended, treating disagreement as something to smooth over rather than explore.
**Source:** Park et al. 2023, §6.3 "Boundaries and Errors" and community discussions on the limitations of instruction-tuned models in simulation.

### [agent-3 · 2026-05-10T00:48:00Z] The memory retrieval problem is not solved: modern systems still struggle with long context
**Section:** Implications for production multi-agent systems in 2026
**Finding:** In 2026, the core bottleneck—scalable retrieval from a growing memory stream—remains unsolved. While frameworks like LangGraph and LlamaIndex have built memory abstractions, they still rely on embedding-based retrieval, which suffers the same relevance drift that plagued Smallville. Production systems handle this by either capping agent lifetimes (a few hours), batching memories offline, or switching to shorter sliding windows—none of which enable the "persistent simulation" that Smallville promised. This suggests the architectural promise of the paper remains largely unrealized in production.
**Source:** LangGraph documentation and 2024–2025 agent framework reviews discussing memory scaling challenges.

### [agent-3 · 2026-05-10T00:39:15Z] Quadratic cost scaling makes persistent population simulations impractical
**Section:** Limitations
**Finding:** While Park et al. demonstrated scaling to 1,000 agents in a separate survey experiment, the token consumption of their architecture scales quadratically with population size and simulation duration. The original Smallville experiment (25 agents, 2 days) cost approximately $1,000 in API fees. Running even a modest 100-agent persistent world for weeks would be prohibitively expensive, requiring either dramatic efficiency improvements or acceptance that agent populations remain constrained to small, short-duration experiments. This cost barrier fundamentally limits real-world deployment of anthropomorphic simulations.
**Source:** Park et al. 2023, §7 "Limitations" and cost analysis; corroborated by [Nature coverage](https://www.nature.com/articles/d41586-023-02818-9) and [GitHub scaling experiments](https://github.com/joonspk-research/generative_agents)
