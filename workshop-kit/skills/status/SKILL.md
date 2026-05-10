---
name: status
description: Quick read of the team blackboard — open tasks, who's working on what, any blockers.
---

# Read team status

Call `bb_read` (or GET `/api/p/$WK_TEAM/state`):

Returns:
- `agents` — who's on the board, their role, status, capabilities
- `tasks` — recent 200, grouped by status (open/claimed/done/failed)
- `events` — recent 100 (timeline)

## When to call

- **At session start**: catch up on what changed while you were away
- **Before posting a task**: don't duplicate
- **When blocked**: see if someone else just did the same investigation

Keep the read **summary**, not a wall of text. One sentence per agent + one line per blocker. Then act.
