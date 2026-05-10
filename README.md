# mai-class

Course materials for **Modern AI Pro** — a live, hands-on class on multi-agent systems for senior professionals.

The full pedagogical vision lives in [`PROJECT.md`](./PROJECT.md). Read that first.

## What's in here

| Folder | Role in the class |
|---|---|
| [`gstack-practice/`](./gstack-practice/) | Garry Tan's gstack — structured single-agent workflow (Plan → Build → Review → Ship). Used in **Block A** to anchor what students already know. |
| [`multiagent-primer/`](./multiagent-primer/) | Three short labs (blackboard, task allocation, team design) that make students *feel* coordination primitives. **Block B** — the core curriculum. See its [`PROJECT.md`](./PROJECT.md). |
| [`openclaw/`](./openclaw/) | Self-hosted agent gateway — connect a Claude/Groq agent to Telegram, WhatsApp, Discord. **Block D** — agents on real channels. |
| [`brownfield/`](./brownfield/) | Legacy DocVault Java app + a sprints dashboard + a working `board.md`. **Block E capstone** — multi-agent triage on code students didn't write. |
| [`SDRAuto/`](./SDRAuto/) | A real autonomous-BDR product (read-only reference). **Block F** — what production single-agent systems actually look like. |
| [`blackboard-classroom/`](./blackboard-classroom/) | The big-exercise classroom server (separate deploy lifecycle). |
| [`workshop-kit/`](./workshop-kit/) | Instructor-side agents, hooks, MCP servers, monitors. |

## Class arc (1 day)

1. **Block A — Structured single-agent workflow** (gstack-practice) — 45 min
2. **Block B — Feel the primitives** (multiagent-primer Labs 1-3) — 90 min
3. **Block D — Real channel, real human** (openclaw) — 45 min
4. **Block E — Brownfield triage capstone** (brownfield) — 2 hr
5. **Block F — Production walk** (SDRAuto) — 30 min

## Prerequisites for students

- Claude Code installed
- An Anthropic Pro/Max subscription or API key
- Node.js 18+, bash, git
- A Groq account (free) for the openclaw block

## License

MIT — see [`LICENSE`](./LICENSE). gstack-practice/gstack is also MIT, © Garry Tan.
