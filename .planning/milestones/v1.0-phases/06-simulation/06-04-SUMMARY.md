---
phase: 06-simulation
plan: 04
subsystem: simulation
tags: [pipeline, orchestrator, yaml, mermaid, generators, knowledge-validation]

# Dependency graph
requires:
  - phase: 06-simulation/02
    provides: decision flow and component map generators
  - phase: 06-simulation/03
    provides: mock test and integration surface generators
  - phase: 06-simulation/01
    provides: simulation types, utils, knowledge validator
provides:
  - runSimulationPipeline orchestrator wiring all 4 generators into file output
  - SimulationPipelineResult with aggregated confirmed/inferred counts
affects: [07-pipeline-orchestration, 09-final-reports]

# Tech tracking
tech-stack:
  added: []
  patterns: [dependency-injection-for-testing, partial-failure-tolerance, composite-descending-sort]

key-files:
  created:
    - src/simulation/simulation-pipeline.ts
    - src/simulation/simulation-pipeline.test.ts
  modified: []

key-decisions:
  - "Dependency injection via PipelineDeps interface for clean integration testing without module mocking"
  - "Partial failure tolerance: failed generators produce console.error but pipeline continues"
  - "totalFailed only incremented when all 4 generators fail for an opportunity"

patterns-established:
  - "DI pattern: optional deps parameter with production defaults for testable orchestrators"
  - "Composite-descending sort before processing to prioritize high-value opportunities"

requirements-completed: [SIMU-01, SIMU-02, SIMU-03, SIMU-04, KNOW-04]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 6 Plan 04: Simulation Pipeline Orchestrator Summary

**Pipeline orchestrator wiring 4 generators with composite-descending sorting, partial failure tolerance, and YAML/Mermaid file output per opportunity**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T12:26:57Z
- **Completed:** 2026-03-11T12:30:08Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- runSimulationPipeline orchestrates decision flow, component map, mock test, and integration surface generators
- Knowledge index built once via buildKnowledgeIndex and reused across all opportunities
- Output files written to evaluation/simulations/<slug>/ with correct filenames (.mmd, .yaml)
- Partial failure handling: individual generator failures don't block remaining artifacts

## Task Commits

Each task was committed atomically:

1. **Task 1: Simulation pipeline orchestrator** - `65a9524` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/simulation/simulation-pipeline.ts` - Pipeline orchestrator with runSimulationPipeline function
- `src/simulation/simulation-pipeline.test.ts` - 8 integration tests with mocked generators via DI

## Decisions Made
- Used dependency injection (PipelineDeps interface with production defaults) instead of module-level mocking for clean integration tests
- totalFailed only counts opportunities where all 4 generators fail (partial results are acceptable)
- Empty defaults for missing artifacts (empty strings/arrays) to maintain consistent SimulationResult shape

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Simulation pipeline is the entry point for Phase 7 (pipeline orchestration) and Phase 9 (final reports)
- All 4 generators and the orchestrator are tested and ready for integration
- Full simulation test suite (62 tests) passes

---
*Phase: 06-simulation*
*Completed: 2026-03-11*
