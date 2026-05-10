#!/usr/bin/env bash
# Workshop-kit autocommit · runs every ~30s. Commits all working-tree changes
# to a per-agent branch and POSTs the new SHA to the team blackboard.
#
# This gives every team a "rollback to T-N" trail without anyone needing to
# remember to commit.
#
# Suggested invocation: run as a background daemon from the student's terminal,
# or wire into a cron-style trigger via a separate `Monitor` entry. For the
# workshop default we simply provide this script and the handout instructs:
#
#   $ workshop-kit/bin/snapshot.sh &     # one-time, in the project dir
#
# Required env: WK_TEAM, WK_TOKEN, WK_AGENT (and WK_API).

set -u
API="${WK_API:-https://bb.modernaipro.com}"
TEAM="${WK_TEAM:-}"
TOKEN="${WK_TOKEN:-}"
AGENT="${WK_AGENT:-anonymous}"
INTERVAL="${WK_SNAPSHOT_INTERVAL:-30}"

if [ -z "$TEAM" ] || [ -z "$TOKEN" ]; then
  echo "[snapshot] WK_TEAM / WK_TOKEN not set — exiting."
  exit 0
fi

if [ ! -d .git ]; then
  echo "[snapshot] no .git in $(pwd) — initialising for safety net."
  git init -q
  git config user.email "${AGENT}@workshop-kit.local" 2>/dev/null
  git config user.name  "$AGENT" 2>/dev/null
  git add -A 2>/dev/null
  git commit -q --allow-empty -m "[bb-snapshot] init by $AGENT" 2>/dev/null || true
fi

# Per-agent branch so two agents in the same project don't fight over HEAD.
BRANCH="bb-snap/${AGENT}"
git checkout -q -B "$BRANCH" 2>/dev/null || true

while true; do
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    git add -A 2>/dev/null
    git commit -q -m "[bb-snapshot] $(date -u +%FT%TZ) by $AGENT" 2>/dev/null || true
    SHA="$(git rev-parse HEAD 2>/dev/null || echo "")"
    if [ -n "$SHA" ]; then
      curl -s --max-time 1 \
        -X POST "$API/api/p/$TEAM/snapshot" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Agent: $AGENT" \
        -H "Content-Type: application/json" \
        -d "{\"agent\":\"$AGENT\",\"git_sha\":\"$SHA\",\"note\":\"auto\"}" \
        >/dev/null 2>&1 || true
    fi
  fi
  sleep "$INTERVAL"
done
