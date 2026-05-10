#!/usr/bin/env bash
# lab1-up.sh — open the 4-pane tmux layout for Lab 1
#
# top-left: live mirror (./bb-watch.sh)
# other 3 panes: claude (one agent each)
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

tmux new-session  -d -s lab1 -n agents './bb-watch.sh'
tmux split-window -h -t lab1:0   'claude --model haiku'
tmux split-window -v -t lab1:0.0 'claude --model haiku'
tmux split-window -v -t lab1:0.2 'claude --model haiku'
tmux select-layout -t lab1:0 tiled
tmux select-pane   -t lab1:0.1
exec tmux attach   -t lab1
