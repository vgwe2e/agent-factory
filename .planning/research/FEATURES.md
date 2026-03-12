# Feature Landscape

**Domain:** Cloud-accelerated LLM scoring pipeline (v1.1 milestone for Aera Skill Feasibility Engine)
**Researched:** 2026-03-11
**Scope:** NEW features only -- vLLM cloud backend, concurrent pipeline, ephemeral GPU provisioning

## Table Stakes

Features the v1.1 milestone must have. Missing = milestone goal unmet.

| Feature | Why Expected | Complexity | Dependencies on Existing |
|---------|--------------|------------|--------------------------|
| vLLM ChatFn adapter | Core deliverable: swap Ollama for cloud vLLM while preserving the same `ChatFn` interface that `scoreOneOpportunity` already consumes | Medium | Implements same `ChatFn` type from `scoring/ollama-client.ts`; uses existing `scoreWithRetry` for validation |
| OpenAI-compatible API client | vLLM exposes `/v1/chat/completions` -- use standard OpenAI SDK format rather than Ollama's proprietary `/api/chat` format | Low | New code, but must produce identical `ChatResult` shape (`{success, content, durationMs}`) |
| JSON schema-constrained output via vLLM | Current pipeline uses Ollama's `format` param for structured JSON. vLLM uses `response_format: {type: "json_schema", json_schema: {name, schema}}` -- must translate Zod schemas to this format | Medium | Existing Zod schemas in `scoring/schemas.ts` must serialize to JSON Schema for vLLM's `response_format` param |
| CLI `--backend ollama\|vllm` flag | User selects backend at invocation time. Default remains `ollama` to preserve offline-first guarantee | Low | Extends Commander config in `cli.ts`; routes to correct ChatFn factory |
| Concurrent pipeline runner | Process 10-20 opportunities simultaneously instead of sequentially. This is the throughput multiplier | High | Wraps or replaces the `for (const triage of processable)` loop in `pipeline-runner.ts`; must integrate with existing triage sorting, checkpoint, and archive logic |
| Semaphore-bounded concurrency | Must limit parallel LLM calls to avoid overwhelming vLLM server. Each opportunity = 3 concurrent lens calls, so N opportunities = 3N requests | Medium | New concurrency primitive; interacts with existing `callWithResilience` retry wrapper |
| Concurrent-safe checkpoint system | Current checkpoint writes synchronously after each opportunity. With parallel execution, multiple completions may arrive simultaneously | Medium | Extends existing `checkpoint.ts` -- needs atomic writes or a write queue to prevent data races |
| Backend health check | Verify vLLM server is reachable and model is loaded before starting the pipeline (analogous to existing `checkOllama()`) | Low | Mirrors `infra/ollama.ts` pattern; vLLM exposes `/health` and `/v1/models` endpoints |
| Graceful fallback to sequential | If vLLM backend is unavailable or errors exceed threshold, degrade to sequential processing or fail early with clear message | Low | Reuses existing three-tier resilience pattern (`callWithResilience`) |

## Differentiators

Features that add significant value beyond the minimum viable milestone.

| Feature | Value Proposition | Complexity | Dependencies on Existing |
|---------|-------------------|------------|--------------------------|
| Ephemeral H100 provisioning | Spin up a cloud GPU, run the pipeline, tear it down automatically. No idle GPU costs. Target: <$10 per Ford-sized run | High | New infrastructure layer; no existing equivalent. Interacts with health check to gate pipeline start |
| Auto-teardown after pipeline completion | GPU pod is terminated when pipeline finishes, preventing cost overrun from forgotten instances | Medium | Needs lifecycle hooks in pipeline-runner; could use process exit handler or explicit teardown call |
| Progress dashboard for concurrent runs | With 20 simultaneous opportunities, sequential log lines become unreadable. Need aggregated progress (e.g., "47/339 scored, 3 errors, ETA 12min") | Medium | Extends existing Pino logging; could use a simple interval-based summary reporter |
| Cost tracking per run | Track GPU time consumed, estimate cost based on provider rate, include in pipeline result | Low | New field in `PipelineResult`; requires tracking wallclock time of GPU provisioning |
| Adaptive concurrency | Start with N=5, measure vLLM response times, ramp up to N=20 if server handles it. Prevents overloading a cold server | Medium | Enhancement to semaphore; no existing code to build on |
| Model warm-up requests | Send a few throwaway requests to vLLM after server startup to prime KV cache and trigger compilation. Reduces first-batch latency | Low | New pre-pipeline step; vLLM benefits from JIT compilation on first requests |
| Dual-backend comparison mode | Run same opportunity through both Ollama and vLLM, diff the scores. Validates cloud backend produces equivalent results | Medium | Uses existing ChatFn injection; compares `ScoringResult` objects |

## Anti-Features

Features to explicitly NOT build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Cloud-only mode | PROJECT.md mandates local Ollama always works. Cloud is opt-in acceleration | Keep `--backend ollama` as default; vLLM is additive |
| Multi-GPU tensor parallelism | Qwen3 30B fits on a single H100 80GB. Multi-GPU adds deployment complexity for no benefit at this model size | Use single H100; revisit only if moving to 70B+ models |
| Custom vLLM Docker image | RunPod/Modal have pre-built vLLM templates with Qwen support. Building custom images adds maintenance burden | Use provider's vLLM template; configure via environment variables |
| Streaming token output | Current pipeline parses complete JSON responses. Streaming adds complexity to JSON schema validation | Keep `stream: false`; vLLM returns complete responses just like Ollama |
| Persistent GPU server | Keeping an H100 running 24/7 costs ~$50-70/day. Pipeline runs take <30 min | Ephemeral: provision, run, teardown. Accept 2-5 min cold start |
| OpenAI API fallback | Adding yet another backend increases surface area. Focus is vLLM specifically | vLLM IS the OpenAI-compatible endpoint; no need for actual OpenAI |
| Serverless GPU (e.g., RunPod Serverless) | Serverless adds cold start per request (up to 60s), model loading overhead, and per-request pricing that is worse for batch workloads | Use a dedicated pod for the duration of the run; serverless is for sporadic API calls, not batch inference |
| Automatic provider failover | Multi-provider orchestration is complex. Pick one provider, optimize for it | Choose RunPod or Modal; document manual fallback if provider is down |
| Prompt optimization for vLLM | Existing prompts work. Optimizing for a different tokenizer risks drift from the Ollama path | Use identical prompts; only change the transport layer |

## Feature Dependencies

```
CLI --backend flag --> Backend factory (selects ChatFn implementation)
Backend factory --> vLLM ChatFn adapter (if --backend vllm)
Backend factory --> Ollama ChatFn (if --backend ollama, existing code)

vLLM ChatFn adapter --> JSON schema translation (Zod --> response_format)
vLLM ChatFn adapter --> Backend health check (verify before pipeline)

Concurrent pipeline runner --> Semaphore-bounded concurrency
Concurrent pipeline runner --> Concurrent-safe checkpoint
Concurrent pipeline runner --> Existing triage sorting (Tier 1 first)
Concurrent pipeline runner --> Existing callWithResilience (per-opportunity)
Concurrent pipeline runner --> Existing archiveAndReset (periodic flush)

Ephemeral provisioning --> Backend health check (wait for ready)
Ephemeral provisioning --> Auto-teardown (pipeline complete hook)
Ephemeral provisioning --> Cost tracking (GPU-hours consumed)

Progress dashboard --> Concurrent pipeline runner (needs concurrent state)
Adaptive concurrency --> Semaphore (dynamically resize)
Model warm-up --> Backend health check (extends it with priming requests)
```

## Critical Implementation Notes

### vLLM API Translation

The existing Ollama API uses:
```typescript
// Ollama format (current)
{ model, messages, stream: false, format: zodSchema, options: { temperature: 0 } }
```

vLLM's OpenAI-compatible API uses:
```typescript
// vLLM format (target)
{ model, messages, stream: false, temperature: 0,
  response_format: { type: "json_schema", json_schema: { name: "scoring", schema: jsonSchema } } }
```

The translation is mechanical: extract JSON schema from Zod via `zodToJsonSchema()`, wrap in `response_format`. The `guided_json` extra parameter (older vLLM style) is being deprecated in favor of standard `response_format`.

**Confidence:** HIGH -- vLLM docs explicitly document `response_format` with `json_schema` type as of v0.8.5+.

### Concurrency Model

Current pipeline: sequential `for` loop, 1 opportunity at a time, 3 parallel lens calls per opportunity.

Target: N concurrent opportunities, each with 3 parallel lens calls = 3N concurrent vLLM requests.

With N=15 and Qwen3-30B on a single H100:
- 45 concurrent requests hitting vLLM's continuous batching engine
- vLLM handles this internally via PagedAttention and dynamic batching
- H100 80GB can hold Qwen3-30B (~60GB at FP16, ~17GB at Q4) with ample KV cache headroom
- Expected throughput: ~2,300 tok/s aggregate (based on gpustack.ai benchmarks for Qwen3-32B on H100)

**Confidence:** MEDIUM -- benchmarks are for similar but not identical models/configs.

### Cloud Provider Economics

For a 339-opportunity Ford run at <30 min:
- RunPod H100 SXM: $2.69/hr = ~$1.35 per 30-min run
- Modal H100: $2.16/hr = ~$1.08 per 30-min run
- Cold start (model loading): 2-5 min for 30B model from provider's cache
- Total cost including cold start: $2-4 per run (well under $10 target)

**Confidence:** MEDIUM -- pricing verified via provider websites as of 2026; actual cold start depends on model caching.

## MVP Recommendation

**Phase 1: vLLM Client Adapter** (table stakes, lowest risk)
1. vLLM ChatFn adapter implementing existing `ChatFn` interface
2. JSON schema translation (Zod to `response_format`)
3. CLI `--backend` flag with backend factory
4. Backend health check
5. Integration tests comparing vLLM vs Ollama output on a handful of opportunities

**Phase 2: Concurrent Pipeline Runner** (table stakes, highest complexity)
1. Semaphore-bounded concurrent scoring (start with N=10)
2. Concurrent-safe checkpoint system
3. Progress reporting for parallel runs
4. Preserve tier-priority ordering (Tier 1 starts first, but all tiers run concurrently)

**Phase 3: Cloud Infrastructure** (differentiator, highest value)
1. Ephemeral H100 provisioning via RunPod or Modal API
2. Auto-teardown after pipeline completion
3. Cost tracking per run
4. End-to-end integration test: provision, score Ford dataset, teardown

**Defer:**
- Adaptive concurrency: Optimize after measuring real vLLM throughput at N=10-20
- Dual-backend comparison: Nice for validation, but manual spot-checking suffices
- Model warm-up: Only matters if cold start latency is a real problem in practice

## Sources

- [vLLM Structured Outputs docs](https://docs.vllm.ai/en/latest/features/structured_outputs/) -- response_format with json_schema (HIGH confidence)
- [vLLM OpenAI-Compatible Server docs](https://docs.vllm.ai/en/latest/serving/openai_compatible_server/) -- API compatibility (HIGH confidence)
- [Qwen3-32B H100 benchmarks (gpustack.ai)](https://docs.gpustack.ai/2.0/performance-lab/qwen3-32b/h100/) -- throughput numbers (MEDIUM confidence)
- [RunPod Pricing](https://www.runpod.io/pricing) -- H100 cost per hour (HIGH confidence)
- [H100 Rental Price Comparison 2026](https://intuitionlabs.ai/articles/h100-rental-prices-cloud-comparison) -- multi-provider pricing (MEDIUM confidence)
- [RunPod vLLM Serverless docs](https://docs.runpod.io/serverless/vllm/get-started) -- deployment patterns (MEDIUM confidence)
- [RunPod Serverless vs Pods comparison](https://www.runpod.io/articles/comparison/serverless-gpu-deployment-vs-pods) -- why pods for batch (MEDIUM confidence)
- [p-queue (npm)](https://www.npmjs.com/package/p-queue) -- concurrency control library (HIGH confidence)
- [Vercel async-sema](https://github.com/vercel/async-sema) -- lightweight semaphore (HIGH confidence)
- [vLLM v0.6.0 performance update](https://blog.vllm.ai/2024/09/05/perf-update.html) -- throughput improvements (MEDIUM confidence)
