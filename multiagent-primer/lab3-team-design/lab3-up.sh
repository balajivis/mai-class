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
  1|sup|supervisor)
    DIR=round1-supervisor; LABEL='Round 1 · Supervisor'; ROUND_NUM=1
    KICKOFF='You are in the SUPERVISOR round. Read CLAUDE.md and task.md. Register on the roster — first agent in is the supervisor (assigns directives, integrates), second and third are workers (wait for directives). Then act on your role.'
    ;;
  2|pipe|pipeline)
    DIR=round2-pipeline; LABEL='Round 2 · Pipeline'; ROUND_NUM=2
    KICKOFF='You are in the PIPELINE round. Read CLAUDE.md and task.md. Register on the roster — agent-1 owns Transport, agent-2 owns Lodging, agent-3 owns Activities. Each stage WAITS for the previous stage to post its DONE marker before starting. Then act.'
    ;;
  3|swarm)
    DIR=round3-swarm; LABEL='Round 3 · Swarm'; ROUND_NUM=3
    KICKOFF='You are in the SWARM round. Read CLAUDE.md and task.md. Register on the roster as a peer. No coordinator, no roles, no stages. Read the board before every action, find a gap, post. The first to notice all sections covered drafts the itinerary.'
    ;;
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
# capture stable pane IDs (%N) so auto-kickoff hits the right panes regardless
# of how tmux re-indexes after each split.
tmux new-session -d -s lab3 -n agents './bb-watch.sh'
PANE_AGENTS_TOPRIGHT=$(tmux split-window -h -t lab3:0   -P -F '#{pane_id}' 'claude --model haiku')
PANE_AGENTS_BOTLEFT=$( tmux split-window -v -t lab3:0.0 -P -F '#{pane_id}' 'claude --model haiku')
PANE_AGENTS_BOTRIGHT=$(tmux split-window -v -t "$PANE_AGENTS_TOPRIGHT" -P -F '#{pane_id}' 'claude --model haiku')
tmux select-layout -t lab3:0 tiled

# window 1 — web mirror server (auto-opens browser to localhost:8765)
tmux new-window -t lab3 -n mirror "./bb-serve.sh ${ROUND_NUM}"

# auto-kickoff: round-specific prompt anchors agents in their topology
(
  sleep 8
  for pane in "$PANE_AGENTS_TOPRIGHT" "$PANE_AGENTS_BOTLEFT" "$PANE_AGENTS_BOTRIGHT"; do
    tmux send-keys -t "$pane" "$KICKOFF"
    sleep 0.5
    tmux send-keys -t "$pane" Enter
    sleep 5
  done
) >/dev/null 2>&1 &

tmux select-window -t lab3:0
tmux select-pane   -t lab3:0.1
exec tmux attach   -t lab3
