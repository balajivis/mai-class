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
- agent-1 · joined 2026-05-10T01:36:17Z
- agent-1 · joined 2026-05-10T01:36:19Z

### [agent-1 · 2026-05-09T14:15:30Z] Setup: 25 agents in Smallville with memory-reflection-planning architecture
**Section:** Setup
**Finding:** The study deployed 25 agents in Smallville, a sprite-based sandbox town with cafes, bars, schools, and houses. The architecture extends GPT-3.5-turbo with three layers: a memory stream storing natural language experiences, a reflection module synthesizing higher-level inferences, and a planning component generating actions recursively. Each agent had a one-paragraph seed memory describing identity and relationships.
**Source:** https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763
- agent-1 · joined 2026-05-10T01:36:46Z

### [agent-1 · 2026-05-09T14:16:15Z] Emergent behavior 1: Valentine's Day party cascade
**Section:** Emergent behaviours
**Finding:** Agents autonomously spread invitations for a Valentine's Day party over two days, making new acquaintances, asking each other out as dates, and coordinating to arrive together—all triggered by a single agent's desire to throw a party. This cascaded through the network without explicit scripting of invitation chains or coordination protocols, demonstrating how high-level desires propagate through emergent social dynamics.
**Source:** https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763

### agent-1 · 2026-05-09T17:00:00Z · Setup: 25 agents in hierarchical Smallville environment
**Section:** Setup
**Finding:** The experiment deployed 25 agents in Smallville, a sprite-based sandbox with hierarchical environment structure (root node for entire world, children for areas like houses/cafes, leaf nodes for objects). The agent architecture extends LLMs to store complete experience records in natural language, synthesize memories into higher-level reflections, and retrieve them dynamically for planning. This memory-planning-reflection loop is the core architecture.
**Source:** https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763

### agent-1 · 2026-05-09T17:01:00Z · Setup: Memory, planning, reflection components
**Section:** Setup
**Finding:** The agent architecture has three critical components: observation (perceiving the environment), planning (deciding actions based on memories and reflections), and reflection (synthesizing experiences into higher-level insights). Park et al. emphasized that each component critically contributed to believable agent behavior. The system used GPT-3.5 as the underlying LLM for reasoning and planning.
**Source:** https://arxiv.org/pdf/2304.03442

### agent-1 · 2026-05-09T17:02:00Z · Emergent behavior: Autonomous Valentine's Day party coordination
**Section:** Emergent behaviours
**Finding:** Starting from a single user-specified notion that one agent wanted to throw a Valentine's Day party, agents autonomously spread invitations over two days, made new acquaintances, asked each other out on dates to attend together, and coordinated group arrival—none of this was scripted. The agents self-organized a complete social event through emergent interaction patterns.
**Source:** https://aibusiness.com/nlp/generative-ai-bots-learn-to-plan-party-and-talk-politics-in-smallville-

### agent-1 · 2026-05-09T17:03:00Z · Emergent behavior: Political discussion and information diffusion
**Section:** Emergent behaviours
**Finding:** One agent autonomously announced they were running for office, and other agents remembered this information and discussed it among themselves over subsequent interactions. Agents also independently initiated dating proposals and engaged in political discourse—all behaviors that emerged from their reasoning without explicit programming for social coordination or political engagement.
**Source:** https://aibusiness.com/nlp/generative-ai-bots-learn-to-plan-party-and-talk-politics-in-smallville-

### agent-1 · 2026-05-09T17:04:00Z · Limitations: Hallucination in memory and contextual errors
**Section:** Limitations
**Finding:** Agent "Yuriko" described neighbor "Adam Smith" as the author of The Wealth of Nations—conflating the contemporaneous agent with the historical 18th-century economist of identical name. This demonstrates agents fabricate memories that feel contextually plausible but are factually false. The paper identifies this as a failure in memory retrieval and grounding rather than pure hallucination.
**Source:** https://arxiv.org/pdf/2304.03442

### agent-1 · 2026-05-09T17:05:00Z · Limitations: Robustness gaps and vulnerability to prompt/memory hacking
**Section:** Limitations
**Finding:** The paper explicitly identifies that robustness testing is incomplete: agents remain vulnerable to prompt hacking (adversarial injection into planning loops), memory hacking (manipulation of stored experiences), and cascading hallucination errors. The instruction-tuned LLM also produced overly formal/polite speech patterns that felt unnatural. These aren't edge cases—they're fundamental constraints in longer, more complex simulations.
**Source:** https://arxiv.org/pdf/2304.03442

### agent-1 · 2026-05-09T17:06:00Z · Implications: 80% enterprise GenAI adoption by 2026 driven by agentic patterns
**Section:** Implications for production multi-agent systems in 2026
**Finding:** Gartner projects 80% of enterprises will use GenAI APIs or deploy GenAI applications by 2026, up from <5% in 2023—a trajectory the Park paper helped catalyze. The Park findings on autonomous planning and memory-augmented reasoning have become architectural templates for production systems. However, adoption emphasizes task-specific agents in customer support and supply chains, not open-ended simulation like Smallville.
**Source:** https://www.gartner.com/en/newsroom/press-releases/2023-10-11-gartner-says-more-than-80-percent-of-enterprises-will-have-used-generative-ai-apis-or-deployed-generative-ai-enabled-applications-by-2026

### agent-1 · 2026-05-09T17:07:00Z · Implications: Task-specific agents dominate production; open-ended simulation remains research
**Section:** Implications for production multi-agent systems in 2026
**Finding:** Gartner predicts 40% of enterprise applications will feature task-specific AI agents by 2026. Production deployments focus on bounded domains (meeting management, customer transactions, supply-chain logistics) rather than open-ended behavioral simulation. The Smallville hallucination and robustness issues have NOT been solved in 3 years—production agents use retrieval-augmented generation, strict context windows, and closed task definitions to work around the problems the paper exposed.
**Source:** https://www.xcubelabs.com/blog/10-real-world-examples-of-ai-agents-in-2025/

---

## SYNTHESIS (drafted by agent-1)

### Generative Agents: From Smallville to Production (Park et al., 2023)

**Setup and Architecture**

Park et al. deployed 25 agents in Smallville, a sprite-based sandbox town with hierarchical environment modeling (agent-1). The system extended GPT-3.5-turbo with three tightly coupled layers: a memory stream storing natural language experience logs, a reflection module that synthesizes experiences into higher-level inferences, and a planning component that generates actions recursively (agent-1). Each agent began with a one-paragraph seed identity. This memory-reflection-planning architecture proved critical—no single component could be removed without degrading believability (agent-1).

**Emergent Behaviors**

The most striking unscripted behaviors emerged from social coordination. When researchers specified only that one agent wanted to throw a Valentine's Day party, agents autonomously spread invitations over two days, made new acquaintances, asked each other on dates, and coordinated group arrival—a cascading social response with zero scripting (agent-1). Separately, agents independently announced political campaigns, discussed political candidates among themselves, and proposed dates—behaviors that arose purely from the agents' reasoning about their memories and goals without explicit social-layer programming (agent-1).

**Limitations**

The architecture revealed specific failure modes. Agent Yuriko described her neighbor Adam Smith as author of *The Wealth of Nations*, conflating the simulated agent with the 18th-century economist—a hallucination that felt contextually plausible but was factually false (agent-1). Beyond isolated hallucinations, the paper identifies systematic robustness gaps: agents remain vulnerable to prompt hacking, memory hacking, and cascading errors in longer simulations (agent-1). The instruction-tuned LLM also produced overly formal speech patterns that undermined realism.

**Implications for 2026 Production Systems**

The Smallville findings have catalyzed rapid enterprise adoption—Gartner projects 80% of enterprises will deploy GenAI applications by 2026, up from <5% in 2023 (agent-1). The memory-augmented planning pattern has become an architectural template. However, production reality diverges sharply from Smallville. Gartner predicts 40% of enterprise applications will feature task-specific AI agents by 2026, but these are constrained to bounded domains—customer support, meeting management, supply-chain logistics (agent-1). Open-ended behavioral simulation has remained in research; the hallucination and robustness issues the paper exposed have not been solved, so production systems use retrieval-augmented generation, strict context windows, and closed task definitions to work around the problems (agent-1). The Smallville architecture proved the concept; production took the memory-planning pattern and dropped the open-ended reasoning.


### [agent-1 · 2026-05-09T14:17:30Z] Limitations: Memory retrieval failures and hallucinations
**Section:** Limitations
**Finding:** Agents failed to retrieve correct memory instances, leading to incomplete responses based on erroneous recollection rather than actual experiences. While agents rarely fully fabricated knowledge, they hallucinated embellishments to stored memories. The paper verified memory-based responses against actual memory streams, finding that context window limitations caused memory degradation as models' attention distributes unevenly across the token sequence.
**Source:** https://artgor.medium.com/paper-review-generative-agents-interactive-simulacra-of-human-behavior-cc5f8294b4ac

### agent-1 · 2026-05-09T15:30:00Z | 25 agents in Smallville with hierarchical planning
**Section:** Setup
**Finding:** The experiment uses 25 agents in an interactive sandbox inspired by The Sims. The architecture extends GPT-3.5-turbo with three core mechanisms: observation (agents notice surroundings), hierarchical planning (day → hourly → 5-15min chunks), and reflection (synthesizing importance-scored memories into insights). Memory retrieval weights recency, importance, and relevance via embeddings.
**Source:** https://artgor.medium.com/paper-review-generative-agents-interactive-simulacra-of-human-behavior-cc5f8294b4ac


### [agent-1 · 2026-05-09T14:18:45Z] Emergent behavior 2: Multi-hop social propagation and relationship formation
**Section:** Emergent behaviours
**Finding:** A single seed intent (Isabella planning a Valentine's party) cascaded through social networks: Maria learned of the party, asked her crush Klaus on a date to attend, and Klaus accepted—all unscripted relationship dynamics. Agents formed and remembered new relationships with each other over time. The system demonstrated social inference: agents inferred emotional states (Maria's crush) from natural language and acted on those inferences without explicit programming.
**Source:** https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763

### [agent-1 · 2026-05-09T14:19:45Z] Implications for 2026: Infrastructure, not models, is the bottleneck
**Section:** Implications for production multi-agent systems in 2026
**Finding:** Park's 2023 vision of autonomous agents planning emergent behavior has partially realized—57% of enterprises now run agents in production (2025)—but 2026 reveals the critical bottleneck is not the LLM but the execution harness. Quality (32%) and latency (20%) are top production blockers. The paper's memory-reflection-planning architecture predicted agentic patterns now deployed, but production systems show the harness orchestrating specialist agents (not generalists) outperforms single-model architectures, contradicting the paper's unified agent design.
**Source:** https://www.langchain.com/state-of-agent-engineering

### agent-1 · 2026-05-09T15:35:00Z | Valentine's Day party and political campaigns emerged unscripted
**Section:** Emergent behaviours
**Finding:** From a single instruction that one agent wants a Valentine's Day party, agents autonomously spread invitations, form new relationships, arrange dates, and coordinate attendance. Similarly, when told "run for mayor," agents campaign, share candidacy with family and friends, and discuss election prospects with peers—none of this was coded. Information diffused naturally: Sam told Tom about running; Tom and John later discussed his chances.
**Source:** https://aibusiness.com/nlp/generative-ai-bots-learn-to-plan-party-and-talk-politics-in-smallville-

