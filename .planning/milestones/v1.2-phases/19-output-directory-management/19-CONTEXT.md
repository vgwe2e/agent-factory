# Phase 19: Output Directory Management - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Local and cloud evaluation runs produce output in separate directories by default, preventing accidental overwrites. Backend-aware output namespacing (`evaluation-ollama/`, `evaluation-vllm/`) applied when `--output-dir` is not explicitly set. Requirements: OUT-01, OUT-02.

</domain>

<decisions>
## Implementation Decisions

### CLI output messaging
- Always show output path in startup banner — print `Output dir: evaluation-vllm/` regardless of whether auto-resolved or user-specified
- Completion message uses relative path: `Results written to evaluation-vllm/`
- No migration warning for users with existing `./evaluation/` directory — no data loss risk since old dir is untouched
- No visual distinction between auto-resolved and user-specified output dirs — keep it simple

### Claude's Discretion
- Directory naming convention — `evaluation-{backend}/` pattern (matches existing `evaluation-vllm/` already in working tree)
- Explicit `--output-dir` override behavior — when user passes `--output-dir`, use as-is without appending backend suffix
- Checkpoint and regen-reports alignment — ensure `.pipeline/` checkpoints and `regen-reports.ts` default follow the same auto-namespacing logic
- How to resolve the default in code (Commander default vs computed default in action handler)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cli.ts:41-43` — `--output-dir <path>` option with Commander default `./evaluation`; change default to computed value based on `--backend`
- `cli.ts:201` — Already prints `Output dir: ${opts.outputDir}` in startup banner; will show resolved path automatically
- `cli.ts:265` — Already prints `Results written to ${opts.outputDir}`; will show resolved path automatically
- `PipelineOptions.outputDir` — Threaded through entire pipeline; changing the CLI default propagates everywhere

### Established Patterns
- Commander `.default()` for static defaults; computed defaults resolved in action handler before passing to `runPipeline`
- `PipelineOptions` dependency injection — outputDir already flows to all consumers
- `evaluation-vllm/` directory already exists from manual cloud runs — naming convention validated

### Integration Points
- `cli.ts:43` — Remove hardcoded `./evaluation` default; compute based on `opts.backend`
- `cli.ts:66` — Action handler: resolve `outputDir` default before pipeline call if user didn't pass `--output-dir`
- `regen-reports.ts:20` — Standalone script defaults to `./evaluation`; should accept backend param or keep as explicit arg
- `src/pipeline/pipeline-runner.ts:58` — `PipelineOptions.outputDir` receives resolved value from CLI

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

*Phase: 19-output-directory-management*
*Context gathered: 2026-03-12*
