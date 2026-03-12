# Phase 16: Simulation Configuration - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can control simulation behavior via CLI flags (`--skip-sim`, `--sim-timeout`) without modifying source code. Simulation errors for one opportunity do not prevent remaining opportunities from being scored and reported. Requirements: SIM-01, SIM-02, SIM-03.

</domain>

<decisions>
## Implementation Decisions

### Timeout granularity
- `--sim-timeout <ms>` applies per-opportunity, not per-generator
- All 4 generators (decision flow, component map, mock test, integration surface) share the timeout budget for a single opportunity
- When a simulation times out, keep any partial artifacts that completed before the timeout (matches existing per-generator failure handling)
- No default timeout — simulations run unbounded unless `--sim-timeout` is explicitly passed (preserves current behavior)

### Skip-sim report behavior
- When `--skip-sim` is passed, omit simulation sections from tier-1 report entirely (no placeholders)
- Summary report includes a one-line note: "Simulation: skipped (--skip-sim)"
- Pipeline still computes which opportunities would have been promoted (composite >= 0.60 threshold) — reports show promoted count even when sim is skipped
- CLI terminal output shows "Simulated: skipped" instead of the simulated count

### Error isolation
- Per-opportunity error isolation lives in `simulation-pipeline.ts` — wrap each opportunity's simulation in try/catch, log error, continue to next
- Simulation errors tracked separately from scoring errors — add `simErrorCount` to `PipelineResult`
- Simulation failures do NOT affect pipeline exit code — exit code reflects scoring outcomes only (aligns with Phase 17 AUTO-04 spec)

### Claude's Discretion
- Timeout error logging approach (error vs distinct status — Claude picks based on existing patterns)
- Exact wording of skip-sim notes in reports and CLI output
- Whether to add `--skip-sim` as a boolean flag or `--sim skip` as a subcommand-style option (boolean flag is the obvious choice given existing CLI patterns)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `withTimeout` utility (`src/infra/timeout.ts`): Already used for scoring timeout — can reuse for per-opportunity simulation timeout
- `TimeoutError` class: Provides clean timeout detection in catch blocks
- `PipelineOptions` interface: Already has `requestTimeoutMs` for scoring — add `simTimeoutMs` and `skipSim` fields
- Commander `.option()` pattern in `cli.ts`: Straightforward to add `--skip-sim` and `--sim-timeout` flags

### Established Patterns
- Dependency injection via `PipelineOptions` — new sim config fields follow this pattern
- Non-fatal error handling: simulation pipeline already catches per-generator failures and continues
- `callWithResilience` + `withTimeout` composition in scoring — same pattern applies to simulation
- Result type pattern: `{success, data} | {success, error}` used throughout

### Integration Points
- `cli.ts:64` — Add `--skip-sim` and `--sim-timeout` to Commander options, pass through to `runPipeline`
- `pipeline-runner.ts:437-460` — Conditionally skip simulation phase based on `skipSim` option
- `pipeline-runner.ts:57-87` — Extend `PipelineOptions` with `skipSim` and `simTimeoutMs`
- `simulation-pipeline.ts:110-212` — Add per-opportunity try/catch and optional timeout wrapping
- `pipeline-runner.ts:89-102` — Extend `PipelineResult` with `simErrorCount`

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

*Phase: 16-simulation-configuration*
*Context gathered: 2026-03-12*
