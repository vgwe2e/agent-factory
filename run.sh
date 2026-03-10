#!/usr/bin/env bash
# Run the agent-factory loop overnight.
# When Claude Code hits context limits, it commits + writes a handoff note,
# then this script restarts it. The new session picks up where it left off.

set -e

PROMPT_FIRST="Read program.md fully. Read seed/README.md. Check .env, research/research-log.md, results.tsv, and build-queue.md. Then begin the loop. NEVER STOP."

PROMPT_RESUME="Read program.md. Read research/next-session.md for where you left off. Read research/research-log.md, results.tsv, and build-queue.md. Continue the loop. NEVER STOP."

cd "$(dirname "$0")"

RUN=1
while true; do
  echo "=== Agent session $RUN starting at $(date) ==="

  if [ "$RUN" -eq 1 ] && [ ! -f research/next-session.md ]; then
    claude -p --dangerously-skip-permissions --verbose "$PROMPT_FIRST" 2>&1 | tee "research/session-${RUN}.log"
  else
    claude -p --dangerously-skip-permissions --verbose "$PROMPT_RESUME" 2>&1 | tee "research/session-${RUN}.log"
  fi

  echo "=== Agent session $RUN ended at $(date) ==="
  RUN=$((RUN + 1))
  sleep 5
done
