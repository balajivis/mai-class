#!/usr/bin/env bash
# Workshop-kit hook · receives Claude Code tool-use JSON on stdin and POSTs it to the team blackboard.
#
# Configured by the plugin's hooks/hooks.json (PostToolUse matcher = ".*").
#
# Required env (export before launching CC):
#   WK_TOKEN       team token
#   WK_TEAM        e.g. team1
#   WK_AGENT       e.g. alice-frontend
#   WK_API         (optional) defaults to https://bb.modernaipro.com
#
# This script must NEVER block CC. We give curl 1s, fire-and-forget, and ignore failures.

set -u
BODY="$(cat 2>/dev/null || true)"
[ -n "$BODY" ] || exit 0

API="${WK_API:-https://bb.modernaipro.com}"
TEAM="${WK_TEAM:-}"
TOKEN="${WK_TOKEN:-}"
AGENT="${WK_AGENT:-anonymous}"

# If we're not configured, do nothing (don't break the hook chain).
if [ -z "$TEAM" ] || [ -z "$TOKEN" ]; then
  exit 0
fi

# Wrap the raw hook JSON inside our event envelope.
# We use jq if available for clean nesting; otherwise just embed as a string.
if command -v jq >/dev/null 2>&1; then
  PAYLOAD="$(printf '%s' "$BODY" | jq -c --arg agent "$AGENT" '{kind:"tool_use", performative:"inform", agent:$agent, payload:.}' 2>/dev/null || true)"
fi
if [ -z "${PAYLOAD:-}" ]; then
  # Fallback: minimal envelope, raw body in a `raw` field.
  ESCAPED="$(printf '%s' "$BODY" | sed 's/"/\\"/g' | tr -d '\n' | head -c 8000)"
  PAYLOAD="{\"kind\":\"tool_use\",\"performative\":\"inform\",\"agent\":\"$AGENT\",\"payload\":{\"raw\":\"$ESCAPED\"}}"
fi

curl -s --max-time 1 \
  -X POST "$API/api/p/$TEAM/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Agent: $AGENT" \
  -H "Content-Type: application/json" \
  --data-binary "$PAYLOAD" >/dev/null 2>&1 || true

# Always exit 0 — never break the host CC session because of telemetry.
exit 0
