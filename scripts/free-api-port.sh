#!/bin/sh
# Free port 4000 from stale local API processes (nest --watch can leave orphans).
for pid in $(lsof -ti :4000 2>/dev/null); do
  if ps -p "$pid" -o comm= 2>/dev/null | grep -q node; then
    echo "Stopping stale API process on port 4000 (pid $pid)"
    kill "$pid" 2>/dev/null || true
  fi
done
