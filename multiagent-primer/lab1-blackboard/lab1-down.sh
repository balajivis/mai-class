#!/usr/bin/env bash
# lab1-down.sh — kill the Lab 1 tmux session
set -eu
tmux kill-session -t lab1 2>/dev/null && echo "lab1 session killed." || echo "no lab1 session running."
