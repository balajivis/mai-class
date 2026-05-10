#!/usr/bin/env bash
# bb-watch.sh — compact live mirror for blackboard.md
#
# usage:   ./bb-watch.sh [path/to/blackboard.md]
# tweak:   REFRESH=2 ./bb-watch.sh

set -u
BOARD="${1:-blackboard.md}"
INTERVAL="${REFRESH:-1}"

[ -f "$BOARD" ] || { echo "not found: $BOARD" >&2; exit 1; }

to_epoch() {
  date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$1" +%s 2>/dev/null \
    || date -u -d "$1" +%s 2>/dev/null \
    || echo 0
}

# ANSI colour for an agent name like "agent-3" — cycles 31..36
c() {
  local n=${1#agent-}
  printf '\033[1;%dm' "$((30 + ((n - 1) % 6 + 1)))"
}
R=$'\033[0m'
Y=$'\033[33m'
G=$'\033[32m'
D=$'\033[2m'
B=$'\033[1m'

# 4-cell coverage bar
bar() {
  local n=$1 i out=""
  (( n > 4 )) && n=4
  for ((i=0;i<n;i++));   do out+="█"; done
  for ((i=n;i<4;i++));   do out+="·"; done
  printf '%s' "$out"
}

render() {
  local now hr findings last_line last_agent last_ts ago
  local s_setup s_emer s_lim s_impl synth dups roster

  now=$(date -u +%s)
  hr=$(date -u +%TZ)

  count() { grep -c "$1" "$BOARD" 2>/dev/null | head -1 | tr -dc '0-9' ; }
  count_default0() { local n; n=$(count "$1"); echo "${n:-0}" ; }

  roster=$(awk '/^- agent-/ { gsub(/^- /, ""); print $1 }' "$BOARD" | sort -u)
  findings=$(count_default0 '^### \[agent-')
  s_setup=$( count_default0 '^\*\*Section:\*\* Setup')
  s_emer=$(  count_default0 '^\*\*Section:\*\* Emergent')
  s_lim=$(   count_default0 '^\*\*Section:\*\* Limitations')
  s_impl=$(  count_default0 '^\*\*Section:\*\* Implications')

  last_line=$(grep '^### \[agent-' "$BOARD" | tail -1 || true)
  last_agent=""; ago=""
  if [ -n "$last_line" ]; then
    last_agent=$(printf '%s' "$last_line" | grep -oE 'agent-[0-9]+' | head -1)
    last_ts=$(   printf '%s' "$last_line" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:]+Z' | head -1)
    ago=$(( now - $(to_epoch "$last_ts") ))
  fi

  synth=$(grep '^## SYNTHESIS' "$BOARD" | head -1 || true)

  dups=$(awk '
    /^### \[agent-/ {
      match($0, /agent-[0-9]+/); a = substr($0, RSTART, RLENGTH); want = 1
    }
    want && /^\*\*Section:\*\*/ {
      s = $0; sub(/^\*\*Section:\*\* */, "", s)
      key = s "|" a
      if (!(key in seen)) { seen[key]=1; sec_agents[s] = sec_agents[s] (sec_agents[s] ? "," : "") a; sec_n[s]++ }
      want = 0
    }
    END { for (s in sec_n) if (sec_n[s] >= 2) printf "%s\t%s\n", s, sec_agents[s] }
  ' "$BOARD")

  # ── header ──────────────────────────────────────────────────────────
  printf '%sLAB 1%s  %s%s%s   ' "$B" "$R" "$D" "$hr" "$R"
  if [ -z "$roster" ]; then
    printf '%sno agents yet%s' "$D" "$R"
  else
    for a in $roster; do printf '%s●%s%s ' "$(c "$a")" "${a#agent-}" "$R"; done
  fi
  printf '\n'

  # ── coverage bars (2 columns) ───────────────────────────────────────
  printf '  Setup       %s %d   Limits      %s %d\n' "$(bar "$s_setup")" "$s_setup" "$(bar "$s_lim")"  "$s_lim"
  printf '  Emergent    %s %d   Implications %s %d\n' "$(bar "$s_emer")"  "$s_emer"  "$(bar "$s_impl")" "$s_impl"

  # ── status line ─────────────────────────────────────────────────────
  printf '  %d findings' "$findings"
  if [ -n "$last_agent" ]; then
    printf ' · last %s%s%s %ds ago' "$(c "$last_agent")" "$last_agent" "$R" "$ago"
    (( ago > 60 )) && printf ' %s💤%s' "$Y" "$R"
  fi
  if [ -n "$synth" ]; then
    local sa; sa=$(printf '%s' "$synth" | grep -oE 'agent-[0-9]+' | head -1)
    printf ' · %s✓ synth %s%s' "$G" "$sa" "$R"
  else
    printf ' · synth —'
  fi
  printf '\n'

  # ── warnings ────────────────────────────────────────────────────────
  if [ -n "$dups" ]; then
    while IFS=$'\t' read -r section agents; do
      printf '  %s🔁 dup%s %s ← %s\n' "$Y" "$R" "$section" "$agents"
    done <<< "$dups"
  fi

  # ── recent activity (last 8 findings, one line each) ────────────────
  printf '\n%sRecent%s\n' "$D" "$R"
  awk '
    /^### \[agent-/ {
      match($0, /agent-[0-9]+/); a = substr($0, RSTART, RLENGTH)
      h = $0; sub(/^### \[[^]]*\] */, "", h)
      pa = a; ph = h; have = 1; next
    }
    have && /^\*\*Section:\*\*/ {
      s = $0; sub(/^\*\*Section:\*\* */, "", s)
      printf "%s\t%s\t%s\n", pa, s, ph
      have = 0
    }
  ' "$BOARD" | tail -8 | while IFS=$'\t' read -r a s h; do
    # trim section label and headline to fit a narrow pane
    s_short="${s:0:11}"
    h_short="${h:0:42}"
    printf '  %s%-7s%s %-11s  %s\n' "$(c "$a")" "$a" "$R" "$s_short" "$h_short"
  done
}

trap 'tput cnorm; printf "\033[?1049l"; exit 0' INT TERM
tput civis 2>/dev/null || true
printf '\033[?1049h'
clear

while true; do
  frame=$(render)
  printf '\033[H%s\033[J' "$frame"
  sleep "$INTERVAL"
done
