---
phase: 14-cloud-infrastructure
plan: 01
subsystem: infra
tags: [runpod, vllm, h100, gpu, serverless, cost-tracking]

# Dependency graph
requires:
  - phase: 12-vllm-client-adapter
    provides: vLLM client and backend factory for model inference
provides:
  - RunPod serverless endpoint lifecycle (create, health poll, teardown)
  - GPU cost tracker with wall-clock time and dollar estimates
affects: [14-02 CLI integration, pipeline runner cloud mode]

# Tech tracking
tech-stack:
  added: [runpod-sdk]
  patterns: [GraphQL endpoint management, exponential backoff polling, idempotent teardown]

key-files:
  created:
    - src/infra/cloud-provider.ts
    - src/infra/cloud-provider.test.ts
    - src/infra/cost-tracker.ts
    - src/infra/cost-tracker.test.ts
  modified: []

key-decisions:
  - "RunPod GraphQL API for endpoint creation/deletion (SDK only supports existing endpoint interaction)"
  - "Exponential backoff polling for health checks capped at 15s intervals"
  - "Idempotent teardown via error swallowing (endpoint may already be gone)"

patterns-established:
  - "GraphQL mutation pattern for RunPod serverless endpoint management"
  - "Deterministic cost tracker testing via explicit Date injection"

requirements-completed: [CLOUD-01, CLOUD-03]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 14 Plan 01: Cloud Provider and Cost Tracker Summary

**RunPod serverless endpoint provisioner with GraphQL lifecycle management and GPU cost tracker at $5.58/hr H100 rate**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T21:52:15Z
- **Completed:** 2026-03-11T21:55:19Z
- **Tasks:** 2
- **Files modified:** 4 created

## Accomplishments
- CloudProvider creates RunPod serverless endpoints via GraphQL API, polls until workers ready, verifies vLLM model loaded, and tears down idempotently
- CostTracker accumulates wall-clock GPU seconds and computes dollar estimates with human-readable duration formatting
- Full TDD coverage: 16 tests across both modules, all passing with mocked external calls

## Task Commits

Each task was committed atomically:

1. **Task 1: RunPod serverless cloud provider** - `5574604` (feat)
2. **Task 2: GPU cost tracker** - `9dd2cfa` (feat)

_Both tasks followed TDD: RED (failing tests) then GREEN (implementation)._

## Files Created/Modified
- `src/infra/cloud-provider.ts` - RunPod serverless endpoint lifecycle: create via GraphQL, health poll, teardown
- `src/infra/cloud-provider.test.ts` - 9 tests covering provision, health, teardown, timeout, API key validation
- `src/infra/cost-tracker.ts` - GPU time accumulation and dollar cost estimation
- `src/infra/cost-tracker.test.ts` - 7 tests with deterministic Date-based assertions

## Decisions Made
- **RunPod GraphQL API for endpoint management:** The runpod-sdk (v1.1.2) only supports interacting with existing endpoints (run, status, health, purgeQueue). Endpoint creation and deletion require the GraphQL API at https://api.runpod.ai/graphql. This is a deviation from the plan which expected SDK methods for create/delete.
- **Exponential backoff capped at 15s:** Poll interval starts at 5s and increases by pollIntervalMs each round, capped at 15s. Configurable via pollIntervalMs for fast test execution.
- **Idempotent teardown:** Errors during GraphQL deleteEndpoint mutation are swallowed -- the endpoint may already be gone, and repeated teardown calls should not fail.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RunPod SDK lacks endpoint creation API**
- **Found during:** Task 1 (cloud provider implementation)
- **Issue:** Plan expected `runpod.endpoint.create()` and `runpod.endpoint.purge()` methods. The SDK only provides `endpoint(id)` to interact with existing endpoints.
- **Fix:** Implemented endpoint creation/deletion via RunPod GraphQL API (POST https://api.runpod.ai/graphql) with saveEndpoint and deleteEndpoint mutations. Used native fetch instead of SDK for these operations.
- **Files modified:** src/infra/cloud-provider.ts
- **Verification:** All 9 cloud provider tests pass with mocked fetch
- **Committed in:** 5574604

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary adaptation to SDK limitations. No scope creep.

## Issues Encountered
None beyond the SDK API surface deviation noted above.

## Next Phase Readiness
- Cloud provider and cost tracker ready for Plan 02 CLI integration
- Plan 02 will wire these modules into the pipeline runner with --cloud flag
- RUNPOD_API_KEY environment variable required at runtime (validated at provision time)

---
*Phase: 14-cloud-infrastructure*
*Completed: 2026-03-11*
