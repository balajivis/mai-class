#!/usr/bin/env bash
# bb-serve.sh — serve the editorial live mirror in a browser
#
# Starts python3's built-in http server in this directory and opens
# bb-mirror.html. The page polls blackboard.md once per second.
#
# usage:  ./bb-serve.sh [port]
# default port: 8765

set -eu
cd "$(dirname "$0")"

PORT="${1:-8765}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. Ask Claude to install it, or use ./bb-watch.sh (terminal mirror) instead." >&2
  exit 1
fi

URL="http://localhost:${PORT}/bb-mirror.html"

echo "▶ serving $(pwd) on port ${PORT}"
echo "▶ live mirror: ${URL}"
echo "▶ press Ctrl-C to stop"
echo

# open browser (best-effort, platform-specific)
if   command -v open      >/dev/null 2>&1; then open      "$URL" 2>/dev/null &
elif command -v xdg-open  >/dev/null 2>&1; then xdg-open  "$URL" 2>/dev/null &
elif command -v wslview   >/dev/null 2>&1; then wslview   "$URL" 2>/dev/null &
fi

exec python3 -m http.server "$PORT" --bind 127.0.0.1
