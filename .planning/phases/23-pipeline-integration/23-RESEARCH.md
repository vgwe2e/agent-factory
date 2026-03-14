# Phase 23: Pipeline Integration - Research

**Researched:** 2026-03-13
**Domain:** Pipeline orchestration, CLI flag routing, checkpoint schema migration, simulation adapter refactoring
**Confidence:** HIGH

## Summary

Phase 23 wires the two-pass scoring funnel (Phase 21 deterministic pre-scoring + Phase 22 consolidated LLM scorer) into the existing pipeline-runner.ts with a `--scoring-mode` CLI switch preserving v1.2 three-lens behavior. This is a pure integration phase -- no new algorithms, no new LLM calls, no new external dependencies. Every building block already exists: `preScoreAll()` from Phase 21, `scoreConsolidated()` from Phase 22, `toSimulationInputs()` for simulation bridging, `checkpoint.ts` for persistence, and `cli.ts` for Commander flags.

The primary complexity is structural: pipeline-runner.ts is a 580-line monolith that needs to branch cleanly between two scoring paths without duplicating shared infrastructure (ingestion, triage, model management, reporting). The checkpoint system needs a schema version bump from 1 to 2, with v1.2 checkpoint backup and version-aware loading. The simulation adapter needs an L4-level alternative alongside the existing L3-level `toSimulationInputs()`. Report formatters already consume the LensScore interface and ScoringResult type -- Phase 22's LensScore synthesis ensures they work unchanged.

**Primary recommendation:** Branch the pipeline at the scoring stage (after triage, before reports). The three-lens path is the existing code verbatim. The two-pass path calls preScoreAll(), filters, then runs scoreConsolidated() per survivor through the existing semaphore/checkpoint/retry infrastructure. Both paths converge at the report-writing stage via the shared ScoringResult[] shape.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `--scoring-mode` flag with values `two-pass` and `three-lens`
- **Default is `two-pass`** when flag is omitted -- v1.3 is the standard path
- Users opt into v1.2 behavior explicitly with `--scoring-mode three-lens`
- If two-pass modules don't exist (Phases 21-22 not built), **error immediately** -- no silent fallback
- `--top-n` flag in three-lens mode: **warn and ignore** (print warning, continue running)
- CLI summary output adds a `Scoring mode: two-pass` line to both === Pipeline === and === Pipeline Complete === blocks
- **Header annotation** in report files indicating which scoring mode produced them (e.g., `Scoring Mode: two-pass`)
- Same filenames and locations as v1.2 -- no filename suffixes or structural changes
- Pre-score TSV artifact is **two-pass only** -- not written in three-lens mode
- Two-pass-specific stats (pre-score count, survivors, cutoff) shown **inline** with existing summary flow: Triaged -> Pre-scored -> Survivors -> LLM Scored -> Promoted -> Simulated
- L3 names displayed as **group headers** in reports, with L4 survivors listed underneath (preserves hierarchical context)
- v1.2 checkpoints (skill-level, version 1) are **incompatible** with two-pass mode -- start fresh
- Old checkpoint preserved as `.checkpoint.v12.bak` for safety before creating new checkpoint
- **Bump checkpoint schema to version 2** for two-pass checkpoints -- loadCheckpoint rejects mismatched versions per scoring mode
- Deterministic pre-scoring **always re-runs** on resume (<100ms, not worth checkpointing)
- Top-N filter **re-evaluates** on resume -- if user changed `--top-n` between runs, updated survivor count applies
- Only LLM scoring entries need checkpointing (L4 ID as checkpoint key)
- Simulation runs **per-L4 survivor** in two-pass mode (not re-grouped by L3)
- SimulationInput gains an `l4Activity` field as primary subject; existing `opportunity` (L3) field becomes optional metadata
- Simulation artifacts organized **flat by L4**: `simulations/{l4-slug}/`
- Archetype for simulation routing comes from the **L4 activity's own archetype field**, not inherited from parent L3

### Claude's Discretion
- Pipeline branching architecture (where two-pass vs three-lens paths diverge in pipeline-runner)
- Exact checkpoint version 2 schema fields and Zod definition
- LensScore synthesis implementation (mapping deterministic dimensions to existing lens shape)
- Internal function decomposition for the two-pass pipeline path
- How three-lens mode remains entirely untouched (code isolation strategy)

### Deferred Ideas (OUT OF SCOPE)
- CLI-configurable dimension weights (ADVN-01 -- deferred until Ford validation)
- Overlap group deduplication (ADVN-02)
- Tier-aware top-N slot allocation (ADVN-03)
- Pre-score histogram in summary reports (ADVN-05)
- A/B validation of two-pass vs three-lens rankings (Phase 24 scope -- VAL-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PIPE-01 | Updated pipeline-runner supports two-pass flow: deterministic pre-score -> top-N filter -> LLM scoring -> simulation | Branch after triage. Call `preScoreAll(hierarchy, topN)` for deterministic pass, then `scoreConsolidated()` per survivor via semaphore. Both paths produce ScoringResult[] for shared report stage. |
| PIPE-02 | `--scoring-mode two-pass\|three-lens` CLI flag for A/B comparison with v1.2 behavior | Commander `.addOption(new Option("--scoring-mode <mode>").choices(["two-pass", "three-lens"]).default("two-pass"))`. Add `scoringMode` to PipelineOptions. |
| PIPE-03 | Synthesize deterministic signals into existing LensScore shape so all report formatters work unchanged | Phase 22's `scoreConsolidated()` already produces LensScore objects (technical from LLM platform_fit, adoption/value from deterministic dimensions via scaleTo03). Report formatters consume LensScore.subDimensions by name -- sub-dimension names will differ but `subScore()` returns 0 for unrecognized names, so no crashes. |
| PIPE-04 | L3 names retained as metadata labels for report grouping (not as scoring unit) | ScoringResult already has `l3Name` field. Report formatters already reference it for grouping. No change needed to type -- just ensure two-pass scoring populates l3Name from the L4's parent. |
| PIPE-05 | Checkpoint system supports L4-level scoring with backward-compatible resume from v1.2 checkpoints | Add CheckpointV2Schema with `version: z.literal(2)`, `scoringMode` field, L4-keyed entries. loadCheckpoint attempts both schemas. Mode mismatch -> backup + fresh start. |
| SIM-01 | SimulationInput accepts L4 activity directly instead of L3 opportunity rollup | Add optional `l4Activity?: L4Activity` field to SimulationInput. Make `opportunity` optional. Simulation pipeline checks l4Activity first. |
| SIM-02 | scoring-to-simulation adapter produces L4-level simulation inputs from two-pass scoring results | New `toL4SimulationInputs()` function: maps each survivor's PreScoreResult + ScoringResult to a SimulationInput with l4Activity populated. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | existing | CLI `--scoring-mode` and `--top-n` flag routing | Already used in cli.ts for all flags |
| zod | ^3.24.0 | CheckpointV2Schema definition | Already used for CheckpointSchema v1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:test | built-in | Test runner | All test files co-located as *.test.ts |
| node:assert/strict | built-in | Assertions | TDD approach per project conventions |

No new dependencies. Everything builds on existing libraries.

## Architecture Patterns

### Recommended Pipeline Branching Strategy

The pipeline-runner.ts currently has a single linear flow. The cleanest branching point is after triage, replacing the scoring loop:

```
[shared] Ingestion -> Triage -> Model Setup
                                    |
                    +--------------+----------------+
                    |                                |
              [two-pass]                      [three-lens]
              preScoreAll()                   (existing code
              filterTopN()                     verbatim)
              scoreConsolidated()
              per survivor
                    |                                |
                    +--------------+----------------+
                                    |
[shared] Reports -> Simulation -> Git Commit -> Cleanup
```

### Recommended Function Decomposition

Extract the scoring loop from pipeline-runner.ts into two separate functions:

```typescript
// In pipeline-runner.ts or a new scoring-orchestrator.ts

/** v1.2 three-lens scoring path -- exact existing code extracted. */
async function runThreeLensScoring(
  processable: TriageResult[],
  skillMap: Map<string, SkillWithContext>,
  completed: Set<string>,
  options: PipelineOptions,
  // ... other deps
): Promise<{ scored: ScoringResult[]; errors: string[] }>

/** v1.3 two-pass scoring path. */
async function runTwoPassScoring(
  hierarchy: L4Activity[],
  completed: Set<string>,
  options: PipelineOptions,
  // ... other deps
): Promise<{ scored: ScoringResult[]; errors: string[]; filterStats: FilterStats }>
```

The main `runPipeline()` calls one or the other based on `options.scoringMode`, then converges for reports.

### Checkpoint Version Strategy

```typescript
// Version 1: v1.2 three-lens (skill-level keys)
export const CheckpointV1Schema = z.object({
  version: z.literal(1),
  inputFile: z.string(),
  startedAt: z.string(),
  entries: z.array(CheckpointEntrySchema),
});

// Version 2: v1.3 two-pass (L4-level keys)
export const CheckpointV2EntrySchema = z.object({
  l4Id: z.string(),
  completedAt: z.string(),
  status: z.enum(['scored', 'error']),
});

export const CheckpointV2Schema = z.object({
  version: z.literal(2),
  scoringMode: z.literal('two-pass'),
  inputFile: z.string(),
  startedAt: z.string(),
  entries: z.array(CheckpointV2EntrySchema),
});
```

loadCheckpoint behavior:
1. Try parse with V2 first (version: 2).
2. If fails, try V1 (version: 1).
3. If scoring mode is two-pass and checkpoint is V1: backup as `.checkpoint.v12.bak`, start fresh.
4. If scoring mode is three-lens and checkpoint is V2: start fresh (incompatible).
5. If scoring mode is three-lens and checkpoint is V1: resume normally.

### SimulationInput Extension

```typescript
export interface SimulationInput {
  opportunity?: L3Opportunity;  // Optional in v1.3 (was required)
  l4Activity?: L4Activity;      // New: primary subject in two-pass mode
  l4s: L4Activity[];             // Kept for simulation generators
  companyContext: CompanyContext;
  archetype: LeadArchetype;
  archetypeRoute: string;
  composite: number;
}
```

The simulation pipeline (simulation-pipeline.ts) currently reads `input.opportunity.l3_name` for logging and slug generation. With L4-level inputs, it should prefer `input.l4Activity?.name` when available, falling back to `input.opportunity?.l3_name`.

### Anti-Patterns to Avoid
- **Duplicating pipeline infrastructure:** Do NOT copy the semaphore/checkpoint/retry loop for two-pass. Extract the shared infrastructure and parameterize what differs (the scoring function per item).
- **Modifying three-lens code path:** The three-lens path must be the EXACT existing code. Extract it as-is, don't "improve" it.
- **Checkpoint version auto-migration:** Do NOT try to convert V1 checkpoints to V2. They track different entities (skills vs L4s). Clean break is correct.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI flag routing | Custom argv parsing | Commander .addOption with .choices() | Already used for --backend, pattern proven |
| Concurrent scoring | New concurrency primitives | Existing Semaphore class | Thread-safety already validated |
| LLM retry | New retry logic | Existing scoreWithRetry + callWithResilience | Battle-tested in v1.2 production runs |
| Atomic checkpoint writes | New file persistence | Existing createCheckpointWriter | Handles signal handlers, atomic rename |
| LensScore synthesis | Manual LensScore construction | Phase 22's scoreConsolidated() return value | Already produces compatible LensScore objects |

**Key insight:** Phase 23 is pure plumbing. Every computational component (pre-scoring, LLM scoring, filtering, simulation) already exists. The work is routing, not building.

## Common Pitfalls

### Pitfall 1: Breaking the SimulationInput contract
**What goes wrong:** Making `opportunity` optional breaks all existing simulation generators that access `input.opportunity.l3_name`.
**Why it happens:** TypeScript marks it optional, but runtime code still dereferences it.
**How to avoid:** For three-lens mode, always populate `opportunity`. For two-pass mode, provide the L4's parent L3 in the `opportunity` field if available, or create a minimal L3-shaped object from L4 metadata.
**Warning signs:** Runtime TypeError "Cannot read property 'l3_name' of undefined" in simulation.

### Pitfall 2: Checkpoint key collision between modes
**What goes wrong:** A v1.2 checkpoint has skill IDs as keys. A v1.3 checkpoint has L4 IDs. If loadCheckpoint doesn't distinguish, it might try to resume a two-pass run from a three-lens checkpoint.
**Why it happens:** Both are JSON files at the same path.
**How to avoid:** Schema versioning (V1 vs V2) with explicit `scoringMode` field. loadCheckpoint rejects version mismatches immediately.
**Warning signs:** "Skipping (already completed)" messages for items that were never scored in the current mode.

### Pitfall 3: Report formatter sub-dimension name mismatches
**What goes wrong:** `format-scores-tsv.ts` looks up sub-dimensions by name (e.g., "data_readiness", "aera_platform_fit"). Phase 22's consolidated scorer produces different names (e.g., "platform_fit" for technical, "financial_signal" for adoption).
**Why it happens:** The TSV header columns are hardcoded to v1.2 sub-dimension names.
**How to avoid:** The `subScore()` helper returns 0 for unrecognized names, so no crash -- but columns will be zero. Either: (a) accept zero columns for two-pass mode (TSV still valid, just missing granularity), or (b) add scoring-mode-aware column mapping.
**Warning signs:** All sub-dimension columns showing 0 in feasibility-scores.tsv despite valid composites.

### Pitfall 4: Pre-score TSV written in three-lens mode
**What goes wrong:** The pre-score TSV artifact is two-pass specific. If written in three-lens mode, it contains stale/meaningless data.
**Why it happens:** The write call isn't gated on scoring mode.
**How to avoid:** Wrap `formatPreScoreTsv()` call in `if (options.scoringMode === 'two-pass')` guard.
**Warning signs:** pre-scores.tsv appearing in three-lens evaluation output.

### Pitfall 5: Pipeline-runner.ts becoming unmaintainable
**What goes wrong:** Adding 200+ lines of two-pass logic to an already 580-line file creates a tangled mess.
**Why it happens:** Easiest to add code inline rather than extract.
**How to avoid:** Extract scoring paths into separate functions. Keep pipeline-runner as the orchestrator that calls them.
**Warning signs:** Functions over 100 lines, deeply nested conditionals.

## Code Examples

### CLI Flag Addition Pattern
```typescript
// Source: existing cli.ts pattern for --backend
.addOption(
  new Option("--scoring-mode <mode>", "Scoring pipeline mode")
    .choices(["two-pass", "three-lens"])
    .default("two-pass"),
)
```

### PipelineOptions Extension
```typescript
// Source: existing PipelineOptions in pipeline-runner.ts
export interface PipelineOptions {
  // ... existing fields ...
  /** Scoring pipeline mode. Default: "two-pass". */
  scoringMode?: "two-pass" | "three-lens";
  /** Number of top-scoring L4 candidates for two-pass LLM scoring. */
  topN?: number;
}
```

### PipelineResult Extension
```typescript
export interface PipelineResult {
  // ... existing fields ...
  /** Two-pass specific: total L4s pre-scored. */
  preScoredCount?: number;
  /** Two-pass specific: survivors after top-N filter. */
  survivorCount?: number;
  /** Two-pass specific: cutoff composite score. */
  cutoffScore?: number;
  /** Scoring mode used for this run. */
  scoringMode?: "two-pass" | "three-lens";
}
```

### L4-Level Simulation Adapter
```typescript
// Source: pattern from existing toSimulationInputs in scoring-to-simulation.ts
export function toL4SimulationInputs(
  promoted: ScoringResult[],
  l4Map: Map<string, L4Activity>,  // L4 ID -> L4Activity
  l3Map: Map<string, L3Opportunity>,
  companyContext: CompanyContext,
): SimulationInput[] {
  return promoted.map(sr => {
    const l4 = l4Map.get(sr.l4Name);  // or by l4Id if available
    const l3 = l3Map.get(sr.l3Name);
    const mapping = getRouteForArchetype(sr.archetype);
    return {
      l4Activity: l4,
      opportunity: l3,          // optional metadata
      l4s: l4 ? [l4] : [],     // single L4
      companyContext,
      archetype: sr.archetype,
      archetypeRoute: mapping.primary_route,
      composite: sr.composite,
    };
  });
}
```

### Checkpoint Mode-Aware Loading
```typescript
// Source: pattern from existing loadCheckpoint in checkpoint.ts
export function loadCheckpointForMode(
  outputDir: string,
  scoringMode: "two-pass" | "three-lens",
): { checkpoint: Checkpoint | CheckpointV2 | null; backedUp: boolean } {
  const existing = loadCheckpointAny(outputDir);  // try V2 then V1
  if (!existing) return { checkpoint: null, backedUp: false };

  // Mode match check
  if (scoringMode === "two-pass" && existing.version === 1) {
    // Backup v1.2 checkpoint, start fresh
    backupCheckpoint(outputDir, ".checkpoint.v12.bak");
    return { checkpoint: null, backedUp: true };
  }
  if (scoringMode === "three-lens" && existing.version === 2) {
    // Incompatible, start fresh (no backup needed for v2)
    return { checkpoint: null, backedUp: false };
  }

  return { checkpoint: existing, backedUp: false };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3 LLM calls per skill (v1.2) | 1 LLM call per top-N survivor (v1.3) | Phase 22 | ~50x call reduction |
| L3 as scoring unit | L4 as scoring unit with L3 grouping | Phase 21 | Finer granularity |
| Skill-level checkpoints | L4-level checkpoints (v1.3) | Phase 23 | Different resume unit |
| L3-level simulation | L4-level simulation | Phase 23 | Per-activity artifacts |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none -- tsx --test for individual files |
| Quick run command | `cd src && npx tsx --test <file>.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIPE-01 | Two-pass flow runs pre-score -> filter -> LLM -> simulation | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts -x` | Existing (needs new tests) |
| PIPE-02 | --scoring-mode flag routes correctly | unit | `cd src && npx tsx --test cli.test.ts -x` | Existing (needs new tests) |
| PIPE-03 | LensScore synthesis produces valid report input | unit | `cd src && npx tsx --test scoring/consolidated-scorer.test.ts -x` | Phase 22 (verify only) |
| PIPE-04 | L3 names appear as metadata in reports | unit | `cd src && npx tsx --test output/format-scores-tsv.test.ts -x` | Existing (verify only) |
| PIPE-05 | Checkpoint V2 schema loads/saves correctly, V1 backup works | unit | `cd src && npx tsx --test infra/checkpoint.test.ts -x` | Existing (needs new tests) |
| SIM-01 | SimulationInput with l4Activity field accepted by pipeline | unit | `cd src && npx tsx --test simulation/simulation-pipeline.test.ts -x` | Existing (needs new tests) |
| SIM-02 | toL4SimulationInputs produces correct L4-level inputs | unit | `cd src && npx tsx --test pipeline/scoring-to-simulation.test.ts -x` | Existing (needs new tests) |

### Sampling Rate
- **Per task commit:** `cd src && npx tsx --test <modified-file>.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/pipeline/scoring-to-simulation.test.ts` -- needs toL4SimulationInputs tests (SIM-02)
- [ ] `src/infra/checkpoint.test.ts` -- needs V2 schema tests and mode-aware loading tests (PIPE-05)
- [ ] `src/pipeline/pipeline-runner.test.ts` -- needs two-pass integration test with mock chatFn (PIPE-01)

## Open Questions

1. **Sub-dimension name mapping in format-scores-tsv.ts**
   - What we know: v1.2 TSV columns reference specific sub-dimension names (data_readiness, aera_platform_fit, etc.). Phase 22 produces different names (platform_fit for technical, financial_signal/decision_density/etc. for adoption).
   - What's unclear: Should the TSV show the v1.3 sub-dimension values under new column names, or keep the v1.2 column names with zeros?
   - Recommendation: Accept zeros in v1.2-named columns for now. The composite, lens totals, and normalized values are still correct. Phase 24 validation will assess report quality. This avoids changing report schema mid-integration.

2. **Simulation pipeline slug generation for L4 activities**
   - What we know: Current simulation uses `slugify(input.opportunity.l3_name)` for directory names.
   - What's unclear: L4 names may produce longer or duplicate slugs across different L3 parents.
   - Recommendation: Use `slugify(l4Activity.name)` with l4Id as suffix for uniqueness: `{l4-slug}-{l4id-last6}`.

## Sources

### Primary (HIGH confidence)
- `src/pipeline/pipeline-runner.ts` -- current pipeline structure (580 lines)
- `src/infra/checkpoint.ts` -- V1 checkpoint schema and writer
- `src/pipeline/scoring-to-simulation.ts` -- existing L3-level adapter
- `src/types/scoring.ts` -- ScoringResult, LensScore, PreScoreResult types
- `src/types/simulation.ts` -- SimulationInput interface
- `src/scoring/deterministic/pre-scorer.ts` -- preScoreAll() API
- `src/scoring/deterministic/filter.ts` -- filterTopN() API
- `src/cli.ts` -- Commander flag patterns
- `.planning/phases/22-consolidated-llm-scorer/22-02-PLAN.md` -- scoreConsolidated() contract

### Secondary (MEDIUM confidence)
- `src/output/format-scores-tsv.ts` -- sub-dimension name dependencies
- `src/simulation/simulation-pipeline.ts` -- simulation input consumption patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns established
- Architecture: HIGH -- branching strategy follows existing patterns, all integration points identified
- Pitfalls: HIGH -- derived from direct code reading of all affected modules

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- internal integration, no external API dependencies)
