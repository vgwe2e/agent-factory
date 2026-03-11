# Architecture Patterns

**Domain:** CLI-based catalog evaluation engine with local LLM orchestration
**Researched:** 2026-03-10

## Recommended Architecture

Sequential pipeline with stage isolation and file-based state persistence.

```
CLI Entry (Commander)
  |
  v
[Ingest] --> hierarchy.json validated via Zod
  |
  v
[Triage] --> classify all L3 opportunities into Tier 1/2/3 (8B model)
  |           persist: triage-results.json
  v
[Score] --> 3-lens scoring for Tier 1 + Tier 2 opportunities (32B model)
  |          persist: scored-opportunities.json, git commit
  v
[Gate] --> filter by ratcheting threshold (>= 0.60 composite)
  |
  v
[Simulate] --> generate decision flows + component maps (32B model)
  |              persist: mermaid/*.mmd, components/*.yaml, git commit
  v
[Spec] --> write implementation specs for passing simulations (32B model)
  |          persist: specs/*.md, git commit
  v
[Reflect] --> meta-reflection every N evaluations
  |             persist: reflections/*.md
  v
[Bundle] --> final report assembly
               persist: REPORT.md, summary.tsv, git commit
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| CLI (main.ts) | Parse args, configure pipeline, invoke stages | All pipeline stages |
| Ingest | Parse + validate hierarchy JSON, extract company context | Triage (passes validated data) |
| Triage | Classify L3 opportunities into priority tiers using 8B model | Score (passes tiered list) |
| Score | Apply 3-lens scoring with 32B model, compute weighted composite | Gate (passes scored list) |
| Gate | Apply ratcheting threshold, red flags, filter to qualifying opportunities | Simulate (passes qualifying list) |
| Simulate | Generate Mermaid decision flows + YAML component maps | Spec (passes simulation artifacts) |
| Spec | Write full implementation specs referencing simulations + knowledge base | Bundle (passes spec paths) |
| Reflect | Analyze patterns across completed evaluations | Bundle (passes reflection insights) |
| Bundle | Assemble final markdown report + TSV summary | CLI (signals completion) |
| LLM Client | Manage Ollama connection, model switching, retry, timeout | All LLM-calling stages |
| Knowledge Base | Serve Aera component data (UI, PB nodes, patterns) | Score, Simulate, Spec |
| Output Writers | Generate markdown, YAML, Mermaid text, TSV | All stages that produce artifacts |
| Git Manager | Auto-commit artifacts at stage boundaries | All output-producing stages |
| Logger | Structured logging with stage context | All components |

### Data Flow

1. **Input:** Single hierarchy JSON file (2000+ activities, 362 L3 opportunities, company context)
2. **Between stages:** In-memory TypeScript objects validated by Zod schemas. Each stage receives typed input and produces typed output.
3. **Persistence:** Each stage writes its artifacts to `evaluation/` directory. File-based state means a crashed run can be resumed from the last committed stage.
4. **Output:** `evaluation/` directory containing:
   - `REPORT.md` (master evaluation report)
   - `summary.tsv` (ranked opportunity list)
   - `triage/` (tier assignments)
   - `scored/` (lens scores + composites)
   - `mermaid/` (.mmd decision flow diagrams)
   - `components/` (.yaml component maps)
   - `specs/` (.md implementation specs)
   - `reflections/` (.md meta-reflections)

## Patterns to Follow

### Pattern 1: Stage Isolation with Typed Contracts

**What:** Each pipeline stage is a pure-ish async function: typed input -> typed output + side effects (file writes, git commits). Stages do not share mutable state.

**When:** Always. Every stage boundary.

**Why:** A failed scoring run should not corrupt triage results. File-based persistence between stages enables crash recovery.

**Example:**
```typescript
import { z } from 'zod';

const TriageResult = z.object({
  opportunityId: z.string(),
  tier: z.enum(['1', '2', '3']),
  rationale: z.string(),
  redFlags: z.array(z.string()),
});
type TriageResult = z.infer<typeof TriageResult>;

async function triage(
  opportunities: ValidatedOpportunity[],
  llm: LLMClient
): Promise<TriageResult[]> {
  const results: TriageResult[] = [];
  for (const opp of opportunities) {
    const raw = await llm.chat('qwen2.5:7b', triagePrompt(opp));
    const parsed = TriageResult.parse(JSON.parse(raw));
    results.push(parsed);
  }
  return results;
}
```

### Pattern 2: LLM Response Parsing with Zod

**What:** Every LLM response is parsed through a Zod schema before use. Never trust raw LLM output.

**When:** Every LLM call that expects structured output.

**Why:** LLMs produce malformed JSON, missing fields, wrong types. Zod catches this at the boundary. Failed parses trigger retry with a "fix your JSON" prompt.

**Example:**
```typescript
async function callWithSchema<T>(
  llm: LLMClient,
  model: string,
  prompt: string,
  schema: z.ZodType<T>,
  maxRetries = 2
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await llm.chat(model, prompt);
    try {
      const json = extractJSON(response);
      return schema.parse(JSON.parse(json));
    } catch (err) {
      if (attempt === maxRetries) throw err;
      prompt = `${prompt}\n\nYour previous response had invalid JSON. Error: ${err.message}. Please output valid JSON matching the schema.`;
    }
  }
  throw new Error('Unreachable');
}
```

### Pattern 3: Model Switching for Cost/Speed Optimization

**What:** Use 8B model for bulk triage (fast, cheap), 32B model for reasoning-heavy stages (scoring, simulation, spec writing).

**When:** At stage boundaries where the required model changes.

**Why:** On 36GB Apple Silicon, running both models simultaneously is not viable. The 8B model processes triage 4-5x faster than 32B, and triage does not need deep reasoning.

**Example:**
```typescript
class LLMClient {
  private currentModel: string | null = null;

  async ensureModel(model: string): Promise<void> {
    if (this.currentModel && this.currentModel !== model) {
      await this.ollama.delete({ model: this.currentModel });
      this.currentModel = null;
    }
    await this.ollama.pull({ model });
    this.currentModel = model;
  }
}
```

### Pattern 4: Loop-Forever with Context Management

**What:** Process all opportunities in a loop, summarizing and archiving context every N iterations to stay within context window limits.

**When:** During bulk processing stages (triage, scoring).

**Why:** 362 opportunities with full context would overflow any context window. The engine must carry forward summaries, not raw history.

**Example:**
```typescript
const BATCH_SIZE = 10;
const batches = chunk(opportunities, BATCH_SIZE);

let runningContext = '';
for (const batch of batches) {
  const results = await processBatch(batch, runningContext);
  await persistResults(results);
  await gitCommit(`Evaluated batch: ${batch.map(o => o.id).join(', ')}`);
  runningContext = await summarizeContext(runningContext, results);
}
```

### Pattern 5: File-Based State for Crash Recovery

**What:** Persist state to disk after each stage. On restart, check for existing stage outputs and resume from the last incomplete stage.

**When:** At every stage boundary.

**Why:** An overnight 6-hour run that crashes at hour 5 should not require re-running hours 1-4.

**Example:**
```typescript
async function runPipeline(config: PipelineConfig) {
  const state = await loadExistingState(config.outputDir);

  if (!state.triageComplete) {
    const triage = await runTriage(state.opportunities);
    await saveState(config.outputDir, 'triage', triage);
  }

  if (!state.scoringComplete) {
    const scored = await runScoring(state.triageResults);
    await saveState(config.outputDir, 'scoring', scored);
  }
  // ... continue from last incomplete stage
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prompt Chaining via LangChain-style Abstractions

**What:** Using chain/agent frameworks to compose LLM calls.
**Why bad:** Adds indirection, makes debugging hard, hides prompt content. This engine's prompts are domain-specific and need to be visible, editable, and version-controlled.
**Instead:** Direct function calls with explicit prompts stored as template strings. Each stage owns its prompts.

### Anti-Pattern 2: In-Memory-Only State

**What:** Keeping all pipeline state in memory without file persistence.
**Why bad:** Overnight run crashes lose all progress. Apple Silicon may throttle under thermal load, causing unexpected restarts.
**Instead:** Write intermediate results to disk after each stage/batch. Git commit at stage boundaries.

### Anti-Pattern 3: Concurrent LLM Calls on Constrained Hardware

**What:** Sending multiple parallel Ollama requests to maximize throughput.
**Why bad:** On 36GB with a 32B model loaded, there is no spare GPU memory for parallel inference. Concurrent requests will queue in Ollama anyway, and may cause OOM.
**Instead:** Sequential processing with p-queue concurrency=1. Optimize throughput via prompt efficiency, not parallelism.

### Anti-Pattern 4: Unstructured LLM Output Parsing

**What:** Parsing LLM responses with regex or string splitting.
**Why bad:** LLMs vary their output format unpredictably. Regex breaks on format drift.
**Instead:** Always request JSON output, always validate with Zod, always retry on parse failure.

### Anti-Pattern 5: Monolithic Pipeline Function

**What:** One giant async function that does ingest -> triage -> score -> simulate -> spec.
**Why bad:** No crash recovery, no testability, no ability to re-run individual stages.
**Instead:** Isolated stage functions with file-based state between them.

## Scalability Considerations

| Concern | Current (1 export, 362 opps) | 10 exports | 100 exports |
|---------|------------------------------|------------|-------------|
| Processing time | ~6-10 hours overnight | Queue exports, process serially (multi-night) | Need faster hardware or cloud models |
| Disk space | ~50MB per evaluation | ~500MB total | ~5GB total, consider cleanup |
| Context management | Batch of 10, summarize between | Same approach per export | Same approach per export |
| Model memory | 32B Q4 fits in 36GB | Same -- one export at a time | Same -- one export at a time |

This architecture is designed for single-export batch processing. Scaling to multiple concurrent exports requires different hardware, not different architecture.

## Sources

- [Aera Skill Feasibility Engine PROJECT.md](../.planning/PROJECT.md) - Pipeline requirements and constraints
- [Ollama API documentation](https://docs.ollama.com) - Model management and chat API
- [Zod documentation](https://zod.dev/) - Schema validation patterns
