#!/usr/bin/env bash
# bb-watch.sh — compact terminal mirror for tasks.json
# usage: ./bb-watch.sh [path/to/tasks.json]

set -u
FILE="${1:-tasks.json}"
INTERVAL="${REFRESH:-1}"

[ -f "$FILE" ] || { echo "not found: $FILE" >&2; exit 1; }

R=$'\033[0m'; D=$'\033[2m'; B=$'\033[1m'
C_OPEN=$'\033[36m'; C_CLAIM=$'\033[33m'; C_DONE=$'\033[32m'

render() {
  local hr; hr=$(date -u +%TZ)
  printf '%sLAB 2 · TASKS%s  %s%s%s\n' "$B" "$R" "$D" "$hr" "$R"
  echo "─────────────────────────────────────────────"
  node -e '
    const fs = require("fs");
    const C = { open:"\x1b[36m", claimed:"\x1b[33m", done:"\x1b[32m", dim:"\x1b[2m", reset:"\x1b[0m", bold:"\x1b[1m" };
    const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const counts = { open:0, claimed:0, done:0 };
    const byAgent = {};
    for (const t of data.tasks) {
      counts[t.status]++;
      if (t.claimed_by) {
        byAgent[t.claimed_by] = byAgent[t.claimed_by] || { claimed:0, done:0 };
        byAgent[t.claimed_by][t.status === "done" ? "done" : "claimed"]++;
      }
    }
    console.log(`  ${C.open}${counts.open} open${C.reset} · ${C.claimed}${counts.claimed} claimed${C.reset} · ${C.done}${counts.done} done${C.reset}  (of ${data.tasks.length})`);
    const agents = Object.keys(byAgent).sort();
    if (agents.length) {
      const parts = agents.map(a => `${C.bold}${a}${C.reset}: ${byAgent[a].done || 0}✓ / ${byAgent[a].claimed || 0}⏳`);
      console.log("  " + parts.join("  ·  "));
    }
    console.log("");
    for (const t of data.tasks) {
      const c = C[t.status];
      const status = t.status.padEnd(8);
      const needs = (t.needs||[]).join(",").padEnd(20);
      const owner = t.claimed_by ? ` ${C.dim}· ${t.claimed_by}${C.reset}` : "";
      console.log(`  ${C.dim}${t.id}${C.reset}  ${c}${status}${C.reset}  ${C.dim}${needs}${C.reset}  ${t.title.slice(0,42)}${owner}`);
    }
  ' "$FILE"
}

trap 'tput cnorm; printf "\033[?1049l"; exit 0' INT TERM
tput civis 2>/dev/null || true
printf '\033[?1049h'; clear

while true; do
  frame=$(render)
  printf '\033[H%s\033[J' "$frame"
  sleep "$INTERVAL"
done
