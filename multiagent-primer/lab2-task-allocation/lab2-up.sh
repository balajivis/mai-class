#!/usr/bin/env bash
# lab2-up.sh — open the tmux layout for Lab 2 and seed the round.
#
# usage:  ./lab2-up.sh <round>
#   round = 1  free-for-all (markdown, no CLI)
#   round = 2  first-claim (CLI, capabilities ignored)
#   round = 3  contract-net (CLI, capabilities respected)
#
# tear down:  ./lab2-down.sh

set -eu
cd "$(dirname "$0")"

ROUND="${1:-}"
case "$ROUND" in
  1|2|3) ;;
  *) echo "usage: ./lab2-up.sh <1|2|3>"; exit 2 ;;
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
  [ -f tasks.md ] && cp tasks.md "runs/${ts}-tasks.md"
  echo "▶ archived previous run → runs/${ts}-*"
fi
rm -f tasks.json.lock
cp tasks.template.json tasks.json
rm -rf outputs && mkdir -p outputs
echo "▶ tasks.json reset · outputs/ cleaned"

# round-1 also needs a markdown view
if [ "$ROUND" = "1" ]; then
  cat > tasks.md <<'MD'
# Round 1 — Free-for-all backlog (markdown)

Claim by appending a line under a task: `- claimed by agent-N at <timestamp>`.
Mark done by appending: `- DONE by agent-N · <result>`.
**No CLI in this round.** Append-only — never edit another agent's claim.

MD
  node -e '
    const t = JSON.parse(require("fs").readFileSync("tasks.json","utf8")).tasks;
    for (const x of t) {
      console.log(`## ${x.id} — ${x.title}`);
      console.log(`needs: ${(x.needs||[]).join(", ")} · est ${x.estimate_min}m · output: \`${x.output}\``);
      console.log("");
    }
  ' >> tasks.md
fi

# pick the kickoff message and per-agent capabilities for the round
case "$ROUND" in
  1)
    K1='You are agent-1. Round 1 = free-for-all. Read CLAUDE.md, then tasks.md. Claim tasks by appending lines (no CLI). Begin.'
    K2='You are agent-2. Round 1 = free-for-all. Read CLAUDE.md, then tasks.md. Claim tasks by appending lines (no CLI). Begin.'
    K3='You are agent-3. Round 1 = free-for-all. Read CLAUDE.md, then tasks.md. Claim tasks by appending lines (no CLI). Begin.'
    ;;
  2)
    K1='You are agent-1. Round 2 = first-claim. Use ./task-cli/task. Capabilities are ignored — claim whatever is open. Read CLAUDE.md, then begin.'
    K2='You are agent-2. Round 2 = first-claim. Use ./task-cli/task. Capabilities are ignored — claim whatever is open. Read CLAUDE.md, then begin.'
    K3='You are agent-3. Round 2 = first-claim. Use ./task-cli/task. Capabilities are ignored — claim whatever is open. Read CLAUDE.md, then begin.'
    ;;
  3)
    K1='You are agent-1. Your capabilities: /plan-eng-review and /review. Round 3 = contract-net. Only claim tasks whose needs match your capabilities. Use ./task-cli/task. Read CLAUDE.md, then begin.'
    K2='You are agent-2. Your capabilities: /qa and /investigate. Round 3 = contract-net. Only claim tasks whose needs match your capabilities. Use ./task-cli/task. Read CLAUDE.md, then begin.'
    K3='You are agent-3. Your capabilities: /document-release and /retro. Round 3 = contract-net. Only claim tasks whose needs match your capabilities. Use ./task-cli/task. Read CLAUDE.md, then begin.'
    ;;
esac

# window 0 — terminal mirror + 3 agents (tiled)
tmux new-session  -d -s lab2 -n agents './bb-watch.sh'
tmux split-window -h -t lab2:0   'claude --model haiku'
tmux split-window -v -t lab2:0.0 'claude --model haiku'
tmux split-window -v -t lab2:0.2 'claude --model haiku'
tmux select-layout -t lab2:0 tiled

# auto-kickoff after claude warmup, staggered
(
  sleep 8
  tmux send-keys -t lab2:0.1 "$K1" Enter ; sleep 5
  tmux send-keys -t lab2:0.2 "$K2" Enter ; sleep 5
  tmux send-keys -t lab2:0.3 "$K3" Enter
) >/dev/null 2>&1 &

tmux select-window -t lab2:0
tmux select-pane   -t lab2:0.1
echo "▶ Round $ROUND launched. Detach: Ctrl-b d. Tear down: ./lab2-down.sh"
exec tmux attach   -t lab2
