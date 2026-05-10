#!/usr/bin/env bash
set -eu
tmux kill-session -t lab2 2>/dev/null && echo "lab2 session killed." || echo "no lab2 session running."
rm -f "$(dirname "$0")/tasks.json.lock"
