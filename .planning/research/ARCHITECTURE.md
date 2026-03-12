# Architecture Patterns

**Domain:** Cloud-accelerated LLM scoring with ephemeral GPU provisioning
**Researched:** 2026-03-11

## Recommended Architecture

Adapter pattern at the ChatFn boundary, semaphore-bounded concurrent pipeline runner, and a provisioner module that manages ephemeral H100 lifecycle. The existing sequential pipeline, Ollama path, and checkpoint system remain untouched -- cloud is layered on top.

```
CLI (cli.ts)
  |
  +-- --backend ollama (default)    --backend vllm
  |        |                              |
  v        v                              v
BackendFactory ---- creates ----> ChatFn adapter
  |                                       |
  |   +------- ollamaChat() <---+        |
  |   |   (existing, unchanged)          |
  |   |                                  v
  |   |                         VllmClient.chat()
  |   |                           |
  |   |                           +-> POST /v1/chat/completions
  |   |                           |   (OpenAI-compatible)
  |   |                           |
  |   |                           +-> response_format: { type: "json_schema", json_schema: {...} }
  |   |                                  (vLLM structured output)
  v   v
PipelineRunner
  |
  +-- --backend ollama: sequential for-loop (existing code path)
  |
  +-- --backend vllm: ConcurrentPipelineRunner
        |
        +-- Semaphore(concurrency=N)
        |     |
        |     +-- scoreOneOpportunity(opp, l4s, company, knowledge, vllmChatFn)
        |     +-- scoreOneOpportunity(opp, l4s, company, knowledge, vllmChatFn)
        |     +-- ... (10-20 concurrent)
        |
        +-- ConcurrentCheckpoint
              |
              +-- append-with-lock (write serialization via async queue)
```

### Infrastructure Layer (Cloud Only)

```
CLI --backend vllm
  |
  v
CloudProvisioner
  |
  +-- provision()
  |     |
  |     +-- RunPod API: create pod (H100, vLLM Docker image)
  |     +-- Poll /v1/models until ready
  |     +-- Return { baseUrl, podId }
  |
  +-- healthCheck()
  |     +-- GET /v1/models (OpenAI-compatible)
  |
  +-- teardown()
        +-- RunPod API: delete pod
        +-- Called in finally{} block + process signal handlers
```

### Component Boundaries

| Component | Status | Responsibility | Communicates With |
|-----------|--------|---------------|-------------------|
| `src/infra/vllm-client.ts` | **NEW** | Translate ChatFn calls to OpenAI-compatible HTTP, map Ollama format param to vLLM response_format | PipelineRunner, scoring-pipeline |
| `src/infra/backend-factory.ts` | **NEW** | Create ChatFn based on --backend flag, wire up provisioner if vllm | CLI, PipelineRunner |
| `src/pipeline/concurrent-runner.ts` | **NEW** | Semaphore-bounded parallel scoring of opportunities | scoring-pipeline, checkpoint |
| `src/infra/cloud-provisioner.ts` | **NEW** | Provision/teardown ephemeral H100 pod via RunPod API | backend-factory, CLI |
| `src/infra/checkpoint.ts` | **MODIFY** | Add write serialization for concurrent access (async queue around writeFileSync) | concurrent-runner |
| `src/pipeline/pipeline-runner.ts` | **MODIFY** | Branch: if backend=vllm, delegate to concurrent-runner; else existing sequential path | CLI, scoring-pipeline |
| `src/cli.ts` | **MODIFY** | Add --backend option, wire backend-factory | pipeline-runner |
| `src/scoring/scoring-pipeline.ts` | **UNCHANGED** | scoreOneOpportunity stays exactly as-is (already accepts ChatFn) | lens-scorers |
| `src/scoring/ollama-client.ts` | **UNCHANGED** | ollamaChat remains the default ChatFn implementation | scoring-pipeline |
| `src/infra/model-manager.ts` | **UNCHANGED** | Still manages Ollama model lifecycle for local path | pipeline-runner |

### Data Flow: vLLM Path

1. **CLI** parses `--backend vllm`, passes to BackendFactory
2. **BackendFactory** calls CloudProvisioner.provision() -- creates RunPod H100 pod with vLLM serving Qwen 2.5 32B
3. **BackendFactory** returns a `ChatFn` that wraps VllmClient.chat(baseUrl, messages, format)
4. **PipelineRunner** sees backend=vllm, delegates scoring loop to ConcurrentPipelineRunner
5. **ConcurrentPipelineRunner** creates Semaphore(N), maps processable opportunities into Promise array, each awaiting semaphore before calling scoreOneOpportunity with vllm ChatFn
6. **scoreOneOpportunity** is unchanged -- it calls chatFn(messages, format) which now goes to vLLM instead of Ollama
7. **ConcurrentCheckpoint** serializes writes via async queue (one write at a time, many concurrent scorers)
8. On completion (or error/signal), **CloudProvisioner.teardown()** destroys the pod

### Data Flow: Ollama Path (Unchanged)

Exactly the same as v1.0. The `--backend ollama` flag (default) skips all cloud code paths. No provisioner created, no concurrent runner used.

## New Components: Detailed Design

### VllmClient (`src/infra/vllm-client.ts`)

The critical insight: vLLM exposes an OpenAI-compatible `/v1/chat/completions` endpoint. The existing `ollamaChat` sends to Ollama's `/api/chat` with an Ollama-specific `format` parameter. The vLLM client must translate this to OpenAI's `response_format`.

```typescript
// ChatFn signature (already defined in scoring-pipeline.ts and pipeline-runner.ts)
type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;

// vLLM adapter: same signature, different transport
export function createVllmChatFn(baseUrl: string, model: string): ChatFn {
  return async (messages, format) => {
    const startMs = Date.now();
    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0,
          // vLLM structured output: translate Ollama format param to OpenAI response_format
          response_format: {
            type: "json_schema",
            json_schema: { name: "response", strict: true, schema: format },
          },
        }),
        signal: AbortSignal.timeout(300_000), // 5min -- H100 is fast
      });

      if (!response.ok) {
        return { success: false, error: `vLLM HTTP ${response.status}` };
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const durationMs = Date.now() - startMs;
      return { success: true, content, durationMs };
    } catch (err) {
      return { success: false, error: `vLLM chat failed: ${err}` };
    }
  };
}
```

**Key translation:** Ollama's `format` parameter is a raw JSON schema object. vLLM's OpenAI-compatible API expects it wrapped in `response_format: { type: "json_schema", json_schema: { name, strict, schema } }`. This is the only adaptation needed -- message format is already OpenAI-compatible.

**Confidence:** HIGH. vLLM's OpenAI-compatible server is well-documented and the structured output via `response_format` with `json_schema` type is confirmed in vLLM docs.

### ConcurrentPipelineRunner (`src/pipeline/concurrent-runner.ts`)

Replaces the sequential `for (const triage of processable)` loop with semaphore-bounded concurrency.

```typescript
import { Semaphore } from "async-mutex";

export interface ConcurrentRunnerOptions {
  concurrency: number;  // 10-20 for H100
  chatFn: ChatFn;
  onResult: (result: ScoringPipelineResult, l3Name: string) => void;
  onError: (error: string, l3Name: string) => void;
}

export async function runConcurrentScoring(
  processable: TriageResult[],
  l3Map: Map<string, L3Opportunity>,
  l4Map: Map<string, L4Activity[]>,
  company: CompanyContext,
  knowledgeContext: KnowledgeContext,
  options: ConcurrentRunnerOptions,
): Promise<void> {
  const semaphore = new Semaphore(options.concurrency);

  const tasks = processable.map((triage) =>
    semaphore.runExclusive(async () => {
      const opp = l3Map.get(triage.l3Name);
      if (!opp) {
        options.onError(`L3 not found: ${triage.l3Name}`, triage.l3Name);
        return;
      }
      const l4s = l4Map.get(triage.l3Name) ?? [];
      const result = await scoreOneOpportunity(
        opp, l4s, company, knowledgeContext, options.chatFn
      );
      options.onResult(result, triage.l3Name);
    })
  );

  await Promise.allSettled(tasks);
}
```

**Why async-mutex Semaphore over p-limit or p-queue:** The existing stack already has p-queue in the research recommendations, but async-mutex's Semaphore is simpler for this use case -- we just need bounded concurrency with no priority or queue semantics. It is well-typed TypeScript and zero-dependency. Either works; async-mutex is slightly cleaner.

**Why Promise.allSettled over Promise.all:** One failed opportunity must not abort the entire batch. allSettled ensures all opportunities are attempted regardless of individual failures.

### ConcurrentCheckpoint (`src/infra/checkpoint.ts` modification)

The current checkpoint uses synchronous `writeFileSync`. With concurrent scoring, multiple completions may try to write simultaneously. Solution: serialize writes through an async queue.

```typescript
// Add to existing checkpoint.ts
export class ConcurrentCheckpointWriter {
  private writeQueue: Promise<void> = Promise.resolve();
  private checkpoint: Checkpoint;

  constructor(checkpoint: Checkpoint, private outputDir: string) {
    this.checkpoint = checkpoint;
  }

  append(entry: CheckpointEntry): void {
    // Chain writes to ensure serial execution
    this.writeQueue = this.writeQueue.then(() => {
      this.checkpoint.entries.push(entry);
      saveCheckpoint(this.outputDir, this.checkpoint);
    });
  }

  async flush(): Promise<void> {
    await this.writeQueue;
  }
}
```

**Why not a mutex:** A simple promise chain is sufficient and avoids a dependency. Each write chains onto the previous one, guaranteeing serial file writes without blocking concurrent scorers.

### CloudProvisioner (`src/infra/cloud-provisioner.ts`)

Manages ephemeral H100 lifecycle via RunPod API.

```typescript
export interface CloudConfig {
  apiKey: string;          // RUNPOD_API_KEY env var
  gpuType: string;         // "NVIDIA H100 80GB HBM3"
  model: string;           // "Qwen/Qwen2.5-32B-Instruct"
  dockerImage: string;     // "vllm/vllm-openai:latest"
  volumeSize: number;      // GB for model weights cache
}

export interface ProvisionedInstance {
  podId: string;
  baseUrl: string;         // https://{podId}-8000.proxy.runpod.net
}

export class CloudProvisioner {
  async provision(config: CloudConfig): Promise<ProvisionedInstance> {
    // 1. Create pod via RunPod REST API
    // 2. Poll pod status until RUNNING
    // 3. Poll /v1/models until vLLM reports model loaded
    // 4. Return baseUrl for ChatFn
  }

  async healthCheck(instance: ProvisionedInstance): Promise<boolean> {
    // GET /v1/models -- returns 200 if vLLM is serving
  }

  async teardown(instance: ProvisionedInstance): Promise<void> {
    // DELETE pod via RunPod REST API
  }
}
```

**Provider choice: RunPod** because:
- Per-millisecond billing (critical for ephemeral use -- a 30-min run should cost ~$1.50 not an hour minimum)
- H100 80GB at ~$2/hr (sufficient for Qwen 2.5 32B unquantized at full FP16)
- JavaScript SDK exists (`@runpod/sdk` on npm) though raw REST is simpler
- Pod creation API is well-documented with programmatic access
- Docker image support means we specify `vllm/vllm-openai:latest` directly

**Confidence:** MEDIUM. RunPod API specifics (exact pod creation fields, proxy URL format) need validation against current docs during implementation.

### BackendFactory (`src/infra/backend-factory.ts`)

Wires everything together based on `--backend` flag.

```typescript
export type Backend = "ollama" | "vllm";

export interface BackendResult {
  chatFn: ChatFn;
  concurrency: number;      // 1 for ollama, 10-20 for vllm
  cleanup?: () => Promise<void>;  // teardown for cloud
}

export async function createBackend(
  backend: Backend,
  logger: Logger,
): Promise<BackendResult> {
  if (backend === "ollama") {
    return { chatFn: ollamaChat, concurrency: 1 };
  }

  // vLLM path
  const provisioner = new CloudProvisioner();
  const instance = await provisioner.provision({
    apiKey: process.env.RUNPOD_API_KEY!,
    gpuType: "NVIDIA H100 80GB HBM3",
    model: "Qwen/Qwen2.5-32B-Instruct",
    dockerImage: "vllm/vllm-openai:latest",
    volumeSize: 50,
  });

  const chatFn = createVllmChatFn(instance.baseUrl, "Qwen/Qwen2.5-32B-Instruct");

  return {
    chatFn,
    concurrency: 15,  // H100 handles 15+ concurrent requests easily
    cleanup: () => provisioner.teardown(instance),
  };
}
```

## Patterns to Follow

### Pattern 1: ChatFn as the Seam

**What:** The existing ChatFn type `(messages, format) => Promise<ChatResult>` is the integration seam. Both Ollama and vLLM implement this same signature. Scoring code never knows which backend it is talking to.

**When:** All new backend code.

**Why:** scoreOneOpportunity, all three lens scorers, and the retry policy already accept ChatFn via dependency injection. Zero changes needed to scoring logic.

**Implication:** The `format` parameter translation (Ollama schema -> OpenAI response_format) lives inside the vLLM adapter, not in scoring code.

### Pattern 2: Graceful Teardown with Signal Handlers

**What:** Register process signal handlers (SIGINT, SIGTERM) that call CloudProvisioner.teardown() before exit. Also wrap the pipeline in try/finally.

**When:** Any time a cloud resource is provisioned.

**Why:** An interrupted run must not leave an H100 pod running at $2/hr. This is the most expensive failure mode.

```typescript
// In pipeline-runner.ts when backend=vllm
const backend = await createBackend("vllm", logger);

const cleanup = async () => {
  if (backend.cleanup) {
    logger.info("Tearing down cloud resources");
    await backend.cleanup();
  }
};

process.on("SIGINT", async () => { await cleanup(); process.exit(130); });
process.on("SIGTERM", async () => { await cleanup(); process.exit(143); });

try {
  await runScoringPhase(/* ... */);
} finally {
  await cleanup();
}
```

### Pattern 3: Health Check Before Scoring Starts

**What:** After provisioning, poll the vLLM `/v1/models` endpoint until the model is loaded and ready before starting the scoring loop.

**When:** During vLLM backend initialization.

**Why:** vLLM takes 30-90 seconds to load a 32B model. Starting scoring requests before the model is loaded causes immediate failures and wastes retry budget.

```typescript
async function waitForReady(baseUrl: string, timeoutMs = 180_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(`${baseUrl}/v1/models`);
      if (resp.ok) return;
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error("vLLM failed to become ready within timeout");
}
```

### Pattern 4: Concurrency Limit as Configuration

**What:** The semaphore bound is configurable, not hardcoded. Default 15 for vLLM/H100, 1 for Ollama.

**When:** Pipeline initialization.

**Why:** Optimal concurrency depends on model size, GPU memory, prompt length. A fixed number will be wrong for some configurations. Start at 15, allow override via `--concurrency N` flag.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Modifying scoreOneOpportunity for Concurrency

**What:** Adding concurrency awareness (locks, batching, result aggregation) inside scoreOneOpportunity.
**Why bad:** scoreOneOpportunity is already a pure async function that accepts ChatFn. It works perfectly for both sequential and concurrent use. Adding concurrency concerns violates single responsibility and breaks the Ollama path.
**Instead:** Concurrency is the runner's concern, not the scorer's concern. The concurrent runner wraps existing scoreOneOpportunity calls in a semaphore.

### Anti-Pattern 2: Shared Mutable State Between Concurrent Scorers

**What:** Multiple concurrent scoreOneOpportunity calls writing to shared arrays, counters, or context objects without synchronization.
**Why bad:** Race conditions on result aggregation, corrupted checkpoint files, incorrect counts.
**Instead:** Each scorer returns its result. The runner collects results via callbacks or a synchronized collector. Checkpoint writes go through the ConcurrentCheckpointWriter queue.

### Anti-Pattern 3: Leaving Cloud Resources on Error

**What:** Provisioning H100 but not tearing down on pipeline error, SIGINT, or uncaught exception.
**Why bad:** An abandoned H100 pod costs $2/hr. A forgotten pod over a weekend costs $96.
**Instead:** try/finally + signal handlers + process.on('uncaughtException'). Triple-defense teardown.

### Anti-Pattern 4: Building a Custom vLLM Serving Layer

**What:** Writing custom model loading, batching, or serving logic instead of using vLLM's built-in OpenAI-compatible server.
**Why bad:** vLLM's server handles continuous batching, KV cache management, tensor parallelism, and GPU memory management. Reimplementing any of this is a multi-month project.
**Instead:** Use `vllm serve Qwen/Qwen2.5-32B-Instruct` with its built-in server. Talk to it via standard OpenAI-compatible HTTP.

### Anti-Pattern 5: Polling RunPod Status in a Tight Loop

**What:** Checking pod status every 100ms during provisioning.
**Why bad:** Wastes API rate limit, provides no faster feedback than 5s intervals.
**Instead:** Poll every 5 seconds with exponential backoff up to 15 seconds. Pod creation takes 30-120 seconds typically.

## Integration Points Summary

### What Changes

| File | Change Type | What Changes |
|------|-------------|--------------|
| `src/cli.ts` | MODIFY | Add `--backend <ollama\|vllm>` and `--concurrency <N>` options |
| `src/pipeline/pipeline-runner.ts` | MODIFY | Branch on backend: sequential (existing) vs concurrent (new) |
| `src/infra/checkpoint.ts` | MODIFY | Add ConcurrentCheckpointWriter class (existing functions unchanged) |

### What Is New

| File | Purpose |
|------|---------|
| `src/infra/vllm-client.ts` | ChatFn adapter for vLLM OpenAI-compatible API |
| `src/infra/backend-factory.ts` | Create ChatFn + config from --backend flag |
| `src/infra/cloud-provisioner.ts` | RunPod pod lifecycle (provision, health check, teardown) |
| `src/pipeline/concurrent-runner.ts` | Semaphore-bounded parallel scoring |

### What Does Not Change

| File | Why Unchanged |
|------|---------------|
| `src/scoring/scoring-pipeline.ts` | scoreOneOpportunity already accepts ChatFn -- works as-is with vLLM adapter |
| `src/scoring/lens-scorers.ts` | Pure scoring functions, backend-agnostic |
| `src/scoring/ollama-client.ts` | Remains the default ChatFn for local path |
| `src/infra/model-manager.ts` | Only used in Ollama path, skipped when backend=vllm |
| `src/infra/retry-policy.ts` | callWithResilience wraps scoreOneOpportunity -- works identically in concurrent context |
| `src/triage/` | Triage is pure function (no LLM in v1.0), runs before scoring |
| `src/simulation/` | Runs after scoring, unchanged |
| `src/output/` | Runs after scoring, unchanged |

## Suggested Build Order

Build from bottom up, validating each layer before adding the next.

### Phase 1: vLLM Client Adapter
- Build `vllm-client.ts` with createVllmChatFn
- Unit test against mock HTTP server (same pattern as ollama-client tests)
- Validate format parameter translation (Ollama schema -> OpenAI response_format)
- **Dependency:** None. Can start immediately.

### Phase 2: Concurrent Pipeline Runner
- Build `concurrent-runner.ts` with Semaphore from async-mutex
- Build ConcurrentCheckpointWriter in checkpoint.ts
- Unit test with mock ChatFn (inject fake scorer)
- Validate checkpoint file integrity under concurrent writes
- **Dependency:** None. Can start in parallel with Phase 1.

### Phase 3: Cloud Provisioner
- Build `cloud-provisioner.ts` with RunPod API calls
- Integration test: provision real pod, verify /v1/models responds, teardown
- Validate signal handler teardown (SIGINT during provision)
- **Dependency:** Needs RUNPOD_API_KEY. Can start in parallel with Phases 1-2.

### Phase 4: Backend Factory + CLI Integration
- Build `backend-factory.ts` wiring provisioner + vllm client
- Modify `cli.ts` to add --backend and --concurrency flags
- Modify `pipeline-runner.ts` to branch on backend
- Integration test: full pipeline with --backend vllm against real H100
- **Dependency:** Phases 1, 2, 3 all complete.

### Phase 5: End-to-End Validation
- Run Ford 339-opp dataset with --backend vllm
- Validate: results match Ollama path quality, <30min runtime, <$10 cost
- Validate: checkpoint resume works with concurrent runner
- Validate: teardown happens on SIGINT, error, and normal completion
- **Dependency:** Phase 4 complete.

## Scalability Considerations

| Concern | Ollama (current) | vLLM on H100 (new) | Multiple H100s (future) |
|---------|-------------------|---------------------|-------------------------|
| Throughput | ~3 min/opp (sequential) | ~5 sec/opp (15 concurrent) | Horizontal scale via multiple pods |
| Total time (339 opps) | ~17 hours | ~25 minutes | ~5 minutes with 5 pods |
| Cost per run | $0 (local) | ~$1.50 (30 min * $2/hr + overhead) | ~$2.50 (higher parallelism, shorter) |
| Memory constraint | 36GB shared (one model) | 80GB dedicated (one model, many requests) | 80GB each |
| Failure blast radius | One opp fails, others continue | Same -- semaphore isolates failures | Pod failure loses in-flight opps only |

## Sources

- [vLLM OpenAI-Compatible Server](https://docs.vllm.ai/en/stable/serving/openai_compatible_server/) - OpenAI-compatible API documentation (HIGH confidence)
- [vLLM Structured Outputs](https://docs.vllm.ai/en/v0.8.2/features/structured_outputs.html) - JSON schema guided generation via response_format (HIGH confidence)
- [RunPod Pod Creation API](https://docs.runpod.io/api-reference/pods/POST/pods) - Programmatic pod provisioning (MEDIUM confidence -- exact fields need validation)
- [RunPod Cloud GPUs](https://www.runpod.io/product/cloud-gpus) - H100 pricing and availability (MEDIUM confidence)
- [H100 Rental Prices 2026](https://intuitionlabs.ai/articles/h100-rental-prices-cloud-comparison) - Cross-provider pricing comparison
- [async-mutex on GitHub](https://github.com/DirtyHairy/async-mutex) - TypeScript semaphore implementation (HIGH confidence)
- [Qwen vLLM Deployment](https://qwen.readthedocs.io/en/latest/deployment/vllm.html) - Official Qwen + vLLM documentation (HIGH confidence)
- [vLLM Structured Output Bug Report](https://github.com/vllm-project/vllm/issues/15236) - Known issues with guided generation as of v0.8.1 (MEDIUM confidence -- may be fixed in later versions)
