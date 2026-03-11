<objective>
Create a PROJECT.md vision document for a fork of the Aera Skill Feasibility Engine that replaces
the local Ollama inference backend with a cloud-hosted vLLM server on H100 GPU(s), enabling
request batching and parallel scoring to reduce a 17-hour Ford evaluation run to under 30 minutes.

This is a strategic planning document — do NOT write implementation code.
The output will be used as input to the GSD workflow (`/gsd:new-project`) to generate a full
roadmap with phases, requirements, and execution plans.
</objective>

<context>
The Aera Skill Feasibility Engine lives in `src/` of the agent-factory repo.

Current architecture:
- CLI entry: `src/cli.ts` → `src/pipeline/pipeline-runner.ts`
- Scoring: `src/scoring/scoring-pipeline.ts` → `scoreOneOpportunity()` fires 3 lens calls
  in parallel via `Promise.all` (technical, adoption, value lenses)
- Each lens calls `ollamaChat()` in `src/scoring/ollama-client.ts` which POSTs to
  `http://localhost:11434/api/chat` with JSON schema constraint (`format` param)
- Retry logic: `scoreWithRetry()` wraps each call with 3 retries + exponential backoff
- Pipeline runner processes 339 opportunities SEQUENTIALLY (one at a time)
- `chatFn` dependency injection exists at every layer — designed for swappable backends
- `ModelManager` in `src/infra/model-manager.ts` handles Ollama model lifecycle (load/unload/switch)
- Checkpoint/resume support via `src/infra/checkpoint.ts`

Current performance on 36GB Apple Silicon with qwen3:30b:
- ~3 min per opportunity (successful)
- ~25% timeout rate at 5-min timeout (some prompts too large)
- 339 opportunities × 3 min = ~17 hours total
- Each opportunity makes 3 parallel LLM calls (one per lens)
- Total LLM calls: ~1,017 (339 × 3)

Key injection points already in the code:
- `PipelineOptions.chatFn` — swap the LLM client at pipeline level
- `PipelineOptions.fetchFn` — swap fetch at infrastructure level
- `scoreOneOpportunity(opp, l4s, company, knowledge, chatFn)` — per-opportunity injection
- `ModelManager` constructor accepts custom fetchFn

The fork should NOT change the scoring logic, prompts, schemas, triage, or output format.
It should ONLY replace the inference backend and add concurrency to the pipeline runner.
</context>

<research>
Before writing the vision, thoroughly research and address:

1. **vLLM deployment on H100**:
   - Read current `src/scoring/ollama-client.ts` to understand the exact API contract
   - Read `src/scoring/schemas.ts` to understand JSON schema constraints used with Ollama's `format` param
   - Determine how vLLM's OpenAI-compatible API maps to the current Ollama API contract
   - Determine how JSON schema-constrained output works in vLLM (guided decoding / outlines)

2. **Batching strategy**:
   - Read `src/pipeline/pipeline-runner.ts` to understand the sequential loop
   - Read `src/scoring/scoring-pipeline.ts` to understand the 3-lens parallel pattern
   - Determine optimal concurrency: how many opportunities can score simultaneously on 1× H100
   - Consider: each opportunity = 3 parallel calls, so N concurrent opportunities = 3N concurrent requests

3. **Infrastructure options**:
   - RunPod, Lambda Labs, Modal, or self-hosted — cost per hour for H100 80GB
   - Ephemeral vs persistent server (spin up for run, tear down after)
   - Docker image for vLLM with qwen3:30b pre-loaded

4. **What stays the same**:
   - All scoring prompts, schemas, and validation logic
   - Triage pipeline (pure functions, no LLM)
   - Checkpoint/resume system
   - Output format and report generation
   - Simulation pipeline
</research>

<requirements>
The vision document must include:

1. **Problem Statement**: Why local Ollama on Apple Silicon is insufficient for production use
   (speed, timeout rate, inability to batch, single-user blocking)

2. **Solution Overview**: vLLM on cloud H100 with concurrent pipeline execution
   - Architecture diagram (text-based) showing: CLI → Pipeline Runner (concurrent) → vLLM Client → Cloud H100
   - What changes vs what stays the same

3. **Technical Approach** (3 workstreams):
   a. **vLLM Client Adapter** — new `src/infra/vllm-client.ts` implementing the same `ChatFn` interface
      but targeting vLLM's OpenAI-compatible `/v1/chat/completions` endpoint with guided JSON decoding
   b. **Concurrent Pipeline Runner** — modified pipeline-runner that scores N opportunities simultaneously
      using a semaphore/pool pattern, while preserving checkpoint saves and archive thresholds
   c. **Cloud Infrastructure** — ephemeral H100 provisioning, model pre-loading, health checks,
      and auto-teardown after pipeline completes

4. **Performance Targets**:
   - Per-opportunity latency: <10 seconds (vs 3 min local)
   - Concurrency: 10-20 simultaneous opportunities (30-60 concurrent LLM calls)
   - Total pipeline time: <30 minutes for 339 opportunities
   - Timeout rate: <1% (vs 25% local)
   - Cost per run: <$10

5. **Risk Assessment**:
   - vLLM guided decoding compatibility with current Zod schemas
   - Network latency vs local inference
   - Cloud provider reliability and GPU availability
   - Cost control (auto-shutdown, billing alerts)

6. **Fork Strategy**: What files change, what files are shared, how to keep scoring logic in sync
   with the main offline-first branch

7. **Success Criteria**: Measurable outcomes that define "done"
</requirements>

<output>
Write the vision document to: `./PROJECT-CLOUD-SCORING.md`

Format: Markdown with clear sections matching the requirements above.
Length: Comprehensive but focused — aim for 150-250 lines.
Tone: Technical decision document suitable for a solo developer planning a sprint.

This document will be consumed by `/gsd:new-project` to generate a full roadmap,
so structure it with clear, decomposable workstreams that map to GSD phases.
</output>

<verification>
Before completing, verify:
- All 7 requirement sections are addressed
- The technical approach is grounded in the ACTUAL code (file paths, function signatures, injection points)
- Performance targets are realistic based on known H100 vLLM benchmarks
- The fork strategy preserves the offline-first main branch
- The document is actionable enough for GSD to generate phases from it
</verification>

<success_criteria>
- Vision document saved to ./PROJECT-CLOUD-SCORING.md
- All workstreams are clearly scoped and decomposable
- Injection points reference real code paths in the current codebase
- Cost estimates are grounded in current cloud GPU pricing
- Document is ready to feed into `/gsd:new-project`
</success_criteria>
