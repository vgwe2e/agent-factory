---
phase: 08-resilience-recovery
plan: 03
subsystem: infra
tags: [resilience, checkpoint, retry-policy, git-commit, pipeline]

# Dependency graph
requires:
  - phase: 08-01
    provides: callWithResilience three-tier LLM call wrapper
  - phase: 08-02
    provides: checkpoint persistence and git auto-commit modules
provides:
  - Pipeline runner with resilience wiring (checkpoint resume, callWithResilience, git auto-commit)
  - Integration tests proving all three resilience modules are wired end-to-end
affects: [09-final-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [stale-checkpoint-detection, resilience-wrapping-via-z-any-passthrough]

key-files:
  created: []
  modified:
    - src/pipeline/pipeline-runner.ts
    - src/pipeline/pipeline-runner.test.ts

key-decisions:
  - "z.any() schema for callWithResilience wrapping since scoreOneOpportunity validates internally"
  - "maxRetries=1 in callWithResilience since scoreWithRetry already retries 3x per lens"
  - "Stale checkpoint detection: completed set emptied when inputFile differs from current inputPath"

patterns-established:
  - "Resilience wiring: wrap existing functions with callWithResilience using z.any() passthrough when inner validation exists"
  - "Checkpoint resume: load at startup, skip completed entries, detect stale by inputFile comparison"

requirements-completed: [INFR-01, INFR-03, INFR-08]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 8 Plan 3: Gap Closure Summary

**Wired checkpoint resume, callWithResilience three-tier retry, and git auto-commit into pipeline-runner with stale-checkpoint detection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T13:26:27Z
- **Completed:** 2026-03-11T13:30:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Pipeline-runner imports and calls all three orphaned resilience modules (checkpoint, retry-policy, git-commit)
- Checkpoint resume support: pipeline skips already-completed opportunities on restart
- Stale checkpoint detection: fresh checkpoint created when inputFile differs from current run
- scoreOneOpportunity wrapped with callWithResilience for three-tier error handling
- Git auto-commit called after final archive flush with opt-out via gitCommit option
- 5 new integration tests covering resume, stale detection, persistence, git flag, and error status

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire resilience modules into pipeline-runner.ts** - `1a12552` (feat)
2. **Task 2: Add integration tests for resilience wiring** - `4c2ef9d` (test)

## Files Created/Modified
- `src/pipeline/pipeline-runner.ts` - Added imports for checkpoint/retry-policy/git-commit, checkpoint resume logic, callWithResilience wrapping, git auto-commit, resumedCount tracking
- `src/pipeline/pipeline-runner.test.ts` - Added 5 integration tests for resilience wiring (455 lines total)

## Decisions Made
- Used z.any() as schema in callWithResilience since scoreOneOpportunity already validates via Zod internally; the resilience wrapper adds fallback/skip tiers, not duplicate validation
- Set maxRetries to 1 in callWithResilience because scoreOneOpportunity's internal scoreWithRetry already retries 3 times per lens call
- Fixed stale checkpoint bug: when inputFile differs from current inputPath, the completed set is emptied (not just the checkpoint object), preventing false skips from a previous run's entries

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale checkpoint completed set not being cleared**
- **Found during:** Task 2 (integration tests)
- **Issue:** Plan's checkpoint loading code populated `completed` set from existing checkpoint before checking if inputFile matched. Stale checkpoint entries would incorrectly skip opportunities.
- **Fix:** Reordered logic: check `isStale` first, then populate `completed` only from non-stale checkpoints.
- **Files modified:** src/pipeline/pipeline-runner.ts
- **Verification:** "stale checkpoint is ignored when inputPath differs" test passes
- **Committed in:** 4c2ef9d (Task 2 commit)

**2. [Rule 1 - Bug] Fixed JSON.parse on already-parsed object in resilient result**
- **Found during:** Task 1 (verification)
- **Issue:** Plan called `JSON.parse(resilient.result.data)` but scoreWithRetry already parses JSON and returns the object via z.any(). Resulted in "[object Object] is not valid JSON" error.
- **Fix:** Changed to `resilient.result.data as unknown as ScoringResult` direct cast.
- **Files modified:** src/pipeline/pipeline-runner.ts
- **Verification:** All 4 existing tests pass
- **Committed in:** 1a12552 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were necessary for correctness. No scope creep.

## Issues Encountered
- Pre-existing test failures in parseExport tests (Ford export file moved to .planning/) -- unrelated to this plan, not addressed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three resilience modules (INFR-01, INFR-03, INFR-08) are fully wired into the pipeline
- Phase 8 gap closure complete: no orphaned modules remain
- Ready for Phase 9 final integration

---
*Phase: 08-resilience-recovery*
*Completed: 2026-03-11*
