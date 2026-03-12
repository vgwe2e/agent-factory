---
phase: 12-vllm-client-adapter
plan: 02
subsystem: infra
tags: [vllm, backend-factory, cli, pipeline, dependency-injection]

# Dependency graph
requires:
  - phase: 12-vllm-client-adapter
    provides: createVllmChatFn, validateScoringSchemas from Plan 01
provides:
  - "createBackend factory: creates ChatFn + config from --backend flag"
  - "--backend ollama|vllm and --vllm-url CLI flags"
  - "Pipeline runner skips Ollama model management for vLLM backend"
affects: [13-runpod-provider, 14-dual-mode-config]

# Tech tracking
tech-stack:
  added: []
  patterns: [backend factory pattern, explicit backend signal via PipelineOptions.backend]

key-files:
  created:
    - src/infra/backend-factory.ts
    - src/infra/backend-factory.test.ts
  modified:
    - src/cli.ts
    - src/pipeline/pipeline-runner.ts

key-decisions:
  - "Use explicit backend field in PipelineOptions instead of inferring from chatFn presence -- existing tests inject chatFn for mocking but still expect Ollama model management"
  - "CLI validates --vllm-url requirement before calling createBackend to provide user-friendly error message"

patterns-established:
  - "Backend factory: single createBackend entry point returns BackendConfig with chatFn + backend identifier"
  - "PipelineOptions.backend: explicit backend signal controls model management behavior without breaking DI patterns"

requirements-completed: [VLLM-01, VLLM-03, VLLM-04]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 12 Plan 02: Backend Factory and CLI Wiring Summary

**Backend factory with --backend ollama|vllm CLI flag, pre-flight schema validation, and pipeline model management bypass for vLLM path**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T21:04:36Z
- **Completed:** 2026-03-11T21:09:31Z
- **Tasks:** 2
- **Files created/modified:** 4

## Accomplishments
- Backend factory creates correct ChatFn for both ollama and vllm backends, with pre-flight schema validation for vLLM (VLLM-04)
- CLI now exposes --backend (choices: ollama, vllm) and --vllm-url flags with proper validation
- Pipeline runner conditionally skips Ollama model loading/unloading when backend is vllm
- Default behavior (no --backend flag) is identical to v1.0 -- zero regression

## Task Commits

Each task was committed atomically (TDD: RED then GREEN for Task 1):

1. **Task 1: Backend factory module**
   - `3fb643d` (test: add failing tests for backend factory)
   - `06307e6` (feat: implement backend factory with schema validation)
2. **Task 2: CLI flags and pipeline wiring**
   - `e5f5704` (feat: wire backend factory into CLI and pipeline runner)

## Files Created/Modified
- `src/infra/backend-factory.ts` - Factory that creates ChatFn + config from --backend flag (78 lines)
- `src/infra/backend-factory.test.ts` - 7 tests: both backends, defaults, custom model, missing url, empty url, invalid backend (74 lines)
- `src/cli.ts` - Added --backend and --vllm-url flags, createBackend integration, version bump to v1.1.0
- `src/pipeline/pipeline-runner.ts` - Added backend field to PipelineOptions, conditional model management

## Decisions Made
- **Explicit backend signal over chatFn inference:** Used `PipelineOptions.backend` field to determine whether to skip Ollama model management, rather than checking `!options.chatFn`. Reason: existing tests inject chatFn for test isolation while still expecting Ollama model management to run. The explicit backend field avoids breaking 16 existing pipeline tests.
- **CLI-level vllmUrl validation:** Validate --vllm-url requirement in CLI before calling createBackend, providing a user-friendly error message specific to the CLI flag name.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used explicit backend field instead of chatFn presence for model management**
- **Found during:** Task 2 (pipeline wiring)
- **Issue:** Plan specified `const useLocalModels = !options.chatFn` to skip Ollama model management. However, all 16 existing pipeline-runner tests inject chatFn for test isolation while expecting model management to still run. Using chatFn presence broke the "calls unloadAll" test.
- **Fix:** Added `backend?: "ollama" | "vllm"` to PipelineOptions and used `options.backend !== "vllm"` as the signal. CLI passes the explicit backend value.
- **Files modified:** src/pipeline/pipeline-runner.ts, src/cli.ts
- **Verification:** All 16 pipeline-runner tests pass, all 7 backend-factory tests pass
- **Committed in:** e5f5704 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for backward compatibility with existing test suite. No scope creep.

## Issues Encountered
- Node.js 22 does not support `mock.module()` without experimental flags. Rewrote backend-factory tests to use real imports instead of module mocking, which works because Plan 01 already created all dependency modules.
- Pre-existing 20 test failures in full suite (stale dist/, missing Ford export, Ollama-dependent). Not caused by this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full --backend vllm CLI path functional: factory creates ChatFn, validates schemas, pipeline skips Ollama model management
- Phase 13 (RunPod provider) can provide vllmUrl dynamically from RunPod Serverless endpoints
- Phase 14 (dual-mode config) can build on the backend flag to auto-select based on environment

---
*Phase: 12-vllm-client-adapter*
*Completed: 2026-03-11*
