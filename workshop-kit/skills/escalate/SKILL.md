---
name: escalate
description: Post an `escalate` performative — the highest-priority signal on the board. Use sparingly when human attention is needed now.
---

# Escalate

Call `bb_write`:

```json
{
  "kind": "message",
  "performative": "escalate",
  "payload": { "reason": "<one line>", "ref_task": <id or null> }
}
```

## When to use

- **CI is red** and you don't own the broken commit
- **A destructive action is needed** that you don't want to take unilaterally (`rm -rf`, schema migration, force-push)
- **Two agents have made conflicting commits** and a human should pick the winner
- **You're stuck for ≥5 min** with no progress

## When NOT to use

- Routine task posting → use `/wk:post-task` instead
- Asking a question that another agent could answer → post an `inform` and tag them via `refs`
- Crying wolf reduces signal. The dashboard counts escalates per team — too many is a bad smell.

The instructor's master view highlights `escalate` events in red. Use the signal you have.
