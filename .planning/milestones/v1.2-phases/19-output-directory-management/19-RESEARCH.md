# Phase 19: Output Directory Management - Research

**Researched:** 2026-03-12
**Domain:** CLI default resolution, file I/O path management
**Confidence:** HIGH

## Summary

This phase is a small, self-contained CLI change. The current `cli.ts` hardcodes `./evaluation` as the Commander default for `--output-dir`. The fix is to remove that static default and compute a backend-aware default (`evaluation-ollama/` or `evaluation-vllm/`) in the action handler, before the value flows into `PipelineOptions.outputDir`. The `regen-reports.ts` standalone script also defaults to `./evaluation` and should follow the same pattern or remain explicit-arg-only.

The architecture is already set up for this -- `PipelineOptions.outputDir` is threaded through the entire pipeline via dependency injection. Changing the resolved value at the CLI entry point propagates everywhere automatically: checkpoint paths, archive paths, evaluation output, simulation directory, and git auto-commit.

**Primary recommendation:** Remove Commander `.default("./evaluation")` from `--output-dir`, compute `./evaluation-${backend}` in the action handler when the user did not explicitly pass `--output-dir`, and leave explicit `--output-dir` values untouched.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Always show output path in startup banner -- print `Output dir: evaluation-vllm/` regardless of whether auto-resolved or user-specified
- Completion message uses relative path: `Results written to evaluation-vllm/`
- No migration warning for users with existing `./evaluation/` directory -- no data loss risk since old dir is untouched
- No visual distinction between auto-resolved and user-specified output dirs -- keep it simple

### Claude's Discretion
- Directory naming convention -- `evaluation-{backend}/` pattern (matches existing `evaluation-vllm/` already in working tree)
- Explicit `--output-dir` override behavior -- when user passes `--output-dir`, use as-is without appending backend suffix
- Checkpoint and regen-reports alignment -- ensure `.pipeline/` checkpoints and `regen-reports.ts` default follow the same auto-namespacing logic
- How to resolve the default in code (Commander default vs computed default in action handler)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OUT-01 | Output directory auto-namespaces by backend type (`evaluation-ollama/`, `evaluation-vllm/`) when `--output-dir` is not explicitly set | Commander default removal + computed default in action handler; `resolveOutputDir()` helper |
| OUT-02 | Local Ollama runs and cloud vLLM runs never clobber each other's output by default | Direct consequence of OUT-01 -- different backends produce different default paths |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | ^13.0.0 | CLI option parsing | Already in use; provides `.default()` and raw argv access |
| node:path | built-in | Path resolution | Already used throughout for `path.join`, `path.resolve` |

### Supporting
No additional libraries needed. This is pure CLI default resolution logic.

## Architecture Patterns

### Recommended Approach: Computed Default in Action Handler

**What:** Remove the static Commander `.default("./evaluation")` from `--output-dir`. In the action handler, detect whether the user explicitly passed `--output-dir` and compute the default from `--backend` if they did not.

**Why this over Commander default:** Commander defaults are static strings set at definition time. The output dir default depends on the `--backend` value, which is only known at action handler invocation time. Computing the default in the handler is the established pattern in this codebase (see CONTEXT.md line 40: "computed defaults resolved in action handler before passing to runPipeline").

**Detection technique:** Commander does not expose a clean "was this option explicitly passed" API. The standard approach is to omit the `.default()` call and check if the value is `undefined` in the handler. When `opts.outputDir` is `undefined`, compute the default; otherwise use as-is.

### Helper Function: `resolveOutputDir`

```typescript
// Pure function, easily testable
export function resolveOutputDir(
  explicitOutputDir: string | undefined,
  backend: string,
): string {
  if (explicitOutputDir != null) return explicitOutputDir;
  return `./evaluation-${backend}`;
}
```

**Key properties:**
- Pure function with no side effects
- Explicit `--output-dir` always wins (no suffix appended)
- Default pattern: `./evaluation-ollama` or `./evaluation-vllm`
- Matches existing `evaluation-vllm/` directory already in working tree

### Integration Points (from CONTEXT.md, verified against source)

| File | Line | Change |
|------|------|--------|
| `cli.ts:103-106` | Remove `.default("./evaluation")` from `--output-dir` option | Make outputDir optional (undefined when not passed) |
| `cli.ts:130` | Action handler opts type | Change `outputDir: string` to `outputDir?: string` |
| `cli.ts:~131` (early in handler) | Add `resolveOutputDir` call | `opts.outputDir = resolveOutputDir(opts.outputDir, opts.backend);` |
| `regen-reports.ts:20` | `OUTPUT_DIR` default | Change to accept `--backend` arg or keep as explicit positional arg |

### What Does NOT Change

- `PipelineOptions.outputDir` stays `string` (not optional) -- CLI resolves before passing
- `pipeline-runner.ts` -- receives resolved path, no changes needed
- `checkpoint.ts` -- receives resolved path via `outputDir`, no changes needed
- All output writers -- receive resolved path, no changes needed
- Banner output (line 272) and completion message (line 361) -- already print `opts.outputDir`, will show resolved path automatically

### regen-reports.ts Alignment

The standalone `regen-reports.ts` script currently defaults `OUTPUT_DIR` to `./evaluation` (line 20). Two options:

**Recommended:** Keep it as an explicit positional argument (no auto-namespacing). Users of `regen-reports.ts` know which directory they want to regenerate from. The script already accepts `process.argv[3]` as the output dir. This is simpler and avoids adding a `--backend` flag to a standalone utility.

**Alternative:** Add `--backend` flag and compute default. Unnecessary complexity for a rarely-used utility script.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI option detection | Parsing `process.argv` manually | Omit Commander `.default()` + check for `undefined` | Commander handles all edge cases (short flags, =value, etc.) |

## Common Pitfalls

### Pitfall 1: Commander Default Interference
**What goes wrong:** If you keep `.default("./evaluation")` on the Commander option, `opts.outputDir` will never be `undefined` -- it will always be `"./evaluation"` when the user omits the flag. You cannot distinguish "user passed `--output-dir ./evaluation`" from "user omitted `--output-dir`".
**How to avoid:** Remove `.default("./evaluation")` entirely. Check for `undefined` in the handler.

### Pitfall 2: Forgetting the opts Type Update
**What goes wrong:** The action handler's `opts` type annotation has `outputDir: string`. After removing the default, Commander will pass `undefined` when the flag is omitted. TypeScript will not catch this if the type is wrong.
**How to avoid:** Change `outputDir: string` to `outputDir?: string` in the opts type, then assert after resolution.

### Pitfall 3: Checkpoint Path Mismatch on Resume
**What goes wrong:** If a user starts a run with auto-resolved `evaluation-vllm/`, then later runs with explicit `--output-dir ./evaluation-vllm`, the checkpoint file is the same path and resume works. No issue. But if the user changes backends, the checkpoint is in a different directory and resume starts fresh -- which is the correct behavior (different backend = different evaluation).
**Warning signs:** This is not actually a pitfall -- it is desired behavior. Document it for clarity.

## Code Examples

### resolveOutputDir (pure function)
```typescript
// Source: designed from CONTEXT.md requirements
export function resolveOutputDir(
  explicitOutputDir: string | undefined,
  backend: string,
): string {
  if (explicitOutputDir != null) return explicitOutputDir;
  return `./evaluation-${backend}`;
}
```

### CLI Option Change
```typescript
// Before:
.option("--output-dir <path>", "Output directory for evaluation results", "./evaluation")

// After:
.option("--output-dir <path>", "Output directory for evaluation results")
```

### Action Handler Resolution
```typescript
// Early in action handler, before any use of opts.outputDir:
const resolvedOutputDir = resolveOutputDir(opts.outputDir, opts.backend);
// Use resolvedOutputDir everywhere below (or reassign opts.outputDir)
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` with `assert/strict` |
| Config file | None (convention-based, `npm test` runs `node --test`) |
| Quick run command | `cd src && npx tsx --test cli.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OUT-01 | `resolveOutputDir` returns `evaluation-{backend}` when no explicit dir | unit | `cd src && npx tsx --test cli.test.ts` | Needs new tests in existing file |
| OUT-01 | `resolveOutputDir` returns explicit dir unchanged when provided | unit | `cd src && npx tsx --test cli.test.ts` | Needs new tests in existing file |
| OUT-02 | Default ollama dir differs from default vllm dir (non-clobber guarantee) | unit | `cd src && npx tsx --test cli.test.ts` | Needs new test in existing file |

### Sampling Rate
- **Per task commit:** `cd src && npx tsx --test cli.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/cli.test.ts` -- add `describe("resolveOutputDir", ...)` test suite covering: ollama default, vllm default, explicit override, explicit override with backend

## Sources

### Primary (HIGH confidence)
- `src/cli.ts` -- direct source code inspection, lines 102-106 (option definition), line 130 (action handler), line 272 (banner), line 361 (completion message)
- `src/pipeline/pipeline-runner.ts` -- direct source code inspection, `PipelineOptions.outputDir` threading
- `src/regen-reports.ts` -- direct source code inspection, line 20 (OUTPUT_DIR default)
- `src/infra/checkpoint.ts` -- direct source code inspection, `checkpointPath()` uses `outputDir` parameter

### Secondary (MEDIUM confidence)
- Commander.js default behavior: omitting `.default()` makes option value `undefined` when not passed -- verified by standard Commander.js documentation pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, only modifying existing CLI entry point
- Architecture: HIGH -- single pure function + one line change in action handler; all downstream consumers already parameterized
- Pitfalls: HIGH -- verified against source code; Commander default behavior is well-understood

**Research date:** 2026-03-12
**Valid until:** Indefinite (stable domain, no external dependencies)
