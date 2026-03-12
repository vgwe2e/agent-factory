# Domain Pitfalls: v1.1 Cloud-Accelerated Scoring

**Domain:** Adding cloud backend, concurrent pipeline, and ephemeral GPU provisioning to existing offline-first LLM scoring engine
**Researched:** 2026-03-11
**Focus:** Integration pitfalls when adding these features to an existing working v1.0 system

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or significant cost overruns.

### Pitfall 1: Concurrent Checkpoint Corruption

**What goes wrong:** The v1.0 checkpoint system (`saveCheckpoint` in `infra/checkpoint.ts`) uses synchronous `writeFileSync` to a single `.checkpoint.json` file. When 10-20 opportunities score concurrently via `Promise.all` or semaphore-bounded parallelism, multiple completions trigger `checkpoint.entries.push()` + `saveCheckpoint()` nearly simultaneously. Two concurrent pushes to the same in-memory array, followed by two writes, can lose entries -- the second write overwrites the first's entry because both read the same pre-push state.
**Why it happens:** The v1.0 `for` loop in `pipeline-runner.ts` (line 196) is sequential -- each `scoreOneOpportunity` completes before the next starts. Developers converting this to concurrent execution often keep the same checkpoint logic without realizing the shared mutable state (`checkpoint.entries` array, `allScoredResults` array, `scoredCount`/`promotedCount` counters, and the `context-tracker` state via `addResult`/`addError`) is no longer safe.
**Consequences:** Lost checkpoint entries mean a crashed concurrent run cannot resume correctly. Opportunities get re-scored on restart, wasting cloud GPU time and money. Worse, `allScoredResults` may have duplicate or missing entries, corrupting the final report.
**Prevention:** (1) Gate all checkpoint writes through a single async mutex -- acquire lock, push entry, write file, release lock. (2) Use append-only JSONL format instead of rewriting the entire JSON on each save. (3) Collect results via a concurrent-safe collector (e.g., each worker returns its result, main loop appends sequentially after await). (4) Move `scoredCount`/`promotedCount` to be derived from results array length, not incremented independently.
**Detection:** Run 20 concurrent mock scorings in a test. Verify checkpoint entry count matches exactly 20. Run twice with process kill at entry 10 -- verify resume skips exactly 10.

### Pitfall 2: Orphaned Cloud GPU Instance Burning Money

**What goes wrong:** The pipeline provisions an H100 instance, begins scoring, then crashes mid-run (network timeout, unhandled rejection, SIGTERM). The teardown code never executes. The H100 continues running at $2-4/hour. Developer does not notice for hours or days.
**Why it happens:** Teardown is typically placed in a `finally` block or shutdown handler, but: (1) `process.exit()` does not run `finally` blocks. (2) Unhandled promise rejections in Node.js can terminate without cleanup. (3) SIGKILL cannot be caught. (4) Network partitions mean the local process dies but the remote instance lives.
**Consequences:** A single forgotten H100 instance costs $48-96/day. Over a weekend: $150-300 for zero work. The $10/run budget target becomes $150+ from a single failure.
**Prevention:** (1) **Defense in depth:** Set a hard auto-terminate timer on the cloud instance itself at provision time (e.g., max 2 hours TTL via RunPod's pod-level timeout or a cron job inside the container). (2) Register `process.on('SIGTERM')`, `process.on('SIGINT')`, `process.on('uncaughtException')`, and `process.on('unhandledRejection')` handlers that all call teardown. (3) After the pipeline exits (success or failure), run a separate verification step that lists active instances and terminates any matching the run ID. (4) Log the instance ID prominently at startup so manual cleanup is possible. (5) Set a spending alert or hard budget cap on the cloud provider account.
**Detection:** Add a post-run "orphan check" that queries the cloud API for running instances. If any exist after pipeline completion, log a CRITICAL warning and attempt termination.

### Pitfall 3: vLLM Guided JSON Schema Incompatibility

**What goes wrong:** The v1.0 system uses Ollama's `format` parameter for structured output (the `ChatFn` signature passes `format: Record<string, unknown>`). The developer assumes vLLM's OpenAI-compatible API handles the same JSON schemas identically. It does not. vLLM's guided decoding backend (xgrammar by default) rejects certain schema features with "The provided JSON schema contains features not supported by xgrammar." The pipeline fails on the first scoring call.
**Why it happens:** Ollama and vLLM use completely different structured output enforcement mechanisms. Ollama uses its own constraint engine. vLLM has switched between multiple backends (outlines, xgrammar) across versions, with each supporting different JSON schema subsets. Features like `additionalProperties`, certain `enum` types, nested `$ref`, and complex `anyOf`/`oneOf` patterns may work in Ollama but fail in vLLM's xgrammar backend. This is a well-documented issue (vllm-project/vllm#15236) affecting versions through v0.8.x.
**Consequences:** The vLLM backend appears to work during basic testing but fails on specific scoring schemas. If not caught early, the team discovers this after provisioning a cloud GPU and running the full pipeline.
**Prevention:** (1) Extract all JSON schemas used in scoring prompts into a shared test fixture. (2) Write an integration test that sends each schema to vLLM's `/v1/chat/completions` with `response_format: { type: "json_schema", json_schema: { schema } }` and verifies acceptance. (3) Simplify schemas to avoid unsupported features: flatten nested refs, avoid `additionalProperties: false` if problematic, use explicit property lists. (4) If xgrammar rejects a schema, fall back to `--guided-decoding-backend outlines` on the vLLM server. (5) Consider using `response_format: { type: "json_object" }` (unguided JSON) with Zod validation as a simpler alternative that works identically on both backends.
**Detection:** Run the schema compatibility test as a pre-flight check before every cloud run. If any schema fails, abort before provisioning the GPU.

### Pitfall 4: Backend Behavioral Divergence Producing Different Scores

**What goes wrong:** The same prompt + model produces meaningfully different scores on Ollama vs vLLM. A Ford evaluation scored locally gives composite 0.72 for an opportunity; the same evaluation on vLLM gives 0.58. Results are not reproducible across backends.
**Why it happens:** (1) Ollama and vLLM use different default sampling parameters (temperature, top_p, repetition_penalty). (2) Different quantization: Ollama may serve Q4_K_M while vLLM serves the full-precision or GPTQ model. (3) vLLM's guided decoding constrains token probabilities differently than Ollama's format enforcement, subtly biasing outputs. (4) Different chat template application -- Ollama applies templates automatically while vLLM requires explicit `--chat-template` configuration. (5) Prompt formatting differences in how system/user messages are concatenated.
**Consequences:** Users cannot trust that "the same engine" produces "the same results" regardless of backend. Cloud results and local results are incomparable. Regression testing becomes meaningless.
**Prevention:** (1) Pin explicit sampling parameters in the `ChatFn` adapter: `temperature: 0.1, top_p: 0.9` on every call, for both backends. (2) Run a 10-opportunity golden set through both backends and compare score distributions. Accept if mean absolute difference is under 0.05 per lens. (3) Ensure the same model weights are used (same Qwen version, same quantization level where possible). (4) Verify chat template application produces identical prompt strings -- log the full prompt on both backends and diff. (5) Document expected variance and set an acceptable tolerance band.
**Detection:** Golden test suite: 10 manually-scored opportunities run through both backends. Flag if any lens score diverges by more than 0.1.

### Pitfall 5: Semaphore Starvation from Slow or Stuck Requests

**What goes wrong:** With a semaphore of 10-20, one stuck vLLM request (network hang, model OOM, infinite generation loop) holds a semaphore slot forever. Over time, multiple slots get stuck. Throughput drops to zero while the semaphore is fully acquired by zombie requests.
**Why it happens:** vLLM can hang under certain conditions: large output with guided decoding (documented in vllm-project/vllm#14151 -- "Structured output requests can hang the server"), GPU OOM causing the server to become unresponsive, or network timeout not configured on the client side. Node.js `fetch` has no default timeout.
**Consequences:** The pipeline appears to be running (no crash, no error) but makes zero progress. The cloud GPU burns money while producing nothing. The developer checks in the morning to find 15 of 20 semaphore slots stuck.
**Prevention:** (1) Set an explicit per-request timeout on every vLLM call (120s for scoring, 30s for triage). Use `AbortController` with `setTimeout`. (2) On timeout, release the semaphore slot, log the failure, and move the opportunity to the retry/skip queue. (3) Implement a "circuit breaker": if 3 consecutive requests timeout, pause all new requests for 30s and health-check the vLLM server. (4) Monitor active semaphore count and elapsed time per slot -- if any slot exceeds 3x median duration, force-abort it.
**Detection:** Log semaphore acquire/release events with timestamps. Alert if any slot is held for more than 5 minutes.

---

## Moderate Pitfalls

### Pitfall 6: ChatFn Interface Too Narrow for Backend Differences

**What goes wrong:** The existing `ChatFn` type (`(messages, format) => Promise<ChatResult>`) does not accommodate vLLM-specific needs: different structured output parameters (`response_format` vs `format`), model selection per request, streaming vs non-streaming, or passing `extra_body` parameters.
**Prevention:** Extend the interface before building the vLLM adapter. Add an optional `options` bag: `{ model?: string, responseFormat?: ResponseFormat, timeout?: number, signal?: AbortSignal }`. Keep backward compatibility -- Ollama adapter ignores fields it does not need. Do not fork the interface into two separate types.

### Pitfall 7: vLLM Server Configuration Drift

**What goes wrong:** The vLLM server is provisioned with default settings. It works for small tests but fails at scale: `--max-model-len` is too low for long prompts, `--gpu-memory-utilization` is too aggressive causing OOM, guided decoding backend is not specified (defaults change between versions), or `--max-num-seqs` limits concurrent request throughput.
**Prevention:** Pin a complete vLLM launch command in the provisioning script with every critical parameter explicitly set: `--model`, `--max-model-len 8192`, `--gpu-memory-utilization 0.90`, `--guided-decoding-backend xgrammar`, `--max-num-seqs 32`, `--dtype auto`. Version-pin vLLM itself (`pip install vllm==0.8.x`). Test the exact launch command locally or in CI before using in production.

### Pitfall 8: Network Latency Surprise with Large Payloads

**What goes wrong:** Each scoring call includes knowledge base context, company context, and opportunity details. With 20 concurrent calls, the total payload throughput exceeds expectations. Response payloads with long reasoning chains add up. Network becomes the bottleneck instead of GPU inference.
**Prevention:** (1) Measure payload sizes during development. If average request exceeds 8KB, consider compressing knowledge context or sending it once at session start. (2) Use HTTP keep-alive connections (vLLM supports this). (3) Deploy the client as close to the GPU as possible (same cloud region). (4) Monitor tokens/second throughput -- if well below H100 capability (~100+ tokens/s for Qwen 30B), the bottleneck is not the GPU.

### Pitfall 9: Concurrent Git Commits from Parallel Workers

**What goes wrong:** The v1.0 pipeline calls `autoCommitEvaluation` after scoring. If the concurrent pipeline writes evaluation files in parallel and triggers git operations, concurrent `git add` / `git commit` commands corrupt the git index.
**Prevention:** Remove per-batch git commits from the concurrent path entirely. Write all files to disk freely (file writes to different paths are safe). Run a single `autoCommitEvaluation` call only after the entire concurrent scoring phase completes. The existing post-pipeline commit pattern at line 304 is correct -- just ensure no intermediate commits happen during concurrent execution.

### Pitfall 10: Context Tracker State Not Designed for Concurrency

**What goes wrong:** The `context-tracker.ts` module (`createContext`, `addResult`, `addError`, `archiveAndReset`) maintains in-memory arrays. Concurrent calls to `addResult` and `archiveAndReset` from parallel workers can interleave, losing results or archiving partial state.
**Prevention:** (1) Each concurrent worker should accumulate its own results independently (local array). (2) After all workers complete, merge results into the context tracker sequentially. (3) `archiveAndReset` should only be called from the main orchestration loop, never from inside a worker. (4) Alternatively, replace the context tracker with a simple concurrent-safe results collector that does not need archiving during the run (cloud runs are fast enough that memory accumulation is not a concern for 30 minutes vs 17 hours).

---

## Minor Pitfalls

### Pitfall 11: Forgetting to Health-Check vLLM Before Scoring

**What goes wrong:** Pipeline provisions GPU, starts scoring immediately. vLLM is still loading the model (can take 30-90 seconds for large models). First N requests fail with connection refused or 503.
**Prevention:** After provisioning, poll vLLM's `/health` or `/v1/models` endpoint with exponential backoff until it returns 200. Only then begin scoring. Set a max wait of 5 minutes -- if health check never passes, teardown and report error.

### Pitfall 12: Mixing Up `guided_json` (Deprecated) and `response_format` (Current)

**What goes wrong:** Developer uses vLLM's older `extra_body: { guided_json: schema }` API pattern from outdated tutorials. This was deprecated in v0.12.0 in favor of `response_format: { type: "json_schema", json_schema: { name, schema } }`. The old API may silently fail or be removed.
**Prevention:** Use only the `response_format` parameter for structured output. Pin vLLM version and verify the API contract in integration tests.

### Pitfall 13: RunPod Volume Storage Costs After Pod Termination

**What goes wrong:** Cloud provisioning creates a RunPod pod with a persistent volume for model weights. The pod terminates after the run, but the volume persists at $0.20/GB/month. A 70GB model volume costs $14/month sitting idle.
**Prevention:** Use RunPod serverless (no persistent volumes) or explicitly delete volumes in the teardown script. If using pod-based deployment, tag volumes for deletion and verify cleanup.

### Pitfall 14: Error Handling Asymmetry Between Backends

**What goes wrong:** Ollama returns errors as HTTP 500 with a JSON body `{ error: "message" }`. vLLM returns errors as HTTP 400/422 with OpenAI-format `{ error: { message, type, code } }`. The unified `ChatFn` adapter handles one format but not the other, causing unhandled exceptions.
**Prevention:** The vLLM adapter must normalize all error responses into the existing `ChatResult` format (`{ success: false, error: string }`). Test with intentional bad inputs (malformed prompt, invalid schema, oversized context) on both backends.

### Pitfall 15: Assuming Cloud Model Matches Local Model

**What goes wrong:** Local Ollama runs `qwen3:30b` (Ollama's quantized variant). vLLM runs `Qwen/Qwen2.5-32B-Instruct` (HuggingFace full precision or different quantization). These are different model versions with different behaviors, but the pipeline treats them as interchangeable.
**Prevention:** Document exactly which model ID each backend uses. Include model name in the evaluation output metadata so results are traceable. Accept that cloud and local results will differ -- the goal is "comparable quality," not "identical output."

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| vLLM Client Adapter | Schema incompatibility between Ollama format and vLLM response_format (Pitfall 3) | Build schema compatibility test suite first, run against both backends before any pipeline work |
| vLLM Client Adapter | ChatFn interface too narrow (Pitfall 6) | Extend interface with options bag before implementing adapter |
| Concurrent Pipeline Runner | Checkpoint corruption from parallel writes (Pitfall 1) | Implement mutex-gated checkpoint writes; use append-only format |
| Concurrent Pipeline Runner | Context tracker race conditions (Pitfall 10) | Worker-local result accumulation, post-merge into tracker |
| Concurrent Pipeline Runner | Semaphore starvation (Pitfall 5) | Per-request timeout with AbortController, circuit breaker pattern |
| Cloud GPU Provisioning | Orphaned instance cost overrun (Pitfall 2) | Instance-level TTL at provision time, multi-layer shutdown handlers |
| Cloud GPU Provisioning | Health check before scoring (Pitfall 11) | Poll /health endpoint before starting pipeline |
| Integration Testing | Backend behavioral divergence (Pitfall 4) | Golden test suite of 10 opportunities, tolerance band of 0.05 mean absolute difference |
| Integration Testing | Error format asymmetry (Pitfall 14) | Test with intentional failures on both backends |

---

## Sources

- [vLLM Structured Outputs Documentation](https://docs.vllm.ai/en/latest/features/structured_outputs/) - Current API for response_format, guided decoding backends
- [vLLM Issue #15236: Major issues with guided generation](https://github.com/vllm-project/vllm/issues/15236) - xgrammar schema compatibility bugs, version-specific failures
- [vLLM Issue #14151: Structured output requests can hang the server](https://github.com/vllm-project/vllm/issues/14151) - Server hang risk with guided decoding
- [Ollama vs vLLM Comparison 2026](https://particula.tech/blog/ollama-vs-vllm-comparison) - Structured output capability differences, API divergence
- [Ollama Structured Output Issues](https://www.glukhov.org/post/2025/10/ollama-gpt-oss-structured-output-issues/) - Ollama-specific format enforcement limitations
- [RunPod Cloud GPU Mistakes to Avoid](https://www.runpod.io/articles/guides/cloud-gpu-mistakes-to-avoid) - Forgotten instances, cost overruns, auto-shutdown patterns
- [RunPod Reduce Cloud GPU Expenses](https://www.runpod.io/articles/guides/reduce-cloud-gpu-expenses-without-sacrificing-performance) - Budget control, instance lifecycle management
- [Vercel async-sema](https://github.com/vercel/async-sema) - TypeScript semaphore implementation for bounded concurrency
- [vLLM OpenAI-Compatible Server](https://docs.vllm.ai/en/stable/serving/openai_compatible_server/) - API parameter differences from OpenAI standard
- Existing codebase: `src/infra/checkpoint.ts`, `src/pipeline/pipeline-runner.ts` - Current sequential architecture that must be adapted
