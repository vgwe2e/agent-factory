---
phase: 17-cli-automation
plan: 02
subsystem: cli
tags: [retry, teardown, exit-codes, lifecycle, commander]

requires:
  - phase: 17-cli-automation
    provides: clearCheckpointErrors function for removing error entries
provides:
  - Full CLI lifecycle with --retry, --teardown flags and structured exit codes
  - Testable runWithRetries helper extracted from Commander action
affects: [18-runpod-provisioning-fix]

tech-stack:
  added: []
  patterns: [extracted testable helper from Commander action, guard program.parse for safe imports]

key-files:
  created:
    - src/cli.test.ts
  modified:
    - src/cli.ts

key-decisions:
  - "Extract runWithRetries as exported helper function for testability (Commander action not unit-testable)"
  - "Guard program.parse() with isMain check to allow safe test imports"
  - "Retry concurrency forced to 1 via retryAttempt counter in pipelineFn closure"
  - "Cost tracker start/stop wraps entire retry loop for accurate total GPU time"

patterns-established:
  - "CLI helper extraction: testable logic exported as named functions, Commander wires them"
  - "isMain guard pattern for CLI entry points that need test imports"

requirements-completed: [AUTO-01, AUTO-02, AUTO-03, AUTO-04]

duration: 3min
completed: 2026-03-12
---

# Phase 17 Plan 02: CLI Retry/Teardown/Exit Codes Summary

**--retry N and --teardown CLI flags with structured exit codes (0/1/2) and extracted runWithRetries helper for full cloud evaluation lifecycle**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T22:12:33Z
- **Completed:** 2026-03-12T22:15:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Implemented --retry N flag that retries errored opportunities at concurrency 1 with clearCheckpointErrors between attempts
- Implemented --teardown flag controlling cloud resource cleanup (always on fatal/signal, opt-in on normal completion)
- Structured exit codes: 0 (success), 1 (errors remain), 2 (fatal)
- Extracted runWithRetries as testable helper with LifecycleOptions/LifecycleResult interfaces
- 8 TDD tests covering teardown control (3), exit codes (3), retry loop (2)

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD failing tests (RED)** - `797c168` (test)
2. **Task 2: Implement --retry, --teardown, exit codes (GREEN)** - `735a2ab` (feat)

## Files Created/Modified
- `src/cli.test.ts` - 8 test cases for runWithRetries helper covering teardown, exit codes, retry loop
- `src/cli.ts` - Added --retry/--teardown flags, runWithRetries helper, import clearCheckpointErrors, isMain guard

## Decisions Made
- Extracted runWithRetries as a standalone exported async function rather than testing through Commander (Commander coupling makes action handler untestable without subprocess spawning)
- Used isMain guard (checking process.argv[1] suffix) to prevent program.parse() from running on import
- Retry concurrency uses a retryAttempt counter in the pipelineFn closure so initial run uses user's concurrency and retries force concurrency 1
- Cost tracker start/stop placed outside runWithRetries so it wraps the entire retry lifecycle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added isMain guard for program.parse()**
- **Found during:** Task 2 (implementation)
- **Issue:** Importing cli.ts in tests triggered program.parse() which requires --input flag, causing test failure
- **Fix:** Added isMain check based on process.argv[1] to only call program.parse() when run as main script
- **Files modified:** src/cli.ts
- **Verification:** Tests import cli.ts successfully, CLI still works when run directly
- **Committed in:** 735a2ab (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for testability. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full CLI lifecycle complete: retry, teardown, exit codes all wired
- Phase 17 fully complete, ready for Phase 18 (RunPod provisioning fix)
- No blockers or concerns

---
*Phase: 17-cli-automation*
*Completed: 2026-03-12*
