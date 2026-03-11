---
phase: 07-pipeline-orchestration
plan: 03
subsystem: pipeline
tags: [pipeline-runner, orchestration, cli, end-to-end, model-switching]
dependency_graph:
  requires: [logger-factory, model-manager, context-tracker, triage-pipeline, scoring-pipeline]
  provides: [pipeline-runner, cli-pipeline-integration]
  affects: [cli]
tech_stack:
  added: []
  patterns: [dependency-injection-for-testing, tier-priority-scoring, archive-threshold-flush]
key_files:
  created:
    - src/pipeline/pipeline-runner.ts
    - src/pipeline/pipeline-runner.test.ts
  modified:
    - src/cli.ts
decisions:
  - "parseExportFn injectable in PipelineOptions for test isolation without file I/O"
  - "ModelManager switchDelayMs set to 0 inside pipeline runner (caller controls)"
  - "chatFn with all lens schema fields in single response for integration test simplicity"
metrics:
  duration: 6min
  completed: "2026-03-11"
  tasks: 2
  files: 3
---

# Phase 7 Plan 3: Pipeline Runner and CLI Integration Summary

End-to-end pipeline runner orchestrating triage, model switching, scoring, and context archival with CLI wiring for unattended overnight runs.

## What Was Built

### Pipeline Runner (src/pipeline/pipeline-runner.ts)
- `runPipeline(inputPath, options, logger)` orchestrates the full evaluation flow:
  parse export -> triage -> model switch -> score per opportunity -> archive -> unload
- Processes opportunities in tier-priority order (Tier 1 first, skip action="skip"/"demote")
- Per-opportunity error resilience: catches scoring failures, records them, continues to next
- Archives intermediate results to disk every N opportunities (configurable `archiveThreshold`, default 25)
- Calls `unloadAll()` at end to release Ollama model memory
- Returns `PipelineResult` with triageCount, scoredCount, promotedCount, skippedCount, errorCount, totalDurationMs, errors
- Full dependency injection: `parseExportFn`, `chatFn`, `fetchFn` for isolated testing

### Pipeline Runner Tests (src/pipeline/pipeline-runner.test.ts)
- 4 integration tests with mocked LLM (chatFn) and model manager (fetchFn)
- Tests: correct counts for non-skipped opportunities, error resilience on per-opportunity failure, archive threshold triggers checkpoint writes, unloadAll verification

### CLI Integration (src/cli.ts)
- Added `--log-level <level>` flag (silent/fatal/error/warn/info/debug/trace, default: info)
- Added `--output-dir <path>` flag (default: ./evaluation)
- Replaced inline triage+scoring code with single `runPipeline()` call
- Pre-flight info (export display, Ollama check) preserved before pipeline start
- Pipeline summary printed on completion (triaged/scored/promoted/errors/duration)
- Exit 1 if all opportunities errored

## Test Results

- 4 pipeline runner tests: PASS
- Full suite (346 tests): PASS -- all existing tests unaffected

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test fixture types to match real hierarchy types**
- **Found during:** Task 1 (GREEN)
- **Issue:** Test L3/L4 fixtures were missing required fields (id, name, description, financial_rating, supporting_archetypes, l4_count, etc.) causing triage to misclassify all opportunities
- **Fix:** Rewrote makeL3/makeL4 helpers with all required fields matching actual L3Opportunity and L4Activity types
- **Files modified:** src/pipeline/pipeline-runner.test.ts

**2. [Rule 1 - Bug] Fixed chatFn mock response schema fields**
- **Found during:** Task 1 (GREEN)
- **Issue:** Mock chatFn returned `data` property instead of `content` (matching ChatResult type), and response JSON had wrong field names for adoption/value lens schemas
- **Fix:** Changed to `content` property and included all 9 field names across 3 lens schemas
- **Files modified:** src/pipeline/pipeline-runner.test.ts

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (RED) | 7d73eb6 | Failing tests for pipeline runner |
| 1 (GREEN) | 4cd4bf0 | Implement pipeline runner with integration tests |
| 2 | 07f67aa | Wire pipeline runner into CLI with new flags |

## Next Phase Readiness
- Pipeline runner ready for Phase 8 (simulation) to extend with simulation stage
- CLI accepts all flags needed for unattended overnight runs
- Context tracker integration verified end-to-end
