# Lab 1 — The Blackboard

**Time:** 25 min (5 setup · 15 work · 5 reflect)
**Lessons it reinforces:** §8 Shared State
**Where this fits:** comes after [Lab 0 — Workflow Rhythm](../lab0-workflow/) and before Labs 2, 3, 5, and the optional Lab 4 (openclaw) in the [multi-agent primer](../README.md). Read [`../PROJECT.md`](../PROJECT.md) for the full pedagogical thesis.

---

## What you are about to do

Run **three Claude Code agents on your own laptop** in parallel. They share one file: `blackboard.md`. There is no coordinator, no task list, no roles. Just three peers and a shared notebook.

Together they will research a topic and produce a short brief.

You will watch what happens. You will see them duplicate work, miss gaps, race on writes, and eventually converge. That mess is the lesson.

---

## Prereqs

You need a POSIX shell (bash + awk + sed + grep), `claude`, and `tmux`. macOS and Linux already have the shell tools. **Windows does not** — see the Windows path below.

### macOS / Linux

Check tmux:

```
tmux -V
```

If that errors, **let Claude install it for you** — you don't need to know your platform's package manager. In a plain terminal run `claude` and paste:

> Install tmux on this machine. Detect my OS, use the right package manager, and verify with `tmux -V` when you're done.

On Linux the install needs `sudo` (you'll be asked for your password). On macOS without Homebrew, Claude will install Homebrew first — that's a 2-minute detour, not a problem. Once `tmux -V` prints a version, exit that Claude session.

### Windows

PowerShell and `cmd.exe` cannot run this lab. You have two options:

**Option A — WSL (recommended).** WSL = *Windows Subsystem for Linux*: a free, Microsoft-built feature that runs a real Ubuntu shell inside Windows 10/11. No VM to configure, no dual-boot. After install you have a `bash` terminal that behaves like Linux, and the rest of the lab works exactly like the macOS/Linux instructions above.

To install, open **PowerShell as Administrator** and run:

```
wsl --install
```

This installs Ubuntu by default (~5 min), then asks for a reboot. After reboot, launch "Ubuntu" from the Start menu — you're now in a Linux shell. Install Claude Code inside that Ubuntu shell (not in PowerShell), then `cd` to this lab directory from inside Ubuntu and follow the macOS/Linux instructions.

If `wsl --install` fails because your laptop is corporate-managed and blocks admin actions, use Option B.

Once you're in the Ubuntu shell, you can let Claude do the rest:

> I'm in WSL Ubuntu. Install tmux and verify Claude Code is on PATH. Use apt and run anything that needs sudo. Confirm with `tmux -V` and `claude --version`.

**Option B — GitHub Codespaces (no install).** A browser-based Linux VM. Free tier covers a 90-min workshop. Go to [github.com/codespaces](https://github.com/codespaces), create a new codespace on any repo (or a blank one), open the terminal, install Claude Code there, then clone this repo and run the lab. Everything works unchanged because the codespace is Linux.

---

## Setup (5 min)

1. **`cd` into this directory and launch the lab:**

   ```
   cd /path/to/multiagent-primer/lab1-blackboard
   ./lab1-up.sh
   ```

   This opens a single tmux window with **four panes**:
   - top-left: the live mirror (`bb-watch.sh`)
   - other three: a `claude` session each — your three agents

   The `CLAUDE.md` in this directory is loaded automatically into each agent — they already know the protocol.

   **Model:** the launcher starts each agent on **Haiku** (`claude --model haiku`). Three Sonnet/Opus agents running in parallel will burn a Pro-plan budget before the 15-min work block ends; Haiku is fast, cheap, and entirely sufficient for the research-and-append protocol this lab uses. To override, edit `lab1-up.sh` or run `claude` (no flag) in a fourth pane manually.

2. **tmux survival kit** — just four keystrokes, all start with `Ctrl-b`:

   | Key | What it does |
   |---|---|
   | `Ctrl-b` then arrow | Move to the next pane (or just click it) |
   | `Ctrl-b z` | Zoom current pane fullscreen (press again to unzoom) |
   | `Ctrl-b d` | Detach — session keeps running; reattach with `./lab1-up.sh` |
   | `./lab1-down.sh` | Kill everything when the lab ends |

3. **The live mirror** refreshes once per second and gives you:
   - Color-coded lines per agent (so you instantly see who is dominating)
   - Section coverage counters (instantly see which of the 4 sections is under-covered)
   - 🔁 **Duplicate detection** — flagged when ≥2 agents post on the same section
   - 💤 **Stale warning** — flagged when no writes for >60 seconds
   - ✓ **Synthesis tracker** — once posted, marks the work done

   You can also just `cat blackboard.md` at any time — the file is the source of truth.

   **Projection mode** — for classroom display, run `./bb-serve.sh` in any spare terminal. It serves an editorial web mirror at <http://localhost:8765/bb-mirror.html> with the same warnings (duplicates, idle, synthesis) rendered as four partition cards on a chalkboard. Use this on the projector while keeping `bb-watch.sh` in your tmux pane for personal monitoring.

4. **In each agent pane, paste this single message to kick off:**

   > Read `task.md`. Register yourself on the roster. Then begin.

   Stagger the three kick-offs by **~5 seconds each**. Simultaneous starts make all three claim `agent-1`; gaps longer than ~15s let the first agent finish too much before the others wake up. Five seconds is the sweet spot.

---

## During the work (15 min)

Watch the live mirror. Make a note (on paper) every time you see:

- 🔁 **Duplication** — two agents posting findings on the same angle within a minute
- 💤 **Idle** — an agent that has stopped posting and isn't doing anything
- 🚧 **Bottleneck** — work piling up at one stage (usually the synthesis)
- 💥 **Race** — two agents trying to write the same section at the same instant; one wins, one fails
- 🤝 **Coordination move** — an agent reading the board and *changing course* because of what someone else posted

**Do not intervene.** Even if it looks like the agents are stuck, let them work it out. The mess is the data.

---

## After (5 min)

Open `blackboard.md`. Then answer these on paper:

1. **Where did your team duplicate work?** Which sections got over-covered?
2. **Where were they idle?** What was each agent doing in the last 3 minutes?
3. **Where was the bottleneck?** (Hint: which step could only happen once?)
4. **What single change would have helped most?** A coordinator? A task list? Stricter rules about who writes when?

Hold onto your answer to question 4. **It is the design brief for Lab 2.**

---

## What good looks like

A blackboard with:
- 8–12 findings, distributed roughly evenly across the four required sections
- A synthesis at the bottom, ~400 words, with inline attribution
- Maybe one or two duplicates (you should expect some — three agents with no coordination are not going to be perfect)

If you got a perfectly clean board with zero duplicates: your agents were probably too cautious. Run again and tell them to be more aggressive about claiming angles.

If you got a board with seven findings all on the same topic: your agents weren't re-reading the board. Run again and tighten the protocol.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Two agents both registered as `agent-1` | They started simultaneously and both saw an empty roster | Restart, stagger by 5 sec |
| `cat >> blackboard.md` writes appear interleaved | Two agents wrote at the same instant | This is supposed to happen sometimes. Note it as a 💥 race. |
| All three agents stop early, brief is incomplete | They each thought someone else would do the next bit | This is the *coordination crisis* — keep your notes for the post-mortem |
| One agent dominates and writes everything | Your other two agents are being too polite | Restart and tell them all "be the agent who acts" |

---

## Then proceed to Lab 2.
