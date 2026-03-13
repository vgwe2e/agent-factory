---
phase: 16-simulation-configuration
plan: 02
subsystem: pipeline
tags: [skip-sim, sim-timeout, cli-flags, pipeline-options, report-formatters]

# Dependency graph
requires:
  - phase: 16-01
    provides: Per-opportunity error isolation and SimulationPipelineOptions with timeoutMs
provides:
  - --skip-sim CLI flag to bypass simulation phase entirely
  - --sim-timeout CLI flag for per-opportunity simulation timeout
  - simErrorCount on PipelineResult for simulation failure tracking
  - simSkipped awareness in formatSummary, formatMetaReflection, writeFinalReports
affects: [pipeline-runner, cli, output-reports]

# Tech tracking
tech-stack:
  added: []
  patterns: [optional-parameter-threading, conditional-pipeline-phase]

key-files:
  created: []
  modified:
    - src/cli.ts
    - src/pipeline/pipeline-runner.ts
    - src/pipeline/pipeline-runner.test.ts
    - src/output/format-summary.ts
    - src/output/format-summary.test.ts
    - src/output/format-meta-reflection.ts
    - src/output/format-meta-reflection.test.ts
    - src/output/write-final-reports.ts

key-decisions:
  - "simTimeoutMs threaded as SimulationPipelineOptions object to runSimulationPipeline (not positional)"
  - "Simulation failures (simErrorCount) do NOT affect pipeline exit code -- only scoring errors do"
  - "formatSummary and formatMetaReflection use optional simSkipped parameter for backward compat"

patterns-established:
  - "Optional CLI flags thread through PipelineOptions to downstream consumers via explicit parameter passing"
  - "Report formatters use optional boolean params for feature-flag awareness without breaking existing callers"

requirements-completed: [SIM-01, SIM-02, SIM-03]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 16 Plan 02: CLI Simulation Flags Summary

**--skip-sim and --sim-timeout CLI flags wired through PipelineOptions with simSkipped-aware report formatters**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T21:53:41Z
- **Completed:** 2026-03-12T21:57:50Z
- **Tasks:** 2 (both TDD: RED + GREEN)
- **Files modified:** 8

## Accomplishments
- --skip-sim flag bypasses simulation entirely, with simulatedCount=0 and empty simResult
- --sim-timeout validates input and threads timeoutMs to runSimulationPipeline via SimulationPipelineOptions
- simErrorCount field on PipelineResult tracks simulation-specific failures separately from scoring errors
- formatSummary shows "Simulation: skipped (--skip-sim)" instead of simulated count when sim skipped
- formatMetaReflection shows skip note, N/A success rate, and knowledge skip message when sim skipped
- writeFinalReports threads simSkipped to both formatters
- CLI output shows "Simulated: skipped" and optional "Sim errors: N" line
- 10 new tests (5 pipeline-runner, 3 format-summary, 5 format-meta-reflection), all 63 relevant tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for skipSim, simTimeoutMs, simErrorCount** - `81029a5` (test)
2. **Task 1 GREEN: Wire --skip-sim and --sim-timeout through pipeline and CLI** - `e73eb44` (feat)
3. **Task 2 RED: Failing tests for simSkipped awareness in formatters** - `42a306c` (test)
4. **Task 2 GREEN: Add simSkipped awareness to report formatters** - `035a7e8` (feat)

_TDD tasks: test commits followed by implementation commits_

## Files Created/Modified
- `src/cli.ts` - Added --skip-sim and --sim-timeout flags, validation, CLI output changes
- `src/pipeline/pipeline-runner.ts` - Extended PipelineOptions (skipSim, simTimeoutMs), PipelineResult (simErrorCount), conditional simulation skip, threaded simSkipped to writeFinalReports
- `src/pipeline/pipeline-runner.test.ts` - 5 new tests for skipSim, simTimeoutMs, simErrorCount, backward compat
- `src/output/format-summary.ts` - Added simSkipped parameter, conditional skip note output
- `src/output/format-summary.test.ts` - 3 new tests for simSkipped awareness
- `src/output/format-meta-reflection.ts` - Added simSkipped parameter, skip note in overview, N/A success rate, knowledge skip message
- `src/output/format-meta-reflection.test.ts` - 5 new tests for simSkipped awareness
- `src/output/write-final-reports.ts` - Added simSkipped parameter, threaded to formatSummary and formatMetaReflection

## Decisions Made
- simTimeoutMs passed as `{ timeoutMs }` object to match SimulationPipelineOptions interface (not positional arg)
- Simulation failures tracked separately via simErrorCount; they do NOT affect pipeline exit code per user decision
- Used optional trailing parameter pattern for simSkipped to maintain backward compatibility with all existing callers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript compile errors in unrelated files (format-adoption-risk.test.ts, vllm-client.test.ts) -- same as documented in 16-01 SUMMARY, not caused by this plan's changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 16 complete: simulation pipeline has error isolation, timeout support, and CLI flags
- All SIM requirements (SIM-01, SIM-02, SIM-03) fulfilled
- Ready for next phase in v1.2 roadmap

---
*Phase: 16-simulation-configuration*
*Completed: 2026-03-12*
