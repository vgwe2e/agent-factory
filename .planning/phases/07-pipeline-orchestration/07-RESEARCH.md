# Phase 7: Pipeline Orchestration - Research

**Researched:** 2026-03-11
**Domain:** Pipeline orchestration, structured logging, Ollama model lifecycle, context management
**Confidence:** HIGH

## Summary

Phase 7 wires the existing triage, scoring, and simulation subsystems into a single unattended pipeline. The four requirements decompose into: structured logging with pino (INFR-02), two-model switching with Ollama keep_alive lifecycle management (INFR-04), context summarization between evaluation iterations (INFR-05), and a non-interactive end-to-end runner (INFR-07).

The most critical constraint is the 36GB Apple Silicon memory ceiling. A quantized Qwen 32B model consumes approximately 20-22GB, leaving no room to keep the 8B model co-resident. The pipeline MUST sequentially load/unload models using Ollama's keep_alive=0 API parameter -- not attempt to run both simultaneously. Each pipeline stage (triage vs scoring/simulation) should batch its work under a single model before switching.

**Primary recommendation:** Build a ModelManager that explicitly unloads models via keep_alive=0 before loading the next, a pino-based logger with child bindings for stage+opportunityId, and an iterative pipeline runner that processes opportunities in tier-priority order with context reset between each.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-02 | Engine logs progress with pino structured logging (pipeline stage + opportunity ID) | pino v9 with child logger bindings; see Standard Stack and Code Examples sections |
| INFR-04 | Engine uses two-model strategy (8B for bulk triage, 32B for reasoning/scoring/simulation) | Ollama keep_alive API for model lifecycle; see Architecture Patterns - Model Manager |
| INFR-05 | Engine manages context across evaluations (summarize, archive, reset between iterations) | Stateless Ollama calls mean context is already request-scoped; pipeline state tracking needed; see Context Management pattern |
| INFR-07 | Engine runs unattended overnight without user interaction | Non-interactive pipeline runner with progress logging; see Architecture Patterns - Pipeline Runner |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pino | ^9.6.0 | Structured JSON logging | Fastest Node.js logger, built-in child logger bindings, ESM native |
| pino-pretty | ^13.0.0 | Dev-mode human-readable log output | Official companion for development; piped via CLI, not imported |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| commander | ^13.0.0 | CLI argument parsing | Already in project; add --log-level and --output-dir flags |

### Already in Project (no new install needed)
| Library | Purpose | Relevant to Phase 7 |
|---------|---------|---------------------|
| zod | Schema validation | Validate pipeline config/options |
| tsx | TypeScript execution | Dev mode running |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pino | winston | winston is slower, heavier; pino's child bindings are ideal for stage+id context |
| pino | console.log | No structure, no levels, no machine-parseable output |

**Installation:**
```bash
cd src && npm install pino pino-pretty
npm install --save-dev @types/pino  # Note: pino ships its own types as of v9, may not need this
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  infra/
    ollama.ts           # Existing Ollama connectivity check
    logger.ts           # NEW: pino logger factory with child bindings
    model-manager.ts    # NEW: Ollama model load/unload lifecycle
  pipeline/
    pipeline-runner.ts  # NEW: End-to-end orchestrator
    context-tracker.ts  # NEW: Per-opportunity state tracking and reset
  cli.ts                # MODIFIED: Wire pipeline runner, add flags
```

### Pattern 1: Model Manager (INFR-04)
**What:** A stateful manager that tracks the currently loaded model and switches models via Ollama API keep_alive parameter.
**When to use:** Before each pipeline stage that requires a different model size.

**Key insight from research:** On 36GB Apple Silicon, Qwen 32B uses ~20-22GB and the 8B uses ~5-6GB (Q4_K_M). Both cannot be resident simultaneously. The Ollama API has no dedicated /api/load endpoint -- loading is implicit (send a request to a model and it loads). Unloading is explicit: send an empty request with keep_alive=0.

**Design:**
```typescript
// src/infra/model-manager.ts

const OLLAMA_CHAT_API = "http://localhost:11434/api/chat";

export interface ModelManagerConfig {
  triageModel: string;    // e.g., "qwen2.5:7b"
  scoringModel: string;   // e.g., "qwen2.5:32b"
  timeoutMs: number;      // model load timeout (first token can take 30-60s for 32B)
}

export class ModelManager {
  private currentModel: string | null = null;

  constructor(
    private config: ModelManagerConfig,
    private logger: Logger,  // pino child logger
  ) {}

  /** Unload current model, load target model */
  async switchTo(model: string): Promise<void> {
    if (this.currentModel === model) return;

    // Step 1: Unload current model
    if (this.currentModel) {
      this.logger.info({ model: this.currentModel }, "unloading model");
      await fetch(OLLAMA_CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.currentModel,
          messages: [],
          keep_alive: 0,
        }),
      });
    }

    // Step 2: Warm-load target model (empty prompt, long keep_alive)
    this.logger.info({ model }, "loading model");
    await fetch(OLLAMA_CHAT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [],
        keep_alive: "30m",
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    this.currentModel = model;
    this.logger.info({ model }, "model ready");
  }

  async ensureTriageModel(): Promise<void> {
    await this.switchTo(this.config.triageModel);
  }

  async ensureScoringModel(): Promise<void> {
    await this.switchTo(this.config.scoringModel);
  }

  async unloadAll(): Promise<void> {
    if (this.currentModel) {
      await this.switchTo("__none__"); // triggers unload of currentModel
      this.currentModel = null;
    }
  }
}
```

### Pattern 2: Structured Logger Factory (INFR-02)
**What:** A pino-based logger that creates child loggers with stage and opportunity bindings.
**When to use:** Every pipeline operation should log through a child logger with context.

```typescript
// src/infra/logger.ts
import pino from "pino";
import type { Logger } from "pino";

export type { Logger } from "pino";

export function createLogger(level: string = "info"): Logger {
  return pino({
    level,
    // Structured base fields
    base: { service: "aera-evaluate" },
    // ISO timestamp
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

// Child logger per pipeline stage
// Usage: const stageLog = logger.child({ stage: "triage" })
// Usage: const oppLog = stageLog.child({ oppId: opp.l3_name })
// Output: {"level":30,"time":"2026-...","service":"aera-evaluate","stage":"triage","oppId":"...","msg":"scoring complete"}
```

**Dev mode with pino-pretty:**
```bash
npx tsx cli.ts --input export.json | npx pino-pretty
```

### Pattern 3: Pipeline Runner (INFR-07)
**What:** A sequential orchestrator that runs triage, scoring, and simulation in order, processing all opportunities without interaction.
**When to use:** The main entry point after CLI argument parsing.

**Design principles:**
1. Triage ALL opportunities first (uses 8B model) -- already implemented as pure function
2. Switch to 32B model
3. Score Tier 1 opportunities, then Tier 2, then Tier 3 (respecting tier priority from TRIG-03)
4. Run simulation for promoted opportunities (composite >= 0.60)
5. Generate output reports

```typescript
// src/pipeline/pipeline-runner.ts
export interface PipelineResult {
  triageCount: number;
  scoredCount: number;
  simulatedCount: number;
  skippedCount: number;
  totalDurationMs: number;
  errors: Array<{ oppId: string; stage: string; error: string }>;
}

export async function runPipeline(
  inputPath: string,
  options: PipelineOptions,
  logger: Logger,
): Promise<PipelineResult> {
  // 1. Ingest
  // 2. Triage (pure function, no LLM needed for tier assignment)
  // 3. Model switch to 32B
  // 4. Score in tier-priority order
  // 5. Simulate promoted opportunities
  // 6. Model unload
  // 7. Generate reports
}
```

### Pattern 4: Context Management (INFR-05)
**What:** Track per-opportunity evaluation state and ensure no context bleeds between iterations.

**Key insight:** Ollama's /api/chat endpoint is already stateless per request (no session/conversation memory unless you explicitly pass message history). Context overflow is NOT an Ollama concern -- each call starts fresh. The real context management concern is:

1. **Pipeline state accumulation** -- tracking which opportunities have been scored, their results, and errors across hundreds of iterations
2. **Memory pressure from Node.js side** -- accumulating large result arrays in memory
3. **Summarize/archive pattern** -- writing intermediate results to disk periodically rather than accumulating everything in RAM

```typescript
// src/pipeline/context-tracker.ts
export interface EvaluationContext {
  currentStage: "triage" | "scoring" | "simulation" | "reporting";
  processed: Set<string>;       // l3_name of completed opportunities
  results: Map<string, ScoringResult>;
  errors: Array<{ oppId: string; stage: string; error: string }>;
}

export function createContext(): EvaluationContext { ... }

/** Write intermediate results to disk and clear in-memory buffer */
export async function archiveAndReset(
  ctx: EvaluationContext,
  outputDir: string,
  logger: Logger,
): Promise<void> {
  // Write scored results to JSON checkpoint file
  // Clear results Map to free memory
  // Keep processed Set (lightweight, just strings)
}
```

### Anti-Patterns to Avoid
- **Loading both models simultaneously:** On 36GB Apple Silicon this will cause extreme memory pressure, swap thrashing, and potential OOM. Always unload one before loading another.
- **Using Ollama conversation history for scoring:** Each scoring call should be independent with fresh system+user messages. Do not accumulate conversation history across opportunities.
- **console.log for progress:** Defeats structured logging. All output must go through pino so it can be filtered, parsed, and analyzed.
- **Interactive prompts (readline, inquirer):** Violates INFR-07 unattended mode. All configuration via CLI flags and defaults.
- **Accumulating all results in memory:** With hundreds of opportunities, write intermediate results to disk periodically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured logging | Custom JSON formatter | pino with child loggers | Handles levels, serialization, timestamps, and 30x faster than console |
| Log formatting for dev | Custom pretty-printer | pino-pretty (piped) | Already handles colorization, indentation, timestamp formatting |
| Model lifecycle | Manual fetch calls scattered throughout | ModelManager class | Centralizes unload-before-load logic, prevents double-load bugs |
| Progress tracking | Custom counters | Logger child bindings + stage tracking | pino child bindings automatically attach stage+id to every log line |

**Key insight:** The Ollama client (scoring/ollama-client.ts) already has the right fetch pattern. ModelManager wraps the lifecycle (load/unload), not the chat calls. Existing ollamaChat function should be refactored to accept a model parameter rather than hardcoding SCORING_MODEL.

## Common Pitfalls

### Pitfall 1: Model Load Timeout
**What goes wrong:** First request to a model after loading takes 30-60 seconds for 32B on Apple Silicon as the model loads into memory. Default timeouts (5s) will fail.
**Why it happens:** Model loading from disk to unified memory is slow for large models.
**How to avoid:** Use a warm-load step (empty request with long keep_alive) after switching models, with a generous timeout (120-180 seconds). Separate the "load model" timeout from the "generate response" timeout.
**Warning signs:** Timeouts on first request of each pipeline stage.

### Pitfall 2: Memory Not Released After Unload
**What goes wrong:** Setting keep_alive=0 tells Ollama to unload after the response, but the OS may not immediately reclaim unified memory on Apple Silicon.
**Why it happens:** macOS unified memory management can be lazy about reclaiming GPU-accessible memory.
**How to avoid:** Add a short delay (2-3 seconds) between unload and load to give the OS time to reclaim. Monitor with `ollama ps` if debugging.
**Warning signs:** Second model loads slowly or system becomes sluggish during switch.

### Pitfall 3: Hardcoded Model Names in ollama-client.ts
**What goes wrong:** The current ollama-client.ts hardcodes `SCORING_MODEL = "qwen2.5:32b"`. Phase 7 needs the pipeline to use different models for different stages.
**Why it happens:** Phase 4 only needed one model.
**How to avoid:** Refactor ollamaChat to accept a model parameter. The existing chatFn dependency injection pattern in lens-scorers.ts already supports this -- just need to parameterize the model name.
**Warning signs:** All calls using 32B even for triage, wasting time and memory.

### Pitfall 4: Logging Noise in Tests
**What goes wrong:** pino logs pollute test output making failures hard to read.
**Why it happens:** Logger created at module level without test detection.
**How to avoid:** Create logger factory that accepts a level parameter. Tests pass level="silent". Pipeline passes level from CLI flag.
**Warning signs:** Test output full of JSON log lines.

### Pitfall 5: Pipeline Exits on First Error
**What goes wrong:** A single LLM scoring failure crashes the entire overnight run.
**Why it happens:** Unhandled promise rejection or throw in scoring loop.
**How to avoid:** Phase 7 should log errors and continue to next opportunity. Phase 8 adds formal retry/fallback, but Phase 7 must at minimum catch and log. The existing Result type pattern (success/error union) already supports this -- never throw, always return errors.
**Warning signs:** Pipeline stops after processing 3 of 200 opportunities.

## Code Examples

### Creating pino Logger with Child Bindings
```typescript
// Source: pino docs (https://github.com/pinojs/pino/blob/main/docs/api.md)
import pino from "pino";

const logger = pino({
  level: "info",
  base: { service: "aera-evaluate" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Child with stage context
const triageLog = logger.child({ stage: "triage" });
triageLog.info("starting triage"); // {"level":30,"stage":"triage","msg":"starting triage",...}

// Child with stage + opportunity context
const oppLog = triageLog.child({ oppId: "Optimize Inventory" });
oppLog.info({ tier: 1 }, "tier assigned"); // {"level":30,"stage":"triage","oppId":"Optimize Inventory","tier":1,...}
```

### Ollama Model Unload (keep_alive=0)
```typescript
// Source: Ollama API docs (https://docs.ollama.com/api/chat)
// Unload a model from memory
await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "qwen2.5:32b",
    messages: [],
    keep_alive: 0,
  }),
});
```

### Ollama Model Warm-Load
```typescript
// Source: Ollama API docs (https://docs.ollama.com/api/chat)
// Pre-load a model into memory with extended keep_alive
await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "qwen2.5:7b",
    messages: [],
    keep_alive: "30m",  // keep loaded for 30 minutes
  }),
});
```

### Refactoring ollamaChat for Model Parameter
```typescript
// Current: model hardcoded
export const SCORING_MODEL = "qwen2.5:32b";

// Refactored: model as parameter with default
export async function ollamaChat(
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
  model: string = "qwen2.5:32b",  // backward compatible default
): Promise<ChatResult> {
  // ... same logic but uses model parameter in body
}
```

### Pipeline Runner Skeleton
```typescript
// Processing loop with structured logging
for (const triaged of sortedResults) {
  if (triaged.action === "skip") {
    oppLog.info({ action: "skip" }, "skipped (red flag)");
    result.skippedCount++;
    continue;
  }

  const oppLog = scoringLog.child({ oppId: triaged.l3Name, tier: triaged.tier });
  oppLog.info("scoring started");

  const scoreResult = await scoreOpportunity(/* ... */);
  if (!scoreResult.success) {
    oppLog.error({ error: scoreResult.error }, "scoring failed");
    result.errors.push({ oppId: triaged.l3Name, stage: "scoring", error: scoreResult.error });
    continue;  // Don't crash -- log and continue
  }

  oppLog.info({ composite: scoreResult.data.composite, promoted: scoreResult.data.promotedToSimulation }, "scoring complete");
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ollama /api/generate | /api/chat (multi-turn capable) | Ollama 0.1.x+ | Chat endpoint is standard for structured output with format parameter |
| Manual model pull/push | keep_alive lifecycle management | Ollama 0.3+ | No need to stop/start Ollama; hot-swap via API |
| bunyan / winston | pino v9 | 2024 | 30x faster, native ESM, built-in TypeScript types |

**Deprecated/outdated:**
- pino v8: Use v9+ for native ESM default export support
- Ollama /api/generate for chat-style prompts: Use /api/chat for system+user message pairs (already in codebase)

## Open Questions

1. **Optimal keep_alive duration between model switches**
   - What we know: Default is 5m, can set to 0 for immediate unload or "30m" for long sessions
   - What's unclear: Whether 2-3 second delay after keep_alive=0 is sufficient for Apple Silicon memory reclaim
   - Recommendation: Start with keep_alive=0 + 3 second delay; if model loads fail, increase delay

2. **Triage model usage in Phase 7 pipeline**
   - What we know: Triage (Phase 3) is implemented as pure functions -- no LLM calls needed for tier assignment/red flags
   - What's unclear: Whether the 8B model is needed at all in the current pipeline, or if it was only planned for future triage enhancements
   - Recommendation: The triage subsystem is already pure TypeScript (no LLM). The 8B model may only be needed if Phase 6 simulation uses it. ModelManager should still support it for forward compatibility, but the pipeline may only switch models if there is actual 8B usage.

3. **Output directory structure for intermediate checkpoints**
   - What we know: Final outputs go to evaluation/ directory (Phase 5/9)
   - What's unclear: Where intermediate checkpoints should live during pipeline execution
   - Recommendation: Use evaluation/.pipeline/ for checkpoints, cleaned up after successful completion

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None (uses package.json test script) |
| Quick run command | `cd src && npx tsx --test infra/logger.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-02 | pino logger creates child with stage+oppId bindings | unit | `cd src && npx tsx --test infra/logger.test.ts` | No -- Wave 0 |
| INFR-04 | ModelManager switches between triage and scoring models | unit (mocked fetch) | `cd src && npx tsx --test infra/model-manager.test.ts` | No -- Wave 0 |
| INFR-04 | ollamaChat accepts model parameter | unit | `cd src && npx tsx --test scoring/ollama-client.test.ts` | No -- Wave 0 |
| INFR-05 | Context tracker archives results to disk and resets | unit | `cd src && npx tsx --test pipeline/context-tracker.test.ts` | No -- Wave 0 |
| INFR-07 | Pipeline runner processes all tiers without interaction | integration (mocked LLM) | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx tsx --test {changed_test_file}`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/infra/logger.ts` + `src/infra/logger.test.ts` -- pino factory and child binding tests
- [ ] `src/infra/model-manager.ts` + `src/infra/model-manager.test.ts` -- model lifecycle tests
- [ ] `src/pipeline/pipeline-runner.ts` + `src/pipeline/pipeline-runner.test.ts` -- end-to-end orchestrator tests
- [ ] `src/pipeline/context-tracker.ts` + `src/pipeline/context-tracker.test.ts` -- context archive/reset tests
- [ ] `npm install pino pino-pretty` -- pino dependency installation

## Sources

### Primary (HIGH confidence)
- Ollama API docs (https://docs.ollama.com/api/chat) - keep_alive parameter, model loading/unloading
- Ollama FAQ (https://docs.ollama.com/faq) - memory management, multiple model loading
- Ollama readthedocs API reference (https://ollama.readthedocs.io/en/api/) - full endpoint documentation
- pino GitHub (https://github.com/pinojs/pino) - API, child loggers, ESM support
- Existing codebase: src/scoring/ollama-client.ts, src/infra/ollama.ts, src/triage/triage-pipeline.ts

### Secondary (MEDIUM confidence)
- [Better Stack pino guide](https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/) - verified setup patterns
- [SigNoz pino guide](https://signoz.io/guides/pino-logger/) - child logger usage patterns
- [Arsturn Ollama memory guide](https://www.arsturn.com/blog/managing-ollama-models-auto-unloading-features-explained) - keep_alive lifecycle
- [Paul Easterbrooks](https://pauleasterbrooks.com/articles/technology/clearing-ollama-memory) - model unloading technique

### Tertiary (LOW confidence)
- Apple Silicon memory reclaim timing after Ollama unload -- no authoritative source found; 2-3 second heuristic based on community reports

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - pino is the established Node.js structured logger; Ollama API is well-documented
- Architecture: HIGH - patterns derived from existing codebase conventions (Result types, dependency injection, pure functions) and verified Ollama API capabilities
- Pitfalls: MEDIUM - memory timing on Apple Silicon is empirical, not documented; model load times are approximate
- Context management: HIGH - Ollama is stateless per request; concern is pipeline-level state, not LLM context

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain, Ollama API unlikely to break)
