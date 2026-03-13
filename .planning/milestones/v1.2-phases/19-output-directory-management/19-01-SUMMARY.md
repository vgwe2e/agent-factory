---
phase: 19-output-directory-management
plan: 01
subsystem: cli
tags: [commander, output-dir, backend-aware-defaults]

# Dependency graph
requires:
  - phase: 14-vllm-cloud-backend
    provides: backend option (ollama/vllm) in CLI
provides:
  - resolveOutputDir pure function for backend-aware output directory defaults
  - evaluation-ollama/ and evaluation-vllm/ auto-namespacing
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-helper-before-commander-setup, optional-with-computed-default]

key-files:
  created: []
  modified:
    - src/cli.ts
    - src/cli.test.ts

key-decisions:
  - "resolveOutputDir is a pure exported function placed before Commander setup for testability"
  - "No migration warning for existing ./evaluation/ directory (per user decision)"
  - "regen-reports.ts left unchanged -- explicit-arg-only for standalone usage"

patterns-established:
  - "Pure helper functions exported before Commander program definition for unit testability"

requirements-completed: [OUT-01, OUT-02]

# Metrics
duration: 1min
completed: 2026-03-12
---

# Phase 19 Plan 01: Output Directory Management Summary

**Backend-aware output directory auto-namespacing via resolveOutputDir pure function -- ollama writes to evaluation-ollama/, vllm to evaluation-vllm/, explicit --output-dir overrides both**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-12T22:39:59Z
- **Completed:** 2026-03-12T22:41:20Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Exported `resolveOutputDir` pure function with 5 unit tests covering all behavior paths
- Wired into CLI action handler so --backend vllm defaults to ./evaluation-vllm and --backend ollama defaults to ./evaluation-ollama
- Explicit --output-dir overrides computed default unchanged
- Existing banner and completion messages automatically display resolved path

## Task Commits

Each task was committed atomically:

1. **Task 1: Add resolveOutputDir with TDD tests** - `3bf5f27` (test+feat, TDD RED+GREEN)
2. **Task 2: Wire resolveOutputDir into CLI action handler** - `b38e613` (feat)

## Files Created/Modified
- `src/cli.ts` - Added resolveOutputDir export, removed hardcoded ./evaluation default, made outputDir optional, resolve early in handler
- `src/cli.test.ts` - Added 5 resolveOutputDir test cases (ollama default, vllm default, explicit override x2, non-clobber guarantee)

## Decisions Made
- resolveOutputDir placed before Commander program definition as a pure helper for maximum testability
- No migration warning for existing ./evaluation/ directory (per user decision in research)
- regen-reports.ts left unchanged -- standalone script users specify directory explicitly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Output directory auto-namespacing complete
- Users running both local and cloud evaluations on same hierarchy will get separate output directories by default

---
*Phase: 19-output-directory-management*
*Completed: 2026-03-12*
