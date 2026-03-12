# Project Research Summary

**Project:** Aera Skill Feasibility Engine v1.1 -- Cloud-Accelerated Scoring
**Domain:** Cloud-accelerated LLM scoring pipeline with ephemeral GPU provisioning
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH

## Executive Summary

The v1.1 milestone adds a cloud GPU backend to the existing offline-first Aera Skill Feasibility Engine. The core problem is throughput: scoring 339 Ford opportunities takes 17 hours locally on Apple Silicon via Ollama. By routing the same scoring pipeline through vLLM on an ephemeral H100, the same workload completes in under 30 minutes for approximately $2-3 per run. The existing codebase is well-prepared for this -- the `ChatFn` dependency injection pattern means scoring logic needs zero changes. The work is purely additive: a new vLLM client adapter, a concurrent pipeline runner, and a cloud provisioner module layered on top of the untouched v1.0 code.

The recommended approach is a three-phase build: (1) vLLM client adapter implementing the existing ChatFn interface, (2) semaphore-bounded concurrent pipeline runner with safe checkpointing, (3) ephemeral H100 provisioning via RunPod Serverless with automatic teardown. Only three new npm dependencies are needed: `p-limit` for concurrency, `runpod-sdk` for cloud lifecycle, and `dotenv` for API key management. The architecture stays minimal -- raw `fetch` for the vLLM HTTP client (no `openai` SDK), the existing checkpoint system extended with a write queue, and all cloud code gated behind the `--backend vllm` flag.

The key risks are: (1) concurrent checkpoint corruption from parallel writes to shared mutable state -- prevented by serializing writes through an async queue, (2) orphaned GPU instances burning money after crashes -- prevented by defense-in-depth teardown (signal handlers, try/finally, instance-level TTL, orphan checks), and (3) vLLM structured output schema incompatibility with the existing Zod schemas -- prevented by a pre-flight schema compatibility test suite run before every cloud invocation. The STACK and ARCHITECTURE researchers agree on approach but diverge on concurrency library choice (p-limit vs async-mutex); p-limit is the right call given its zero-dependency footprint and exact fit for the "run N at a time" pattern.

## Key Findings

### Recommended Stack

The v1.0 stack (TypeScript/ESM, Zod, Commander, Pino) is unchanged. Three production dependencies are added with minimal footprint (combined ~5 transitive deps). The most important stack decision is NOT adding the `openai` npm package -- raw `fetch` handles the single POST endpoint to vLLM in ~40 lines, consistent with the existing Ollama client pattern.

**Core technologies:**
- **Raw `fetch` for vLLM**: OpenAI-compatible `/v1/chat/completions` endpoint -- avoids 130+ transitive deps from `openai` SDK
- **p-limit ^7.0**: Semaphore-bounded concurrency -- zero deps, pure ESM, right-sized for "run N promises at a time"
- **runpod-sdk ^1.1.2**: Serverless endpoint lifecycle (create, health poll, teardown) -- official typed SDK
- **dotenv ^16.4**: API key management -- keeps secrets out of CLI args and shell history

**Critical version requirement:** vLLM >= 0.8.5 for `response_format` with `json_schema` type (the current structured output API).

### Expected Features

**Must have (table stakes):**
- vLLM ChatFn adapter implementing existing `ChatFn` interface
- JSON schema translation from Ollama `format` to vLLM `response_format`
- CLI `--backend ollama|vllm` flag (default remains `ollama`)
- Concurrent pipeline runner with semaphore-bounded concurrency (10-20 simultaneous)
- Concurrent-safe checkpoint writes
- Backend health check before scoring starts
- Graceful fallback on backend failure

**Should have (differentiators):**
- Ephemeral H100 provisioning via RunPod Serverless (auto-scale to zero)
- Auto-teardown after pipeline completion (defense against cost overrun)
- Progress dashboard for concurrent runs (aggregated status, not per-opportunity logs)
- Cost tracking per run (GPU-hours consumed, estimated cost)

**Defer (v2+):**
- Adaptive concurrency (dynamically resize semaphore based on throughput)
- Dual-backend comparison mode (manual spot-checking suffices for validation)
- Model warm-up requests (only matters if cold start latency is a real problem)
- Multi-GPU tensor parallelism (Qwen 30B fits on a single H100)

### Architecture Approach

The architecture is an adapter pattern at the ChatFn boundary with a factory that wires the correct backend based on CLI flags. The existing sequential pipeline remains the default (Ollama path). The vLLM path branches to a concurrent runner that wraps `scoreOneOpportunity` calls in a semaphore. Cloud provisioning is a separate infrastructure layer that creates/destroys RunPod Serverless endpoints. All scoring, triage, simulation, and output code is unchanged.

**Major components:**
1. **VllmClient** (`src/infra/vllm-client.ts`) -- translates ChatFn calls to OpenAI-compatible HTTP; maps Ollama format param to vLLM response_format
2. **BackendFactory** (`src/infra/backend-factory.ts`) -- creates ChatFn + concurrency config from `--backend` flag; wires provisioner for cloud path
3. **ConcurrentPipelineRunner** (`src/pipeline/concurrent-runner.ts`) -- semaphore-bounded parallel scoring; uses p-limit to cap concurrent opportunities
4. **CloudProvisioner** (`src/infra/cloud-provisioner.ts`) -- RunPod Serverless endpoint lifecycle: create, health poll, teardown with signal handlers
5. **ConcurrentCheckpointWriter** (extends `src/infra/checkpoint.ts`) -- async write queue serializing concurrent checkpoint updates

### Critical Pitfalls

1. **Concurrent checkpoint corruption** -- Multiple parallel scorers writing to shared checkpoint array and file simultaneously. Prevent with async write queue that serializes all checkpoint mutations. Test by running 20 concurrent mock scorings and verifying exact entry count.

2. **Orphaned GPU instances** -- Crashed pipeline leaves H100 running at $2-4/hr. Prevent with defense-in-depth: instance-level TTL at provision time, SIGINT/SIGTERM/uncaughtException handlers, try/finally teardown, post-run orphan check, and spending alerts on the cloud account.

3. **vLLM structured output schema incompatibility** -- vLLM's xgrammar backend rejects certain JSON schema features that Ollama accepts. Prevent with pre-flight schema compatibility test against vLLM before provisioning GPU. Fall back to `--guided-decoding-backend outlines` if xgrammar fails.

4. **Backend behavioral divergence** -- Same prompt produces different scores on Ollama vs vLLM due to quantization, sampling, and template differences. Prevent with pinned sampling parameters, golden test suite of 10 opportunities, and documented tolerance band (0.05 mean absolute difference per lens).

5. **Semaphore starvation from stuck requests** -- vLLM can hang under guided decoding. Prevent with per-request AbortController timeout (120s for scoring), circuit breaker pattern (3 consecutive timeouts = pause and health-check), and semaphore slot monitoring.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: vLLM Client Adapter
**Rationale:** Foundation layer with zero dependencies on other new code. Can be unit-tested against a mock HTTP server without any cloud infrastructure. Validates the critical schema translation (Ollama format to vLLM response_format) before committing to cloud spend.
**Delivers:** A drop-in ChatFn implementation for vLLM, CLI `--backend` flag, backend factory, health check.
**Addresses:** vLLM ChatFn adapter, JSON schema translation, CLI flag, backend health check (table stakes).
**Avoids:** Schema incompatibility (Pitfall 3) caught early by pre-flight tests; ChatFn interface issues (Pitfall 6) resolved before building on top of it.

### Phase 2: Concurrent Pipeline Runner
**Rationale:** Can be developed and tested in parallel with Phase 1 using mock ChatFn. No cloud dependency -- concurrency logic is backend-agnostic. This is the highest-complexity table stakes feature and benefits from isolated development.
**Delivers:** Semaphore-bounded concurrent scoring, concurrent-safe checkpointing, progress reporting for parallel runs.
**Uses:** p-limit for semaphore, existing scoreOneOpportunity unchanged.
**Implements:** ConcurrentPipelineRunner, ConcurrentCheckpointWriter.
**Avoids:** Checkpoint corruption (Pitfall 1), context tracker races (Pitfall 10), semaphore starvation (Pitfall 5), concurrent git commits (Pitfall 9).

### Phase 3: Cloud Infrastructure
**Rationale:** Depends on Phase 1 (needs vLLM client to test against) and Phase 2 (needs concurrent runner for throughput). Highest-value differentiator -- transforms the tool from "17 hours local" to "30 minutes for $3."
**Delivers:** Ephemeral H100 provisioning via RunPod Serverless, auto-teardown, cost tracking.
**Uses:** runpod-sdk, dotenv.
**Implements:** CloudProvisioner with signal handler teardown.
**Avoids:** Orphaned instances (Pitfall 2), volume storage costs (Pitfall 13).

### Phase 4: Integration and Validation
**Rationale:** End-to-end validation requires all three previous phases. Runs the Ford 339-opportunity dataset through the full cloud path and validates results, timing, and cost.
**Delivers:** Proven end-to-end pipeline, golden test suite for backend comparison, documented performance characteristics.
**Addresses:** Backend behavioral divergence (Pitfall 4), error handling asymmetry (Pitfall 14), model version documentation (Pitfall 15).

### Phase Ordering Rationale

- Phases 1 and 2 can be developed in parallel (no dependency between them), but are listed sequentially for roadmap clarity. The concurrent runner works with any ChatFn, including mock and Ollama.
- Phase 3 must follow Phase 1 because the provisioner creates the infrastructure that the vLLM client consumes.
- Phase 4 is explicitly separated from Phase 3 because integration testing against real cloud GPUs is a distinct activity from building the provisioner. It requires budget, cloud credentials, and acceptance criteria.
- This ordering avoids the most expensive pitfalls early: schema incompatibility is caught in Phase 1 (before any cloud spend), checkpoint corruption is caught in Phase 2 (before any concurrent cloud runs), and orphaned instances are guarded in Phase 3 (before the full-scale validation run).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (vLLM Client Adapter):** Needs validation of exact JSON schema features supported by vLLM's xgrammar backend against the project's actual Zod scoring schemas. Known issues documented in vllm-project/vllm#15236.
- **Phase 3 (Cloud Infrastructure):** RunPod Serverless API specifics (endpoint creation fields, proxy URL format, auto-scale configuration) need validation against current docs. The SDK is at v1.1.2 with a beta v1.2.0 -- API surface may shift. Also: STACK.md recommends RunPod Serverless while FEATURES.md lists "Serverless GPU" as an anti-feature (recommending dedicated pods for batch). This contradiction needs resolution -- STACK.md's serverless recommendation is better-reasoned for the ephemeral use case given FlashBoot cold starts of 10-15s.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Concurrent Pipeline Runner):** Well-documented concurrency patterns. p-limit is a battle-tested library. Async write queue for checkpointing is a standard pattern.
- **Phase 4 (Integration and Validation):** Standard end-to-end testing. No novel technical challenges -- just execution.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Minimal additions (3 deps), all verified on npm, vLLM API well-documented |
| Features | MEDIUM-HIGH | Table stakes are clear and well-scoped; cloud provider economics verified but pricing may change |
| Architecture | HIGH | Adapter pattern is proven, ChatFn DI already exists, component boundaries are clean |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls well-documented with specific vLLM issue references; some edge cases (xgrammar compatibility) need runtime validation |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Serverless vs Pods contradiction:** STACK.md recommends RunPod Serverless; FEATURES.md lists serverless as an anti-feature. Resolution: use Serverless -- the cold-start concern is mitigated by RunPod's FlashBoot (10-15s) and the batch nature of the workload means cold start is amortized across 339 opportunities.
- **Concurrency library disagreement:** STACK.md recommends p-limit; ARCHITECTURE.md code samples use async-mutex Semaphore. Resolution: use p-limit -- zero transitive dependencies, simpler API, naturally degrades to sequential at concurrency=1.
- **Exact vLLM schema compatibility:** Cannot be validated without running the actual scoring schemas against a vLLM instance. Must be tested empirically in Phase 1 before committing to the cloud path.
- **RunPod Serverless API details:** SDK is relatively new (v1.1.2). Exact endpoint creation parameters, cold start behavior with Qwen models, and proxy URL format need validation during Phase 3 implementation.
- **Model version alignment:** Ollama runs `qwen3:30b` (quantized); vLLM would run `Qwen/Qwen2.5-32B-Instruct` (potentially different version). Need to pin compatible versions and document expected score variance.

## Sources

### Primary (HIGH confidence)
- [vLLM OpenAI-Compatible Server docs](https://docs.vllm.ai/en/stable/serving/openai_compatible_server/) -- API contract, response_format
- [vLLM Structured Outputs docs](https://docs.vllm.ai/en/latest/features/structured_outputs/) -- json_schema support since v0.8.5
- [Qwen vLLM Deployment](https://qwen.readthedocs.io/en/latest/deployment/vllm.html) -- official Qwen + vLLM documentation
- [p-limit npm](https://www.npmjs.com/package/p-limit) -- concurrency library API
- [RunPod Pricing](https://www.runpod.io/pricing) -- H100 serverless rates

### Secondary (MEDIUM confidence)
- [RunPod Serverless vLLM docs](https://docs.runpod.io/serverless/vllm/get-started) -- deployment patterns
- [RunPod JS SDK](https://docs.runpod.io/sdks/javascript/overview) -- programmatic endpoint management
- [Qwen3-32B H100 benchmarks (gpustack.ai)](https://docs.gpustack.ai/2.0/performance-lab/qwen3-32b/h100/) -- throughput estimates
- [H100 Rental Prices 2026](https://intuitionlabs.ai/articles/h100-rental-prices-cloud-comparison) -- multi-provider comparison
- [vLLM Issue #15236](https://github.com/vllm-project/vllm/issues/15236) -- xgrammar schema compatibility bugs
- [vLLM Issue #14151](https://github.com/vllm-project/vllm/issues/14151) -- structured output hang risk

### Tertiary (LOW confidence)
- [RunPod Cloud GPU Mistakes to Avoid](https://www.runpod.io/articles/guides/cloud-gpu-mistakes-to-avoid) -- operational guidance (vendor content)
- [Ollama vs vLLM Comparison 2026](https://www.glukhov.org/post/2025/11/hosting-llms-ollama-localai-jan-lmstudio-vllm-comparison/) -- independent comparison

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
