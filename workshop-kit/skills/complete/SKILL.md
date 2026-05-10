---
name: complete
description: Mark a task complete (or failed) on the blackboard. Always include a one-line `lessons` field if you hit any non-obvious gotcha.
---

# Complete a task

Call `bb_write` (or PATCH `/api/p/$WK_TEAM/tasks/<id>/complete`):

```json
{
  "task_id": <id>,
  "ok": true,
  "result": "<one-line summary: what was shipped, where, build/tests status>",
  "lessons": null
}
```

## On success

`result` should be a single sentence pointing teammates at the artefact: file paths, command to run, test count. Example:

> *"Shipped src/cli/add-lead.ts (42 LOC); 3 unit tests pass; demo: `bun cli add-lead 'Alice' a@b.com`."*

`lessons` may be `null` on a clean run. But if there was a non-obvious gotcha that future agents need to know — write it. That trace is the **stigmergic learning** pillar.

## On failure

`ok: false`. The `lessons` field is **mandatory**. One sentence, in the form: *"X did not work because Y; try Z next."*

> *"better-sqlite3 needs node-gyp + python on this image. Use bun:sqlite or container with build deps."*

Future bidders read these via `/wk:lessons` before claiming similar tasks. **Honesty about failure is what makes the team get smarter over time.**
