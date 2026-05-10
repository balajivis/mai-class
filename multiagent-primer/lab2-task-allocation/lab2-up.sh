#!/usr/bin/env bash
# lab2-up.sh — open the tmux layout for Lab 2 and seed the round.
#
# usage:  ./lab2-up.sh <round>
#   round = 1  first-claim (CLI, capabilities ignored)
#   round = 2  contract-net (CLI, capabilities respected)
#
# (Lab 1 already taught raw chaos; Lab 2 starts at first-claim.)
#
# tear down:  ./lab2-down.sh

set -eu
cd "$(dirname "$0")"

ROUND="${1:-}"
case "$ROUND" in
  1|2) ;;
  *) echo "usage: ./lab2-up.sh <1|2>"; exit 2 ;;
esac

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found. See ../lab1-blackboard/README.md prereqs." >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "node not found. Install Node.js (any v18+) and retry." >&2
  exit 1
fi

if tmux has-session -t lab2 2>/dev/null; then
  echo "▶ existing lab2 session — attaching (no reset)"
  exec tmux attach -t lab2
fi

# archive previous run
if [ -f tasks.json ] && ! cmp -s tasks.json tasks.template.json; then
  mkdir -p runs
  ts=$(date -u +%Y%m%d-%H%M%SZ)
  cp tasks.json "runs/${ts}-tasks.json"
  [ -d outputs ] && cp -R outputs "runs/${ts}-outputs" 2>/dev/null || true
  echo "▶ archived previous run → runs/${ts}-*"
fi
rm -f tasks.json.lock
cp tasks.template.json tasks.json
rm -rf outputs && mkdir -p outputs
echo "▶ tasks.json reset · outputs/ cleaned"

# pick the kickoff message for the round
case "$ROUND" in
  1)
    K1='You are agent-1. Round 1 = first-claim. Use ./task-cli/task. Capabilities are ignored — claim whatever is open. Read CLAUDE.md, then begin.'
    K2='You are agent-2. Round 1 = first-claim. Use ./task-cli/task. Capabilities are ignored — claim whatever is open. Read CLAUDE.md, then begin.'
    K3='You are agent-3. Round 1 = first-claim. Use ./task-cli/task. Capabilities are ignored — claim whatever is open. Read CLAUDE.md, then begin.'
    ;;
  2)
    K1='You are agent-1. Your capabilities: /plan-eng-review and /review. Round 2 = contract-net. Only claim tasks whose needs match your capabilities. Use ./task-cli/task. Read CLAUDE.md, then begin.'
    K2='You are agent-2. Your capabilities: /qa and /investigate. Round 2 = contract-net. Only claim tasks whose needs match your capabilities. Use ./task-cli/task. Read CLAUDE.md, then begin.'
    K3='You are agent-3. Your capabilities: /document-release and /retro. Round 2 = contract-net. Only claim tasks whose needs match your capabilities. Use ./task-cli/task. Read CLAUDE.md, then begin.'
    ;;
esac

# window 0 — terminal mirror + 3 agents (tiled)
# capture stable pane IDs so auto-kickoff hits the right panes regardless of
# how tmux re-indexes after each split.
tmux new-session -d -s lab2 -n agents './bb-watch.sh'
tmux set-option -t lab2 remain-on-exit on
PANE_TOPRIGHT=$(tmux split-window -h -t lab2:0   -P -F '#{pane_id}' 'claude --model haiku')
PANE_BOTLEFT=$( tmux split-window -v -t lab2:0.0 -P -F '#{pane_id}' 'claude --model haiku')
PANE_BOTRIGHT=$(tmux split-window -v -t "$PANE_TOPRIGHT" -P -F '#{pane_id}' 'claude --model haiku')
tmux select-layout -t lab2:0 tiled

# window 1 — web mirror (auto-opens browser to localhost:8766)
tmux new-window -t lab2 -n mirror './bb-serve.sh'

# auto-kickoff: type message, sleep, then Enter — without the sleep the Enter
# sometimes gets eaten by claude's startup buffer.
(
  sleep 8
  for pair in "$PANE_TOPRIGHT|$K1" "$PANE_BOTLEFT|$K2" "$PANE_BOTRIGHT|$K3"; do
    pane="${pair%%|*}"; msg="${pair#*|}"
    tmux send-keys -t "$pane" "$msg"
    sleep 0.5
    tmux send-keys -t "$pane" Enter
    sleep 5
  done
) >/dev/null 2>&1 &

tmux select-window -t lab2:0
tmux select-pane   -t lab2:0.1
echo
echo "▶ Round $ROUND launched."
echo "▶ Attach with:   tmux attach -t lab2"
echo "▶ Switch windows: Ctrl-b 0  (agents)  ·  Ctrl-b 1  (web mirror)"
echo "▶ Detach:        Ctrl-b d"
echo "▶ Tear down:     ./lab2-down.sh"
echo
sleep 1
echo "▶ Session state:"
tmux list-windows -t lab2
echo
echo "▶ Run 'tmux attach -t lab2' now."
