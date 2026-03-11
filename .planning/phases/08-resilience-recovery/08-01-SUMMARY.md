---
phase: 08-resilience-recovery
plan: 01
subsystem: infra
tags: [retry, resilience, llm, error-handling, zod]

# Dependency graph
requires:
  - phase: 04-scoring-engine
    provides: scoreWithRetry and ValidatedResult from ollama-client.ts
provides:
  - callWithResilience three-tier resilient LLM call wrapper
  - RetryPolicyOptions and ResilientResult types
affects: [08-resilience-recovery, scoring, pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [three-tier-resilience, primary-fallback-skip]

key-files:
  created:
    - src/infra/retry-policy.ts
    - src/infra/retry-policy.test.ts
  modified: []

key-decisions:
  - "scoreWithRetry reused as-is for both primary and fallback tiers (no wrapper duplication)"
  - "skipReason carries full error chain from scoreWithRetry for debugging context"

patterns-established:
  - "Three-tier resilience: primary retry -> fallback prompt -> skip-and-log"
  - "ResilientResult wrapper adds resolvedVia metadata to existing ValidatedResult"

requirements-completed: [INFR-01]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 8 Plan 01: Retry Policy Summary

**Three-tier resilient LLM call wrapper (primary retry, fallback prompt, skip-and-log) built on scoreWithRetry**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T13:09:11Z
- **Completed:** 2026-03-11T13:12:00Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- callWithResilience function implementing primary->fallback->skip three-tier resilience
- 6 unit tests covering all tiers, retry passthrough, and error propagation
- Zero new dependencies added; reuses existing scoreWithRetry infrastructure
- Full test suite (359 tests) passes with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for callWithResilience** - `bb3e6b8` (test)
2. **Task 1 GREEN: Implement callWithResilience** - `7d76b82` (feat)

_TDD task with RED and GREEN commits._

## Files Created/Modified
- `src/infra/retry-policy.ts` - Three-tier resilient LLM call wrapper exporting callWithResilience, RetryPolicyOptions, ResilientResult
- `src/infra/retry-policy.test.ts` - 6 unit tests covering primary success, fallback, skip-and-log, no-fallback, retry count, skipReason

## Decisions Made
- Reused scoreWithRetry as-is for both primary and fallback tiers rather than duplicating retry logic
- skipReason carries the full error string from scoreWithRetry for downstream debugging
- No logger parameter added (scoreWithRetry already logs internally via console.error)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- callWithResilience ready for integration into scoring pipeline
- Fallback prompt strategies can be plugged in via the fallbackCall parameter
- Subsequent plans in Phase 8 can wrap existing scorers with this resilience layer

## Self-Check: PASSED

- FOUND: src/infra/retry-policy.ts
- FOUND: src/infra/retry-policy.test.ts
- FOUND: bb3e6b8 (test commit)
- FOUND: 7d76b82 (feat commit)

---
*Phase: 08-resilience-recovery*
*Completed: 2026-03-11*
