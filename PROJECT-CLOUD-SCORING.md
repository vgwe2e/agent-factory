# PROJECT-CLOUD-SCORING.md

## Cloud-Accelerated Scoring: vLLM on H100 for Aera Skill Feasibility Engine

**Author:** Vincent Wicker
**Date:** 2026-03-11
**Status:** Vision / Pre-planning

---

## 1. Problem Statement

The Aera Skill Feasibility Engine currently runs all LLM scoring through local Ollama on Apple Silicon (36GB unified memory). For the Ford hierarchy evaluation (339 L3 opportunities, 3 lenses each = 1,017 LLM calls), this architecture creates four compounding bottlenecks:

**Sequential processing.** The pipeline runner (`src/pipeline/pipeline-runner.ts`) iterates opportunities in a `for` loop (line 196). Each opportunity calls `scoreOneOpportunity`, which fires 3 lens calls via `Promise.all` -- but opportunities themselves are strictly sequential. With ~3 minutes per opportunity on `qwen3:30b`, the 339-opportunity Ford run takes ~17 hours.

**High timeout rate.** `SCORING_TIMEOUT_MS` is set to 600 seconds (10 minutes) in `src/scoring/ollama-client.ts` line 19. Despite this generous timeout, ~25% of calls fail due to Apple Silicon thermal throttling and memory pressure during long runs. Each failure triggers up to 3 retries with exponential backoff (`scoreWithRetry`), further inflating wall-clock time.

**Single-model memory constraint.** `ModelManager` (`src/infra/model-manager.ts`) enforces one loaded model at a time because `qwen3:30b` consumes nearly all 36GB. There is no room for batching or concurrent model instances.

**No request batching.** Ollama's `/api/chat` endpoint processes one request at a time. Even the 3 concurrent lens calls within `Promise.all` (`src/scoring/scoring-pipeline.ts` line 64) are serialized at the Ollama layer, negating the intended parallelism.

**Bottom line:** The current architecture cannot scale beyond single-user, single-machine, sequential evaluation. A 17-hour overnight run with 25% error rate is not viable for iterative analysis or client-facing delivery.

---

## 2. Solution Overview

Replace the local Ollama backend with a cloud-hosted vLLM server running on one or more NVIDIA H100 GPUs. vLLM provides true request batching (continuous batching), an OpenAI-compatible API, and guided JSON decoding -- enabling concurrent scoring of multiple opportunities simultaneously.

### Architecture

```
CLI (cli.ts)
  |
  v
Pipeline Runner (MODIFIED: concurrent opportunity processing)
  |
  |--- Opportunity 1 ---> scoreOneOpportunity ---> Promise.all([tech, adopt, value])
  |--- Opportunity 2 ---> scoreOneOpportunity ---> Promise.all([tech, adopt, value])
  |--- ...             (semaphore-bounded, N=10-20 concurrent)
  |--- Opportunity N --->
  |
  v
vLLM Client Adapter (NEW: src/infra/vllm-client.ts)
  |  Implements same ChatFn interface:
  |  (messages, format) => Promise<ChatResult>
  |
  v
Cloud H100 vLLM Server
  POST /v1/chat/completions
  - guided_json for schema-constrained output
  - continuous batching handles 30-60 concurrent requests
```

### What Changes vs What Stays

| Layer | Changes? | Notes |
|-------|----------|-------|
| Ingestion, triage, archetype router | No | Pure functions, no LLM dependency |
| Lens prompt builders (`prompts/*.ts`) | No | Same message arrays, same format |
| Zod schemas (`scoring/schemas.ts`) | No | Validation layer unchanged |
| `scoreWithRetry` | No | Generic retry wrapper, callFn-agnostic |
| `callWithResilience` | No | Wraps scoreWithRetry, backend-agnostic |
| Lens scorers (`lens-scorers.ts`) | No | Already accept `chatFn` injection |
| `scoreOneOpportunity` | No | Already accepts `chatFn` parameter |
| `ollamaChat` function | Replaced | New `vllmChat` with same `ChatFn` signature |
| `ModelManager` | Replaced | New cloud-oriented health check / teardown |
| `pipeline-runner.ts` | Modified | Sequential loop becomes semaphore-bounded concurrent loop |
| Checkpoint system | Modified | Must handle concurrent writes safely |
| CLI (`cli.ts`) | Modified | New `--backend vllm` flag, env var for endpoint |

The key insight: **dependency injection via `ChatFn` means the entire scoring stack (lens scorers, scoring pipeline, retry logic) works unmodified.** The `chatFn` parameter flows from `PipelineOptions` through `scoreOneOpportunity` to each lens scorer. We only need to provide a new implementation.

---

## 3. Technical Approach

### Workstream A: vLLM Client Adapter

**New file:** `src/infra/vllm-client.ts`

Implements the `ChatFn` type signature used throughout the scoring stack:

```typescript
type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;
```

**Key differences from `ollamaChat`:**

1. **Endpoint:** vLLM's OpenAI-compatible `/v1/chat/completions` instead of Ollama's `/api/chat`
2. **Schema enforcement:** vLLM uses `guided_json` parameter (or `response_format` with `json_schema`) instead of Ollama's `format` parameter. The existing JSON schemas from `zodToJsonSchema()` in `src/scoring/schemas.ts` are directly compatible -- they just go in a different request field.
3. **Response parsing:** OpenAI format returns `choices[0].message.content` instead of `message.content`. Duration comes from `usage` fields rather than `total_duration` nanoseconds.
4. **Authentication:** Bearer token header for cloud provider API key.
5. **Timeout:** Can be reduced from 600s to 30-60s. H100 inference for 30B models at these prompt sizes (~1500-2500 tokens input, ~200 tokens output) should complete in 2-5 seconds.

**Configuration:** Environment variables (`VLLM_ENDPOINT`, `VLLM_API_KEY`, `VLLM_MODEL`) with sensible defaults. No hardcoded URLs.

**Model choice:** Run the same `qwen3:30b` (or Qwen 2.5 32B) on the H100. A single H100 (80GB HBM3) can hold a 32B model in fp16 with room for large KV cache, enabling high-throughput batching.

### Workstream B: Concurrent Pipeline Runner

**Modified file:** `src/pipeline/pipeline-runner.ts`

The current scoring loop (line 196-258) processes opportunities one at a time:

```typescript
for (const triage of processable) {
  // ... score one, checkpoint, maybe archive
}
```

Replace with a semaphore-bounded concurrent executor:

1. **Concurrency pool:** Process N opportunities simultaneously (configurable, default 10-15). Each opportunity still runs its 3 lenses via `Promise.all` internally, so actual concurrent LLM requests = N * 3.
2. **Semaphore pattern:** Simple counting semaphore (no external deps) to cap in-flight opportunities. When one completes, the next starts.
3. **Checkpoint safety:** Current checkpoint appends entries sequentially. With concurrency, entries arrive out of order. Solutions: (a) batch checkpoint writes with a mutex, or (b) write per-opportunity checkpoint files and merge on completion.
4. **Archive threshold:** `archiveAndReset` (called every 25 opportunities) needs to accumulate results from concurrent completions. Use a shared results array with atomic counter.
5. **Error isolation:** Current `callWithResilience` already returns structured results (no thrown exceptions). Concurrent failures in one opportunity do not affect others.
6. **Ordering:** Results arrive out of tier order. Final report generation already sorts, so this is acceptable. Checkpoint must track tier for resume priority.

**Preserving resume support:** The checkpoint system (`src/infra/checkpoint.ts`) already uses `getCompletedNames()` to build a `Set<string>` of finished opportunities. This works identically with concurrent processing -- the `completed.has(triage.l3Name)` check on line 210 filters before dispatching to the pool.

### Workstream C: Cloud Infrastructure

**Provisioning:** Ephemeral H100 instance via cloud provider API (RunPod, Lambda, or Modal). Spin up on-demand, pre-load model weights, run evaluation, tear down.

**Lifecycle:**
1. `provision()` -- Start GPU instance, wait for ready
2. `loadModel()` -- Pull/load model weights on vLLM server
3. `healthCheck()` -- Poll `/health` or `/v1/models` until serving
4. Run pipeline (workstream B)
5. `teardown()` -- Terminate instance to stop billing

**New file:** `src/infra/cloud-provider.ts` -- Abstract provisioning interface with at least one concrete implementation (e.g., RunPod serverless or dedicated).

**Replaces `ModelManager`:** The current `ModelManager` manages Ollama's `keep_alive` parameter for model loading/unloading on constrained hardware. In the cloud path, model lifecycle is handled by vLLM server startup config. The cloud equivalent ensures the model is loaded and serving before pipeline starts, and tears down the instance after completion.

**Health monitoring during run:** Periodic health checks to detect if the cloud instance becomes unhealthy. If the vLLM server crashes mid-run, checkpoint resume allows restarting from where it left off.

---

## 4. Performance Targets

| Metric | Local Ollama (current) | Cloud vLLM (target) | Improvement |
|--------|----------------------|---------------------|-------------|
| Per-opportunity (3 lenses) | ~3 min | <10 sec | 18x |
| Concurrent opportunities | 1 | 10-20 | 10-20x |
| Concurrent LLM calls | 1 (serialized) | 30-60 | 30-60x |
| Total pipeline (339 opps) | ~17 hours | <30 min | 34x |
| Timeout rate | ~25% | <1% | 25x |
| Cost per run | $0 (local HW) | <$10 | N/A |

**Cost breakdown estimate:** H100 at ~$3/hr (spot/serverless), 30-minute run = ~$1.50 compute. With overhead (startup, model loading, buffer): ~$3-5 per run. Well under $10 target.

**Latency budget per opportunity:**
- Network round-trip to cloud: ~50ms
- vLLM inference (30B model, ~2000 token input, ~200 token output): ~2-4 sec per lens
- 3 lenses in parallel: ~4 sec wall-clock
- Retry buffer: ~2 sec
- **Total: ~6 sec per opportunity**

With 15 concurrent opportunities: 339 / 15 = 23 batches * 6 sec = ~2.3 minutes of pure scoring. Add ingestion, triage, simulation, reporting overhead: ~10-15 minutes total. Comfortably under 30-minute target.

---

## 5. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Guided JSON incompatibility** | vLLM's `guided_json` may not handle all JSON schema features from `zodToJsonSchema()` (e.g., `$ref`, `additionalProperties`) | Medium | Test schemas against vLLM's outlines engine early. Simplify schemas if needed -- current schemas are flat (no nesting beyond one level). |
| **Network latency variance** | Cloud round-trips add 50-200ms per call; unstable connections could cause cascading timeouts | Low | Generous per-request timeout (30s vs 2-4s expected). Retry logic already exists in `scoreWithRetry`. |
| **Provider reliability** | Cloud GPU instance could be preempted (spot) or crash mid-run | Medium | Checkpoint resume already works. Use on-demand instances for critical runs. Health check polling detects failures early. |
| **Cost overrun** | Runaway retries or stuck instances could exceed $10 target | Low | Hard timeout on pipeline (60 min). Auto-teardown on completion or timeout. Budget alerts on provider. |
| **Model weight divergence** | Running different quantization on H100 vs Apple Silicon could produce different scores | Medium | Use identical model weights (e.g., same GGUF or safetensors). Run validation set on both backends and compare score distributions. Accept minor variance. |
| **Concurrent checkpoint corruption** | Multiple opportunities writing checkpoint simultaneously | Medium | Mutex-protected writes or per-opportunity checkpoint files. Test under concurrent load. |

---

## 6. Fork Strategy

This is a **feature branch fork**, not a permanent divergence. The goal is to keep the cloud scoring path as a thin adapter layer that can be merged back or maintained alongside the offline-first main branch.

### Files That Change

| File | Change Type | Sync Risk |
|------|-------------|-----------|
| `src/infra/vllm-client.ts` | **New** | None -- additive |
| `src/infra/cloud-provider.ts` | **New** | None -- additive |
| `src/pipeline/pipeline-runner.ts` | **Modified** | High -- core orchestration |
| `src/infra/checkpoint.ts` | **Modified** | Medium -- concurrent safety |
| `src/cli.ts` | **Modified** | Low -- additive flags |

### Files That Must NOT Change

| File | Reason |
|------|--------|
| `src/scoring/lens-scorers.ts` | Shared scoring logic; uses `chatFn` injection |
| `src/scoring/scoring-pipeline.ts` | `scoreOneOpportunity` is backend-agnostic |
| `src/scoring/schemas.ts` | Zod schemas shared across backends |
| `src/scoring/prompts/*.ts` | Prompt builders are pure functions |
| `src/scoring/ollama-client.ts` | `scoreWithRetry` is generic; `ollamaChat` stays for offline mode |
| `src/triage/*` | No LLM dependency |
| `src/ingestion/*` | No LLM dependency |

### Sync Strategy

1. **Injection point is the boundary.** All cloud-specific code sits behind the `ChatFn` interface and the `PipelineOptions.chatFn` parameter. Scoring logic changes on main branch flow through unchanged.
2. **Pipeline runner is the risk.** The concurrent modification to `pipeline-runner.ts` will diverge from main's sequential loop. Strategy: extract the scoring loop into a separate function (`runScoringLoop`) that accepts a concurrency parameter. When concurrency=1, behavior is identical to current sequential loop. This lets the change merge back to main without breaking offline mode.
3. **Feature flag in CLI.** `--backend ollama|vllm` flag selects which `chatFn` implementation to inject. Default remains `ollama` for backward compatibility.

---

## 7. Success Criteria

### Must Have (Definition of Done)

- [ ] Ford 339-opportunity evaluation completes in under 30 minutes end-to-end
- [ ] Timeout/error rate below 5% (stretch: below 1%)
- [ ] Scoring output is schema-valid (same Zod validation as offline path)
- [ ] Checkpoint resume works correctly after mid-run interruption
- [ ] Cloud instance auto-tears-down after pipeline completion or timeout
- [ ] Cost per Ford run is under $10
- [ ] Offline Ollama path (`--backend ollama`) continues to work unchanged

### Should Have

- [ ] Score distribution comparison: cloud vs local scores within acceptable variance (mean delta < 0.5 per lens on validation set)
- [ ] Single CLI command provisions, runs, and tears down: `npm run dev -- --input ford.json --backend vllm`
- [ ] Progress reporting shows concurrent status (N in-flight, M completed, K errors)

### Nice to Have

- [ ] Support for multiple GPU instances (scale beyond single H100 for larger evaluations)
- [ ] Streaming progress via SSE for web dashboard integration
- [ ] Cost tracking per run with cumulative reporting

---

## Appendix: GSD Phase Mapping

These workstreams map to GSD execution phases:

| Phase | Workstream | Key Deliverable |
|-------|-----------|-----------------|
| 1 | A: vLLM Client | `vllm-client.ts` passing same test suite as `ollamaChat` |
| 2 | B: Concurrent Runner | Pipeline runner with semaphore pool, concurrent checkpointing |
| 3 | C: Cloud Infra | Provisioning, health check, auto-teardown |
| 4 | Integration | End-to-end test with real H100 and Ford dataset |
| 5 | Validation | Score comparison, performance benchmarks, cost analysis |
