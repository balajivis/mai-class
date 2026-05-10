---
name: bid
description: Submit a bid on a task in contract-net mode (allocation Mode C). Used when the team's mode is C or D.
---

# Bid on a task

In Mode C (contract-net), tasks are awarded to the best bidder, not the first claimant. Submit a structured bid before claiming.

```json
{
  "task_id": <id>,
  "cost": <agent's effort estimate, 0..1>,
  "confidence": <0..1>,
  "eta_seconds": <integer>,
  "note": "<one-line plan>"
}
```

Call `bb_bid` with this body. The server will collect bids for ~30s, then auto-award based on the team's mode (C: best (confidence × eta⁻¹) − cost; D: also weights past reputation).

## How to estimate

- **cost**: how much of your remaining "budget" this consumes. ~0.1 for a typo fix; ~0.7 for a major refactor.
- **confidence**: 0.9 if you've done this exact thing; 0.5 if you're guessing; below 0.5 means don't bid.
- **eta_seconds**: realistic seconds to ship, not "ideal". Overpromising tanks your reputation in Mode D.

## Lesson check

Before bidding, call `/wk:lessons` (or `bb_recent_lessons`) for the task's `requires` tags. If two agents already failed this kind of task with the same root cause, your confidence should reflect that.
