# Phase 11: Wire Simulation Pipeline - Research

**Researched:** 2026-03-11
**Domain:** Pipeline integration / adapter pattern / TypeScript wiring
**Confidence:** HIGH

## Summary

Phase 11 closes the last remaining integration gap from the v1.0 milestone audit: `runSimulationPipeline` (Phase 6) is never called from `pipeline-runner.ts`, and no `ScoringResult -> SimulationInput` adapter exists. The pipeline currently passes a hardcoded empty `SimulationPipelineResult` to `writeFinalReports`, resulting in zero simulation artifacts and zero simulation metrics in `summary.md`.

All underlying modules are fully built and tested: the four generators (decision flow, component map, mock test, integration surface), the simulation pipeline orchestrator, the knowledge validator, and the final reports writer that already accepts `SimulationPipelineResult`. The work is purely wiring: build an adapter function, call `runSimulationPipeline` at the right point in the pipeline, and replace the hardcoded empty result with the real one.

**Primary recommendation:** Create a pure `scoringResultsToSimulationInputs` adapter, insert `runSimulationPipeline` call between scoring completion and `writeFinalReports`, and pass real results through.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIMU-01 | Generate Mermaid decision flow diagrams for qualifying opportunities | Simulation pipeline already calls `generateDecisionFlow`; wiring it into pipeline-runner makes this happen for real data |
| SIMU-02 | Produce YAML component maps linking to Aera components | Simulation pipeline already calls `generateComponentMap`; wiring enables real execution |
| SIMU-03 | Create mock decision tests with client financials | Simulation pipeline already calls `generateMockTest`; adapter passes `companyContext` from export |
| SIMU-04 | Map integration surfaces per simulated opportunity | Simulation pipeline already calls `generateIntegrationSurface`; wiring enables execution |
| KNOW-04 | Generated component maps reference only real Aera components | Knowledge validator runs inside `generateComponentMap` via `buildKnowledgeIndex`; wiring the pipeline makes this execute |
| OUTP-05 | Produce `evaluation/simulations/<skill-name>/` directories | `runSimulationPipeline` writes files to `outputDir/<slug>/`; pipeline-runner must pass correct `simDir` path |
| OUTP-06 | Produce `evaluation/summary.md` with non-zero simulation metrics | Replace `emptySimResult` with real `SimulationPipelineResult` in `writeFinalReports` call |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | strict mode | All source code | Project convention |
| node:test | built-in | Test runner | Project convention (no external test frameworks) |
| node:assert/strict | built-in | Assertions | Project convention |
| js-yaml | (installed) | YAML dump for simulation artifacts | Already used by simulation-pipeline.ts |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.25.x | Schema validation | Not needed for adapter (types already defined) |
| pino | v10 | Structured logging | Logger already injected into pipeline-runner |

No new dependencies required. This phase is pure wiring of existing modules.

## Architecture Patterns

### Adapter Function Pattern

The core new code is a pure function that transforms `ScoringResult[]` (Phase 4 output) + lookup data into `SimulationInput[]` (Phase 6 input).

**Type gap analysis:**

| SimulationInput field | Source | How to get it |
|----------------------|--------|---------------|
| `opportunity` | `L3Opportunity` | Look up from `l3Map` by `sr.l3Name` |
| `l4s` | `L4Activity[]` | Look up from `l4Map` by `sr.l3Name` |
| `companyContext` | `CompanyContext` | From `data.company_context` (already in scope) |
| `archetype` | `LeadArchetype` | `sr.archetype` (direct copy) |
| `archetypeRoute` | `string` | `getRouteForArchetype(sr.archetype).primary_route` |
| `composite` | `number` | `sr.composite` (direct copy) |

**Key filter:** Only opportunities where `sr.promotedToSimulation === true` (composite >= 0.60) should become simulation inputs.

### Pipeline Runner Insertion Point

Current pipeline-runner.ts flow (steps 10-10c):
```
10.  Final archive flush
10a. writeEvaluation (added in Phase 10)
10b. autoCommitEvaluation
10c. writeFinalReports (with emptySimResult) <-- REPLACE
11.  Unload models
```

New flow:
```
10.  Final archive flush
10a. writeEvaluation
10b. Run simulation pipeline          <-- NEW
10c. autoCommitEvaluation (moved after simulation so artifacts are committed)
10d. writeFinalReports (with REAL simResult)  <-- MODIFIED
11.  Unload models
```

**Important ordering:** Simulation must run BEFORE git auto-commit so simulation artifacts are included in the commit. Simulation must run BEFORE `writeFinalReports` so real metrics appear in `summary.md`.

### Simulation Output Directory

`runSimulationPipeline` expects `outputDir` to be the directory where it creates `<slug>/` subdirectories. The pipeline runner's `outputDir` is the root. Simulation files should go to `evaluation/simulations/`. So pass:

```typescript
path.join(options.outputDir, "evaluation", "simulations")
```

Note: `writeFinalReports` ALSO writes simulation artifacts to `evaluation/simulations/<slug>/` (see lines 60-76 of write-final-reports.ts). This creates a **double-write concern**: `runSimulationPipeline` writes files via `fs.writeFileSync`, then `writeFinalReports` writes the same files again via `fs.writeFile`. Since the content is identical (both sourced from the same `SimulationPipelineResult`), this is harmless but redundant. The planner should decide whether to:
1. Accept the redundancy (simplest, no code changes to existing modules)
2. Skip the `writeFinalReports` simulation artifact writing (requires modifying write-final-reports.ts)

**Recommendation:** Accept redundancy. It is harmless and avoids modifying a tested module.

### Dependency Injection for Tests

`runSimulationPipeline` already accepts a `PipelineDeps` parameter for testing. The pipeline-runner test should inject mock deps to avoid actual LLM calls. Options:

1. **Add `simulationDeps` to PipelineOptions** -- cleanest, follows existing DI patterns (like `chatFn`, `fetchFn`, `parseExportFn`)
2. **Add `runSimulationPipelineFn` to PipelineOptions** -- inject the entire function

Option 1 is more consistent with the simulation pipeline's existing `PipelineDeps` interface. Option 2 is simpler and matches `parseExportFn` pattern.

**Recommendation:** Option 2 -- inject `runSimulationPipelineFn` into `PipelineOptions` for consistency with `parseExportFn` pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Archetype -> route mapping | Custom lookup table | `getRouteForArchetype()` from `knowledge/orchestration.ts` | Already built, tested, uses bundled decision guide |
| L3/L4 lookup | Re-query parsed data | `l3Map` and `l4Map` already computed in pipeline-runner | Variables already in scope at insertion point |
| Simulation file I/O | Custom file writers | `runSimulationPipeline` handles all file creation | Already creates directories and writes all 4 artifacts |
| Knowledge validation | Custom component checker | `buildKnowledgeIndex` called inside simulation pipeline | Already wired in Phase 6 |

## Common Pitfalls

### Pitfall 1: Output Directory Path Mismatch
**What goes wrong:** `runSimulationPipeline` receives `options.outputDir` directly, creating `<slug>/` directories at the root output level instead of under `evaluation/simulations/`.
**Why it happens:** The simulation pipeline takes a flat `outputDir` and creates slug dirs directly inside it.
**How to avoid:** Pass `path.join(options.outputDir, "evaluation", "simulations")` as the simulation output directory.
**Warning signs:** Simulation artifact directories appear at `<outputDir>/opp-name/` instead of `<outputDir>/evaluation/simulations/opp-name/`.

### Pitfall 2: Scoring Model Still Loaded During Simulation
**What goes wrong:** The scoring model (32B) is still loaded when simulation pipeline runs, which also needs the 32B model. This is actually fine -- both use the same model. But if model management changes, watch out.
**How to avoid:** Keep `ensureScoringModel()` call where it is (before scoring loop). Simulation generators use Ollama's default loaded model. No additional model switching needed.

### Pitfall 3: Forgetting to Filter Promoted-Only Results
**What goes wrong:** All scored opportunities sent to simulation, including those below the 0.60 threshold.
**Why it happens:** Using `allScoredResults` directly instead of filtering by `promotedToSimulation`.
**How to avoid:** `allScoredResults.filter(sr => sr.promotedToSimulation)` before adapter.

### Pitfall 4: Empty Promoted List Short-Circuits Gracefully
**What goes wrong:** If no opportunities are promoted (all below 0.60), the simulation pipeline receives an empty array.
**Why it happens:** Possible with low-quality data or strict scoring.
**How to avoid:** `runSimulationPipeline` already handles empty inputs (returns zero counts). No special casing needed.

### Pitfall 5: Git Auto-Commit Before Simulation Completes
**What goes wrong:** `autoCommitEvaluation` runs before simulation artifacts exist, so they are not committed.
**How to avoid:** Move `autoCommitEvaluation` after the simulation pipeline call.

## Code Examples

### Adapter Function
```typescript
// Source: Derived from type analysis of ScoringResult and SimulationInput
import type { ScoringResult } from "../types/scoring.js";
import type { SimulationInput } from "../types/simulation.js";
import type { L3Opportunity, L4Activity, CompanyContext } from "../types/hierarchy.js";
import { getRouteForArchetype } from "../knowledge/orchestration.js";

export function toSimulationInputs(
  promoted: ScoringResult[],
  l3Map: Map<string, L3Opportunity>,
  l4Map: Map<string, L4Activity[]>,
  companyContext: CompanyContext,
): SimulationInput[] {
  const inputs: SimulationInput[] = [];
  for (const sr of promoted) {
    const opp = l3Map.get(sr.l3Name);
    if (!opp) continue; // defensive -- should never happen
    const l4s = l4Map.get(sr.l3Name) ?? [];
    const mapping = getRouteForArchetype(sr.archetype);
    inputs.push({
      opportunity: opp,
      l4s,
      companyContext,
      archetype: sr.archetype,
      archetypeRoute: mapping.primary_route,
      composite: sr.composite,
    });
  }
  return inputs;
}
```

### Pipeline Runner Wiring (insertion after step 10a)
```typescript
// Source: Derived from existing pipeline-runner.ts structure
import { runSimulationPipeline } from "../simulation/simulation-pipeline.js";

// After writeEvaluation, before autoCommitEvaluation:
const promoted = allScoredResults.filter(sr => sr.promotedToSimulation);
const simInputs = toSimulationInputs(promoted, l3Map, l4Map, data.company_context);
const simDir = path.join(options.outputDir, "evaluation", "simulations");
const simResult = await (options.runSimulationPipelineFn ?? runSimulationPipeline)(
  simInputs,
  simDir,
);

logger.info({
  simulated: simResult.totalSimulated,
  failed: simResult.totalFailed,
  confirmed: simResult.totalConfirmed,
  inferred: simResult.totalInferred,
}, "Simulation pipeline complete");

// Then pass simResult to writeFinalReports instead of emptySimResult
```

### Test Mock for Simulation Pipeline
```typescript
// Source: Follows existing test patterns in pipeline-runner.test.ts
function makeSimulationPipelineFn(options?: { fail?: boolean }) {
  return async (inputs: SimulationInput[], outputDir: string) => {
    if (options?.fail) {
      throw new Error("Simulation failed");
    }
    // Create directories for each input (mimics real behavior for file assertions)
    for (const input of inputs) {
      const slug = input.opportunity.l3_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const dir = path.join(outputDir, slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "decision-flow.mmd"), "graph TD\n  A-->B", "utf-8");
      fs.writeFileSync(path.join(dir, "component-map.yaml"), "streams: []\n", "utf-8");
      fs.writeFileSync(path.join(dir, "mock-test.yaml"), "decision: test\n", "utf-8");
      fs.writeFileSync(path.join(dir, "integration-surface.yaml"), "source_systems: []\n", "utf-8");
    }
    return {
      results: inputs.map(i => ({
        l3Name: i.opportunity.l3_name,
        slug: i.opportunity.l3_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        artifacts: {
          decisionFlow: "graph TD\n  A-->B",
          componentMap: { streams: [], cortex: [], process_builder: [], agent_teams: [], ui: [] },
          mockTest: { decision: "test", input: { financial_context: {}, trigger: "test" }, expected_output: { action: "act", outcome: "ok" }, rationale: "test" },
          integrationSurface: { source_systems: [], aera_ingestion: [], processing: [], ui_surface: [] },
        },
        validationSummary: { confirmedCount: 1, inferredCount: 0, mermaidValid: true },
      })),
      totalSimulated: inputs.length,
      totalFailed: 0,
      totalConfirmed: inputs.length,
      totalInferred: 0,
    };
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `emptySimResult` | Real `SimulationPipelineResult` | Phase 11 (this phase) | summary.md shows actual simulation metrics |
| No simulation execution | Full 4-generator simulation pipeline | Phase 11 (this phase) | SIMU-01 through SIMU-04, KNOW-04 satisfied |

## Open Questions

1. **Should simulation failures be fatal to pipeline?**
   - What we know: Current pipeline treats `writeEvaluation` and `writeFinalReports` failures as non-fatal (logs warning, continues). Simulation generators already handle partial failure internally.
   - Recommendation: Wrap `runSimulationPipeline` in try-catch, treat failure as non-fatal (log warning), pass `emptySimResult` as fallback. Consistent with existing error handling philosophy.

2. **Should `PipelineResult` include simulation counts?**
   - What we know: Current `PipelineResult` has `triageCount`, `scoredCount`, `promotedCount` but no simulation counts.
   - Recommendation: Add `simulatedCount` to `PipelineResult` for completeness. Low-risk additive change.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none (uses npx tsx --test) |
| Quick run command | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SIMU-01 | Decision flow files created in evaluation/simulations/ | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | Wave 0 (new test case) |
| SIMU-02 | Component map YAML files created | integration | same as above | Wave 0 |
| SIMU-03 | Mock test YAML files created | integration | same as above | Wave 0 |
| SIMU-04 | Integration surface YAML files created | integration | same as above | Wave 0 |
| KNOW-04 | Component maps use real Aera components | integration | verified transitively via simulation pipeline tests | Exists in simulation-pipeline.test.ts |
| OUTP-05 | evaluation/simulations/<skill-name>/ directories exist | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | Wave 0 |
| OUTP-06 | summary.md has non-zero simulation metrics | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx tsx --test pipeline/pipeline-runner.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] New test case in `pipeline-runner.test.ts` -- "runs simulation pipeline for promoted opportunities and produces artifact directories"
- [ ] New test case in `pipeline-runner.test.ts` -- "passes real simulation results to writeFinalReports (non-zero metrics in summary.md)"
- [ ] New test case in `pipeline-runner.test.ts` -- "simulation pipeline failure is non-fatal"
- [ ] Adapter unit test: `toSimulationInputs` converts ScoringResult[] correctly (could be in adapter file or pipeline-runner.test.ts)

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `src/pipeline/pipeline-runner.ts` (current pipeline flow, hardcoded emptySimResult at line 284-290)
- Direct code inspection of `src/simulation/simulation-pipeline.ts` (runSimulationPipeline signature, PipelineDeps interface)
- Direct code inspection of `src/types/simulation.ts` (SimulationInput type definition)
- Direct code inspection of `src/types/scoring.ts` (ScoringResult type definition)
- Direct code inspection of `src/knowledge/orchestration.ts` (getRouteForArchetype function)
- Direct code inspection of `src/output/write-final-reports.ts` (writeFinalReports signature, simulation artifact writing)
- `.planning/v1.0-MILESTONE-AUDIT.md` (gap analysis, root cause identification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all modules exist and are tested
- Architecture: HIGH - adapter pattern is straightforward, insertion point is clear
- Pitfalls: HIGH - derived from direct code analysis of both modules' type contracts

**Research date:** 2026-03-11
**Valid until:** indefinite (pure integration wiring of stable internal modules)
