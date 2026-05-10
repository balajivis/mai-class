# mai-class

Course materials for **Modern AI Pro** — a live, hands-on class on multi-agent systems for senior professionals.

The full pedagogical vision lives in [`multiagent-primer/PROJECT.md`](./multiagent-primer/PROJECT.md). For the student entry point, read [`multiagent-primer/README.md`](./multiagent-primer/README.md).

## What's in here

| Folder | Role in the class |
|---|---|
| [`multiagent-primer/`](./multiagent-primer/) | The entire core curriculum. Six labs (0 → 1 → 2 → 3 → 5, with Lab 4 as an optional sidequest). See its [`README.md`](./multiagent-primer/README.md) for the lab list and [`PROJECT.md`](./multiagent-primer/PROJECT.md) for the design rationale. |

The primer bundles its own toolkits (gstack, openclaw) and sandboxes (SDRAuto, docvault-legacy) — students clone this repo and have everything they need.

## Class arc (~4 hours)

1. **Block A — Single-agent workflow rhythm** (`lab0-workflow/`, bundles gstack) — 45 min
2. **Block B — Feel the primitives** (`lab1-blackboard/` → `lab2-task-allocation/` → `lab3-team-design/`) — 90 min
3. **Block C — Build sprint capstone** (`lab5-build-sprint/`) — 75 min
4. **Block D — Real channel, real human** (`lab4-openclaw-optional/`) — 45 min, *optional*

The labs are designed to be done in order — Lab 0 establishes the single-agent baseline, Lab 1 reveals the coordination crisis, Labs 2 and 3 patch it, and Lab 5 is the build-sprint capstone where role-specialized agents ship real working code with a 3-tier eval. Lab 4 is an optional sidequest on HITL.

## Prerequisites for students

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and logged in
- An Anthropic Pro/Max subscription or API key
- Node.js 18+, Bun v1.0+, `bash`, `git`, `tmux` (macOS / Linux / WSL)
- A Groq account (free) — only if you do the optional Lab 4 (openclaw)

## License

MIT — see [`LICENSE`](./LICENSE). The bundled `multiagent-primer/lab0-workflow/gstack/` is also MIT, © Garry Tan.
