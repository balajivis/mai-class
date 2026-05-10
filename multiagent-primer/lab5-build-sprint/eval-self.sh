#!/usr/bin/env bash
# eval-self.sh — three-tier evaluation for Lab 5.
#
# Reads blackboard.md and tasks.json from the current dir; prints L1 (per-agent),
# L2 (combined output), L3 (coordination) metrics, plus a one-line verdict.
#
# This is the primer's stand-in for blackboard-classroom's master dashboard —
# the same lesson §15 readout, computed from local files instead of a server.
#
# usage:
#   ./eval-self.sh                      # current run
#   ./eval-self.sh runs/<ts>-blackboard.md runs/<ts>-tasks.json
#   NO_COLOR=1 ./eval-self.sh           # no ANSI

set -u

BB="${1:-blackboard.md}"
TJ="${2:-tasks.json}"

[ -f "$BB" ] || { echo "blackboard not found: $BB" >&2; exit 1; }
[ -f "$TJ" ] || { echo "tasks.json not found: $TJ" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq required" >&2; exit 2; }

# ── color ──────────────────────────────────────────────────────────────
if [ -t 1 ] && [ "${NO_COLOR:-}" = "" ]; then
  B=$'\033[1m'; D=$'\033[2m'; R=$'\033[0m'
  G=$'\033[32m'; Y=$'\033[33m'; RD=$'\033[31m'; C=$'\033[36m'; M=$'\033[35m'
else
  B=""; D=""; R=""; G=""; Y=""; RD=""; C=""; M=""
fi

# ── parse blackboard performative entries into a TSV stream ────────────
# format:  agent \t iso_ts \t performative \t refs \t body_first_line
events_tsv() {
  awk '
    function trim(s) { sub(/^[ \t]+/,"",s); sub(/[ \t]+$/,"",s); return s }
    /^### \[/ {
      h = $0
      sub(/^### \[/, "", h); sub(/\].*$/, "", h)
      n = split(h, p, " · ")
      if (n < 3) next
      agent = trim(p[1]); ts = trim(p[2]); perf = trim(p[3])
      refs = ""; body = ""; have = 1; next
    }
    have && /^\*\*Refs:\*\*/   { r = $0; sub(/^\*\*Refs:\*\*[ \t]*/, "", r); refs = r; next }
    have && /^\*\*Body:\*\*/   { b = $0; sub(/^\*\*Body:\*\*[ \t]*/, "", b); body = b; have = 0; printf "%s\t%s\t%s\t%s\t%s\n", agent, ts, perf, refs, body; next }
    have && /^\*\*Lesson:\*\*/ { b = $0; sub(/^\*\*Lesson:\*\*[ \t]*/, "", b); body = b; have = 0; printf "%s\t%s\t%s\t%s\t%s\n", agent, ts, perf, refs, body; next }
    have && /^\*\*Task:\*\*/   { next }
    have && /^### \[/          { printf "%s\t%s\t%s\t%s\t\n", agent, ts, perf, refs; have = 0 }
    END {
      if (have) printf "%s\t%s\t%s\t%s\t\n", agent, ts, perf, refs
    }
  ' "$BB"
}

EV=$(events_tsv)

# ── L1: per-agent metrics from tasks.json ──────────────────────────────
echo
echo "${B}=== L1 · Per-agent ===${R}"
# Build a list of agents from the roster + events.
ROSTER_AGENTS=$(awk '/^- agent-/ { sub(/^- /, ""); print $1 }' "$BB" | sort -u)
EVENT_AGENTS=$(printf '%s\n' "$EV" | awk -F'\t' 'NF >= 3 && $1 != "" { print $1 }' | sort -u)
TASK_AGENTS=$(jq -r '.tasks[] | .claimed_by // empty' "$TJ" 2>/dev/null | sort -u)
ALL_AGENTS=$(printf '%s\n%s\n%s\n' "$ROSTER_AGENTS" "$EVENT_AGENTS" "$TASK_AGENTS" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_AGENTS" ]; then
  echo "  ${D}no agents have posted yet${R}"
else
  printf '  %-18s %-7s %-7s %-7s %-7s  performatives\n' "agent" "done" "fail" "claim" "events"
  while IFS= read -r a; do
    [ -z "$a" ] && continue
    DONE=$(jq -r --arg a "$a"   '[.tasks[] | select(.claimed_by==$a and .status=="done")]   | length' "$TJ")
    FAIL=$(jq -r --arg a "$a"   '[.tasks[] | select(.claimed_by==$a and .status=="failed")] | length' "$TJ")
    # Note: failed tasks are re-opened by `task fail` so claimed_by gets nulled. Count lessons instead:
    LESSONS_OWNED=$(jq -r --arg a "$a" '[.tasks[] | select(.lessons != null) | .lessons] | length' "$TJ")
    CLAIMED=$(jq -r --arg a "$a" '[.tasks[] | select(.claimed_by==$a and .status=="claimed")] | length' "$TJ")
    EV_COUNT=$(printf '%s\n' "$EV" | awk -F'\t' -v a="$a" '$1 == a' | wc -l | tr -d ' ')
    PERF_BREAKDOWN=$(printf '%s\n' "$EV" | awk -F'\t' -v a="$a" '$1 == a { print $3 }' | sort | uniq -c | awk '{ printf "%s=%s ", tolower($2), $1 }')
    [ -z "$PERF_BREAKDOWN" ] && PERF_BREAKDOWN="${D}—${R}"
    printf '  %-18s %-7s %-7s %-7s %-7s  %s\n' "$a" "$DONE" "$FAIL" "$CLAIMED" "$EV_COUNT" "$PERF_BREAKDOWN"
  done <<< "$ALL_AGENTS"
fi

# ── L2: combined output ────────────────────────────────────────────────
echo
echo "${B}=== L2 · Combined output ===${R}"
T_TOTAL=$(jq '.tasks | length' "$TJ")
T_OPEN=$(   jq '[.tasks[] | select(.status=="open")]    | length' "$TJ")
T_CLAIMED=$(jq '[.tasks[] | select(.status=="claimed")] | length' "$TJ")
T_DONE=$(   jq '[.tasks[] | select(.status=="done")]    | length' "$TJ")
T_FAIL=$(   jq '[.tasks[] | select(.status=="failed")]  | length' "$TJ")
T_WITH_LESSONS=$(jq '[.tasks[] | select(.lessons != null)] | length' "$TJ")

DENOM=$(( T_DONE + T_FAIL ))
if [ "$DENOM" -gt 0 ]; then
  RATE=$(awk -v d="$T_DONE" -v t="$DENOM" 'BEGIN { printf "%.0f", (d/t)*100 }')
else
  RATE="—"
fi

# Heuristic build/test markers from results
RESULTS_BLOB=$(jq -r '.tasks[] | .result // empty' "$TJ" 2>/dev/null | tr '[:upper:]' '[:lower:]')
BUILD="—"
case "$RESULTS_BLOB" in
  *"build pass"*|*"build green"*|*"build ok"*|*"build ✓"*) BUILD="${G}✓${R}" ;;
  *"build fail"*|*"build broken"*|*"build red"*|*"build ✗"*) BUILD="${RD}✗${R}" ;;
esac
TESTS="—"
case "$RESULTS_BLOB" in
  *"tests pass"*|*"all tests"*) TESTS="${G}✓${R}" ;;
  *"tests fail"*|*"test fail"*) TESTS="${RD}✗${R}" ;;
esac

printf '  total=%d  ${G}done=%d${R}  ${RD}fail=%d${R}  ${C}open=%d${R}  ${Y}claim=%d${R}\n' \
  "$T_TOTAL" "$T_DONE" "$T_FAIL" "$T_OPEN" "$T_CLAIMED" \
  | awk -v G="$G" -v R="$R" -v RD="$RD" -v C="$C" -v Y="$Y" \
        '{ gsub(/\$\{G\}/,G); gsub(/\$\{R\}/,R); gsub(/\$\{RD\}/,RD); gsub(/\$\{C\}/,C); gsub(/\$\{Y\}/,Y); print }'
printf '  completion rate: %s%%  build: %s  tests: %s  📓 %d lesson%s\n' \
  "$RATE" "$BUILD" "$TESTS" "$T_WITH_LESSONS" "$( [ "$T_WITH_LESSONS" -ne 1 ] && echo s )"

# ── L3: coordination ───────────────────────────────────────────────────
echo
echo "${B}=== L3 · Coordination ===${R}"

EV_COUNT=$(printf '%s\n' "$EV" | awk 'NF' | wc -l | tr -d ' ')

# events/min: span between first and last ts
SPAN_MIN=$(printf '%s\n' "$EV" | awk -F'\t' 'NF >= 3 { print $2 }' | sort -u | awk '
  NR == 1 { first = $0 }
  { last = $0 }
  END {
    if (first == "" || last == "" || first == last) { print "0"; exit }
    cmd_first = "date -u -j -f \"%Y-%m-%dT%H:%M:%SZ\" \"" first "\" +%s 2>/dev/null || date -u -d \"" first "\" +%s 2>/dev/null"
    cmd_last  = "date -u -j -f \"%Y-%m-%dT%H:%M:%SZ\" \"" last  "\" +%s 2>/dev/null || date -u -d \"" last  "\" +%s 2>/dev/null"
    cmd_first | getline f; close(cmd_first)
    cmd_last  | getline l; close(cmd_last)
    if (l > f) printf "%.1f", (l - f) / 60.0
    else print "0"
  }
')
EV_PER_MIN="—"
if [ "$EV_COUNT" -gt 0 ] && [ "$(awk -v s="$SPAN_MIN" 'BEGIN { print (s > 0) ? 1 : 0 }')" = 1 ]; then
  EV_PER_MIN=$(awk -v c="$EV_COUNT" -v m="$SPAN_MIN" 'BEGIN { printf "%.1f", c/m }')
fi

# performative mix (totals across all agents)
PERF_MIX=$(printf '%s\n' "$EV" | awk -F'\t' 'NF >= 3 { print $3 }' | sort | uniq -c | sort -rn | awk '{ printf "%d %s · ", $1, tolower($2) }' | sed 's/ · $//')
[ -z "$PERF_MIX" ] && PERF_MIX="${D}none${R}"

# channels: count unique (sender → ref) ordered pairs
CHANNELS=$(printf '%s\n' "$EV" | awk -F'\t' '
  NF >= 4 && $4 != "" && $4 != "—" {
    n = split($4, refs, /[ ,]+/)
    for (i = 1; i <= n; i++) {
      r = refs[i]; sub(/^@/, "", r)
      if (r ~ /^agent-/) print $1 "->" r
    }
  }
' | sort -u | wc -l | tr -d ' ')

# conflicts: count of `failed`-and-then-reclaimed-by-someone-else patterns is
# captured in `lessons`. We use the count of distinct task ids with any lesson,
# minus those that ended `done` from the SAME agent. Approximation:
CONFLICTS_LESSONS=$(jq '[.tasks[] | select(.lessons != null and .status != "done")] | length' "$TJ")
# also: claim collisions show up as repeated `[claim]` entries on the same task — too noisy to detect from the blackboard alone here, so we use lesson-tagged failures as the conflict proxy.

# idle agents: agents in roster who haven't posted in last 90s of run (relative to last event)
LAST_TS=$(printf '%s\n' "$EV" | awk -F'\t' 'NF >= 3 { print $2 }' | sort -u | tail -1)
IDLE=0
if [ -n "$LAST_TS" ] && [ -n "$ALL_AGENTS" ]; then
  while IFS= read -r a; do
    [ -z "$a" ] && continue
    A_LAST=$(printf '%s\n' "$EV" | awk -F'\t' -v a="$a" 'NF >= 3 && $1 == a { print $2 }' | sort -u | tail -1)
    if [ -z "$A_LAST" ]; then
      IDLE=$(( IDLE + 1 ))
      continue
    fi
    DIFF=$(awk -v a="$A_LAST" -v b="$LAST_TS" '
      BEGIN {
        cmd_a = "date -u -j -f \"%Y-%m-%dT%H:%M:%SZ\" \"" a "\" +%s 2>/dev/null || date -u -d \"" a "\" +%s 2>/dev/null"
        cmd_b = "date -u -j -f \"%Y-%m-%dT%H:%M:%SZ\" \"" b "\" +%s 2>/dev/null || date -u -d \"" b "\" +%s 2>/dev/null"
        cmd_a | getline va; close(cmd_a)
        cmd_b | getline vb; close(cmd_b)
        print (vb - va)
      }
    ')
    if [ "$DIFF" -gt 90 ]; then
      IDLE=$(( IDLE + 1 ))
    fi
  done <<< "$ALL_AGENTS"
fi

# redundancy: count of duplicate (lowercased) task titles
REDUNDANCY=$(jq -r '.tasks[] | .title' "$TJ" | tr '[:upper:]' '[:lower:]' | sort | uniq -c | awk '$1 > 1 { sum += $1 - 1 } END { print sum + 0 }')

printf '  events/min:     %s   (%s events over %s min)\n' "$EV_PER_MIN" "$EV_COUNT" "$SPAN_MIN"
printf '  channels:       %s   (cross-agent refs)\n' "$CHANNELS"
printf '  conflicts:      %s   (failed-with-lesson tasks)\n' "$CONFLICTS_LESSONS"
printf '  idle agents:    %s   (>90s without posting)\n' "$IDLE"
printf '  redundancy:     %s   (duplicate task titles)\n' "$REDUNDANCY"
printf '  performatives:  %s\n' "$PERF_MIX"

# ── verdict ────────────────────────────────────────────────────────────
echo
echo "${B}=== Verdict ===${R}"

# L1: distribution check — does any agent dominate >50% of done?
if [ "$T_DONE" -gt 0 ]; then
  TOP_DONE=$(jq -r '[.tasks[] | select(.status=="done") | .claimed_by] | group_by(.) | map({a:.[0], n:length}) | max_by(.n) | .n' "$TJ")
  TOP_PCT=$(awk -v t="$TOP_DONE" -v d="$T_DONE" 'BEGIN { printf "%.0f", (t/d)*100 }')
  if [ "$TOP_PCT" -gt 60 ]; then
    echo "  L1: ${Y}⚠${R}  one agent did $TOP_PCT% of completed work — load not distributed"
  else
    echo "  L1: ${G}✓${R}  work distributed (top agent: $TOP_PCT% of done)"
  fi
else
  echo "  L1: ${D}—${R}  no completed tasks yet"
fi

# L2: completion rate
if [ "$RATE" = "—" ]; then
  echo "  L2: ${D}—${R}  no closed tasks yet"
elif [ "$RATE" -ge 70 ]; then
  echo "  L2: ${G}✓${R}  $RATE% completion rate (target ≥70%)"
elif [ "$RATE" -ge 50 ]; then
  echo "  L2: ${Y}⚠${R}  $RATE% completion rate (target ≥70%)"
else
  echo "  L2: ${RD}✗${R}  $RATE% completion rate is low"
fi

# L3: the §15 silent-failure check
L3_FLAGS=0
if [ "$IDLE" -gt 0 ]; then
  echo "  L3: ${Y}⚠${R}  $IDLE agent(s) went idle — silent-failure pattern from §15"
  L3_FLAGS=$(( L3_FLAGS + 1 ))
fi
if [ "$REDUNDANCY" -gt 0 ]; then
  echo "  L3: ${Y}⚠${R}  $REDUNDANCY duplicate task title(s) — agents working in parallel on the same thing"
  L3_FLAGS=$(( L3_FLAGS + 1 ))
fi
if [ "$CHANNELS" = "0" ] && [ "$EV_COUNT" -gt 5 ]; then
  echo "  L3: ${Y}⚠${R}  $EV_COUNT events but 0 cross-agent refs — agents broadcast, never address each other"
  L3_FLAGS=$(( L3_FLAGS + 1 ))
fi
PERF_KINDS=$(printf '%s\n' "$EV" | awk -F'\t' 'NF >= 3 && $3 != "" { print $3 }' | sort -u | wc -l | tr -d ' ')
if [ "$EV_COUNT" -gt 5 ] && [ "$PERF_KINDS" -le 1 ]; then
  echo "  L3: ${Y}⚠${R}  performative mix is monotone (only $PERF_KINDS kind in $EV_COUNT events) — typed messages collapsing to noise"
  L3_FLAGS=$(( L3_FLAGS + 1 ))
fi
if [ "$L3_FLAGS" = 0 ] && [ "$EV_COUNT" -gt 0 ]; then
  echo "  L3: ${G}✓${R}  coordination signals look healthy"
fi

echo
echo "${D}eval-self.sh · primer's stand-in for §15 three-tier evaluation${R}"
echo "${D}same readout as blackboard-classroom's master view, computed locally${R}"
