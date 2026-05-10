There are a lot of nodejs libaries that might occupy the space. Watchout for them.

# gstack (garrytan/gstack)

Garry Tan's open-source "software factory" for Claude Code. A collection of SKILL.md
slash commands that give Claude Code structured specialist roles, following a sprint
process: Think → Plan → Build → Review → Test → Ship → Reflect.

## What it is

- 15 specialist personas + 6 power tools, all as slash commands
- Each skill is a Markdown prompt template (SKILL.md generated from .tmpl files)
- Includes a headless Playwright browser binary for real QA testing
- Skills chain together — output from one feeds into the next
- MIT licensed, installed to ~/.claude/skills/gstack/

## Specialist skills

| Command | Role | Purpose |
|---------|------|---------|
| /office-hours | YC Office Hours | Reframes product idea before coding, challenges premises |
| /plan-ceo-review | CEO / Founder | Challenges scope, finds the 10-star product |
| /plan-eng-review | Eng Manager | Locks architecture, data flow, edge cases, test plan |
| /plan-design-review | Senior Designer | Rates design dimensions 0-10, explains what a 10 looks like |
| /design-consultation | Design Partner | Builds a complete design system from scratch |
| /review | Staff Engineer | Finds bugs that pass CI but break in prod, auto-fixes obvious ones |
| /investigate | Debugger | Systematic root-cause debugging, no fixes without investigation |
| /design-review | Designer Who Codes | Design audit + fix loop with atomic commits |
| /qa | QA Lead | Opens real browser, finds bugs, fixes them, generates regression tests |
| /qa-only | QA Reporter | Same as /qa but report-only, no code changes |
| /ship | Release Engineer | Runs tests, audits coverage, pushes, opens PR — one command |
| /document-release | Technical Writer | Updates all docs to match what shipped |
| /retro | Eng Manager | Weekly retro with per-person stats, shipping streaks, trends |
| /browse | QA Engineer | Headless Chromium browser, real clicks, ~100ms per command |
| /setup-browser-cookies | Session Manager | Import cookies from real browser for authenticated testing |

## Power tools

| Command | Purpose |
|---------|---------|
| /codex | Second opinion from OpenAI Codex CLI (review, adversarial, consultation modes) |
| /careful | Warns before destructive commands (rm -rf, DROP TABLE, force-push) |
| /freeze | Locks edits to one directory, prevents accidental changes elsewhere |
| /guard | Activates both /careful + /freeze at once |
| /unfreeze | Removes /freeze restrictions |
| /gstack-upgrade | Self-updater, detects global vs vendored install |

## Project structure

```
gstack/
├── browse/           # Headless browser CLI (Playwright)
│   ├── src/          # CLI + server + commands
│   └── dist/         # Compiled binary
├── scripts/          # Build + DX tooling (gen-skill-docs, skill-check, dev-skill)
├── test/             # Skill validation + eval tests
├── <skill-name>/     # Each skill has its own directory with SKILL.md.tmpl
├── setup             # One-time setup script
├── SKILL.md.tmpl     # Root template
└── package.json      # Build scripts (bun-based)
```

## Key technical details

- SKILL.md files are generated from .tmpl templates — edit the template, not the output
- Build with: bun install && bun run build
- Tests: bun test (free, <5s), bun run test:evals (paid, ~$4/run)
- Skills are platform-agnostic: they read CLAUDE.md for project config, never hardcode frameworks
- Designed for 10-15 parallel sprints via Conductor (conductor.build)
- Requirements: Claude Code, Git, Bun v1.0+