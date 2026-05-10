---
name: session-dump
description: Extracts user commands from all active Claude terminal sessions in the current project and compiles them into a structured markdown file.
argument-hint: "[output-filename]"
---

## Instructions

When the user runs `/session-dump [filename]`, scan all Claude conversation logs for the current project and extract the essential user commands from each session into a single markdown summary file.

### 1. Locate session files

- Read all `.jsonl` files from `~/.claude/projects/<project-id>/` where `<project-id>` corresponds to the current working directory (path with `-` replacing `/`).
- Each `.jsonl` file represents one Claude terminal session.

### 2. Extract user commands

For each session file, parse the JSONL and collect messages where:
- `type` is `"user"`
- There is no `toolUseResult` key (skip tool confirmations — these are not user-initiated prompts)
- The message content text is non-trivial (longer than 5 characters, not a system/command wrapper)

Filter out noise:
- Skip `<local-command-caveat>` wrapper messages
- Skip `<local-command-stdout>` messages
- Skip `/model` and other local CLI command invocations
- Skip `<command-message>` skill invocation wrappers (keep only the actual user intent)
- Keep the substantive prompts the user typed

### 3. Identify terminal names

Terminal names (e.g., PM, Architect, Dev) are not stored in session metadata. Infer them from content:
- Look at what the session does (project organization = PM, specs/architecture = Architect, coding/CLI = Dev, testing = Test, reviewing = Reviewer, documentation/slides = Doc, etc.)
- If the current session is one of them, label it accordingly
- If a session has no user commands, note it as idle

### 4. Write the output

- Default output file: `terminal-sessions.md` in the project root
- If the user provides `$ARGUMENTS`, use that as the filename instead
- Format:

```markdown
# Claude Terminal Sessions — YYYY-MM-DD

## <Terminal Name>
> One-line summary of what this session did.

\`\`\`
first user command
\`\`\`
\`\`\`
second user command
\`\`\`

## <Next Terminal>
...
```

- Include a summary table at the end mapping each terminal to its purpose
- If a terminal has no commands, note: `*(No commands found — session may be idle.)*`

### 5. Important rules

1. **Only extract user-typed prompts** — not assistant responses, tool calls, or system messages
2. **Preserve the original wording** of each command exactly as typed
3. **Skip duplicate/repeated commands** (e.g., "let me know when it is done" repeated multiple times — include it once with a note)
4. **Group by terminal**, not chronologically across all sessions
5. **Current session**: label it but don't include the `/session-dump` invocation itself
