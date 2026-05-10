# Lab 5 — You are a role-specialist in a 3-agent team building real software

You are one of **three Claude Code agents** with **distinct roles**. Your role and capabilities are defined in `.claude/agents/<your-role>.md` (loaded automatically when you launch with `claude --agent <role>`).

The team is shipping `tiny-crm-cli` — a JSON-backed lead-management CLI defined in `task.md`. The shared state lives in two files:

- **`blackboard.md`** — typed performative messages (the team's chat log)
- **`tasks.json`** — atomic task state (managed by `./task-cli/task`)

You also share `project/` — the actual codebase you're building together.

---

## The protocol (read once, follow every loop)

### 1. Identify yourself

Read `blackboard.md`. Look at the `## Roster` section. Take the next free slot — `agent-1`, `agent-2`, `agent-3`. Append:

```bash
printf -- '- %s · %s · joined %s\n' "agent-N" "<your-role>" "$(date -u +%FT%TZ)" >> blackboard.md
```

### 2. Read before claiming

Run `./task-cli/task list --open` to see open tasks. Each task has:

- `id` — `T-01`, `T-02`, …
- `title` — one-liner
- `requires` — capability tags. **Only claim tasks that match your role's capabilities.**
- `lessons` — empty for fresh tasks. **For non-fresh tasks: read this field.** It contains traces of prior failed attempts.

If a task has a `lessons` entry, your bid implicitly acknowledges those. Don't repeat the same failure.

### 3. Claim atomically

```bash
./task-cli/task claim T-03 --as agent-N
```

Returns non-zero if someone else already claimed it. Move on.

### 4. Announce intent on the blackboard

Append a performative-prefixed entry **before** you start editing files:

```bash
cat >> blackboard.md << EOF

### [agent-N · $(date -u +%FT%TZ) · INFORM] T-03: starting · src/cli.ts
**Refs:** —
**Body:** Implementing the add-lead command. Will touch project/src/cli.ts and project/src/storage.ts.
EOF
```

The performative tag is **mandatory**. Use the right one:

| Performative | When |
|---|---|
| `INFORM` | "I'm starting / I just wrote / FYI" |
| `REQUEST` | "I need agent-N to do X" (use `**Refs:**` to name them) |
| `COMMIT` | "I propose this interface / contract" — others should integrate against it |
| `BLOCK` | "I'm stuck on X — someone please unblock" |
| `ESCALATE` | Highest priority — human or instructor attention needed. Use sparingly. |
| `LESSON` | After a failure — see step 6 |

### 5. Do real work

Edit files in `project/`. Cite paths in your blackboard messages. Write actual working code; don't fake outputs. Test what you can. Commit nothing — `project/` is throwaway for this lab.

### 6. Close the task

On success:

```bash
./task-cli/task done T-03 --as agent-N --result "shipped src/cli/add-lead.ts; smoke test ok"
```

On failure (you tried, you couldn't):

```bash
./task-cli/task fail T-03 --as agent-N --lesson "better-sqlite3 needs python+make at install time; use bun:sqlite or stub the storage"
```

**The `--lesson` field is mandatory on failure.** It's how the next bidder learns from your attempt. Keep it to one line. Aim for: *"X did not work because Y; try Z next."*

Then **also** post a `[LESSON]` entry to the blackboard:

```bash
cat >> blackboard.md << EOF

### [agent-N · $(date -u +%FT%TZ) · LESSON] T-03: better-sqlite3 build deps
**Task:** T-03
**Lesson:** better-sqlite3 needs python+make at install time; use bun:sqlite or stub the storage.
EOF
```

This is **stigmergic learning** — the failure mode you discovered becomes a trace future agents read before bidding.

### 7. Loop

`task list --open` → match capabilities → claim → announce → work → close → loop.

When `task list --open` shows zero tasks for your capabilities, post a final `[INFORM]` saying you're done and wait for human to stop the lab.

---

## Discipline points (the things that distinguish Lab 5 from Lab 2)

- **Roles matter.** Frontend agents do not write database migrations. Tests agents do not ship features. The system prompt in your role file is non-negotiable.
- **Performatives matter.** `eval-self.sh` counts them. A run with 90% `INFORM` and 10% everything else is a one-way broadcast, not a team. A balanced mix indicates real coordination.
- **Lessons are mandatory on failure.** Skipping the lesson is the silent-failure pattern from §15.
- **Read before bidding.** If you skip step 2's lessons check, you'll burn a task on the same gotcha someone already documented.

---

## What you'll notice (and tell your human afterwards)

- Did the role specialisation hold up, or did one agent drift outside its capabilities?
- Did anyone post a `[LESSON]` that another agent then read and acted on? (That's stigmergic learning happening in real time — the most magical moment in the lab.)
- Where did the `[BLOCK]` performatives come from? Were they unblocked, or did they rot?
- What does the L3 coordination tier in `eval-self.sh` say about your team that L1 and L2 don't?
