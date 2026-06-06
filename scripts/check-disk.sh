#!/usr/bin/env bash
set -euo pipefail

THRESHOLD=85
USAGE=$(df / | awk 'NR==2 {gsub("%","",$5); print $5}')

echo "Disk usage: ${USAGE}%"

if [ "$USAGE" -ge "$THRESHOLD" ]; then
  echo "WARNING: disk usage is above ${THRESHOLD}%"
  exit 1
fi

exit 0
