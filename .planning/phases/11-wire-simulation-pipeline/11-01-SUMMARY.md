---
phase: 11-wire-simulation-pipeline
plan: 01
subsystem: pipeline
tags: [simulation, pipeline-runner, adapter, dependency-injection]

requires:
  - phase: 06-simulation-generators
    provides: "runSimulationPipeline function and SimulationInput/SimulationPipelineResult types"
  - phase: 07-pipeline-orchestration
    provides: "pipeline-runner.ts end-to-end orchestrator with PipelineOptions/PipelineResult"
  - phase: 09-final-reports
    provides: "writeFinalReports accepting SimulationPipelineResult parameter"
  - phase: 10-wire-evaluation
    provides: "writeEvaluation wired into pipeline-runner between scoring and git commit"
provides:
  - "toSimulationInputs adapter converting ScoringResult[] to SimulationInput[]"
  - "runSimulationPipeline wired into pipeline-runner for promoted opportunities"
  - "writeFinalReports receives real SimulationPipelineResult (not hardcoded empty)"
  - "PipelineResult.simulatedCount field"
affects: []

tech-stack:
  added: []
  patterns:
    - "Dependency injection for simulation pipeline via runSimulationPipelineFn option"
    - "Non-fatal simulation pipeline failure with try-catch fallback to empty result"

key-files:
  created:
    - src/pipeline/scoring-to-simulation.ts
    - src/pipeline/scoring-to-simulation.test.ts
  modified:
    - src/pipeline/pipeline-runner.ts
    - src/pipeline/pipeline-runner.test.ts

key-decisions:
  - "runSimulationPipelineFn injectable via PipelineOptions for test isolation (same pattern as parseExportFn and chatFn)"
  - "Simulation failure is non-fatal: try-catch with fallback to empty SimulationPipelineResult"
  - "autoCommitEvaluation moved after simulation so simulation artifacts are included in git commit"
  - "toSimulationInputs is a pure adapter function with no I/O side effects"

patterns-established:
  - "Adapter pattern: pure function bridging scoring types to simulation types"

requirements-completed: [SIMU-01, SIMU-02, SIMU-03, SIMU-04, KNOW-04, OUTP-05, OUTP-06]

duration: 5min
completed: 2026-03-11
---

# Phase 11 Plan 01: Wire Simulation Pipeline Summary

**toSimulationInputs adapter bridges scoring results to simulation inputs; pipeline-runner calls runSimulationPipeline for promoted opportunities with non-fatal error handling and real results flowing to writeFinalReports**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T17:27:58Z
- **Completed:** 2026-03-11T17:33:02Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Pure adapter function toSimulationInputs converts ScoringResult[] to SimulationInput[] using l3Map, l4Map, companyContext, and getRouteForArchetype
- Pipeline runner calls runSimulationPipeline between writeEvaluation and autoCommitEvaluation for promoted opportunities
- writeFinalReports receives real SimulationPipelineResult (replaced hardcoded empty result)
- PipelineResult includes simulatedCount field
- Simulation pipeline failure handled as non-fatal with try-catch
- All 16 pipeline-runner tests pass (12 existing + 4 new), 4 adapter unit tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create adapter function with TDD** - `2131001` (test+feat)
2. **Task 2: Wire simulation pipeline into pipeline-runner with integration tests** - `d4cf47f` (feat)

**Plan metadata:** (pending) (docs: complete plan)

## Files Created/Modified
- `src/pipeline/scoring-to-simulation.ts` - Pure adapter: ScoringResult[] -> SimulationInput[]
- `src/pipeline/scoring-to-simulation.test.ts` - 4 unit tests for adapter function
- `src/pipeline/pipeline-runner.ts` - Wired simulation pipeline call, injectable runSimulationPipelineFn, simulatedCount
- `src/pipeline/pipeline-runner.test.ts` - 4 new simulation integration tests, mock injected into all existing tests

## Decisions Made
- runSimulationPipelineFn injectable via PipelineOptions for test isolation (same DI pattern as parseExportFn and chatFn)
- Simulation failure is non-fatal: try-catch with fallback to empty SimulationPipelineResult
- autoCommitEvaluation moved after simulation so simulation artifacts are included in the git commit
- toSimulationInputs is a pure adapter function with no I/O side effects
- Mock simulation pipeline creates stub artifact directories for test verification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All SIMU-* requirements and OUTP-05/OUTP-06 are now satisfied end-to-end
- The v1.0 milestone is complete: all 31/31 plans across 11 phases executed
- Pipeline runs ingestion -> triage -> scoring -> simulation -> evaluation -> final reports

---
*Phase: 11-wire-simulation-pipeline*
*Completed: 2026-03-11*
