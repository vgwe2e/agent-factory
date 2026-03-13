---
phase: 18-runpod-provisioning-fix
plan: 01
subsystem: infra
tags: [runpod, vllm, graphql, cloud-provisioning, serverless]

# Dependency graph
requires:
  - phase: 16-simulation-hardening
    provides: "Cloud provider infrastructure for vLLM scoring"
provides:
  - "Fixed RunPod provisioning with dockerArgs, model validation, 15min timeout, auto-teardown"
affects: [19-structured-output-migration, 20-end-to-end-validation]

# Tech tracking
tech-stack:
  added: []
  patterns: [dockerArgs-over-env, model-validation-healthcheck, auto-teardown-on-failure]

key-files:
  created: []
  modified:
    - src/infra/cloud-provider.ts
    - src/infra/cloud-provider.test.ts

key-decisions:
  - "dockerArgs with --model --max-model-len 16384 --dtype auto instead of env vars"
  - "Case-insensitive contains match for model validation (handles path prefixes)"
  - "10min provision + 5min health = 15min combined timeout"
  - "Auto-teardown via try/catch wrapper around entire provision() body"
  - "Diagnostic /v1/models fetch on health timeout to distinguish model-mismatch from not-loaded"

patterns-established:
  - "Auto-teardown: wrap provisioning in try/catch, teardown in catch before re-throw"
  - "Model validation: parse /v1/models response, case-insensitive contains match"
  - "Actionable errors: include resource ID, recovery steps, and --vllm-url fallback"

requirements-completed: [PROV-01, PROV-02, PROV-03, PROV-04]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 18 Plan 01: RunPod Provisioning Fix Summary

**Fixed RunPod provisioning: dockerArgs replaces env vars, healthCheck validates loaded model, 15min timeout with auto-teardown, --vllm-url fallback in all errors**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T22:25:42Z
- **Completed:** 2026-03-12T22:28:19Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments
- GraphQL saveEndpoint mutation now uses dockerArgs with --model, --max-model-len, --dtype instead of ignored env vars
- healthCheck parses /v1/models and validates requested model appears in loaded model list (case-insensitive contains)
- Combined 15-minute timeout (10min provision + 5min health) with enriched error messages
- Auto-teardown on any provisioning failure prevents orphaned RunPod endpoints
- All error messages include endpoint ID, recovery steps, and --vllm-url manual fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for all PROV requirements (RED)** - `fd6f90d` (test)
2. **Task 2: Implement provisioning fixes to pass all tests (GREEN)** - `2d76f5b` (feat)

## Files Created/Modified
- `src/infra/cloud-provider.ts` - Fixed provisioning with dockerArgs, model validation, auto-teardown, enriched errors
- `src/infra/cloud-provider.test.ts` - 13 tests covering all PROV requirements, fixed runpod.io -> runpod.ai URLs

## Decisions Made
- Used dockerArgs string ("--model X --max-model-len 16384 --dtype auto") -- single string passed as Docker CMD args to vLLM container
- 16384 context length fits Qwen 32B on H100 80GB comfortably; auto dtype lets vLLM pick bfloat16
- Case-insensitive contains match for model validation handles path-prefix variations in model IDs
- Diagnostic /v1/models fetch on health timeout distinguishes "wrong model loaded" from "model never loaded"
- Auto-teardown uses dedicated helper function with best-effort error swallowing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed baseUrl assertions in existing tests**
- **Found during:** Task 1 (RED phase)
- **Issue:** Existing tests used `api.runpod.io` but actual constant is `api.runpod.ai`
- **Fix:** Updated all test URLs from runpod.io to runpod.ai
- **Files modified:** src/infra/cloud-provider.test.ts
- **Verification:** Tests pass with correct URL assertions
- **Committed in:** fd6f90d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix per plan instructions)
**Impact on plan:** Bug fix was explicitly called out in plan. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cloud provider now provisions correctly on first attempt
- Ready for structured output migration (Phase 19) and end-to-end validation (Phase 20)

---
*Phase: 18-runpod-provisioning-fix*
*Completed: 2026-03-12*
