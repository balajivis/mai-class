#!/usr/bin/env bash
# Workshop-kit statusline · prints one line per CC session.
#
# Reads the session JSON on stdin (per Claude Code statusline spec). Renders:
#
#   🤖 alice-frontend · team1 · tasks 2 · BB🟢
#
# Identity is sourced from env vars set by the student before launching CC:
#   WK_AGENT       e.g. alice-frontend     (defaults to subagent name from session JSON)
#   WK_TEAM        e.g. team1              (project id)
#   WK_TOKEN       team token (used for live counts)
#   WK_API         http(s)://bb.modernaipro.com  (default)
#
# Falls back gracefully if curl/jq missing or server unreachable.

set -u
input="$(cat 2>/dev/null || true)"

# Pull subagent name from the session JSON if present.
SUBAGENT_NAME=""
if command -v jq >/dev/null 2>&1 && [ -n "$input" ]; then
  SUBAGENT_NAME="$(printf '%s' "$input" | jq -r '.subagent // .agent // .session.agent // empty' 2>/dev/null)"
fi

AGENT="${WK_AGENT:-$SUBAGENT_NAME}"
AGENT="${AGENT:-anonymous}"
TEAM="${WK_TEAM:-?}"
API="${WK_API:-https://bb.modernaipro.com}"
TOKEN="${WK_TOKEN:-}"

# Live task count for this agent (best-effort, 1s timeout).
TASKS="?"
HEALTH="🔴"
if [ -n "$TOKEN" ] && command -v curl >/dev/null 2>&1; then
  body="$(curl -s --max-time 1 \
    -H "Authorization: Bearer $TOKEN" \
    "$API/api/p/$TEAM/tasks?status=claimed" 2>/dev/null || true)"
  if [ -n "$body" ]; then
    HEALTH="🟢"
    if command -v jq >/dev/null 2>&1; then
      TASKS="$(printf '%s' "$body" | jq -r --arg a "$AGENT" '[.tasks[] | select(.claimed_by == $a)] | length' 2>/dev/null || echo "?")"
    fi
  fi
fi

# Pretty colour by agent role (last hyphen-segment).
ROLE="${AGENT##*-}"
case "$ROLE" in
  frontend) C=$'\e[38;5;75m' ;;     # blue
  backend)  C=$'\e[38;5;208m' ;;    # orange
  tests)    C=$'\e[38;5;120m' ;;    # green
  db)       C=$'\e[38;5;141m' ;;    # purple
  docs)     C=$'\e[38;5;180m' ;;    # tan
  devops)   C=$'\e[38;5;215m' ;;    # amber
  *)        C=$'\e[38;5;245m' ;;    # zinc
esac
DIM=$'\e[38;5;245m'
RST=$'\e[0m'

printf '%s🤖 %s%s · %s%s%s · tasks %s · BB%s' "$C" "$AGENT" "$RST" "$DIM" "$TEAM" "$RST" "$TASKS" "$HEALTH"
