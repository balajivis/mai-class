# mai-class

Course materials for **Modern AI Pro** — a live, hands-on class on multi-agent systems for senior professionals.

The full pedagogical vision lives in [`PROJECT.md`](./PROJECT.md). Read that first.

## What's in here

| Folder | Role in the class |
|---|---|
| [`multiagent-primer/`](./multiagent-primer/) | The core curriculum. Five labs: Lab 0 (single-agent rhythm — bundles gstack + SDRAuto), Lab 1 (blackboard), Lab 2 (task allocation), Lab 3 (team design), Lab 4 *optional* (openclaw — agents on real channels). **Blocks A + B + D + F**. See its [`PROJECT.md`](./PROJECT.md). |
| [`brownfield/`](./brownfield/) | Legacy DocVault Java app + a sprints dashboard + a working `board.md`. **Block E capstone** — multi-agent triage on code students didn't write. |
| [`blackboard-classroom/`](./blackboard-classroom/) | The big-exercise classroom server (separate deploy lifecycle). |
| [`workshop-kit/`](./workshop-kit/) | Instructor-side agents, hooks, MCP servers, monitors. |

## Class arc (1 day)

1. **Block A — Single-agent workflow rhythm** (`multiagent-primer/lab0-workflow/`, bundles gstack) — 45 min
2. **Block B — Feel the primitives** (`multiagent-primer/` Labs 1-3) — 90 min
3. **Block D — Real channel, real human** (`multiagent-primer/lab4-openclaw-optional/`) — 45 min, *optional*
4. **Block E — Brownfield triage capstone** (`brownfield/`) — 2 hr
5. **Block F — Production walk** (`multiagent-primer/lab0-workflow/SDRAuto/`) — 30 min

The four primer labs (0 → 1 → 2 → 3) are designed to be done in sequence — Lab 0 establishes the single-agent baseline, then Lab 1 reveals the coordination problem, then 2 and 3 patch it.

## Prerequisites for students

- Claude Code installed
- An Anthropic Pro/Max subscription or API key
- Node.js 18+, bash, git
- A Groq account (free) — only if you do the optional Lab 4 (openclaw)

## License

MIT — see [`LICENSE`](./LICENSE). The bundled `multiagent-primer/lab0-workflow/gstack/` is also MIT, © Garry Tan.
