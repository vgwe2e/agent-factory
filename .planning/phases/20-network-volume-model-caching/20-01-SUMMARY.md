---
phase: 20-network-volume-model-caching
plan: 01
subsystem: infra
tags: [runpod, network-volume, model-caching, graphql, vllm]

# Dependency graph
requires:
  - phase: 18-cloud-provisioning-hardening
    provides: CloudProviderConfig, saveEndpoint mutation, createCloudProvider
provides:
  - networkVolumeId field on CloudProviderConfig
  - networkVolumeId threading through VllmBackendOptions to cloud provisioning
  - --network-volume CLI flag for RunPod model weight caching
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional GraphQL mutation field (omit vs include, never empty string)"
    - "CLI flag threading: Commander option -> BackendOptions -> ProviderConfig"

key-files:
  created: []
  modified:
    - src/infra/cloud-provider.ts
    - src/infra/cloud-provider.test.ts
    - src/infra/backend-factory.ts
    - src/infra/backend-factory.test.ts
    - src/cli.ts

key-decisions:
  - "Omit networkVolumeId field entirely when not provided (empty string vs omitted may differ in RunPod API)"
  - "No --download-dir in dockerArgs -- RunPod vLLM worker template caches automatically at /runpod-volume/huggingface-cache/hub/"
  - "CACHE-02 (model reuse) satisfied by RunPod built-in behavior when volume attached -- no code needed"

patterns-established:
  - "Conditional GraphQL field: build field string, interpolate empty or populated"

requirements-completed: [CACHE-01, CACHE-02]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 20 Plan 01: Network Volume Model Caching Summary

**RunPod network volume support via --network-volume flag threading through CLI, backend-factory, and cloud-provider GraphQL mutation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T22:59:29Z
- **Completed:** 2026-03-12T23:02:08Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- CloudProviderConfig accepts optional networkVolumeId, conditionally included in saveEndpoint GraphQL mutation
- VllmBackendOptions threads networkVolumeId from CLI to cloud provisioning
- --network-volume CLI flag with pipeline info display
- 4 new tests covering volume ID presence/absence in both cloud-provider and backend-factory

## Task Commits

Each task was committed atomically:

1. **Task 1: Add networkVolumeId to CloudProviderConfig and saveEndpoint mutation** - `c4744a8` (test+feat TDD)
2. **Task 2: Thread networkVolumeId through backend-factory and CLI** - `3d38d9e` (feat TDD)

## Files Created/Modified
- `src/infra/cloud-provider.ts` - Added networkVolumeId to config, conditional field in mutation
- `src/infra/cloud-provider.test.ts` - Two new tests for volume ID in GraphQL mutation
- `src/infra/backend-factory.ts` - Added networkVolumeId to VllmBackendOptions, threaded to createCloudProvider
- `src/infra/backend-factory.test.ts` - Two new tests for volume ID threading through cloud path
- `src/cli.ts` - Added --network-volume flag, threaded to createBackend, pipeline info display

## Decisions Made
- Omit networkVolumeId field entirely when not provided (empty string vs omitted may differ in RunPod API)
- No --download-dir in dockerArgs -- RunPod vLLM worker template caches automatically at /runpod-volume/huggingface-cache/hub/
- CACHE-02 (model reuse on subsequent launches) satisfied by RunPod built-in behavior when volume attached -- no additional code needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Network volume support complete
- Users can pass --network-volume <id> with a pre-created RunPod volume
- Subsequent launches with same volume skip HuggingFace model download automatically

---
*Phase: 20-network-volume-model-caching*
*Completed: 2026-03-12*
