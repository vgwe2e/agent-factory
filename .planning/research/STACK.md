# Technology Stack: v1.1 Cloud-Accelerated Scoring

**Project:** Aera Skill Feasibility Engine - Cloud Backend Milestone
**Researched:** 2026-03-11
**Overall confidence:** MEDIUM-HIGH

## Existing Stack (DO NOT CHANGE)

Already validated in v1.0 -- listed for reference only:

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript (ESM strict) | ^5.7.0 | Core language |
| Zod | ^3.24.0 | Schema validation |
| Commander | ^13.0.0 | CLI framework |
| Pino | ^10.3.1 | Structured logging |
| js-yaml | ^4.1.1 | YAML output |
| tsx | ^4.19.0 | Dev runner |
| Node.js built-in test runner | N/A | Testing (412 tests) |
| Raw `fetch` | Built-in | HTTP client (Ollama) |

## New Stack Additions

### 1. vLLM Client Adapter -- NO new HTTP dependency

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Raw `fetch` (built-in) | Node.js 22+ | HTTP calls to vLLM OpenAI-compatible API | The existing Ollama client already uses raw `fetch`. vLLM exposes an OpenAI-compatible `/v1/chat/completions` endpoint. Building a thin adapter with `fetch` avoids adding the `openai` npm package (130+ transitive deps) for what amounts to a single POST endpoint. The ChatFn interface already abstracts the transport. |

**vLLM API contract (HIGH confidence):**
- Endpoint: `POST /v1/chat/completions`
- Structured output: `response_format: { type: "json_schema", json_schema: { name, schema } }` (supported since vLLM 0.8.5)
- This maps directly to the existing `format` parameter in `ChatFn` -- the adapter translates Ollama's `format` field to vLLM's `response_format` field
- Temperature, model, messages all map 1:1 to OpenAI chat completions schema

**Integration point:** New file `src/scoring/vllm-client.ts` implementing the same `ChatFn` type signature. The pipeline-runner selects which client based on `--backend` flag. Zero changes to scorers or simulation code.

### 2. Concurrent Pipeline Runner -- p-limit

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| p-limit | ^7.0.0 | Semaphore-bounded concurrency | Pure ESM (matches project), zero dependencies, TypeScript types included, battle-tested (Sindre Sorhus / npm ecosystem staple). Simpler API than async-sema for the use case of "run N promises concurrently." The project needs a counting semaphore to bound parallel scoring to 10-20 simultaneous opportunities against vLLM. |

**Why p-limit over alternatives:**
- **async-sema** (Vercel): Good library, but heavier API surface (rate limiting, weighted semaphores) that we don't need. p-limit's `limit(fn)` wrapper is the exact pattern needed.
- **Hand-rolled semaphore**: Tempting since it is roughly 20 lines, but p-limit handles edge cases (error propagation, queue draining) correctly. Not worth the test burden.
- **p-queue** (recommended in v1.0 research): p-queue adds priority and `.onIdle()` which are unnecessary for this use case. The concurrent runner just needs "run N at a time." p-limit is the simpler, right-sized tool.
- **No concurrency library for Ollama path**: When `--backend ollama`, concurrency stays at 1 (sequential). p-limit with concurrency=1 degrades to sequential execution naturally.

**Integration point:** New file `src/pipeline/concurrent-runner.ts`. Wraps `scoreOneOpportunity` calls in `limit()`. The existing sequential loop in `pipeline-runner.ts` remains for Ollama; concurrent runner is a parallel code path selected by backend choice.

### 3. Cloud Infrastructure -- runpod-sdk + RunPod Serverless

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| runpod-sdk | ^1.1.2 | Programmatic RunPod endpoint management | Official JS/TS SDK with typed API. Handles endpoint creation, health polling, and teardown. Serverless endpoints are the right abstraction -- they auto-scale, auto-teardown on idle, and bill per-second. |

**Why RunPod Serverless (not Pods):**

| Factor | Serverless Endpoint | On-Demand Pod |
|--------|-------------------|---------------|
| Auto-teardown | Built-in (idle timeout configurable, e.g. 15s) | Manual or scripted |
| Billing | Per-second of compute | Per-hour while running |
| Cold start | 10-15s with FlashBoot | 2-5 min (boot + model load) |
| vLLM setup | Quick Deploy template (zero config) | Manual Docker + vLLM install |
| H100 cost | ~$5.58/hr (pay only during inference) | ~$2.79/hr (pay while idle too) |
| Best for | Batch scoring with idle gaps | Continuous high-throughput |

For the use case (339 opportunities, approximately 30 min total, then done), serverless is clearly cheaper and simpler. The endpoint scales to 0 when idle -- no forgotten GPU instances burning money.

**Pricing math (HIGH confidence):**
- H100 serverless: ~$0.00155/sec = ~$5.58/hr
- Ford 339-opp run at 10-20 concurrency: estimated 20-30 min active compute
- Cost per run: ~$2-3 (well under the $10 target)
- RunPod pricing sourced from docs.runpod.io/serverless/pricing (may change)

**Why RunPod over other cloud GPU providers:**
- **Modal**: Strong competitor, but RunPod has a dedicated vLLM Quick Deploy template that eliminates all Docker/config work. Modal requires writing a Python handler.
- **Lambda Labs**: On-demand only, no serverless. Would require manual lifecycle management.
- **AWS SageMaker**: 3-5x more expensive, slower cold starts, massive SDK complexity.
- **Vast.ai**: Cheapest but unreliable for production use. Community GPUs with variable availability.

**Integration point:** New file `src/infra/cloud-provider.ts`. Handles:
1. Check for existing endpoint (idempotent via `RUNPOD_ENDPOINT_ID` env var)
2. Create serverless endpoint with vLLM Quick Deploy template + Qwen model
3. Poll health until ready
4. Return endpoint URL for vLLM client
5. Teardown after pipeline completes (or on error via `finally`)

### 4. Concurrent-Safe Checkpointing -- NO new dependency

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js `fs` + in-memory write queue | Built-in | Serialize concurrent checkpoint writes | The current checkpoint system uses synchronous `writeFileSync` which is already atomic at the OS level. For concurrent writes, we need a write queue (not a lock library). A simple async queue pattern (array + drain function) serializes writes without race conditions. No external dependency needed. |

**Current checkpoint design:**
```typescript
// Current: synchronous, single-writer
export function saveCheckpoint(outputDir: string, checkpoint: Checkpoint): void {
  writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf-8');
}
```

**Concurrent-safe design:** Wrap in an async queue that serializes writes. Multiple concurrent scorers call `enqueueCheckpointEntry()` which appends to an in-memory buffer and flushes sequentially. `loadCheckpoint` and `getCompletedNames` remain unchanged (read-only, called before concurrency starts).

### 5. Environment Configuration -- dotenv

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| dotenv | ^16.4.0 | Load RUNPOD_API_KEY from .env file | Standard approach for API keys. The project currently has zero cloud credentials. Adding dotenv keeps secrets out of CLI args and shell history. Single dependency, zero transitive deps. |

**Note on Node 22 --env-file:** The v1.0 research recommended `--env-file` over dotenv. However, `--env-file` requires passing the flag at the Node level, which complicates the `tsx` dev workflow and the compiled `dist/cli.js` entry point. dotenv loaded at CLI entry is simpler and more portable.

**Integration point:** Load at CLI entry (`cli.ts`), read `RUNPOD_API_KEY` and optional `RUNPOD_ENDPOINT_ID` (for reusing existing endpoints). Add `.env` to `.gitignore`.

## What NOT to Add

| Library | Why Not |
|---------|---------|
| `openai` npm package | 130+ transitive dependencies for a single POST endpoint. Raw `fetch` does the same thing in 40 lines. The existing codebase already uses `fetch` for Ollama -- stay consistent. |
| `langchain` / `llamaindex` | Massive abstraction layers. The ChatFn DI pattern already solves provider switching cleanly. |
| `litellm` (Python) | Wrong language. The project is TypeScript. |
| `async-sema` | Over-engineered for a counting semaphore. p-limit is simpler and sufficient. |
| `p-queue` | Priority queue semantics not needed. All opportunities are scored with equal priority. p-limit is right-sized. |
| `pulumi` / `terraform` | Infrastructure-as-code is overkill for "create one serverless endpoint, use it, tear it down." The runpod-sdk API calls are 3-4 functions total. |
| `bull` / `bullmq` | Job queue requires Redis. The concurrent runner is in-process only (single CLI run). p-limit is the right abstraction. |
| `ioredis` | No shared state needed. Single process, in-memory concurrency. |
| `proper-lockfile` | File locks are fragile. In-memory write queue is simpler and correct for single-process. |
| `ws` / WebSocket libs | vLLM streaming not needed. Non-streaming `/v1/chat/completions` returns complete JSON, matching existing Ollama pattern (`stream: false`). |
| `@vercel/ai` / AI SDK | Streaming-first, React-focused. Wrong abstraction for batch CLI processing. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| vLLM HTTP client | Raw `fetch` | `openai` npm | Unnecessary dependency weight; `fetch` already proven in codebase |
| Concurrency | p-limit ^7 | async-sema | Larger API surface than needed; p-limit is simpler |
| Concurrency | p-limit ^7 | Hand-rolled | Edge cases (error propagation, queue drain) not worth the test burden |
| Cloud provider | RunPod Serverless | RunPod Pods | Higher effective cost for batch use case; manual teardown required |
| Cloud provider | RunPod Serverless | Modal | No vLLM Quick Deploy; requires Python handler code |
| Cloud provider | RunPod Serverless | Lambda Labs | No serverless option; manual lifecycle management |
| Cloud SDK | runpod-sdk | Raw GraphQL API | SDK provides typed responses; only ~5 transitive deps vs hand-rolling GraphQL client |
| Secrets | dotenv | Node --env-file | Complicates tsx workflow; dotenv is more portable |
| Checkpoint safety | In-memory queue | `proper-lockfile` | File locks are fragile; in-memory queue correct for single-process |

## Installation

```bash
cd src

# New production dependencies (only 3 packages added)
npm install p-limit runpod-sdk dotenv

# No new dev dependencies needed
```

**Dependency impact:** +3 direct dependencies. p-limit has 0 transitive deps, dotenv has 0 transitive deps, runpod-sdk has approximately 5. Minimal footprint.

## Version Verification

| Package | Verified Version | Source | Confidence |
|---------|-----------------|--------|------------|
| p-limit | 7.3.0 (latest) | npm registry (WebSearch) | HIGH |
| runpod-sdk | 1.1.2 (latest stable) | npm registry (WebSearch) | MEDIUM -- beta 1.2.0 exists but not stable |
| dotenv | 16.4.x (latest) | npm registry (WebSearch) | HIGH |
| vLLM structured output | 0.8.5+ supports response_format json_schema | vLLM official docs | HIGH |
| RunPod H100 serverless pricing | ~$0.00155/sec | RunPod pricing docs | MEDIUM -- pricing may change |

## Key Architecture Decision: Adapter Pattern Over SDK

The most important stack decision is NOT adding the `openai` npm package. The reasoning:

1. The existing `ChatFn` type is already a perfect abstraction:
   ```typescript
   type ChatFn = (
     messages: Array<{ role: string; content: string }>,
     format: Record<string, unknown>,
   ) => Promise<ChatResult>;
   ```

2. The vLLM adapter translates this to OpenAI-compatible format:
   - `messages` maps 1:1
   - `format` (Ollama's JSON schema) maps to `response_format: { type: "json_schema", json_schema: { name: "output", schema: format } }`
   - Response `choices[0].message.content` maps to `ChatResult.content`
   - `usage.total_tokens` or timing headers map to `ChatResult.durationMs`

3. This is approximately 40 lines of code. Adding a 130+ dependency package for this is the wrong trade-off.

4. The DI pattern means zero changes to any scorer, simulation, or pipeline code -- only the CLI wiring changes to inject the right `chatFn`.

## New File Map

| File | Purpose | Dependencies |
|------|---------|-------------|
| `src/scoring/vllm-client.ts` | vLLM ChatFn adapter via raw fetch | None (built-in fetch) |
| `src/pipeline/concurrent-runner.ts` | p-limit bounded parallel scoring | p-limit |
| `src/infra/cloud-provider.ts` | RunPod endpoint lifecycle (create/health/teardown) | runpod-sdk |
| `src/infra/checkpoint.ts` (modify) | Add async write queue for concurrent safety | None new |
| `src/cli.ts` (modify) | Add --backend flag, dotenv loading, wiring | dotenv |

## Sources

- [vLLM OpenAI-Compatible Server docs](https://docs.vllm.ai/en/stable/serving/openai_compatible_server/)
- [vLLM Structured Outputs docs](https://docs.vllm.ai/en/latest/features/structured_outputs/)
- [vLLM Structured Outputs v0.8.2](https://docs.vllm.ai/en/v0.8.2/features/structured_outputs.html)
- [RunPod Serverless vLLM deployment](https://docs.runpod.io/serverless/vllm/get-started)
- [RunPod JS SDK GitHub](https://github.com/runpod/js-sdk)
- [RunPod JS SDK docs](https://docs.runpod.io/sdks/javascript/overview)
- [RunPod Pricing](https://www.runpod.io/pricing)
- [RunPod Serverless Pricing docs](https://docs.runpod.io/serverless/pricing)
- [RunPod OpenAI API compatibility](https://docs.runpod.io/serverless/vllm/openai-compatibility)
- [p-limit npm](https://www.npmjs.com/package/p-limit)
- [runpod-sdk npm](https://www.npmjs.com/package/runpod-sdk)
- [Guide to Deploying Qwen 3 with vLLM on RunPod](https://medium.com/@mshojaei77/guide-to-deploying-qwen-3-with-vllm-on-runpod-31b9da6642d0)
- [RunPod Serverless Scaling Strategy](https://www.runpod.io/blog/serverless-scaling-strategy-runpod)
- [Ollama vs vLLM comparison 2026](https://www.glukhov.org/post/2025/11/hosting-llms-ollama-localai-jan-lmstudio-vllm-comparison/)
