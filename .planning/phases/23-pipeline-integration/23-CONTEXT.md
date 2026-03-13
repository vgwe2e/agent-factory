# Phase 23: Pipeline Integration - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the two-pass flow (deterministic pre-score -> top-N filter -> consolidated LLM -> simulation) into pipeline-runner with a `--scoring-mode` CLI switch preserving v1.2 three-lens behavior for comparison. Update the simulation adapter to accept L4 activities directly. Ensure checkpoint system supports L4-level entries with backward-compatible resume.

Requirements: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, SIM-01, SIM-02.

</domain>

<decisions>
## Implementation Decisions

### Scoring mode switch
- `--scoring-mode` flag with values `two-pass` and `three-lens`
- **Default is `two-pass`** when flag is omitted -- v1.3 is the standard path
- Users opt into v1.2 behavior explicitly with `--scoring-mode three-lens`
- If two-pass modules don't exist (Phases 21-22 not built), **error immediately** -- no silent fallback
- `--top-n` flag in three-lens mode: **warn and ignore** (print warning, continue running)
- CLI summary output adds a `Scoring mode: two-pass` line to both === Pipeline === and === Pipeline Complete === blocks

### Report labeling
- **Header annotation** in report files indicating which scoring mode produced them (e.g., `Scoring Mode: two-pass`)
- Same filenames and locations as v1.2 -- no filename suffixes or structural changes
- Pre-score TSV artifact is **two-pass only** -- not written in three-lens mode
- Two-pass-specific stats (pre-score count, survivors, cutoff) shown **inline** with existing summary flow: Triaged -> Pre-scored -> Survivors -> LLM Scored -> Promoted -> Simulated
- L3 names displayed as **group headers** in reports, with L4 survivors listed underneath (preserves hierarchical context)

### Checkpoint migration
- v1.2 checkpoints (skill-level, version 1) are **incompatible** with two-pass mode -- start fresh
- Old checkpoint preserved as `.checkpoint.v12.bak` for safety before creating new checkpoint
- **Bump checkpoint schema to version 2** for two-pass checkpoints -- loadCheckpoint rejects mismatched versions per scoring mode
- Deterministic pre-scoring **always re-runs** on resume (<100ms, not worth checkpointing)
- Top-N filter **re-evaluates** on resume -- if user changed `--top-n` between runs, updated survivor count applies
- Only LLM scoring entries need checkpointing (L4 ID as checkpoint key)

### Simulation adapter
- Simulation runs **per-L4 survivor** in two-pass mode (not re-grouped by L3)
- SimulationInput gains an `l4Activity` field as primary subject; existing `opportunity` (L3) field becomes optional metadata
- Simulation artifacts organized **flat by L4**: `simulations/{l4-slug}/`
- Archetype for simulation routing comes from the **L4 activity's own archetype field**, not inherited from parent L3

### Claude's Discretion
- Pipeline branching architecture (where two-pass vs three-lens paths diverge in pipeline-runner)
- Exact checkpoint version 2 schema fields and Zod definition
- LensScore synthesis implementation (mapping deterministic dimensions to existing lens shape)
- Internal function decomposition for the two-pass pipeline path
- How three-lens mode remains entirely untouched (code isolation strategy)

</decisions>

<specifics>
## Specific Ideas

- The pipeline flow in two-pass should read as a clear funnel in logs: "826 candidates -> 53 survivors -> 48 LLM scored -> 31 promoted -> 31 simulated"
- Three-lens mode should be a completely separate code path that shares no new v1.3 logic -- it runs the exact v1.2 pipeline unchanged
- The `.checkpoint.v12.bak` backup on mode switch prevents accidental data loss during the transition period

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pipeline-runner.ts`: Main orchestration loop -- branching point for two-pass vs three-lens mode selection
- `scoring-to-simulation.ts`: `toSimulationInputs()` -- current L3-level adapter, needs L4-level alternative for two-pass
- `checkpoint.ts`: `CheckpointSchema` (version 1), `createCheckpointWriter`, `loadCheckpoint` -- version bump and L4 key support needed
- `cli.ts`: Commander setup with existing `--backend`, `--concurrency`, `--skip-sim` flags -- add `--scoring-mode` and `--top-n` here
- `extract-skills.ts`: `extractScoringSkills()` -- pattern for hierarchy traversal
- `progress.ts`: `createProgressTracker()` -- reusable for two-pass progress reporting

### Established Patterns
- PipelineOptions interface for dependency injection (chatFn, parseExportFn, runSimulationPipelineFn)
- Semaphore-bounded concurrent scoring with checkpoint persistence per entry
- Non-fatal error handling (simulation failures don't kill pipeline)
- Result type pattern: `{success, data} | {success, error}`
- Pure helper functions tested independently (resolveOutputDir, toSimulationInputs)

### Integration Points
- `cli.ts`: New `--scoring-mode` flag (Commander Option with choices), `--top-n` flag wired to PipelineOptions
- `PipelineOptions`: New fields -- `scoringMode`, `topN`
- `PipelineResult`: New fields for two-pass stats (preScoredCount, survivorCount, cutoffScore)
- `CheckpointSchema`: Version 2 with `scoringMode` and `l4Id` entry fields
- `SimulationInput`: New optional `l4Activity` field, `opportunity` becomes optional
- `writeFinalReports` / `writeEvaluation`: Accept scoring mode for header annotation
- Report formatters: Scoring mode annotation in headers

</code_context>

<deferred>
## Deferred Ideas

- CLI-configurable dimension weights (ADVN-01 -- deferred until Ford validation)
- Overlap group deduplication (ADVN-02)
- Tier-aware top-N slot allocation (ADVN-03)
- Pre-score histogram in summary reports (ADVN-05)
- A/B validation of two-pass vs three-lens rankings (Phase 24 scope -- VAL-01)

</deferred>

---

*Phase: 23-pipeline-integration*
*Context gathered: 2026-03-13*
