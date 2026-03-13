---
phase: 16-simulation-configuration
verified: 2026-03-12T22:15:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
---

# Phase 16: Simulation Configuration Verification Report

**Phase Goal:** Users can control simulation behavior via CLI flags without modifying source code
**Verified:** 2026-03-12T22:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Plan 16-01)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A simulation failure for one opportunity does not prevent remaining opportunities from being simulated | VERIFIED | `simulation-pipeline.ts` lines 147-258: outer try/catch with `continue` after error; each opp processes independently |
| 2 | When simTimeoutMs is set, an opportunity whose 4 generators exceed the budget is terminated and logged | VERIFIED | Lines 229-233: `withTimeout((_signal) => processOpp(), options.timeoutMs)` applied when `options?.timeoutMs != null`; TimeoutError caught line 236 and logged |
| 3 | When a simulation times out, partial artifacts from completed generators are preserved on disk | VERIFIED | Each generator writes to disk immediately on success (lines 164, 175, 185, 195); timeout catch pushes default-artifact result ensuring output array consistency |
| 4 | When simTimeoutMs is not set, simulations run unbounded (current behavior preserved) | VERIFIED | Lines 231-233: `else { await processOpp(); }` — no timeout wrapper when options.timeoutMs is null/undefined |

### Observable Truths (Plan 16-02)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | User passes --skip-sim and the pipeline completes scoring without entering the simulation phase | VERIFIED | `pipeline-runner.ts` lines 448-482: `if (!options.skipSim)` guards the simulation block; `cli.ts` line 220: `skipSim: opts.skipSim ?? false` |
| 6 | User passes --sim-timeout 60000 and the timeout value is threaded to runSimulationPipeline | VERIFIED | `cli.ts` lines 128-135: validation, line 221: `simTimeoutMs`; `pipeline-runner.ts` lines 456: `options.simTimeoutMs ? { timeoutMs: options.simTimeoutMs } : undefined` |
| 7 | Summary report includes 'Simulation: skipped (--skip-sim)' note when sim is skipped | VERIFIED | `format-summary.ts` lines 32-33: `if (simSkipped) { lines.push('**Simulation: skipped (--skip-sim)**') }` |
| 8 | Tier-1 report omits simulation qualification language when sim is skipped | VERIFIED | Plan decision confirmed: tier-1 report has no simulation results sections; plan explicitly excluded format-tier1-report.ts changes as no-op |
| 9 | CLI output shows 'Simulated: skipped' instead of a count when --skip-sim is used | VERIFIED | `cli.ts` line 243: `opts.skipSim ? "skipped" : pipelineResult.simulatedCount` |
| 10 | PipelineResult includes simErrorCount field tracking simulation-specific errors | VERIFIED | `pipeline-runner.ts` lines 101, 545: `simErrorCount: simResult.totalFailed` on PipelineResult |
| 11 | Simulation failures do not affect pipeline exit code | VERIFIED | `cli.ts` lines 260-263: exit(1) only when `errorCount > 0 && scoredCount === 0`; simErrorCount not used in exit condition |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/simulation/simulation-pipeline.ts` | Per-opportunity try/catch and optional timeout wrapping | VERIFIED | Lines 147-258: outer try/catch with processOpp(); `withTimeout` applied conditionally; `SimulationPipelineOptions` interface defined |
| `src/simulation/simulation-pipeline.test.ts` | Tests for error isolation and timeout behavior | VERIFIED | 14 tests pass; "per-opportunity error isolation" describe block covers crash isolation, all-fail defaults, timeout, partial timeout, error count |
| `src/cli.ts` | --skip-sim and --sim-timeout CLI flags | VERIFIED | Lines 64-65: both flags declared; lines 128-135: sim-timeout validation; lines 220-221: both threaded to runPipeline |
| `src/pipeline/pipeline-runner.ts` | skipSim + simTimeoutMs on PipelineOptions, simErrorCount on PipelineResult, conditional simulation skip | VERIFIED | Lines 88-90: skipSim and simTimeoutMs on PipelineOptions; line 101: simErrorCount on PipelineResult; lines 448-482: conditional sim block |
| `src/output/format-summary.ts` | Skip-sim aware summary formatting | VERIFIED | Line 19: `simSkipped?: boolean` param; lines 32-35: conditional output |
| `src/output/format-meta-reflection.ts` | Skip-sim aware meta-reflection formatting | VERIFIED | Line 89: `simSkipped?: boolean` param; lines 106-116: conditional overview; lines 196-198: knowledge section skip |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/simulation/simulation-pipeline.ts` | `src/infra/timeout.ts` | `withTimeout` import | VERIFIED | Line 37: `import { withTimeout, TimeoutError } from "../infra/timeout.js"` |
| `src/cli.ts` | `src/pipeline/pipeline-runner.ts` | `PipelineOptions.skipSim` and `PipelineOptions.simTimeoutMs` | VERIFIED | Lines 220-221: `skipSim: opts.skipSim ?? false, simTimeoutMs` passed to `runPipeline()` |
| `src/pipeline/pipeline-runner.ts` | `src/simulation/simulation-pipeline.ts` | `runSimulationPipeline options.timeoutMs` | VERIFIED | Lines 456: `options.simTimeoutMs ? { timeoutMs: options.simTimeoutMs } : undefined` as 5th arg |
| `src/pipeline/pipeline-runner.ts` | `src/output/write-final-reports.ts` | `simSkipped` boolean parameter | VERIFIED | Lines 496-504: `writeFinalReports(..., undefined, options.skipSim)` |
| `src/output/write-final-reports.ts` | `format-summary.ts` + `format-meta-reflection.ts` | `simSkipped` threaded to both formatters | VERIFIED | Lines 41, 43: both calls pass `simSkipped` as last argument |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SIM-01 | 16-02 | User can pass `--skip-sim` flag to bypass simulation phase entirely | SATISFIED | `cli.ts` line 64 declares flag; `pipeline-runner.ts` lines 448-482 conditionally skips sim; CLI output line 243 shows "skipped" |
| SIM-02 | 16-01, 16-02 | User can configure simulation timeout via `--sim-timeout <ms>` flag | SATISFIED | `cli.ts` line 65 declares flag, lines 128-135 validate; threaded through `PipelineOptions.simTimeoutMs` to `runSimulationPipeline` options |
| SIM-03 | 16-01, 16-02 | Simulation errors are logged with reason and do not block scoring completion | SATISFIED | `simulation-pipeline.ts` lines 236-241: distinct log messages for TimeoutError vs generic errors; outer try/catch with `continue` ensures remaining opps proceed; `simErrorCount` separate from `errorCount` |

No orphaned requirements: REQUIREMENTS.md maps SIM-01, SIM-02, SIM-03 to Phase 16 and all three are claimed in plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No TODOs, FIXMEs, placeholders, empty implementations, or console-only stubs found in any modified file.

**Pre-existing build errors** (not introduced by Phase 16):
- `output/format-adoption-risk.test.ts(68)`: TS2322 type error — pre-existing, documented in both SUMMARY files
- `scoring/vllm-client.test.ts(53)`: TS2322 type error — pre-existing, documented in both SUMMARY files

These do not affect Phase 16 functionality.

### Human Verification Required

None. All observable behaviors are mechanically verifiable via code inspection and test execution.

### Commit Verification

All 6 task commits exist in git history:

| Hash | Description |
|------|-------------|
| `7907c33` | test(16-01): failing tests for per-opportunity error isolation and timeout |
| `ed90a3d` | feat(16-01): per-opportunity error isolation and timeout |
| `81029a5` | test(16-02): failing tests for skipSim, simTimeoutMs, and simErrorCount |
| `e73eb44` | feat(16-02): wire --skip-sim and --sim-timeout through pipeline and CLI |
| `42a306c` | test(16-02): failing tests for simSkipped awareness in report formatters |
| `035a7e8` | feat(16-02): simSkipped awareness in report formatters and writeFinalReports |

### Test Results

| Test Suite | Tests | Pass | Fail |
|------------|-------|------|------|
| `simulation/simulation-pipeline.test.ts` | 14 | 14 | 0 |
| `pipeline/pipeline-runner.test.ts` | 31 | 31 | 0 |
| `output/format-summary.test.ts` | (included below) | — | — |
| `output/format-meta-reflection.test.ts` | 32 combined | 32 | 0 |

### Gaps Summary

No gaps. All 11 must-have truths verified, all 5 key links wired, all 3 requirements satisfied. The phase goal is fully achieved: users can control simulation behavior (`--skip-sim`, `--sim-timeout`) via CLI flags without modifying source code.

---

_Verified: 2026-03-12T22:15:00Z_
_Verifier: Claude (gsd-verifier)_
