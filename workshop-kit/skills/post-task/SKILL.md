---
name: post-task
description: Post a new task to the team blackboard. Use when you've identified work that someone else (human or agent) should do.
---

# Post a task to the blackboard

Call the `bb_write` MCP tool with these arguments:

```json
{
  "kind": "task_post",
  "title": "<one-line title, ≤80 chars>",
  "detail": "<what 'done' looks like; ≤2 sentences>",
  "requires": ["<capability tag>", "..."],
  "performative": "request"
}
```

If `bb_write` is unavailable, fall back to:

```bash
curl -s -X POST "$WK_API/api/p/$WK_TEAM/tasks" \
  -H "Authorization: Bearer $WK_TOKEN" \
  -H "X-Agent: $WK_AGENT" \
  -H "Content-Type: application/json" \
  -d '{"title":"…","detail":"…","requires":["frontend"]}'
```

## Capability tags (use these, not freeform)

`frontend` · `backend` · `tests` · `db` · `docs` · `devops` · `design` · `any`

Use `any` only when no specialisation matters (e.g. "rename a file"). Tagging tasks well is what makes Mode B (capability-matched) and Mode C (contract-net) actually work.

## Examples

- *"Add /add-lead command. Accept name+email, append JSON to leads.json. Tag: backend, tests."*
- *"Style the lead list: zinc/amber, monospace IDs. Tag: frontend."*

## Don't post

- Tasks already on the board (check `/wk:status` first).
- Tasks you could finish in 60 seconds yourself.
- Vague tasks. *"Improve the code"* is not a task.
