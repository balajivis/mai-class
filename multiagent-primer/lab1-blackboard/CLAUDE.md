# Lab 1 — You are an agent in a 3-agent team

You are one of **three Claude Code agents** sharing this directory. There is no coordinator. There are no assigned tasks. The only thing you share is a single file: `blackboard.md`.

Your team's job is to produce the brief described in `task.md`.

---

## Protocol (read carefully — this is the entire lesson)

### 1. Identify yourself
Read `blackboard.md`. Look at the `## Roster` section.
- If it is empty, register yourself as `agent-1`.
- Otherwise, take the next free slot (`agent-2`, then `agent-3`).
- Append a line to the roster with your name and the current `date -u +%FT%TZ`.

Use `cat >> blackboard.md` for atomic appends — for example:

```bash
printf -- '- %s · joined %s\n' "agent-N" "$(date -u +%FT%TZ)" >> blackboard.md
```

**Never use Edit on the roster section** — three agents Editing the same lines will race and lose writes. Append-only is the discipline that keeps the lesson clean.

### 2. Read the task
Open `task.md`. The brief has four required sections. Note them.

### 3. Read the board before doing anything
Every time you are about to do work, **first** re-read `blackboard.md`. If another agent has already posted findings on the angle you were about to research, **pick a different angle**. Duplicating work wastes the team's time.

### 4. Research
Use `WebFetch`, `WebSearch`, or your existing knowledge. Find concrete facts with sources. Be skeptical of your own first instinct — if you can't cite it, don't post it.

### 5. Post to the board
Append your finding using:

```bash
cat >> blackboard.md << 'EOF'

### [agent-N · YYYY-MM-DDTHH:MM:SSZ] <one-line headline>
**Section:** <one of the four required sections>
**Finding:** <2–4 sentences>
**Source:** <URL or citation>
EOF
```

Always append. Never delete or overwrite another agent's finding. If you think a finding is wrong, post a counter-finding underneath; let the synthesis decide.

### 6. Loop
Re-read the board. Find a gap (a required section with no findings, or thin coverage). Research. Post. Repeat.

### 7. Synthesise
When all four required sections have at least two findings each, the **first agent to notice this** writes the synthesis:

```bash
cat >> blackboard.md << 'EOF'

---

## SYNTHESIS (drafted by agent-N)

<the ~400-word brief, structured by the four required sections,
 weaving in the findings above with inline (agent-N) attribution>
EOF
```

Other agents: **do not rewrite** the synthesis. If you disagree, append a `## REVISIONS` section underneath with specific suggestions. Whoever wrote the synthesis decides whether to fold them in.

### 8. Stop
When the synthesis is posted and at least two agents have reviewed it (i.e. read it without posting revisions), the work is done. Reply to your human "done — see `blackboard.md`" and exit.

---

## Rules of the road

- **Read before write, every single time.** The board changes between your loops.
- **Append-only.** Never `Edit` or `Write` `blackboard.md` — only `Bash` with `>>`.
- **Be brief.** The final brief is ~400 words. Each finding is 2–4 sentences.
- **Cite or it didn't happen.** Findings without sources are noise.
- **Don't narrate.** Don't post "I'm now going to research X." Just go research X and post the finding.

---

## What you will notice (and what to tell the human afterwards)

After this lab finishes, your human is going to ask you three questions:

1. **Where did you duplicate work?** (Two agents researching the same thing because neither re-read the board.)
2. **Where were you idle?** (You finished and didn't know what to do next.)
3. **What was the bottleneck?** (The synthesis step, usually — only one agent can write it at a time.)

Watch for these as you work. They are the lesson.
