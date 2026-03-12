#!/usr/bin/env bash
set -euo pipefail

# Full evaluation pipeline: score → retry errors → regenerate reports → teardown
#
# Usage:
#   ./run-full-eval.sh <input-json> <vllm-url> [concurrency] [max-retries]
#
# Example:
#   ./run-full-eval.sh ../.planning/ford_hierarchy_v2_export.json https://POD_ID-8000.proxy.runpod.net 3 2
#
# Requires: RUNPOD_API_KEY in ../.env, runpodctl on PATH

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT="${1:?Usage: $0 <input-json> <vllm-url> [concurrency] [max-retries]}"
VLLM_URL="${2:?Usage: $0 <input-json> <vllm-url> [concurrency] [max-retries]}"
CONCURRENCY="${3:-3}"
MAX_RETRIES="${4:-2}"
OUTPUT_DIR="${SCRIPT_DIR}/evaluation-vllm"
CHECKPOINT="${OUTPUT_DIR}/.checkpoint.json"

cd "$SCRIPT_DIR"
export DOTENV_CONFIG_PATH=../.env

# Extract pod ID from URL for teardown
POD_ID=$(echo "$VLLM_URL" | grep -oE '[a-z0-9]+-8000' | sed 's/-8000//')

echo "=== Full Evaluation Pipeline ==="
echo "Input:       $INPUT"
echo "vLLM URL:    $VLLM_URL"
echo "Concurrency: $CONCURRENCY"
echo "Max retries: $MAX_RETRIES"
echo "Pod ID:      $POD_ID"
echo ""

# --- Step 1: Initial scoring run ---
echo ">>> Step 1: Scoring (concurrency $CONCURRENCY)"
npx tsx cli.ts \
  --input "$INPUT" \
  --backend vllm \
  --vllm-url "$VLLM_URL" \
  --concurrency "$CONCURRENCY" \
  --output-dir "$OUTPUT_DIR" || true

# --- Step 2: Retry errors with concurrency 1 ---
for i in $(seq 1 "$MAX_RETRIES"); do
  ERROR_COUNT=$(python3 -c "
import json
with open('$CHECKPOINT') as f:
    cp = json.load(f)
print(sum(1 for e in cp['entries'] if e.get('status') == 'error'))
" 2>/dev/null || echo "0")

  if [ "$ERROR_COUNT" -eq 0 ]; then
    echo ">>> No errors to retry. Moving on."
    break
  fi

  echo ">>> Step 2.$i: Retrying $ERROR_COUNT errors (concurrency 1)"

  # Clear error entries from checkpoint
  python3 -c "
import json
path = '$CHECKPOINT'
with open(path) as f:
    cp = json.load(f)
cp['entries'] = [e for e in cp['entries'] if e.get('status') != 'error']
with open(path, 'w') as f:
    json.dump(cp, f, indent=2)
"

  npx tsx cli.ts \
    --input "$INPUT" \
    --backend vllm \
    --vllm-url "$VLLM_URL" \
    --concurrency 1 \
    --output-dir "$OUTPUT_DIR" || true
done

# --- Step 3: Regenerate reports from full checkpoint data ---
echo ">>> Step 3: Regenerating reports"
npx tsx regen-reports.ts "$INPUT" "$OUTPUT_DIR"

# --- Step 4: Final error count ---
FINAL_ERRORS=$(python3 -c "
import json
with open('$CHECKPOINT') as f:
    cp = json.load(f)
scored = sum(1 for e in cp['entries'] if e.get('status') == 'scored')
errors = sum(1 for e in cp['entries'] if e.get('status') == 'error')
print(f'{scored} scored, {errors} errors')
")
echo ""
echo "=== Pipeline Complete ==="
echo "Results: $FINAL_ERRORS"
echo "Reports: $OUTPUT_DIR/evaluation/"

# --- Step 5: Teardown ---
if [ -n "$POD_ID" ]; then
  echo ""
  echo ">>> Step 5: Tearing down RunPod pod $POD_ID"
  source <(grep '^RUNPOD_API_KEY=' ../.env)
  export RUNPOD_API_KEY
  runpodctl pod stop "$POD_ID" 2>/dev/null || true
  sleep 3
  runpodctl pod delete "$POD_ID" 2>/dev/null || true
  echo "Pod $POD_ID stopped and deleted."
else
  echo "WARNING: Could not extract pod ID from URL. Skipping teardown."
  echo "Run manually: runpodctl pod stop <POD_ID> && runpodctl pod delete <POD_ID>"
fi

echo ""
echo "Done."
