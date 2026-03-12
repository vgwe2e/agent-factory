<objective>
Systematically debug and harden the Aera Skill Feasibility Engine's local Ollama evaluation pipeline so it can score all 141 Tier 1+2 opportunities unattended against qwen3:30b on Apple Silicon (36GB).

The pipeline currently degrades from an expected 4-5 hour run into 12-35 hours due to cascading timeouts, then crashes on checkpoint I/O. The goal is a single command that runs to completion without human intervention.

Read `CLAUDE.md` for project conventions and architecture before starting.
</objective>

<context>
The Aera engine (`src/`) evaluates Ford Motor Company hierarchy exports (L3 opportunities) across three scoring lenses (technical, business, organizational) using local LLM inference via Ollama.

<stack>
- Runtime: Node.js 22, TypeScript, ESM
- LLM: Ollama v0.13.5, qwen3:30b (Q4_K_M, 18.5GB MoE), qwen3:8b (Q4_K_M, 5GB) for triage
- Hardware: Apple Silicon, 36GB unified memory
- Entry point: `src/cli.ts` → `src/pipeline/pipeline-runner.ts`
- Scoring: `src/scoring/ollama-client.ts` (ollamaChat, scoreWithRetry)
- Checkpoint: `src/infra/checkpoint.ts` (debounced atomic write via rename)
- Timeout wrapper: `src/infra/timeout.ts` (withTimeout + AbortSignal)
- Model switching: `src/infra/model-manager.ts` (swaps between 8b triage and 30b scoring)
</stack>

<symptoms_from_production_run date="2026-03-12">
1. Pipeline stalled at 17-18% (18/141 completed) with ETA climbing: 30K → 36K → 42K seconds
2. Each scoring call to qwen3:30b took ~16 minutes but SCORING_TIMEOUT_MS was 240,000 (4 min) — every call timed out
3. scoreWithRetry correctly breaks on timeout (no retry), but the pipeline kept processing the next opportunity which also timed out, creating a 16-min-per-skip death spiral
4. Only concurrency 1 was in flight, so no GPU contention — the 30B MoE model is genuinely slow on Apple Silicon for complex scoring prompts
5. 7 errors accumulated (all timeout), then the checkpoint writer crashed:
   `Error: ENOENT: no such file or directory, rename 'evaluation/.checkpoint.json.tmp' -> 'evaluation/.checkpoint.json'`
   This killed the process and the `evaluation/` directory was subsequently lost, destroying 302 scored results from a prior run
6. The timeout was bumped from 240s to 1,200s (20 min) as a band-aid, but this makes a full run ~35 hours

<key_observation>
The 30B model produces high-quality scores when it completes (~3 min for simple prompts, 15+ min for complex ones). The issue is not model quality — it's that the pipeline has no concept of variable-duration scoring, no progress feedback during long calls, no graceful degradation, and no protection against losing completed work.
</key_observation>
</symptoms_from_production_run>
</context>

<investigation_protocol>
Apply systematic debugging methodology. For each problem area below, follow this cycle:

1. **Observe**: Read the relevant source files. Trace the actual execution path.
2. **Hypothesize**: Form a specific, falsifiable theory about root cause.
3. **Test**: Write or run a targeted test/experiment to confirm or reject.
4. **Fix**: Implement the minimal correct fix. Avoid over-engineering.
5. **Verify**: Run existing tests + new regression test to confirm the fix.

Do NOT shotgun-fix everything at once. Work through one problem at a time, commit after each verified fix.
</investigation_protocol>

<problem_areas>

<area id="1" priority="critical">
<title>Checkpoint durability — protect completed work</title>
<description>
The most damaging failure: 302 scored results were lost when the process crashed. The checkpoint writer uses debounced atomic rename (write .tmp then rename). The ENOENT crash suggests the tmp file or directory disappeared between writeFileSync and renameSync.

A fallback was added (try/catch around atomicWrite with direct-write fallback), but this is a band-aid. Investigate:
- Is the output directory (`evaluation/`) being created with the correct path (relative vs absolute)?
- Could the debounce timer fire after the process is already tearing down?
- Should checkpoint writes be synchronous and immediate for scored results (not debounced)?
- Should the checkpoint file use an absolute path resolved at startup?
- Is there a race between `flush()` and the debounced `atomicWrite()`?
</description>
<files>
- src/infra/checkpoint.ts
- src/infra/checkpoint.test.ts
- src/pipeline/pipeline-runner.ts (where createCheckpointWriter is called)
</files>
<success>Checkpoint survives process crashes (SIGTERM, SIGINT, uncaughtException). Scored results are never lost. Add a test that simulates crash-during-write.</success>
</area>

<area id="2" priority="high">
<title>Timeout strategy — match reality of 30B on Apple Silicon</title>
<description>
The current approach (single global SCORING_TIMEOUT_MS) doesn't account for:
- Three scoring lenses run per opportunity (technical, business, organizational)
- Each lens makes its own ollamaChat call
- Complex opportunities (multi-system integrations) take 3-5x longer than simple ones
- The 30B MoE model has highly variable inference time on Apple Silicon

Investigate the actual timing distribution:
- Read the checkpoint data in `evaluation-vllm/.checkpoint.json` and any pipeline logs
- Check if there are per-lens timing records anywhere
- Determine: should we have per-lens timeouts? Per-tier timeouts? Adaptive timeouts based on prompt length?

The 20-minute timeout works but is wasteful for the majority of calls that complete in 3-5 minutes. Consider whether a shorter timeout with automatic retry at longer timeout would be more efficient than one massive timeout.
</description>
<files>
- src/scoring/ollama-client.ts (SCORING_TIMEOUT_MS, ollamaChat, scoreWithRetry)
- src/scoring/score-opportunity.ts (three-lens scoring orchestration)
- src/pipeline/pipeline-runner.ts (requestTimeoutMs, withTimeout wrapping)
- src/infra/timeout.ts
</files>
<success>Pipeline completes all 141 Tier 1+2 opportunities locally without timeout-induced skips. Timeout strategy documented in code comments with rationale.</success>
</area>

<area id="3" priority="high">
<title>Ollama health and warm-up — prevent cold-start stalls</title>
<description>
Ollama may swap models in/out of memory. The 30B model is 18.5GB and may get evicted if the system is under memory pressure. The pipeline should:
- Verify Ollama is running and the target model is loaded before starting
- Send a warm-up prompt to ensure the model is in memory
- Detect if Ollama becomes unresponsive mid-run (not just timeout, but connection refused)
- Distinguish between "model is slow" and "Ollama crashed/hung"
</description>
<files>
- src/infra/ollama.ts (Ollama health check utilities)
- src/infra/model-manager.ts (model switching logic)
- src/pipeline/pipeline-runner.ts (pipeline startup)
</files>
<success>Pipeline fails fast with a clear message if Ollama isn't ready. Model warm-up reduces first-call latency. Mid-run Ollama crashes are detected within 30 seconds, not after a 20-minute timeout.</success>
</area>

<area id="4" priority="medium">
<title>Progress visibility for long-running local scoring</title>
<description>
The production logs showed the same "Pipeline progress" line repeating every 5 seconds for 16 minutes with no change. For a 35-hour run, the operator needs:
- ETA based on actual per-opportunity timing (not constant rate assumption)
- Current opportunity name and which lens is being scored
- Ollama status (is it actually generating tokens, or is it stuck?)
- Clear distinction between "working slowly" and "stalled"

Investigate whether Ollama's streaming API could provide token-level progress without changing the scoring logic.
</description>
<files>
- src/pipeline/pipeline-runner.ts (progress logging)
- src/scoring/ollama-client.ts (ollamaChat — currently stream: false)
</files>
<success>Progress logs show meaningful updates during long-running calls. Operator can distinguish working vs stalled without reading source code.</success>
</area>

<area id="5" priority="medium">
<title>Graceful shutdown and resume</title>
<description>
When the checkpoint crash killed the process, all state was lost. The pipeline needs:
- SIGINT/SIGTERM handlers that flush checkpoint before exit
- Checkpoint validation on resume (detect corruption)
- Resume should log what was recovered: "Resuming: 302 scored, 36 errors, 141 remaining"
- If the output directory is accidentally deleted, detect and warn (don't silently start fresh)
</description>
<files>
- src/infra/checkpoint.ts
- src/pipeline/pipeline-runner.ts (signal handling, resume logic)
</files>
<success>Ctrl+C during a run preserves all completed work. Resume clearly reports recovered state. Accidental output deletion is detected.</success>
</area>

</problem_areas>

<constraints>
- All fixes must pass existing tests: `cd src && npm test`
- Follow project conventions: Node.js built-in test runner, co-located test files, Result type pattern
- Git commits: `<type>(<scope>): <message>` — commit after each verified fix
- Do not change the scoring prompts or model selection — only infrastructure/resilience
- Do not add new dependencies unless absolutely necessary
- Keep changes minimal and focused — one problem area per commit
- The pipeline must remain compatible with `--backend vllm` cloud mode
</constraints>

<verification>
After all fixes:
1. Run full test suite: `cd src && npm test`
2. Dry-run the pipeline with a small input (first 5 opportunities) to verify:
   - Checkpoint survives Ctrl+C
   - Resume picks up where it left off
   - Progress logging is meaningful
   - Ollama health is verified at startup
3. Document what changed and why in commit messages
</verification>

<success_criteria>
- Zero risk of losing scored results to checkpoint crashes
- Pipeline handles 15+ minute scoring calls without false-positive timeouts
- Unattended local run completes all Tier 1+2 opportunities (may take 20-35 hours, that's OK)
- Ctrl+C at any point preserves all completed work
- Resume is seamless and clearly reports state
- All existing tests pass, new regression tests added for each fix
</success_criteria>
