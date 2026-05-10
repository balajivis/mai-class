#!/usr/bin/env bash
# bb-serve.sh — serve bb-mirror.html for Lab 2.
# Same pattern as Lab 1's: python3 -m http.server + auto-open browser.

set -eu
cd "$(dirname "$0")"

PORT="${1:-8766}"
URL="http://localhost:${PORT}/bb-mirror.html"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found." >&2; exit 1
fi

echo "▶ serving $(pwd) on port ${PORT}"
echo "▶ live mirror: ${URL}"

if   command -v open     >/dev/null 2>&1; then open     "$URL" 2>/dev/null &
elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" 2>/dev/null &
elif command -v wslview  >/dev/null 2>&1; then wslview  "$URL" 2>/dev/null &
fi

exec python3 -m http.server "$PORT" --bind 127.0.0.1
