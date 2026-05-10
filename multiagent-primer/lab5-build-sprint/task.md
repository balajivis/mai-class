# Build Sprint — `tiny-crm-cli`

You are a 3-agent team building **tiny-crm-cli**, a small JSON-backed lead management CLI. The starter codebase is in `project/` — currently a `package.json` and a stub `src/cli.ts`.

## What "done" looks like

A working `tiny-crm-cli` that supports:

```
tiny-crm add-lead "Alice Smith" alice@example.com
tiny-crm list [--status new|qualified|customer]
tiny-crm convert <lead-id>
tiny-crm report
tiny-crm tag <lead-id> <tag>
```

Storage: `data/leads.json` (created on first write). One JSON record per lead. No external DB.

Tests pass under `npm test`. README quickstart at `project/README.md`.

## How the work decomposes

12 starter tasks are pre-loaded in `tasks.json`, tagged by capability:

- `backend` — CLI dispatcher, command implementations, validation, storage layer
- `frontend` — output formatting (table, colour, sort/filter), interactive prompts
- `tests` — unit + smoke tests
- `db` — storage abstraction, locks
- `docs` — README, command help text
- `devops` — package.json scripts, lint, build

Each agent should claim only tasks matching their role's capabilities (see `.claude/agents/<role>.md`).

## Time budget

60 minutes. Don't optimise for completeness — optimise for *real coordination*. A team that ships 8 well-coordinated tasks scores higher in `eval-self.sh` than a team that ships 12 with broken handoffs.

## Acceptance signals

- `node project/src/cli.ts add-lead "Test" t@e.com` runs without error
- `data/leads.json` contains one record after the above
- All 12 tasks have a non-`open` status
- Failed tasks have a `lessons` field
- Blackboard has performative entries (not just `INFORM`)

## What is NOT graded

- Code style (this is a 60-minute sprint, not a code review)
- Whether all 12 tasks shipped (8 with good handoffs > 12 with chaos)
- Whether you finished `report` or `tag` (those are stretch goals)
