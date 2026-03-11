# Phase 9: Final Reports & Reflection - Research

**Researched:** 2026-03-11
**Domain:** Report generation, file output orchestration, markdown formatting
**Confidence:** HIGH

## Summary

Phase 9 produces the final four output artifacts that complete the evaluation bundle: simulation file bundles (OUTP-05), executive summary (OUTP-06), dead zones report (OUTP-07), and meta-reflection (OUTP-08). This phase consumes data already produced by Phases 3-6 (triage results, scoring results, simulation results) and transforms them into user-facing markdown and organized directory structures.

The implementation follows the exact same pattern established in Phase 5's `output/` module: pure formatter functions that take typed data and return strings, plus an orchestrator function that writes files to disk. No LLM calls are needed -- all data is already available from upstream pipeline stages. The meta-reflection (OUTP-08) is the only artifact that requires cross-cutting analysis logic, but it operates on already-computed scores and flags, not raw text requiring LLM reasoning.

**Primary recommendation:** Follow the Phase 5 `output/` module pattern exactly -- pure formatter functions per file, extended `writeEvaluation` orchestrator, TDD with fixture helpers.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OUTP-05 | Engine produces evaluation/simulations/<skill-name>/ with decision flows, component maps, mock tests | Simulation pipeline (Phase 6) already writes these files. This requirement needs the orchestrator to ensure the simulations directory is created under evaluation/ and populated by the simulation pipeline. |
| OUTP-06 | Engine produces evaluation/summary.md with executive summary of top 10 opportunities | New formatter: takes ScoringResult[] + TriageResult[] + SimulationPipelineResult, selects top 10 by composite, produces markdown with key metrics and recommendations. |
| OUTP-07 | Engine produces evaluation/dead-zones.md with areas explicitly recommended against | New formatter: takes TriageResult[] (filtered to DEAD_ZONE + PHANTOM + NO_STAKES flags), groups by L1/L2 domain, produces markdown with explicit "do not pursue" recommendations and reasoning. |
| OUTP-08 | Engine produces evaluation/meta-reflection.md with catalog-level pattern analysis | New formatter: takes all results (triage + scoring + simulation), computes cross-cutting statistics (archetype distribution, common red flags, domain strength patterns, knowledge base coverage), produces analytical markdown. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:fs/promises | built-in | Async file writing | Already used in writeEvaluation |
| node:path | built-in | Path manipulation | Already used throughout |
| node:test | built-in | Test runner | Project convention |
| assert/strict | built-in | Test assertions | Project convention |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| js-yaml | 4.1.1 | YAML dumping for simulation artifacts | Already a dependency, used if simulation data needs re-serialization |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Template literals | Handlebars/EJS | Overkill for markdown; all existing formatters use template literals successfully |
| LLM-generated summaries | Pure data aggregation | LLM not needed; scores, flags, and simulation data already contain all necessary information |

**Installation:**
```bash
# No new dependencies needed -- all libraries already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  output/
    format-summary.ts            # OUTP-06: executive summary formatter
    format-summary.test.ts
    format-dead-zones.ts         # OUTP-07: dead zones formatter
    format-dead-zones.test.ts
    format-meta-reflection.ts    # OUTP-08: meta-reflection formatter
    format-meta-reflection.test.ts
    write-evaluation.ts          # Extended to include new files + simulations dir
    write-evaluation.test.ts     # Extended tests
```

### Pattern 1: Pure Formatter Function
**What:** Each output file has a dedicated pure function that takes typed data and returns a string.
**When to use:** Every new report file (summary.md, dead-zones.md, meta-reflection.md).
**Example:**
```typescript
// Follows exact pattern from format-adoption-risk.ts and format-tier1-report.ts
export function formatSummary(
  scored: ScoringResult[],
  triaged: TriageResult[],
  simulationResults: SimulationPipelineResult,
  companyName: string,
  date?: string,
): string {
  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  // ... build markdown with template literals
  return lines.join("\n") + "\n";
}
```

### Pattern 2: Orchestrator Extension
**What:** The existing `writeEvaluation` function gets extended with new file entries and the simulations directory path.
**When to use:** Wiring all formatters into the file output pipeline.
**Key consideration:** `writeEvaluation` currently takes `ScoringResult[]` and `TriageResult[]`. It needs to also accept `SimulationPipelineResult` for the new formatters. The simulation pipeline already writes its own files to `evaluation/simulations/<slug>/`, so the orchestrator just needs to ensure the simulation output directory is set correctly.

### Pattern 3: Date Injection for Deterministic Tests
**What:** All formatters accept an optional `date` parameter to avoid non-deterministic `new Date()` calls in tests.
**When to use:** Every formatter function signature.
**Already established:** Phase 5 formatters all use this pattern.

### Anti-Patterns to Avoid
- **LLM calls for report generation:** All data is already computed. The meta-reflection computes statistics from structured data, not from free-text analysis.
- **Duplicate type definitions:** Reuse existing `ScoringResult`, `TriageResult`, `SimulationPipelineResult` types. Do not create wrapper types.
- **Coupling simulation file writing to this phase:** The simulation pipeline (Phase 6) already writes `decision-flow.mmd`, `component-map.yaml`, `mock-test.yaml`, `integration-surface.yaml` per opportunity. Phase 9 just needs to ensure the output directory is `evaluation/simulations/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML serialization | Custom YAML writer | js-yaml `dump()` | Already used in simulation pipeline |
| Slug generation | Custom slugify | `slugify()` from simulation/utils.ts | Already implemented and tested |
| Markdown table formatting | Custom table builder | Template literal lines with `\|` separators | Consistent with all existing formatters |

**Key insight:** This phase is pure data formatting. Every piece of data it needs already exists as a typed TypeScript value from upstream phases.

## Common Pitfalls

### Pitfall 1: OUTP-05 Confusion -- Simulation Files Already Exist
**What goes wrong:** Building new simulation file writers when the simulation pipeline already writes them.
**Why it happens:** OUTP-05 says "Engine produces evaluation/simulations/<skill-name>/" but Phase 6's `runSimulationPipeline` already writes these files.
**How to avoid:** OUTP-05 is satisfied by ensuring the simulation pipeline's `outputDir` parameter points to `evaluation/simulations/`. The orchestrator just needs to pass the right path. No new file writing for simulation artifacts.
**Warning signs:** Creating new functions that serialize ComponentMap, MockTest, etc. to files.

### Pitfall 2: Meta-Reflection Scope Creep
**What goes wrong:** Trying to make meta-reflection use LLM for "insights" instead of computing statistics.
**Why it happens:** "Catalog-level pattern analysis" sounds like it needs AI reasoning.
**How to avoid:** Meta-reflection should compute: archetype distribution percentages, most common red flags, domain-level scoring averages, knowledge base coverage stats (confirmed vs inferred), top/bottom performing domains. All computable from structured data.
**Warning signs:** Importing ollamaChat or any LLM client.

### Pitfall 3: Breaking writeEvaluation Signature
**What goes wrong:** Adding too many parameters to writeEvaluation, making it unwieldy.
**Why it happens:** Each new report needs different data inputs.
**How to avoid:** Use an options object pattern: `writeEvaluation(outputDir, options: EvaluationData)` where `EvaluationData` bundles all typed inputs. Or add a separate `writeFinalReports` function that handles Phase 9 files.
**Warning signs:** Function signature with 8+ positional parameters.

### Pitfall 4: Non-Deterministic Test Output
**What goes wrong:** Tests fail intermittently because formatters use `new Date()`.
**Why it happens:** Forgetting to pass the `date` parameter in formatter calls.
**How to avoid:** Every formatter MUST accept optional `date` parameter. Every test MUST pass a fixed date string.
**Warning signs:** Tests that pass locally but fail in CI, or flaky timestamp assertions.

## Code Examples

### Executive Summary Structure (OUTP-06)
```typescript
// Top 10 opportunities by composite score
// Source: Derived from existing format-tier1-report.ts pattern
export function formatSummary(
  scored: ScoringResult[],
  triaged: TriageResult[],
  simResults: SimulationPipelineResult,
  companyName: string,
  date?: string,
): string {
  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const top10 = [...scored]
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 10);

  const lines: string[] = [];
  lines.push(`# Executive Summary: ${companyName}`);
  lines.push("");
  lines.push(`**Generated:** ${dateStr}`);
  lines.push(`**Total opportunities evaluated:** ${scored.length}`);
  lines.push(`**Promoted to simulation:** ${scored.filter(s => s.promotedToSimulation).length}`);
  lines.push(`**Simulations completed:** ${simResults.totalSimulated}`);
  lines.push("");
  lines.push("## Top 10 Opportunities");
  lines.push("");
  lines.push("| Rank | Opportunity | Composite | Archetype | Confidence | Simulated |");
  lines.push("|------|-------------|-----------|-----------|------------|-----------|");
  for (let i = 0; i < top10.length; i++) {
    const s = top10[i];
    const simulated = simResults.results.some(r => r.l3Name === s.l3Name) ? "Yes" : "No";
    lines.push(`| ${i + 1} | ${s.l3Name} | ${s.composite.toFixed(2)} | ${s.archetype} | ${s.overallConfidence} | ${simulated} |`);
  }
  // ... additional sections
  return lines.join("\n") + "\n";
}
```

### Dead Zones Report Structure (OUTP-07)
```typescript
// Source: Derived from existing format-adoption-risk.ts pattern
export function formatDeadZones(
  triaged: TriageResult[],
  scored: ScoringResult[],
  date?: string,
): string {
  // Filter to skip/demote actions from triage
  const deadZones = triaged.filter(t =>
    t.redFlags.some(f => f.type === "DEAD_ZONE" || f.type === "PHANTOM")
  );
  const noStakes = triaged.filter(t =>
    t.redFlags.some(f => f.type === "NO_STAKES")
  );
  // Group by L1 domain for pattern detection
  // Produce explicit "Do Not Pursue" recommendations
  // ...
}
```

### Meta-Reflection Computed Statistics (OUTP-08)
```typescript
// Source: Novel for this phase but follows existing pure function pattern
interface CatalogStats {
  totalOpportunities: number;
  archetypeDistribution: Record<string, number>;  // count per archetype
  tierDistribution: Record<number, number>;        // count per tier
  redFlagFrequency: Record<string, number>;        // count per flag type
  domainScores: Map<string, { avg: number; count: number }>;  // L1 domain averages
  knowledgeCoverage: { confirmed: number; inferred: number };
  simulationSuccessRate: number;
}

function computeCatalogStats(
  triaged: TriageResult[],
  scored: ScoringResult[],
  simResults: SimulationPipelineResult,
): CatalogStats {
  // Pure computation from typed data
  // No LLM needed
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 5 wrote 4 files | Phase 9 extends to write 7+ files total | Phase 9 | writeEvaluation needs expansion or companion function |
| Simulation pipeline wrote to arbitrary dir | Simulation output must land in evaluation/simulations/ | Phase 9 | Pipeline runner must set correct output path |

**Existing infrastructure that Phase 9 builds on:**
- `writeEvaluation` in `output/write-evaluation.ts` -- the orchestrator to extend
- `SimulationPipelineResult` in `simulation/simulation-pipeline.ts` -- simulation data source
- `slugify` in `simulation/utils.ts` -- directory naming for simulation bundles
- All formatter patterns in `output/format-*.ts` -- template for new formatters

## Open Questions

1. **Should writeEvaluation be extended or should a new writeFinalReports function be created?**
   - What we know: writeEvaluation currently handles 4 files with a specific signature. Phase 9 adds 3 more files plus simulation directory management.
   - What's unclear: Whether extending the existing function or creating a companion is cleaner.
   - Recommendation: Create a new `writeFinalReports` function that handles Phase 9 files (summary.md, dead-zones.md, meta-reflection.md) and is called alongside `writeEvaluation` from the pipeline runner. OUTP-05 (simulation directory) is handled by the pipeline runner passing the correct path to `runSimulationPipeline`.

2. **How much analysis depth should meta-reflection contain?**
   - What we know: It should surface "cross-cutting insights" and "catalog-level patterns."
   - What's unclear: Exactly which statistics are most valuable.
   - Recommendation: Start with: archetype distribution, red flag frequency, domain-level composite averages, knowledge coverage (confirmed vs inferred counts from simulation), top 3 strongest and weakest domains. All computable from existing typed data.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None (uses package.json `"test": "node --test"`) |
| Quick run command | `npx tsx --test src/output/format-summary.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OUTP-05 | Simulation files organized under evaluation/simulations/<slug>/ | integration | `npx tsx --test src/output/write-final-reports.test.ts` | No -- Wave 0 |
| OUTP-06 | summary.md with top 10 opportunities | unit | `npx tsx --test src/output/format-summary.test.ts` | No -- Wave 0 |
| OUTP-07 | dead-zones.md with explicit recommendations against | unit | `npx tsx --test src/output/format-dead-zones.test.ts` | No -- Wave 0 |
| OUTP-08 | meta-reflection.md with catalog-level pattern analysis | unit | `npx tsx --test src/output/format-meta-reflection.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsx --test src/output/<changed-file>.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/output/format-summary.test.ts` -- covers OUTP-06
- [ ] `src/output/format-dead-zones.test.ts` -- covers OUTP-07
- [ ] `src/output/format-meta-reflection.test.ts` -- covers OUTP-08
- [ ] `src/output/write-final-reports.test.ts` -- covers OUTP-05 integration + all file writing

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/output/write-evaluation.ts` -- existing orchestrator pattern
- Codebase analysis: `src/output/format-tier1-report.ts` -- formatter function pattern
- Codebase analysis: `src/output/format-adoption-risk.ts` -- red flag grouping pattern
- Codebase analysis: `src/simulation/simulation-pipeline.ts` -- SimulationPipelineResult type and file output
- Codebase analysis: `src/types/simulation.ts` -- all simulation artifact types
- Codebase analysis: `src/types/scoring.ts` -- ScoringResult type
- Codebase analysis: `src/types/triage.ts` -- TriageResult and RedFlag types

### Secondary (MEDIUM confidence)
- None needed -- this phase is entirely internal to the existing codebase

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns established
- Architecture: HIGH -- follows existing Phase 5 formatter pattern exactly
- Pitfalls: HIGH -- identified from direct codebase analysis of existing patterns

**Research date:** 2026-03-11
**Valid until:** Indefinitely (internal codebase patterns, not external dependencies)
