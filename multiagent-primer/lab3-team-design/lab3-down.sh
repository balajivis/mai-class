#!/usr/bin/env bash
# lab3-down.sh — kill the Lab 3 tmux session
set -eu
tmux kill-session -t lab3 2>/dev/null && echo "lab3 session killed." || echo "no lab3 session running."
