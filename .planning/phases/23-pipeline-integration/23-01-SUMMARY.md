---
phase: 23-pipeline-integration
plan: 01
subsystem: pipeline
tags: [checkpoint, simulation, cli, two-pass, scoring, zod]

# Dependency graph
requires:
  - phase: 22-consolidated-llm-scorer
    provides: ConsolidatedLensSchema, ScoringResult v1.3 fields
provides:
  - CheckpointV2Schema with mode-aware loading for two-pass pipeline
  - SimulationInput L4 extension with optional opportunity
  - toL4SimulationInputs adapter for per-L4 simulation
  - --scoring-mode CLI flag with PipelineOptions/PipelineResult extensions
affects: [23-02-pipeline-wiring, 24-calibration]

# Tech tracking
tech-stack:
  added: []
  patterns: [mode-aware checkpoint versioning, V1/V2 backup on mode switch, optional opportunity pattern]

key-files:
  created: []
  modified:
    - src/infra/checkpoint.ts
    - src/infra/checkpoint.test.ts
    - src/types/simulation.ts
    - src/pipeline/scoring-to-simulation.ts
    - src/pipeline/scoring-to-simulation.test.ts
    - src/cli.ts
    - src/cli.test.ts
    - src/pipeline/pipeline-runner.ts
    - src/simulation/simulation-pipeline.ts

key-decisions:
  - "CheckpointV2 uses l4Id as key (not skillId) since two-pass operates at L4 granularity"
  - "V1 checkpoint backed up as .checkpoint.v12.bak on mode switch (not deleted)"
  - "SimulationInput.opportunity made optional rather than creating separate type"
  - "createCheckpointV2Writer reuses CheckpointWriter interface via cast for compatibility"

patterns-established:
  - "Mode-aware checkpoint: loadCheckpointForMode dispatches on scoring mode + version"
  - "Optional opportunity: simulation pipeline derives l3Name from l4Activity?.name when present"

requirements-completed: [PIPE-02, PIPE-05, SIM-01, SIM-02]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 23 Plan 01: Contracts and Adapters Summary

**Checkpoint V2 schema with mode-aware loading, L4 simulation adapter, and --scoring-mode CLI flag for two-pass pipeline integration**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T00:59:22Z
- **Completed:** 2026-03-14T01:05:02Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- CheckpointV2Schema validates two-pass entries keyed by L4 ID with mode-aware loading across all 5 mode/version combinations
- SimulationInput extended with optional l4Activity and optional opportunity for dual-mode support
- toL4SimulationInputs adapter produces per-L4 simulation inputs from two-pass scoring results
- --scoring-mode CLI flag defaults to two-pass with proper PipelineOptions/PipelineResult wiring

## Task Commits

Each task was committed atomically:

1. **Task 1: Checkpoint V2 schema and mode-aware loading** - `f524b99` (feat)
2. **Task 2: SimulationInput L4 extension and toL4SimulationInputs adapter** - `ac0b6e6` (feat)
3. **Task 3: CLI --scoring-mode flag and PipelineOptions/PipelineResult extensions** - `929a6cc` (feat)

## Files Created/Modified
- `src/infra/checkpoint.ts` - CheckpointV2Schema, loadCheckpointForMode, getCompletedL4Ids, createCheckpointV2Writer
- `src/infra/checkpoint.test.ts` - 18 new tests for V2 schema, mode-aware loading, and V2 writer
- `src/types/simulation.ts` - SimulationInput with optional opportunity and l4Activity fields
- `src/pipeline/scoring-to-simulation.ts` - toL4SimulationInputs adapter for two-pass mode
- `src/pipeline/scoring-to-simulation.test.ts` - 5 new tests for toL4SimulationInputs
- `src/cli.ts` - --scoring-mode flag, top-n warning, scoring mode in summaries, pipelineOptions wiring
- `src/cli.test.ts` - 3 new tests for PipelineResult scoring mode fields
- `src/pipeline/pipeline-runner.ts` - PipelineOptions.scoringMode/topN, PipelineResult extensions
- `src/simulation/simulation-pipeline.ts` - Optional opportunity handling in slug derivation

## Decisions Made
- CheckpointV2 uses l4Id as key (not skillId) since two-pass operates at L4 granularity
- V1 checkpoint backed up as .checkpoint.v12.bak on mode switch (preserves three-lens progress)
- SimulationInput.opportunity made optional rather than creating a separate L4SimulationInput type (simpler, less duplication)
- createCheckpointV2Writer reuses CheckpointWriter interface via cast for API compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated simulation-pipeline.ts for optional opportunity**
- **Found during:** Task 2 (SimulationInput L4 extension)
- **Issue:** simulation-pipeline.ts line 124 accesses `input.opportunity.l3_name` directly, which crashes with optional opportunity
- **Fix:** Changed to `input.l4Activity?.name ?? input.opportunity?.l3_name ?? "unknown"` for safe derivation
- **Files modified:** src/simulation/simulation-pipeline.ts
- **Verification:** All 10 simulation pipeline tests pass
- **Committed in:** ac0b6e6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for correctness -- the plan explicitly noted this change was needed. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All contracts and adapters in place for Plan 02 (pipeline-runner two-pass wiring)
- loadCheckpointForMode ready to replace loadCheckpoint in pipeline-runner
- toL4SimulationInputs ready to be called alongside toSimulationInputs based on scoringMode
- --scoring-mode flag routes through to pipeline -- Plan 02 adds the actual branching logic

---
*Phase: 23-pipeline-integration*
*Completed: 2026-03-14*
