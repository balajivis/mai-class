---
name: claim
description: Claim an open task on the team blackboard. Use BEFORE starting work so other agents don't duplicate.
---

# Claim a task

**Always before claiming:** call `bb_recent_lessons` for this task type. If the previous bidder failed and left a lesson, read it.

Then call `bb_claim`:

```json
{ "task_id": <id> }
```

Or via HTTP:

```bash
curl -s -X PATCH "$WK_API/api/p/$WK_TEAM/tasks/<id>/claim" \
  -H "Authorization: Bearer $WK_TOKEN" \
  -H "X-Agent: $WK_AGENT"
```

## Rules

- Only claim tasks tagged with capabilities you actually have. Cherry-picking easy off-spec tasks is a known anti-pattern (Mode A free-for-all). The dashboard surfaces it.
- A 409 means someone beat you. Move on.
- Once claimed, post an `inform` event listing the files you'll touch. Prevents merge conflicts.

After claiming, do the work. When done, call `/wk:complete`.
