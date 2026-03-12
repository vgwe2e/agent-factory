# Phase 16: Simulation Configuration - Research

**Researched:** 2026-03-12
**Domain:** CLI flag integration, timeout handling, error isolation in Node.js pipeline
**Confidence:** HIGH

## Summary

Phase 16 adds two CLI flags (`--skip-sim`, `--sim-timeout <ms>`) and strengthens per-opportunity error isolation in the simulation pipeline. The codebase already has all the building blocks: `withTimeout` utility with `TimeoutError` class, Commander option patterns, dependency injection via `PipelineOptions`, and per-generator failure handling in `simulation-pipeline.ts`. The work is primarily wiring -- no new libraries, no new architectural patterns.

The existing simulation pipeline (`simulation-pipeline.ts:110-212`) already handles per-generator failures gracefully. The gap is per-opportunity isolation: currently the `for` loop in `runSimulationPipeline` has no try/catch around the per-opportunity iteration, so one thrown error would halt the entire simulation phase. The pipeline-runner already wraps the entire simulation call in try/catch (lines 443-460), but this is whole-pipeline granularity, not per-opportunity.

**Primary recommendation:** Extend `PipelineOptions` with `skipSim: boolean` and `simTimeoutMs?: number`, thread them through `cli.ts` via Commander, add per-opportunity try/catch in `simulation-pipeline.ts`, and wrap each opportunity's 4-generator sequence in `withTimeout` when `simTimeoutMs` is set.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `--sim-timeout <ms>` applies per-opportunity, not per-generator
- All 4 generators share the timeout budget for a single opportunity
- When a simulation times out, keep any partial artifacts that completed before the timeout
- No default timeout -- simulations run unbounded unless `--sim-timeout` is explicitly passed
- When `--skip-sim` is passed, omit simulation sections from tier-1 report entirely (no placeholders)
- Summary report includes a one-line note: "Simulation: skipped (--skip-sim)"
- Pipeline still computes promoted count even when sim is skipped
- CLI terminal output shows "Simulated: skipped" instead of the simulated count
- Per-opportunity error isolation lives in `simulation-pipeline.ts`
- Simulation errors tracked separately -- add `simErrorCount` to `PipelineResult`
- Simulation failures do NOT affect pipeline exit code

### Claude's Discretion
- Timeout error logging approach (error vs distinct status)
- Exact wording of skip-sim notes in reports and CLI output
- Whether to use boolean flag `--skip-sim` or subcommand-style `--sim skip` (boolean flag is the obvious choice)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIM-01 | User can pass `--skip-sim` flag to bypass simulation phase entirely when only scores are needed | Commander boolean flag pattern in `cli.ts`, conditional skip in `pipeline-runner.ts:437-460`, `PipelineOptions.skipSim` field |
| SIM-02 | User can configure simulation timeout via `--sim-timeout <ms>` flag | `withTimeout` utility in `src/infra/timeout.ts`, `TimeoutError` class, Commander `.option()` pattern, `PipelineOptions.simTimeoutMs` field |
| SIM-03 | Simulation errors are logged with reason and do not block scoring completion | Per-opportunity try/catch in `simulation-pipeline.ts` for loop, error tracking via `simErrorCount` on `PipelineResult` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | (already installed) | CLI flag parsing | Already used in cli.ts; `.option("--skip-sim")` for boolean, `.option("--sim-timeout <ms>")` for value |
| node:test | built-in | Test framework | Project convention per CLAUDE.md |
| assert/strict | built-in | Test assertions | Project convention |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| withTimeout (internal) | N/A | Promise timeout wrapper | Wrap per-opportunity simulation when `simTimeoutMs` is set |
| TimeoutError (internal) | N/A | Timeout detection in catch | Distinguish timeout from other errors in logging |

### Alternatives Considered
None needed -- all infrastructure already exists in the codebase.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Change Structure
```
src/
  cli.ts                          # Add --skip-sim and --sim-timeout flags
  pipeline/
    pipeline-runner.ts            # Thread skipSim + simTimeoutMs through PipelineOptions
                                  # Conditionally skip simulation block
                                  # Add simErrorCount to PipelineResult
  simulation/
    simulation-pipeline.ts        # Add per-opportunity try/catch
                                  # Accept optional timeoutMs parameter
                                  # Return error count in result
  output/
    format-summary.ts             # Handle skip-sim note in summary
    format-tier1-report.ts        # Conditionally omit simulation sections
```

### Pattern 1: CLI Flag Threading (Existing Pattern)
**What:** Commander option -> PipelineOptions field -> conditional behavior in pipeline-runner
**When to use:** Every CLI flag follows this pattern
**Example:**
```typescript
// cli.ts -- add flags
.option("--skip-sim", "Skip simulation phase (scoring only)")
.option("--sim-timeout <ms>", "Per-opportunity simulation timeout in milliseconds")

// pipeline-runner.ts -- extend PipelineOptions
export interface PipelineOptions {
  // ... existing fields ...
  skipSim?: boolean;
  simTimeoutMs?: number;
}

// pipeline-runner.ts -- conditional skip (line ~437)
if (!options.skipSim) {
  // existing simulation block
} else {
  simResult = { results: [], totalSimulated: 0, totalFailed: 0, totalConfirmed: 0, totalInferred: 0 };
}
```

### Pattern 2: Per-Opportunity Error Isolation (New Pattern, Follows Scoring Precedent)
**What:** Wrap each opportunity in try/catch inside the simulation pipeline's for loop
**When to use:** Prevents one bad opportunity from killing the entire simulation phase
**Example:**
```typescript
// simulation-pipeline.ts -- wrap the per-opportunity block
for (let i = 0; i < sorted.length; i++) {
  const input = sorted[i];
  try {
    // Optionally wrap in withTimeout if timeoutMs is set
    const processOpp = async () => {
      // existing generator calls (decision flow, component map, mock test, integration surface)
    };

    if (timeoutMs) {
      await withTimeout((_signal) => processOpp(), timeoutMs);
    } else {
      await processOpp();
    }
  } catch (err) {
    // Log error, increment failure count, continue to next opportunity
    if (err instanceof TimeoutError) {
      console.error(`  Simulation timed out for ${l3Name} after ${err.timeoutMs}ms`);
    } else {
      console.error(`  Simulation failed for ${l3Name}: ${err instanceof Error ? err.message : String(err)}`);
    }
    totalFailed++;
    // Push a result with empty/default artifacts for this opportunity
    results.push({ l3Name, slug, artifacts: defaultArtifacts, validationSummary: defaultValidation });
    continue;
  }
}
```

### Pattern 3: Timeout with Partial Artifact Preservation
**What:** When timeout fires mid-simulation, generators that already completed have written files to disk. The timeout catch should NOT delete those files.
**When to use:** Locked decision from CONTEXT.md -- keep partial artifacts
**Key insight:** The existing generator pattern writes files synchronously to disk after each generator completes (`fs.writeFileSync`). If generator 1 and 2 finish, their files are on disk. If generator 3 times out, those files persist. The catch block just needs to NOT delete the directory.

### Anti-Patterns to Avoid
- **Wrapping each generator individually in withTimeout:** User decided timeout is per-opportunity, not per-generator. All 4 generators share one timeout budget.
- **Adding a default timeout value:** User explicitly decided no default -- simulations run unbounded unless `--sim-timeout` is passed.
- **Deleting partial artifacts on timeout:** User decided to keep partial artifacts that completed before timeout.
- **Making simulation errors affect exit code:** User decided simulation failures do NOT affect exit code (scoring outcomes only).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Promise timeout | Custom setTimeout race | `withTimeout` from `src/infra/timeout.ts` | Already handles AbortSignal, cleanup, TimeoutError class |
| CLI boolean flags | Manual argv parsing | Commander `.option("--skip-sim")` | Already the project pattern |
| CLI value flags | Manual parsing + validation | Commander `.option("--sim-timeout <ms>")` + parseInt | Consistent with `--concurrency`, `--max-tier` patterns |

## Common Pitfalls

### Pitfall 1: Timeout Not Aborting In-Progress LLM Calls
**What goes wrong:** `withTimeout` fires, but the underlying Ollama/vLLM HTTP request keeps running in the background.
**Why it happens:** The generators don't currently accept an `AbortSignal` to cancel in-flight requests.
**How to avoid:** Accept this limitation for now -- the timeout prevents the pipeline from hanging, even if the background request eventually completes. The generators use `fetch()` internally which supports AbortSignal, but threading it through would be a larger change. The timeout's primary value is pipeline progress, not resource cleanup.
**Warning signs:** After a timeout, you may see a delayed log from the aborted generator completing.

### Pitfall 2: simErrorCount vs errorCount Confusion
**What goes wrong:** Mixing simulation error counts with scoring error counts in PipelineResult.
**Why it happens:** Both are "errors" but from different pipeline phases.
**How to avoid:** Keep them separate: `errorCount` for scoring errors, `simErrorCount` for simulation errors. CLI summary should display both. The `errors[]` array in PipelineResult is for scoring errors only.

### Pitfall 3: Skip-Sim Still Needs promotedCount
**What goes wrong:** Assuming skip-sim means no promoted opportunities to compute.
**Why it happens:** Confusing "skip simulation execution" with "skip promotion calculation."
**How to avoid:** The promotion threshold (composite >= 0.60) is computed during scoring, before simulation. `--skip-sim` only skips the simulation execution, not the promotion determination. The `promotedCount` field on PipelineResult should still be populated.

### Pitfall 4: Report Formatting When simResult Is Empty
**What goes wrong:** `formatSummary` and `formatMetaReflection` receive an empty SimulationPipelineResult and display "Simulations Completed: 0" instead of the skip note.
**Why it happens:** The skip-sim path must produce a different display than "simulation ran but found nothing."
**How to avoid:** Either pass a flag/sentinel into the report formatters indicating sim was skipped, or handle it in `pipeline-runner.ts` when building the CLI output. For report files, the `formatSummary` function should accept an optional `simSkipped: boolean` parameter.

### Pitfall 5: parseInt Validation for --sim-timeout
**What goes wrong:** User passes `--sim-timeout abc` and gets NaN behavior.
**Why it happens:** Commander passes the raw string value.
**How to avoid:** Follow the exact pattern from `--concurrency` validation (cli.ts lines 112-116): `parseInt`, check `isNaN`, check `> 0`.

## Code Examples

### Current CLI Flag Pattern (from cli.ts)
```typescript
// Source: src/cli.ts:58-63
.option(
  "--concurrency <n>",
  "Number of opportunities to score in parallel (default: 1)",
  "1",
)
.option(
  "--max-tier <n>",
  "Only score opportunities up to this tier (1, 2, or 3)",
  "3",
)
```

### Current Simulation Block in pipeline-runner.ts (lines 437-460)
```typescript
// Source: src/pipeline/pipeline-runner.ts:437-460
const promoted = finalScoredResults.filter((sr) => sr.promotedToSimulation);
const simInputs = toSimulationInputs(promoted, l3Map, l4Map, data.company_context);
const simDir = path.join(options.outputDir, "evaluation", "simulations");

let simResult: SimulationPipelineResult;
try {
  const runSim = options.runSimulationPipelineFn ?? defaultRunSimulationPipeline;
  simResult = await runSim(simInputs, simDir);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  logger.warn({ error: msg }, "Simulation pipeline failed (non-fatal)");
  simResult = {
    results: [],
    totalSimulated: 0,
    totalFailed: 0,
    totalConfirmed: 0,
    totalInferred: 0,
  };
}
```

### withTimeout Usage Pattern (from scoring in pipeline-runner.ts)
```typescript
// Source: src/pipeline/pipeline-runner.ts:327-339
const resilient = await withTimeout(
  (_signal) => callWithResilience({
    primaryCall: async () => { /* ... */ },
    schema: z.any(),
    label: triage.l3Name,
    maxRetries: 1,
  }),
  requestTimeoutMs,
);
```

### Current SimulationPipelineResult Interface
```typescript
// Source: src/simulation/simulation-pipeline.ts:40-46
export interface SimulationPipelineResult {
  results: SimulationResult[];
  totalSimulated: number;
  totalFailed: number;
  totalConfirmed: number;
  totalInferred: number;
}
```

### Current PipelineResult Interface (needs simErrorCount)
```typescript
// Source: src/pipeline/pipeline-runner.ts:89-102
export interface PipelineResult {
  triageCount: number;
  scoredCount: number;
  promotedCount: number;
  skippedCount: number;
  errorCount: number;
  resumedCount: number;
  simulatedCount: number;
  totalDurationMs: number;
  concurrency: number;
  avgPerOppMs: number;
  errors: string[];
  costSummary?: CostSummary;
}
```

## State of the Art

No external library changes needed. All changes are internal wiring.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simulation always runs | Conditional via `--skip-sim` | This phase | Users can skip costly simulation |
| No per-opp timeout | `--sim-timeout <ms>` per opportunity | This phase | Prevents hung pipelines |
| Single try/catch around entire simulation | Per-opportunity try/catch | This phase | One bad opp doesn't kill all sims |

## Open Questions

1. **Should `runSimulationPipeline` signature change to accept `timeoutMs`?**
   - What we know: Currently takes `(inputs, outputDir, ollamaUrl?, deps?)`. Adding `timeoutMs` as a parameter is clean.
   - What's unclear: Whether to add it as a positional param or wrap in an options object.
   - Recommendation: Add an optional `options` object parameter: `{ timeoutMs?: number }` to keep the signature extensible. This avoids positional parameter sprawl.

2. **How to signal "sim skipped" to report formatters?**
   - What we know: `formatSummary` currently takes `SimulationPipelineResult`. An empty result looks like "sim ran, found nothing" which is different from "sim was skipped."
   - What's unclear: Whether to add a `skipped` flag to `SimulationPipelineResult` or pass a separate boolean.
   - Recommendation: Pass a separate `simSkipped: boolean` parameter to `formatSummary` and `formatMetaReflection`. Simpler than overloading the result type.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `assert/strict` |
| Config file | None (project convention: `npx tsx --test`) |
| Quick run command | `cd src && npx tsx --test simulation/simulation-pipeline.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SIM-01 | `--skip-sim` bypasses simulation, pipeline completes scoring | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | Existing file, new test needed |
| SIM-01 | Summary report shows "Simulation: skipped" note | unit | `cd src && npx tsx --test output/format-summary.test.ts` | Existing file, new test needed |
| SIM-01 | Tier-1 report omits simulation sections when skipped | unit | `cd src && npx tsx --test output/format-tier1-report.test.ts` | Existing file, new test needed |
| SIM-01 | CLI output shows "Simulated: skipped" | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | Existing file, new test needed |
| SIM-02 | `--sim-timeout 200` terminates slow simulations | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | Existing file, new test needed |
| SIM-02 | Timeout keeps partial artifacts from completed generators | unit | `cd src && npx tsx --test simulation/simulation-pipeline.test.ts` | Existing file, new test needed |
| SIM-03 | One opportunity failure does not block remaining simulations | unit | `cd src && npx tsx --test simulation/simulation-pipeline.test.ts` | Existing file, new test needed |
| SIM-03 | `simErrorCount` tracked on PipelineResult | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | Existing file, new test needed |

### Sampling Rate
- **Per task commit:** `cd src && npx tsx --test simulation/simulation-pipeline.test.ts pipeline/pipeline-runner.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. All test files already exist; only new test cases need to be added.

## Sources

### Primary (HIGH confidence)
- `src/cli.ts` -- Commander option patterns, CLI flag threading
- `src/pipeline/pipeline-runner.ts` -- PipelineOptions, PipelineResult, simulation wiring (lines 437-460)
- `src/simulation/simulation-pipeline.ts` -- Simulation pipeline loop, generator orchestration, PipelineDeps injection
- `src/infra/timeout.ts` -- `withTimeout` utility, `TimeoutError` class
- `src/pipeline/pipeline-runner.test.ts` -- Existing test patterns, mock simulation pipeline factory
- `src/simulation/simulation-pipeline.test.ts` -- Existing simulation test patterns, mock generators

### Secondary (MEDIUM confidence)
- `src/output/format-summary.ts` -- Summary formatting that needs skip-sim awareness
- `src/output/format-tier1-report.ts` -- Tier-1 report simulation section formatting
- `src/output/format-meta-reflection.ts` -- Meta-reflection simulation metrics

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all patterns already exist in codebase
- Architecture: HIGH -- direct inspection of all integration points, clear wiring path
- Pitfalls: HIGH -- based on direct code reading, not speculative

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable internal codebase, no external dependencies)
