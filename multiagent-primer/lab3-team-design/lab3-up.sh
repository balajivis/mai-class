#!/usr/bin/env bash
# lab3-up.sh — open the tmux layout for Lab 3
#
# usage: ./lab3-up.sh <round>
#   round = 1 (supervisor) | 2 (pipeline) | 3 (swarm)
#
# Each round symlinks the matching CLAUDE.md into the lab dir, archives
# any previous blackboard, and resets from template.
#
# detach: Ctrl-b d        reattach: ./lab3-up.sh <round>
# tear down: ./lab3-down.sh

set -eu
cd "$(dirname "$0")"

ROUND="${1:-}"
case "$ROUND" in
  1|sup|supervisor) DIR=round1-supervisor; LABEL='Round 1 · Supervisor' ;;
  2|pipe|pipeline)  DIR=round2-pipeline;   LABEL='Round 2 · Pipeline'   ;;
  3|swarm)          DIR=round3-swarm;      LABEL='Round 3 · Swarm'      ;;
  *)
    echo "usage: $0 <round>" >&2
    echo "  round = 1 (supervisor) | 2 (pipeline) | 3 (swarm)" >&2
    exit 2
    ;;
esac

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found. Run 'claude --model haiku' in a plain terminal and ask it to install tmux." >&2
  exit 1
fi

if tmux has-session -t lab3 2>/dev/null; then
  echo "▶ existing lab3 session — attaching (run ./lab3-down.sh first to switch round)"
  exec tmux attach -t lab3
fi

# fresh start: archive previous board, reset from template, swap CLAUDE.md
if [ -s blackboard.md ] && ! cmp -s blackboard.md blackboard.template.md; then
  mkdir -p runs
  ts=$(date -u +%Y%m%d-%H%M%SZ)
  cp blackboard.md "runs/${ts}-round-prev.md"
  echo "▶ archived previous run → runs/${ts}-round-prev.md"
fi
cp blackboard.template.md blackboard.md
ln -sf "${DIR}/CLAUDE.md" CLAUDE.md
echo "▶ ${LABEL} · CLAUDE.md → ${DIR}/CLAUDE.md"

# window 0 — terminal mirror + 3 agents
tmux new-session  -d -s lab3 -n agents './bb-watch.sh'
tmux split-window -h -t lab3:0   'claude --model haiku'
tmux split-window -v -t lab3:0.0 'claude --model haiku'
tmux split-window -v -t lab3:0.2 'claude --model haiku'
tmux select-layout -t lab3:0 tiled

# window 1 — web mirror server (auto-opens browser to localhost:8765)
tmux new-window -t lab3 -n mirror './bb-serve.sh'

# auto-kickoff: same prompt for all rounds, CLAUDE.md handles role-by-slot
KICKOFF='Read CLAUDE.md and task.md. Register yourself on the roster following the protocol for this round. Then act on your role.'
(
  sleep 8
  for pane in 1 2 3; do
    tmux send-keys -t "lab3:0.${pane}" "$KICKOFF"
    tmux send-keys -t "lab3:0.${pane}" Enter
    sleep 5
  done
) >/dev/null 2>&1 &

tmux select-window -t lab3:0
tmux select-pane   -t lab3:0.1
exec tmux attach   -t lab3
