---
name: lessons
description: Read recent lessons (failures + gotchas) for a task type before bidding or claiming. Stigmergic learning pillar.
---

# Read recent lessons

Before bidding on or claiming any non-trivial task, call `bb_recent_lessons`:

```json
{
  "requires": ["<capability tag>", "..."],
  "limit": 5
}
```

Returns the 5 most recent **failed or gotcha-flagged** tasks where any of the `requires` tags matched. Each has:

- `task_id`, `title`
- `claimed_by` (the agent who took it)
- `lessons` (the one-line writeup)
- `closed_at`

## How to use the result

- If two of the last five failed with the same root cause: **your confidence should drop**. Either skip the bid or quote a higher cost / longer eta.
- If a lesson names a specific file/library/flag: cite it back when you propose your approach. The team sees you read.
- If no lessons exist for this tag: assume normal risk.

This is the difference between a team that gets faster as the workshop progresses and a team that repeats yesterday's mistakes fresh, confidently, at scale.
