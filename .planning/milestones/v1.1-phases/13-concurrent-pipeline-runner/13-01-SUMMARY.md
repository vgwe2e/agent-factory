---
phase: 13-concurrent-pipeline-runner
plan: 01
subsystem: infra
tags: [semaphore, timeout, checkpoint, concurrency, abort-signal, debounce]

# Dependency graph
requires:
  - phase: 12-vllm-client-adapter
    provides: pipeline infrastructure (checkpoint.ts baseline)
provides:
  - Counting semaphore with acquire/release/run for bounding concurrent LLM calls
  - Concurrent-safe checkpoint writer with debounced atomic rename writes
  - Promise timeout wrapper with AbortSignal propagation
affects: [13-02-pipeline-runner, 13-03-cli-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns: [counting-semaphore, debounced-atomic-write, promise-race-timeout, abort-signal-propagation]

key-files:
  created:
    - src/infra/semaphore.ts
    - src/infra/semaphore.test.ts
    - src/infra/timeout.ts
    - src/infra/timeout.test.ts
  modified:
    - src/infra/checkpoint.ts
    - src/infra/checkpoint.test.ts

key-decisions:
  - "Debounce interval 100ms for checkpoint coalescing — fast enough for UX, slow enough to batch concurrent completions"
  - "Atomic rename pattern (write .tmp then rename) prevents checkpoint corruption on crash"
  - "Semaphore hands slot directly to next waiter on release (no decrement/increment race)"

patterns-established:
  - "Semaphore.run() as primary concurrency gate — acquire/try/finally/release"
  - "withTimeout(fn, ms) racing fn against timer with AbortSignal cleanup"
  - "createCheckpointWriter returns object with enqueue/flush for single-writer queue pattern"

requirements-completed: [CONC-01, CONC-02, CONC-03]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 13 Plan 01: Concurrency Primitives Summary

**Counting semaphore, promise timeout with AbortSignal, and debounced atomic checkpoint writer -- three zero-dependency concurrency building blocks for parallel scoring**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T21:29:48Z
- **Completed:** 2026-03-11T21:32:01Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Semaphore correctly bounds concurrency to N with FIFO queuing of excess tasks
- withTimeout rejects stuck promises with TimeoutError and aborts via AbortSignal
- Checkpoint writer coalesces rapid concurrent writes into single atomic file operations
- All 24 tests pass across 4 test suites (existing + new), zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Semaphore and timeout primitives**
   - `691fe54` test(13-01): add failing tests for semaphore and timeout primitives
   - `96a668a` feat(13-01): implement semaphore and timeout concurrency primitives
2. **Task 2: Concurrent-safe checkpoint writer**
   - `da79039` test(13-01): add failing tests for concurrent checkpoint writer
   - `31828ff` feat(13-01): add concurrent-safe checkpoint writer with debounced atomic writes

_TDD: each task has RED (test) then GREEN (feat) commits._

## Files Created/Modified
- `src/infra/semaphore.ts` - Counting semaphore with acquire/release/run API
- `src/infra/semaphore.test.ts` - 5 tests: concurrency limiting, queuing, error recovery
- `src/infra/timeout.ts` - withTimeout wrapper and TimeoutError class
- `src/infra/timeout.test.ts` - 5 tests: resolution, rejection, AbortSignal behavior
- `src/infra/checkpoint.ts` - Added createCheckpointWriter with debounced atomic writes
- `src/infra/checkpoint.test.ts` - 7 new tests for writer (14 total), backward compat preserved

## Decisions Made
- Debounce interval set to 100ms for checkpoint coalescing -- balances write batching with acceptable latency
- Atomic rename pattern (write to .tmp, then renameSync) prevents corruption on crash
- Semaphore hands slot directly to next waiter on release, avoiding decrement/increment race window
- Zero new external dependencies -- all built on Node.js builtins

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three primitives (Semaphore, withTimeout, createCheckpointWriter) exported and ready for Plan 02 pipeline-runner wiring
- Semaphore.run() wraps scoring calls, withTimeout wraps callWithResilience, createCheckpointWriter replaces direct saveCheckpoint in the loop

## Self-Check: PASSED

All 7 files verified on disk. All 4 task commits verified in git log.

---
*Phase: 13-concurrent-pipeline-runner*
*Completed: 2026-03-11*
