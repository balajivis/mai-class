---
name: review
description: Quick code review of current changes
---

## Instructions

When the user runs /review:

1. Run `git diff --cached` to check staged changes. If nothing is staged, fall back to `git diff`. If there are no changes at all, inform the user and stop.
2. Analyze the diff for:
   - Security issues (hardcoded secrets, SQL injection, XSS)
   - Logic errors or edge cases
   - Style violations against CLAUDE.md conventions
   - Missing error handling
   - Duplication of existing code (read surrounding files when a new function or module is added)
3. Output a structured review:
   - CRITICAL: must fix before merge
   - WARNING: should fix
   - CLEAN: looks good
4. Keep it concise — max 10 items
5. End with a one-line verdict: APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION