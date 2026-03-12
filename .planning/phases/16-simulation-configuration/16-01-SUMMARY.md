---
phase: 16-simulation-configuration
plan: 01
subsystem: simulation
tags: [error-isolation, timeout, withTimeout, abort-signal, pipeline-resilience]

# Dependency graph
requires:
  - phase: 08-simulation-framework
    provides: simulation-pipeline.ts with 4-generator sequential pipeline
provides:
  - Per-opportunity error isolation in simulation pipeline
  - Optional timeout wrapping via withTimeout + SimulationPipelineOptions
  - Default-artifact fallback on failure for consistent output shape
affects: [16-02, pipeline-runner, cli]

# Tech tracking
tech-stack:
  added: []
  patterns: [outer-try-catch-with-inner-graceful-failure, optional-timeout-wrapping]

key-files:
  created: []
  modified:
    - src/simulation/simulation-pipeline.ts
    - src/simulation/simulation-pipeline.test.ts

key-decisions:
  - "Outer try/catch wraps entire 4-generator block; inner per-generator try/catch preserved for graceful partial failures"
  - "Timeout wrapping is opt-in via options.timeoutMs -- no default timeout value"
  - "Failed opportunities get default empty artifacts pushed to results for consistent output shape"

patterns-established:
  - "SimulationPipelineOptions interface for extending pipeline behavior without breaking backward compatibility"
  - "Error isolation pattern: try/catch around processOpp() with continue for next opportunity"

requirements-completed: [SIM-02, SIM-03]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 16 Plan 01: Simulation Error Isolation Summary

**Per-opportunity error isolation and optional timeout wrapping in simulation pipeline using withTimeout from infra/timeout.ts**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T21:47:29Z
- **Completed:** 2026-03-12T21:51:20Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Each opportunity's 4-generator sequence wrapped in try/catch so one failure does not halt remaining simulations
- Optional timeoutMs parameter via SimulationPipelineOptions enables per-opportunity timeout wrapping with withTimeout
- Failed opportunities produce default-artifact results for consistent output shape
- TimeoutError vs generic errors logged with distinct messages
- 6 new tests covering isolation, timeout, partial timeout, and error counting (14 total pass)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for error isolation and timeout** - `7907c33` (test)
2. **Task 1 GREEN: Implement error isolation and timeout** - `ed90a3d` (feat)

_TDD task: test commit followed by implementation commit_

## Files Created/Modified
- `src/simulation/simulation-pipeline.ts` - Added outer try/catch, processOpp() extraction, withTimeout wrapping, SimulationPipelineOptions interface
- `src/simulation/simulation-pipeline.test.ts` - Added 6 tests in "per-opportunity error isolation" suite covering crash isolation, all-fail defaults, timeout, no-timeout passthrough, partial timeout, error count

## Decisions Made
- Outer try/catch wraps the entire processOpp() function rather than individual generators -- this catches both unexpected throws and timeouts uniformly while preserving existing per-generator graceful failure handling
- No default timeout value -- simulations run unbounded unless timeoutMs is explicitly passed, per user decision documented in CONTEXT.md
- Default artifacts pushed on catch (empty strings, empty arrays) so result array length always equals input count

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed shared mock state bleeding between test suites**
- **Found during:** Task 1 GREEN (test verification)
- **Issue:** Shared mock functions retained stale implementations and call counts across describe blocks, causing assertion failures
- **Fix:** Used fresh local mock.fn() instances in isolation test suite instead of shared mocks
- **Files modified:** src/simulation/simulation-pipeline.test.ts
- **Verification:** All 14 tests pass
- **Committed in:** ed90a3d (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test infrastructure fix necessary for correct test isolation. No scope creep.

## Issues Encountered
- Pre-existing TypeScript compile errors in unrelated files (output/format-adoption-risk.test.ts, scoring/vllm-client.test.ts) -- not caused by this plan's changes, logged but not fixed per scope boundary rules

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- simulation-pipeline.ts now supports both error isolation and timeout -- ready for CLI integration (timeoutMs passthrough from CLI flags)
- SimulationPipelineOptions interface is extensible for future pipeline configuration options

---
*Phase: 16-simulation-configuration*
*Completed: 2026-03-12*
