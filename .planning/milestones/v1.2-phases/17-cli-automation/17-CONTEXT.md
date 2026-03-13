# Phase 17: CLI Automation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

A single CLI invocation handles the full cloud evaluation lifecycle — score, retry errors, generate reports, tear down infrastructure. Users pass `--retry N` and `--teardown` flags to control automation. Pipeline exits with structured exit codes reflecting final status. Requirements: AUTO-01, AUTO-02, AUTO-03, AUTO-04.

</domain>

<decisions>
## Implementation Decisions

### Retry loop design
- Re-run full pipeline for retries — checkpoint system already skips scored opportunities via `getCompletedNames()`
- Before each retry attempt, clear 'error' entries from checkpoint file so errored opps become retryable (new `clearCheckpointErrors` helper)
- Retries run at concurrency 1 regardless of original `--concurrency` value (safer for struggling backends, matches AUTO-01 spec)
- Banner + summary between retry attempts: "=== Retry 2/3: N errored opportunities ===" followed by normal pipeline output
- Retry loop lives in `cli.ts` action handler, wrapping existing `runPipeline` calls

### Claude's Discretion
- Teardown implementation approach — `--teardown` flag wiring into existing `backendConfig.cleanup()` pattern
- Exit code mapping — code 0 (all scored), code 1 (errors remain after retries), code 2 (fatal failure like parse error or infra down)
- Lifecycle orchestration — where score→retry→report→teardown sequencing lives (cli.ts extension is the obvious approach)
- Whether `--teardown` tears down on fatal failure too (likely yes — don't leave orphaned pods)
- Report regeneration after retry rounds (reports should reflect final state after all retries complete)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backendConfig.cleanup()`: Already called on SIGINT/SIGTERM in `cli.ts:156-163` — reuse for `--teardown`
- `loadCheckpoint` / `getCompletedNames` / `createCheckpointWriter`: Full checkpoint system in `src/infra/checkpoint.ts`
- `loadArchivedScores`: Loads prior scores on resume in `src/pipeline/load-archived-scores.ts`
- `PipelineResult.errorCount` and `PipelineResult.errors[]`: Already tracked, drive retry decisions

### Established Patterns
- CLI flags via Commander `.option()` in `cli.ts` — straightforward to add `--retry` and `--teardown`
- Dependency injection via `PipelineOptions` — retry concurrency override fits this pattern
- Signal handler cleanup pattern in `cli.ts:166-167` — teardown extends this
- Non-fatal error handling: pipeline catches per-opp errors and continues

### Integration Points
- `cli.ts:64` — Add `--retry` and `--teardown` Commander options
- `cli.ts:192-218` — Wrap `runPipeline` call in retry loop with checkpoint clearing
- `cli.ts:242-246` — Replace basic exit logic with structured exit codes (0/1/2)
- `src/infra/checkpoint.ts` — Add `clearCheckpointErrors` helper function
- Phase 16 dependency: `--skip-sim` and `--sim-timeout` flags must be wired before full lifecycle works

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The success criteria from the roadmap are clear and testable.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-cli-automation*
*Context gathered: 2026-03-12*
