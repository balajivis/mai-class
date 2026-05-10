#!/usr/bin/env bash
# lab1-up.sh — open the tmux layout for Lab 1
#
# window 0 "agents":  bb-watch (top-left) + 3 claude agents (tiled)
# window 1 "mirror":  bb-serve (web UI on http://localhost:8765/bb-mirror.html)
#
# detach: Ctrl-b d        reattach: ./lab1-up.sh
# tear down: ./lab1-down.sh

set -eu
cd "$(dirname "$0")"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found. Run 'claude --model haiku' in a plain terminal and ask it to install tmux." >&2
  exit 1
fi

if tmux has-session -t lab1 2>/dev/null; then
  exec tmux attach -t lab1
fi

# fresh start: archive previous run (if any), then reset blackboard from template
if [ -s blackboard.md ] && ! cmp -s blackboard.md blackboard.template.md; then
  mkdir -p runs
  ts=$(date -u +%Y%m%d-%H%M%SZ)
  cp blackboard.md "runs/${ts}.md"
  echo "▶ archived previous run → runs/${ts}.md"
fi
cp blackboard.template.md blackboard.md
echo "▶ blackboard.md reset"

# window 0 — terminal mirror + 3 agents
# capture stable pane IDs (%N) so auto-kickoff hits the right panes regardless
# of how tmux re-indexes after each split.
tmux new-session -d -s lab1 -n agents './bb-watch.sh'
PANE_TOPRIGHT=$(tmux split-window -h -t lab1:0   -P -F '#{pane_id}' 'claude --model haiku')
PANE_BOTLEFT=$( tmux split-window -v -t lab1:0.0 -P -F '#{pane_id}' 'claude --model haiku')
PANE_BOTRIGHT=$(tmux split-window -v -t "$PANE_TOPRIGHT" -P -F '#{pane_id}' 'claude --model haiku')
tmux select-layout -t lab1:0 tiled

# window 1 — web mirror server (auto-opens browser to localhost:8765)
tmux new-window -t lab1 -n mirror './bb-serve.sh'

# auto-kickoff: paste the prompt into each agent pane after claude is ready,
# staggered by 5s so they don't all race for agent-1. Runs in background while
# the user is attaching, so they see the prompts type themselves in.
KICKOFF='Read task.md. Register yourself on the roster. Then begin.'
(
  sleep 8                                                          # claude warmup
  for pane in "$PANE_TOPRIGHT" "$PANE_BOTLEFT" "$PANE_BOTRIGHT"; do
    tmux send-keys -t "$pane" "$KICKOFF"
    sleep 0.5
    tmux send-keys -t "$pane" Enter
    sleep 5
  done
) >/dev/null 2>&1 &

# start in the agents window, focused on first claude pane
tmux select-window -t lab1:0
tmux select-pane   -t lab1:0.1
exec tmux attach   -t lab1
