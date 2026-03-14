---
phase: 23-pipeline-integration
plan: 02
subsystem: pipeline
tags: [two-pass, scoring, pre-scorer, consolidated-scorer, simulation, reports, checkpoint-v2]

# Dependency graph
requires:
  - phase: 23-pipeline-integration
    plan: 01
    provides: CheckpointV2Schema, loadCheckpointForMode, toL4SimulationInputs, --scoring-mode CLI flag
  - phase: 21-deterministic-pre-scoring
    provides: preScoreAll, formatPreScoreTsv, PreScoreResult, FilterResult
  - phase: 22-consolidated-llm-scorer
    provides: scoreConsolidated, ConsolidatedScorerResult, LensScore builders
provides:
  - Working two-pass pipeline path in pipeline-runner.ts (pre-score -> filter -> LLM score -> reports)
  - Three-lens path refactored into runThreeLensScoring internal helper
  - L4-aware simulation slugs with ID suffix for uniqueness
  - Scoring mode annotation in report headers
affects: [24-calibration]

# Tech tracking
tech-stack:
  added: []
  patterns: [scoring-mode branching in pipeline, direct scoreConsolidated call with timeout, L4 skill-skip for skillless activities]

key-files:
  created: []
  modified:
    - src/pipeline/pipeline-runner.ts
    - src/pipeline/pipeline-runner.test.ts
    - src/simulation/simulation-pipeline.ts
    - src/output/write-final-reports.ts
    - src/output/write-evaluation.ts

key-decisions:
  - "scoreConsolidated called directly with withTimeout (no callWithResilience wrapper) to avoid double-serialization"
  - "L4 activities without skills silently skipped in two-pass mode (not errored)"
  - "Scoring mode annotation prepended as header line to markdown/TSV reports"

patterns-established:
  - "Scoring mode branch: if scoringMode === 'two-pass' { runTwoPassScoring } else { runThreeLensScoring }"
  - "L4 skill lookup: skillByL4 map keyed by l4Name for consolidated scorer"
  - "Simulation slug uniqueness: l4Activity name + last 6 chars of ID"

requirements-completed: [PIPE-01, PIPE-03, PIPE-04]

# Metrics
duration: 14min
completed: 2026-03-14
---

# Phase 23 Plan 02: Pipeline Wiring Summary

**Two-pass scoring pipeline wired end-to-end: preScoreAll -> filterTopN -> scoreConsolidated -> L4-aware simulation -> annotated reports, branching cleanly from three-lens at triage**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-14T01:06:57Z
- **Completed:** 2026-03-14T01:21:07Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Two-pass pipeline path executes full funnel: deterministic pre-score all L4s, filter top-N survivors, LLM score each with consolidated scorer, produce reports
- Three-lens path refactored into runThreeLensScoring internal helper (behavior-preserving, all 33 existing tests pass)
- Simulation pipeline generates unique slugs for L4 activities (name + ID suffix) in two-pass mode
- Report files annotated with "Scoring Mode: two-pass" or "Scoring Mode: three-lens" header
- PIPE-03 verified: synthesized LensScore objects from two-pass produce non-zero composite and lens totals in TSV output

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract three-lens scoring helper (verbatim refactor)** - `1e1153d` (refactor)
2. **Task 2: Implement two-pass scoring path and wire pipeline branch** - `51e0318` (feat)
3. **Task 3: L4-aware simulation pipeline and scoring-mode report annotations** - `a808bc9` (feat)

## Files Created/Modified
- `src/pipeline/pipeline-runner.ts` - runThreeLensScoring + runTwoPassScoring helpers, scoring mode branch, two-pass stats in PipelineResult
- `src/pipeline/pipeline-runner.test.ts` - Two-pass integration test with mock chatFn, PIPE-03 formatter verification test, refactor contract tests
- `src/simulation/simulation-pipeline.ts` - L4-aware slug derivation with ID suffix, subjectName for display
- `src/output/write-final-reports.ts` - Optional scoringMode parameter, header annotation
- `src/output/write-evaluation.ts` - Optional scoringMode parameter, header annotation

## Decisions Made
- scoreConsolidated called directly with withTimeout instead of wrapping in callWithResilience -- avoids double JSON serialize/parse through scoreWithRetry, since scoreConsolidated handles its own retries internally
- L4 activities without skills are silently skipped in two-pass mode (not counted as errors) since the consolidated scorer needs at least one skill to score
- Scoring mode annotation is a simple text header prepended to markdown reports (not structural changes to formatters)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed callWithResilience double-wrapping for consolidated scorer**
- **Found during:** Task 2
- **Issue:** Wrapping scoreConsolidated in callWithResilience caused double JSON serialization -- scoreConsolidated result was stringified, then scoreWithRetry re-parsed it, producing "[object Object]" errors
- **Fix:** Call scoreConsolidated directly with withTimeout, since it handles retries internally via scoreWithRetry
- **Files modified:** src/pipeline/pipeline-runner.ts
- **Verification:** Two-pass integration test passes with 1 scored result

**2. [Rule 1 - Bug] L4 activities without skills skip silently instead of erroring**
- **Found during:** Task 2
- **Issue:** Test fixture has 9 L4s but only 3 have skills. The other 6 survived pre-scoring but had no skills for consolidated scorer, causing 6 error entries
- **Fix:** Changed from error to silent skip with info log when no skills found under L4
- **Files modified:** src/pipeline/pipeline-runner.ts
- **Verification:** Integration test passes with 0 errors

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were essential for correct two-pass operation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full two-pass pipeline path is operational end-to-end
- Phase 24 calibration can run both scoring modes and compare results
- All checkpoint/resume infrastructure working for both modes
- Report annotations allow identifying which mode produced each output

## Self-Check: PASSED

All 5 modified files exist. All 3 task commits verified.

---
*Phase: 23-pipeline-integration*
*Completed: 2026-03-14*
