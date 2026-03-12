# Phase 13: Concurrent Pipeline Runner - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the sequential scoring loop in `pipeline-runner.ts` with semaphore-bounded parallel execution. Add concurrent-safe checkpointing, per-request timeouts, and live progress reporting. The pipeline must resume cleanly after crash with no checkpoint corruption. Requirements: CONC-01, CONC-02, CONC-03, CONC-04.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All gray areas deferred to Claude's judgment during research and planning:

- **Checkpoint safety** — How to coordinate concurrent checkpoint writes (atomic rename, single-writer queue, WAL, etc.). Current `checkpoint.ts` uses sync `writeFileSync` after each opp — needs rework for concurrent access.
- **Progress display** — Terminal output approach for CONC-04 (simple periodic log lines, progress bar library, or richer TUI). Must show in-flight count, completed count, error count, and ETA.
- **Timeout & failure interaction** — How per-request timeouts (CONC-03) interact with existing 3-tier resilience (`callWithResilience`: retry → fallback → skip). Timeout scope: individual LLM call, whole-opp scoring, or both.
- **Concurrency scope** — Whether concurrency applies only to the scoring loop or also streams promoted opportunities into simulation as they complete. Current flow: triage → score all → simulate all → reports.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User deferred all decisions to Claude.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scoreOneOpportunity` (`scoring-pipeline.ts`): Already fully async, 3 lenses run in parallel via `Promise.all` — ready to be called concurrently
- `callWithResilience` (`retry-policy.ts`): Per-opp retry/fallback/skip — wraps each concurrent task
- `Checkpoint` schema (`checkpoint.ts`): Zod-validated JSON, needs concurrent-safe rewrite
- `context-tracker.ts`: `addResult`/`addError`/`archiveAndReset` — mutates shared state, needs serialization under concurrency

### Established Patterns
- Dependency injection: `chatFn`, `parseExportFn`, `runSimulationPipelineFn` — new concurrency runner should follow this
- Result type pattern: `{success, data} | {success, error}` — no thrown exceptions in core logic
- Three-tier resilience: retry → fallback → skip-and-log — must be preserved per-opportunity
- Pino structured logging with child loggers per opportunity (`logger.child({ oppId })`)

### Integration Points
- `pipeline-runner.ts:203` — Sequential `for` loop is the parallelization target
- `cli.ts` — Needs `--concurrency <N>` flag added (Commander option)
- `PipelineOptions` interface — Needs `concurrency?: number` field
- `PipelineResult` interface — May need timing fields (avg per-opp, throughput)
- `archiveAndReset` threshold logic — Currently counts `sinceLastArchive`, needs rethink for concurrent batches

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-concurrent-pipeline-runner*
*Context gathered: 2026-03-11*
