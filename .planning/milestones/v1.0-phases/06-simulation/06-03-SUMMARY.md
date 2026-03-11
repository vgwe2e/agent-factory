---
phase: 06-simulation
plan: 03
subsystem: simulation
tags: [ollama, yaml, zod, mock-test, integration-surface, retry]

# Dependency graph
requires:
  - phase: 06-simulation-01
    provides: "Zod schemas (MockTestSchema, IntegrationSurfaceSchema), parseAndValidateYaml, extractYamlBlock, SimulationInput types"
provides:
  - "buildMockTestPrompt: prompt builder for mock decision test YAML"
  - "generateMockTest: LLM-powered mock test generator with retry"
  - "buildIntegrationSurfacePrompt: prompt builder for integration surface YAML"
  - "generateIntegrationSurface: LLM-powered integration surface generator with retry"
affects: [06-simulation pipeline orchestrator, phase-09 report generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [prompt-builder-generator pair, retry-with-error-feedback, YAML-over-JSON for LLM output]

key-files:
  created:
    - src/simulation/prompts/mock-test.ts
    - src/simulation/prompts/integration-surface.ts
    - src/simulation/generators/mock-test-gen.ts
    - src/simulation/generators/mock-test-gen.test.ts
    - src/simulation/generators/integration-surface-gen.ts
    - src/simulation/generators/integration-surface-gen.test.ts
  modified: []

key-decisions:
  - "Type assertion for IntegrationSurface due to Zod .default() making status optional in output type"

patterns-established:
  - "Prompt builder + generator pair: buildXPrompt returns messages, generateX calls Ollama with retry"
  - "Retry with error feedback: validation errors from previous attempt appended to retry messages"

requirements-completed: [SIMU-03, SIMU-04]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 6 Plan 3: Mock Test and Integration Surface Generators Summary

**Mock test and integration surface YAML generators with Ollama retry, grounded in client financials and enterprise_applications**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T12:19:09Z
- **Completed:** 2026-03-11T12:22:34Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Mock test generator produces validated YAML grounded in actual client financials (revenue, COGS) and decision_articulation
- Integration surface generator maps enterprise_applications to source systems with TBD markers for unmatched sources
- Both generators retry up to 3 times with Zod validation error feedback for LLM self-correction
- 10 tests pass with mocked LLM responses covering success, code fences, retry, and failure paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Mock test prompt builder and generator** - `173e9a7` (feat)
2. **Task 2: Integration surface prompt builder and generator** - `3579e9e` (feat)
3. **Fix: IntegrationSurface type assertion** - `b17a2a3` (fix)

## Files Created/Modified
- `src/simulation/prompts/mock-test.ts` - Prompt builder extracting decision_articulation and financial context
- `src/simulation/prompts/integration-surface.ts` - Prompt builder mapping enterprise_applications to source systems
- `src/simulation/generators/mock-test-gen.ts` - Ollama generator with retry for mock test YAML
- `src/simulation/generators/mock-test-gen.test.ts` - 5 tests: valid YAML, decision mapping, code fences, retry, failure
- `src/simulation/generators/integration-surface-gen.ts` - Ollama generator with retry for integration surface YAML
- `src/simulation/generators/integration-surface-gen.test.ts` - 5 tests: identified/tbd sources, code fences, retry, failure

## Decisions Made
- Type assertion `as IntegrationSurface` needed because Zod `.default("identified")` on status field produces an optional output type while the TypeScript interface requires non-optional status

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed IntegrationSurface type mismatch from Zod default**
- **Found during:** Task 2 (integration surface generator)
- **Issue:** TypeScript error -- Zod `.default()` makes the output type optional but `IntegrationSurface` requires `status` as non-optional
- **Fix:** Added `as IntegrationSurface` type assertion since Zod default guarantees the value is always populated
- **Files modified:** src/simulation/generators/integration-surface-gen.ts
- **Verification:** `npx tsc --noEmit` passes for all 06-03 files
- **Committed in:** b17a2a3

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type assertion needed for Zod schema/TypeScript interface compatibility. No scope creep.

## Issues Encountered
- Pre-existing test failures in component-map-gen.test.ts and decision-flow-gen.test.ts (from Plan 06-02 which hasn't been executed yet) -- out of scope, not addressed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 simulation artifact generators now have prompt builders (decision-flow from 06-02 pending, component-map from 06-02 pending, mock-test and integration-surface from this plan)
- Ready for simulation pipeline orchestrator once Plan 06-02 generators are complete

---
*Phase: 06-simulation*
*Completed: 2026-03-11*
