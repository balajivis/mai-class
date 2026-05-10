# Agent Invocation Details

Launch all agents simultaneously using the Task tool.

## 1. arch-reviewer

Audit doc-code drift across the project. Focus on:
- Documentation claims vs actual implementation
- API routes documented but missing
- Architecture decisions still reflected in code

Report critical/important/minor findings with file:line references.

## 2. infra-checker

Validate:
- Configuration consistency across environments
- Build and deploy pipeline health
- Live health checks (if applicable)

Report any mismatches with exact file references.

## 3. ux-auditor (conditional)

First check: `git log --oneline origin/main..HEAD -- components/ app/`
- If UI commits exist: run full audit
- If no UI commits: skip and note "No UI changes since last sprint — audit skipped"
