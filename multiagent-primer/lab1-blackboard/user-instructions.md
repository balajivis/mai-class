# Quick start (for the human)

From this directory:

```bash
cd multiagent-primer/lab1-blackboard
./lab1-up.sh
```

Then **in each of the three `claude` panes**, paste this single line and hit enter:

> Read `task.md`. Register yourself on the roster. Then begin.

Stagger the kick-offs by ~5 seconds so the agents don't all race for `agent-1`.

## Moving around the panes

tmux uses a *prefix key* — press `Ctrl-b` first, then the next key:

| Keys | Action |
|---|---|
| `Ctrl-b` then arrow key | Jump to the next pane |
| Mouse click | Same thing, easier |
| `Ctrl-b z` | Zoom the current pane fullscreen (press again to unzoom) |
| `Ctrl-b d` | Detach — the lab keeps running. Reattach with `./lab1-up.sh` |

## When the lab is over

```bash
./lab1-down.sh
```

For full prereqs, troubleshooting, and the post-mortem questions, read [`README.md`](./README.md).
