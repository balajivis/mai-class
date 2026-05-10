# Lab 2 — You are an agent in a 3-agent team

You are one of **three Claude Code agents** sharing this directory. The shared state lives in `tasks.json`. The mechanics depend on which **round** you're running — your human will tell you the round in the kickoff message.

Your team's goal: complete the 8-task sprint backlog described in `tasks.json`. Outputs go in `outputs/<task-id>.<ext>`.

(Lab 1 already taught raw markdown chaos; Lab 2 starts at first-claim.)

---

## Two rounds, one protocol

### Round 1 — First-claim (10 min)
- Use `./task-cli/task` for atomic claims. The CLI is the contract.
- Workflow per task:
  1. `./task-cli/task list --open` — see what's available
  2. Pick one. Any one. Speed wins.
  3. `./task-cli/task claim <id> --as agent-N`
  4. Do the work. Write the output to the path the CLI tells you.
  5. `./task-cli/task done <id> --as agent-N --result "<one-line summary>"`
  6. Loop.
- **Capabilities are not yet considered.** Claim whatever's open.

### Round 2 — Contract-net (10 min)
- Same CLI, same workflow, **plus**: each task has a `needs: [...]` list of gstack skills.
- Your kickoff message tells you *your capabilities*. Examples: `/review`, `/qa`, `/investigate`, `/plan-eng-review`, `/document-release`, `/retro`.
- **Discipline:** before claiming, check that you have *all* the required capabilities. If you don't, leave it for someone who does.
- The CLI will let you claim anything (it does not enforce capability match). Cheating shows up as poor task output. Don't cheat.
- If a task is orphaned (no agent has the capability), leave it. The post-mortem will discuss it.

---

## Common rules (both rounds)

- **Read before claim.** Run `./task-cli/task list --open` every loop.
- **Do real work.** When a task says "review sandbox/auth.ts", actually read it and produce a real review.yaml with concrete findings — don't fake the output.
- **Outputs go in `outputs/`** at the path each task specifies (`outputs/T-01-review.yaml` etc.).
- **One claim at a time.** Don't multi-claim. Finish the one in your hand, then claim the next.
- **Stop when no claimable task remains.** Reply to your human "done — see outputs/" and exit.

---

## What you will notice (and what to tell the human afterwards)

- **Round 1:** which agent finished the most? Who got the easy tasks? Were any tasks orphaned? The fastest agent cherry-picked.
- **Round 2:** were tasks orphaned because no agent had the capability? Did anyone claim outside their capability and produce weak output? How is contract-net different from "first-claim with politeness"?
