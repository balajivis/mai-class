#!/usr/bin/env bash
# lab3-compare.sh — print a per-round summary across runs/ archives
#
# Run after all three rounds. Reads runs/*.md files (auto-archived by lab3-up.sh)
# and prints a one-line summary per archive: counts of entries, agents active,
# directives, DONE markers, itinerary status. Sorted oldest → newest so you can
# read across rounds top-to-bottom.

set -eu
cd "$(dirname "$0")"

RUNS_DIR="runs"
[ -d "$RUNS_DIR" ] || { echo "no runs/ directory yet"; exit 0; }

shopt -s nullglob
files=("$RUNS_DIR"/*.md)
[ "${#files[@]}" -gt 0 ] || { echo "no archives in $RUNS_DIR/"; exit 0; }

# also include the live blackboard if it has content
[ -f blackboard.md ] && [ -s blackboard.md ] && ! cmp -s blackboard.md blackboard.template.md && files+=("blackboard.md")

# header
printf '%-32s  %-7s  %-7s  %-9s  %-7s  %-9s  %s\n' \
  'archive' 'entries' 'agents' 'directiv' 'DONE' 'itinerary' 'roles'
printf '%-32s  %-7s  %-7s  %-9s  %-7s  %-9s  %s\n' \
  '────────────────────────────────' '───────' '───────' '─────────' '───────' '─────────' '──────────────'

for f in "${files[@]}"; do
  base=$(basename "$f")

  entries=$(grep -c '^### \[agent-' "$f" 2>/dev/null | tr -dc '0-9'); entries=${entries:-0}
  agents=$( awk '/^- agent-/ {gsub(/^- /,""); print $1}' "$f" | sort -u | wc -l | tr -dc '0-9'); agents=${agents:-0}
  directives=$(grep -c 'DIRECTIVE' "$f" 2>/dev/null | tr -dc '0-9'); directives=${directives:-0}
  dones=$(grep -c '· DONE\]\|· done\]' "$f" 2>/dev/null | tr -dc '0-9'); dones=${dones:-0}
  if grep -q '^## ITINERARY' "$f" 2>/dev/null; then itin='✓'; else itin='—'; fi

  # role list (compact)
  roles=$(awk '/^- agent-/ { for(i=1;i<=NF;i++) if($i=="·" && i<NF) last=$(i+1); if(/·/) print $NF }' "$f" \
          | grep -v '^$' | grep -v '^Z$' | sort -u | paste -sd, - 2>/dev/null || true)
  [ -z "$roles" ] && roles='(none)'

  printf '%-32s  %-7s  %-7s  %-9s  %-7s  %-9s  %s\n' \
    "$base" "$entries" "$agents" "$directives" "$dones" "$itin" "$roles"
done
