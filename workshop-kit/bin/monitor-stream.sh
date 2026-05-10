#!/usr/bin/env bash
# Workshop-kit monitor · streams the per-agent SSE feed and emits one line per relevant event.
#
# Each line of stdout becomes a CC notification (per Monitor spec).
#
# Required env:
#   WK_TOKEN  team token
#   WK_TEAM   e.g. team1
#   WK_AGENT  e.g. alice-frontend
#   WK_API    (optional) defaults to https://bb.modernaipro.com

set -u
API="${WK_API:-https://bb.modernaipro.com}"
TEAM="${WK_TEAM:-}"
TOKEN="${WK_TOKEN:-}"
AGENT="${WK_AGENT:-}"

if [ -z "$TEAM" ] || [ -z "$TOKEN" ] || [ -z "$AGENT" ]; then
  echo "[monitor] WK_TEAM / WK_TOKEN / WK_AGENT not set; monitor disabled."
  # exit cleanly — the host CC keeps running fine.
  sleep infinity
fi

# Resilient reconnect loop. Each iteration opens a fresh SSE stream and parses
# `event: NAME\ndata: JSON\n\n` frames into single-line summaries.
while true; do
  curl -sN --max-time 0 \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Agent: $AGENT" \
    "$API/api/p/$TEAM/agents/$AGENT/stream" \
    | awk -v me="$AGENT" '
      BEGIN { ev=""; data="" }
      /^event:/ { ev = substr($0, 7); gsub(/^[ \t]+|[ \t]+$/, "", ev); next }
      /^data:/  { data = substr($0, 6); gsub(/^[ \t]+/, "", data); next }
      /^$/ {
        if (ev != "" && data != "") {
          if (ev == "task_offer")     print "🆕 task offer · " data
          else if (ev == "task_claim") print "🤝 claim · "      data
          else if (ev == "task_complete") print "✅ done · "    data
          else if (ev == "task_fail") print "❌ failed · "      data
          else if (ev == "event")     print "· " data
          else                        print ev " · " data
          fflush()
        }
        ev = ""; data = ""
      }
      /^:/ { next }   # heartbeat / comment lines
    '

  # If we got disconnected, wait a moment and retry.
  echo "[monitor] disconnected; reconnecting in 2s"
  sleep 2
done
