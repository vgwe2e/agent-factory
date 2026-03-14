---
phase: 23-pipeline-integration
verified: 2026-03-14T02:00:00Z
status: passed
score: 5/5 success criteria verified
re_verification: false
---

# Phase 23: Pipeline Integration Verification Report

**Phase Goal:** The full two-pass pipeline runs end-to-end from CLI invocation through deterministic scoring, LLM assessment, simulation, and reports -- with a feature flag preserving v1.2 behavior for comparison
**Verified:** 2026-03-14
**Status:** PASSED
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `--scoring-mode two-pass` runs the full two-pass funnel (deterministic pre-score, top-N filter, consolidated LLM, simulation) and `--scoring-mode three-lens` runs the v1.2 three-lens path unchanged | VERIFIED | `runTwoPassScoring` (line 297) and `runThreeLensScoring` (line 148) in `pipeline-runner.ts`; branch at line 698; integration test "two-pass pipeline executes full funnel" passes (test 35/37 in pipeline-runner.test.ts) |
| 2 | All 10+ existing report formatters produce correct output from v1.3 scoring results because deterministic signals are synthesized into the existing LensScore shape | VERIFIED | PIPE-03 test (line 1553 in pipeline-runner.test.ts) constructs a ScoringResult with populated lenses, calls `formatScoresTsv`, asserts composite > 0 and at least one lens total > 0. Test passes. |
| 3 | L3 opportunity names appear as metadata labels for report grouping but are not used as scoring units | VERIFIED | `l3Name: preScore.l3Name` (line 433 in pipeline-runner.ts); `preScore.l3Name` set from `l4.l3` in pre-scorer (line 70). PIPE-03 mock ScoringResult includes `l3Name: "Test Opportunity"`. |
| 4 | The checkpoint system supports L4-level scoring entries and can resume a v1.3 run without corrupting or losing v1.2 checkpoint data | VERIFIED | `CheckpointV2Schema` (zod schema at line 33 of checkpoint.ts); `loadCheckpointForMode` handles all 5 mode/version combinations; V1 checkpoint backed up to `.checkpoint.v12.bak` on two-pass switch; 38/38 checkpoint tests pass |
| 5 | The simulation pipeline accepts L4 activities directly via an updated scoring-to-simulation adapter | VERIFIED | `toL4SimulationInputs` in `scoring-to-simulation.ts` (line 81); `SimulationInput.l4Activity?: L4Activity` in `types/simulation.ts`; simulation-pipeline.ts line 124-127 derives slug from `l4Activity.name + "-" + id.slice(-6)`; 9/9 scoring-to-simulation tests pass |

**Score:** 5/5 success criteria verified

### Required Artifacts (from Plan Frontmatter)

#### Plan 23-01 Artifacts

| Artifact | Min Lines | Status | Details |
|----------|-----------|--------|---------|
| `src/infra/checkpoint.ts` | 250 | VERIFIED (407 lines) | Exports CheckpointV2Schema, CheckpointV2, CheckpointV2Entry, loadCheckpointForMode, getCompletedL4Ids, createCheckpointV2Writer |
| `src/types/simulation.ts` | — | VERIFIED | `opportunity?: L3Opportunity` (optional), `l4Activity?: L4Activity` field present |
| `src/pipeline/scoring-to-simulation.ts` | 80 | VERIFIED (109 lines) | Exports toL4SimulationInputs and toSimulationInputs |
| `src/cli.ts` | — | VERIFIED | Contains "scoring-mode" flag with choices ["two-pass","three-lens"], default "two-pass" |

#### Plan 23-02 Artifacts

| Artifact | Min Lines | Status | Details |
|----------|-----------|--------|---------|
| `src/pipeline/pipeline-runner.ts` | 650 | VERIFIED (922 lines) | Contains runTwoPassScoring, runThreeLensScoring, scoring mode branch, PipelineResult two-pass stats |
| `src/pipeline/pipeline-runner.test.ts` | 120 | VERIFIED (1653 lines) | Two-pass integration test, PIPE-03 formatter verification, three-lens refactor contract test |
| `src/simulation/simulation-pipeline.ts` | — | VERIFIED | Contains "l4Activity" at line 124-127 for slug derivation |

### Key Link Verification

#### Plan 23-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/infra/checkpoint.ts` | `src/pipeline/pipeline-runner.ts` | `loadCheckpointForMode` called with scoringMode | WIRED | pipeline-runner.ts line 700: `loadCheckpointForMode(options.outputDir, "two-pass")` |
| `src/pipeline/scoring-to-simulation.ts` | `src/types/simulation.ts` | `toL4SimulationInputs` produces SimulationInput with l4Activity | WIRED | scoring-to-simulation.ts line 97: `l4Activity: l4` in SimulationInput push |
| `src/cli.ts` | `src/pipeline/pipeline-runner.ts` | scoringMode and topN passed through PipelineOptions | WIRED | cli.ts line 350-351: `scoringMode: opts.scoringMode as "two-pass" | "three-lens"`, `topN: opts.scoringMode === "two-pass" ? topN : undefined` |

#### Plan 23-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pipeline/pipeline-runner.ts` | `src/scoring/deterministic/pre-scorer.ts` | `preScoreAll` call in two-pass path | WIRED | pipeline-runner.ts line 51 import, line 316: `preScoreAll(hierarchy, topN)` |
| `src/pipeline/pipeline-runner.ts` | `src/scoring/consolidated-scorer.ts` | `scoreConsolidated` call per survivor | WIRED | pipeline-runner.ts line 52 import, line 423: `scoreConsolidated(skill!, knowledgeContext, preScore, chatFn)` |
| `src/pipeline/pipeline-runner.ts` | `src/pipeline/scoring-to-simulation.ts` | `toL4SimulationInputs` for two-pass, `toSimulationInputs` for three-lens | WIRED | pipeline-runner.ts line 50 import, line 791/793: branch selects correct adapter by scoringMode |
| `src/pipeline/pipeline-runner.ts` | `src/infra/checkpoint.ts` | `loadCheckpointForMode` for mode-aware resume | WIRED | pipeline-runner.ts line 36 import, line 700: `loadCheckpointForMode(...)` |
| `src/pipeline/pipeline-runner.ts` | `src/output/format-pre-score-tsv.ts` | `formatPreScoreTsv` written only in two-pass mode | WIRED | pipeline-runner.ts line 54 import, line 332-333: written inside `runTwoPassScoring` only |
| `src/pipeline/pipeline-runner.ts` | `src/output/write-final-reports.ts` | `writeFinalReports` receives scoringMode for header annotation | WIRED | pipeline-runner.ts line 854: `writeFinalReports(..., scoringMode)` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PIPE-01 | 23-02 | Updated pipeline-runner supports two-pass flow: deterministic pre-score -> top-N filter -> LLM scoring -> simulation | SATISFIED | `runTwoPassScoring` implements full funnel; integration test verifies end-to-end |
| PIPE-02 | 23-01 | `--scoring-mode two-pass\|three-lens` CLI flag for A/B comparison with v1.2 behavior | SATISFIED | CLI flag at src/cli.ts lines 145-148, defaults to "two-pass", accepts "three-lens"; 16/16 CLI tests pass |
| PIPE-03 | 23-02 | Synthesize deterministic signals into existing LensScore shape so all report formatters work unchanged | SATISFIED | PIPE-03 test (pipeline-runner.test.ts line 1553) verifies non-zero composite and lens totals from two-pass ScoringResult via formatScoresTsv |
| PIPE-04 | 23-02 | L3 names retained as metadata labels for report grouping (not as scoring unit) | SATISFIED | `l3Name: preScore.l3Name` in ScoringResult construction (line 433); pre-scorer sets `l3Name: l4.l3` |
| PIPE-05 | 23-01 | Checkpoint system supports L4-level scoring with backward-compatible resume from v1.2 checkpoints | SATISFIED | CheckpointV2Schema, loadCheckpointForMode with V1 backup; 38/38 checkpoint tests pass including V1/V2 mode scenarios |
| SIM-01 | 23-01 | SimulationInput accepts L4 activity directly instead of L3 opportunity rollup | SATISFIED | `SimulationInput.l4Activity?: L4Activity` field added; `opportunity` made optional |
| SIM-02 | 23-01 | scoring-to-simulation adapter produces L4-level simulation inputs from two-pass scoring results | SATISFIED | `toL4SimulationInputs` in scoring-to-simulation.ts; 9/9 adapter tests pass |

All 7 requirement IDs declared across plans are accounted for and SATISFIED. No orphaned requirements detected.

### Anti-Patterns Found

Scanned key modified files for stubs and placeholder patterns.

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `src/pipeline/pipeline-runner.ts` line 462 | `as never` cast for V2 checkpoint enqueue | Info | Type cast for interface compatibility (documented in SUMMARY as intentional design decision — CheckpointWriter interface typed for V1 but reused for V2) |
| `src/pipeline/pipeline-runner.ts` line 278 | `const key = sr.skillId ?? sr.l3Name` in dedup | Info | Deduplication uses V1 key pattern; two-pass results have skillId populated so this works correctly |

No blockers or warnings found. The `as never` cast is documented in 23-01-SUMMARY as an intentional API compatibility decision.

### Test Results

| Test File | Tests | Pass | Fail | Notes |
|-----------|-------|------|------|-------|
| `infra/checkpoint.test.ts` | 38 | 38 | 0 | All V1 + V2 scenarios, mode-aware loading, V1 backup |
| `pipeline/scoring-to-simulation.test.ts` | 9 | 9 | 0 | toSimulationInputs + toL4SimulationInputs |
| `cli.test.ts` | 16 | 16 | 0 | scoring-mode flag, topN suppression, PipelineResult fields |
| `pipeline/pipeline-runner.test.ts` | 37 | 37 | 0 | Two-pass integration, PIPE-03 formatter verification, three-lens refactor |
| `simulation/simulation-pipeline.test.ts` | 10 | 10 | 0 | L4-aware slug derivation, optional opportunity |

**Note on `npm test` / `node --test` results:** The full suite shows 500 tests with 16 failures. All 16 failures are in `dist/*.test.js` compiled files (stale build artifacts). When run via `npx tsx --test`, all TypeScript source tests pass. The dist failures are pre-existing and unrelated to phase 23 changes (they include `dist/ingestion/parse-export.test.js` which fails because the Ford hierarchy fixture is not accessible at the dist path).

### Notable Design Decisions Verified

1. **CLI defaults to "two-pass", pipeline-runner internal fallback is "three-lens"** — The plan truth specifies the CLI flag behavior (verified: CLI defaults to "two-pass"). The pipeline-runner's internal `options.scoringMode ?? "three-lens"` (line 694) is a defensive fallback for direct API callers without CLI context. This is intentional and does not violate the requirement.

2. **scoreConsolidated called directly with withTimeout** — No callWithResilience wrapper. Intentional (documented in 23-02-SUMMARY): scoreConsolidated handles retries internally; wrapping caused double JSON serialization issues.

3. **L4 activities without skills skip silently** — Not errored. Intentional: consolidated scorer requires at least one skill; silent skip avoids polluting error count for structurally incomplete L4s.

### Human Verification Required

The following items cannot be verified programmatically:

#### 1. End-to-End CLI Run with Real Hierarchy

**Test:** `cd src && npm run dev -- --input ../path/to/ford_hierarchy_v3_export.json --scoring-mode two-pass --top-n 10 --skip-sim --output-dir /tmp/test-two-pass`
**Expected:** Pipeline runs, pre-scores all L4s, filters to top-10, scores each with consolidated scorer, writes pre-scores.tsv to evaluation/, reports contain "Scoring Mode: two-pass" header.
**Why human:** Requires a real hierarchy file and LLM backend. The integration test uses a minimal 9-L4 fixture.

#### 2. Three-Lens Mode Preserved Without Regression

**Test:** Run same command with `--scoring-mode three-lens` on the same input.
**Expected:** Uses v1.2 path (no preScoreAll, no pre-scores.tsv), output reports DO NOT have "Scoring Mode" header from three-lens if mode is omitted from writeFinalReports.
**Why human:** Requires real LLM calls to verify the full v1.2 path produces equivalent quality results.

#### 3. Checkpoint Resume for Two-Pass Mode

**Test:** Interrupt a two-pass run (Ctrl+C), then re-run. Verify already-scored L4s are skipped and checkpoint V2 file exists.
**Expected:** `.checkpoint.json` (version 2) present, previously scored L4 IDs not re-scored, run completes from where it stopped.
**Why human:** Requires real run with time to accumulate scores before interruption.

---

## Gaps Summary

None. All must-haves are verified.

---

_Verified: 2026-03-14_
_Verifier: Claude (gsd-verifier)_
