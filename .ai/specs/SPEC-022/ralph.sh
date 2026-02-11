#!/bin/bash
# Ralph Loop — Adapted for Open Mercato POS Module (SPEC-022)
# Uses Gemini CLI in non-interactive mode with --model auto.
# Auto routes: simple tasks → Flash, complex tasks → Pro.
#
# Usage: ./ralph.sh [max_iterations]
#   max_iterations: defaults to 5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DEV_LOG="$SCRIPT_DIR/development_log.md"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
MAX_ITERATIONS="${1:-5}"
LOCK_FILE="$SCRIPT_DIR/.ralph.lock"

# ── Lock Mechanism: Prevent parallel runs ──
if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(cat "$LOCK_FILE")
  if ps -p "$LOCK_PID" > /dev/null; then
    echo "❌ Ralph is already running (PID: $LOCK_PID). Exiting."
    exit 1
  fi
fi
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT


# Preflight checks — ensure gemini is in PATH
# Source nvm if available; also add all nvm node bin directories to PATH as fallback
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Fallback: scan nvm node versions for the gemini binary
if ! command -v gemini &> /dev/null; then
  for node_bin in "$HOME"/.nvm/versions/node/*/bin; do
    if [ -x "$node_bin/gemini" ]; then
      export PATH="$node_bin:$PATH"
      break
    fi
  done
fi

if ! command -v gemini &> /dev/null; then
  echo "❌ Gemini CLI not found. Install with: npm install -g @google/gemini-cli"
  exit 1
fi

if [ ! -f "$DEV_LOG" ]; then
  echo "❌ development_log.md not found at $DEV_LOG"
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "❌ prompt.md not found at $PROMPT_FILE"
  exit 1
fi

echo "🚀 Starting Ralph Loop (Gemini CLI) — Max iterations: $MAX_ITERATIONS"
echo "   Project root: $PROJECT_ROOT"
echo "   Dev log: $DEV_LOG"
echo ""

cd "$PROJECT_ROOT"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  # ── Gate 1: Check status of the NEXT incomplete step ──
  NEXT_STEP_LINE=$(grep -E "^\| [A-Z0-9-]*[[:space:]]*\|" "$DEV_LOG" | grep -v "✅ Done" | head -n 1)
  NEXT_STEP_STATUS=$(echo "$NEXT_STEP_LINE" | awk -F '|' '{print $3}' | xargs)
  NEXT_STEP_ID=$(echo "$NEXT_STEP_LINE" | awk -F '|' '{print $2}' | xargs)

  if [ -z "$NEXT_STEP_STATUS" ]; then
    echo ""
    echo "✅ All steps complete! No remaining steps in development_log.md."
    exit 0
  fi

  if [[ "$NEXT_STEP_STATUS" != "⬜"* ]]; then
    echo ""
    echo "⏸️  Loop paused: Next step [$NEXT_STEP_ID] status is [$NEXT_STEP_STATUS]."
    echo "   Manual action or User Acceptance required."
    exit 0
  fi

  echo "📋 Next step: $NEXT_STEP_ID"
  echo ""

  # ── Snapshot commit count before the agent runs ──
  COMMITS_BEFORE=$(git rev-list --count HEAD)

  # ── Run Gemini CLI with the prompt file (with Retry Logic) ──
  RETRY_COUNT=0
  MAX_RETRIES=3
  BACKOFF=30

  while [ $RETRY_COUNT -le $MAX_RETRIES ]; do
    echo "🤖 Running Gemini CLI (Attempt $((RETRY_COUNT + 1))/$((MAX_RETRIES + 1)))..."
    
    # Run gemini and capture output
    OUTPUT=$(gemini -p "$(cat "$PROMPT_FILE")" --model auto --yolo 2>&1 | tee /dev/stderr) || true
    
    # Check for rate limit errors (429, RESOURCE_EXHAUSTED)
    if echo "$OUTPUT" | grep -Ei "429|RESOURCE_EXHAUSTED|Too Many Requests" > /dev/null; then
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⚠️  Rate limit hit (429). Retrying in ${BACKOFF}s..."
        sleep $BACKOFF
        RETRY_COUNT=$((RETRY_COUNT + 1))
        BACKOFF=$((BACKOFF * 2)) # Exponential backoff
        continue
      else
        echo "❌ Rate limit hit and max retries reached. Stopping iterations."
        exit 1
      fi
    fi

    # Check for completion signal
    if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
      echo ""
      echo "✅ Ralph completed all tasks!"
      echo "   Finished at iteration $i of $MAX_ITERATIONS"
      exit 0
    fi

    # If no rate limit and no completion, proceed to gates
    break
  done


  # ── Gate 2: Post-commit review gate ──
  COMMITS_AFTER=$(git rev-list --count HEAD)

  if [ "$COMMITS_AFTER" -gt "$COMMITS_BEFORE" ]; then
    echo ""
    echo "🔍 Post-commit gate: Checking for Review Findings in dev log..."

    # Check if the learnings section for this step contains "Review Findings"
    if ! grep -q "Review Findings" "$DEV_LOG"; then
      echo "❌ REVIEW GATE FAILED: No 'Review Findings' found in development_log.md"
      echo "   The agent skipped the mandatory self-review step."
      echo "   Rolling back the last commit(s)..."
      COMMITS_ADDED=$((COMMITS_AFTER - COMMITS_BEFORE))
      git reset --soft HEAD~"$COMMITS_ADDED"
      git restore --staged .
      git checkout -- .
      echo "   ↩️  Rolled back $COMMITS_ADDED commit(s). Re-run to retry."
      exit 1
    fi

    echo "✅ Review gate passed."
  else
    echo "⚠️  No new commits detected. The agent may have failed."
  fi

  echo ""
  echo "Iteration $i complete. Pausing 10s before next iteration..."
  sleep 10
done

echo ""
echo "⚠️  Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "   Check development_log.md for status."
exit 1
