# Phase 17: CLI Automation - Research

**Researched:** 2026-03-12
**Domain:** CLI lifecycle orchestration, retry logic, process exit codes
**Confidence:** HIGH

## Summary

Phase 17 adds three CLI flags (`--retry`, `--teardown`, and implicit full-lifecycle orchestration) to the existing Commander-based CLI in `cli.ts`. The implementation is entirely within the project's own codebase -- no new libraries are needed. The core challenge is wiring a retry loop around the existing `runPipeline` call while correctly manipulating checkpoint state between attempts.

The checkpoint system already tracks errors via `status: 'error'` entries and `getCompletedNames()` returns ALL entries (scored + error + skipped), which causes the pipeline to skip errored opportunities on resume. The retry mechanism must clear error entries from the checkpoint between attempts so errored opps become re-processable. Reports should only be generated after all retry rounds complete (to reflect final state).

**Primary recommendation:** Implement retry as a loop in cli.ts wrapping runPipeline, with a new `clearCheckpointErrors()` helper in checkpoint.ts. Teardown extends the existing `doCleanup()` pattern. Exit codes replace the current ad-hoc `process.exit` calls.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Re-run full pipeline for retries -- checkpoint system already skips scored opportunities via `getCompletedNames()`
- Before each retry attempt, clear 'error' entries from checkpoint file so errored opps become retryable (new `clearCheckpointErrors` helper)
- Retries run at concurrency 1 regardless of original `--concurrency` value (safer for struggling backends, matches AUTO-01 spec)
- Banner + summary between retry attempts: "=== Retry 2/3: N errored opportunities ===" followed by normal pipeline output
- Retry loop lives in `cli.ts` action handler, wrapping existing `runPipeline` calls

### Claude's Discretion
- Teardown implementation approach -- `--teardown` flag wiring into existing `backendConfig.cleanup()` pattern
- Exit code mapping -- code 0 (all scored), code 1 (errors remain after retries), code 2 (fatal failure like parse error or infra down)
- Lifecycle orchestration -- where score->retry->report->teardown sequencing lives (cli.ts extension is the obvious approach)
- Whether `--teardown` tears down on fatal failure too (likely yes -- don't leave orphaned pods)
- Report regeneration after retry rounds (reports should reflect final state after all retries complete)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTO-01 | CLI `--retry <N>` flag automatically retries errored opportunities up to N times with concurrency 1 | Checkpoint system analysis confirms `clearCheckpointErrors` + re-calling `runPipeline` with `concurrency: 1` is the correct approach. `getCompletedNames` returns all entries including errors, so clearing errors makes them re-processable. |
| AUTO-02 | CLI `--teardown` flag automatically stops and deletes RunPod pod on pipeline completion or failure | `backendConfig.cleanup()` already exists and is called in signal handlers and `finally` block. `--teardown` flag controls whether cleanup runs on normal completion; on fatal failure it should always run. |
| AUTO-03 | Single CLI invocation handles full lifecycle: score -> retry -> report -> teardown | Current cli.ts already calls runPipeline (which includes scoring + reports). Adding retry loop before and teardown after completes the lifecycle. Reports are generated inside runPipeline, so the last retry iteration produces final reports. |
| AUTO-04 | Pipeline exit code reflects final status (0 = all scored, 1 = errors remain, 2 = fatal) | Replace current ad-hoc `process.exit(1)` calls with structured exit code logic at end of action handler. Fatal = catch block around entire lifecycle. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | existing | CLI option parsing | Already used in cli.ts; `.option()` for `--retry` and `--teardown` |
| node:test | built-in | Test framework | Project convention per CLAUDE.md |
| node:assert/strict | built-in | Test assertions | Project convention per CLAUDE.md |

### Supporting
No new libraries required. All functionality builds on existing project code.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Loop in cli.ts | Separate orchestrator module | Unnecessary abstraction for simple loop; cli.ts is the natural home per locked decision |

## Architecture Patterns

### Current cli.ts Structure (before changes)
```
cli.ts action handler:
  1. Parse + validate input
  2. Create backend (backendConfig)
  3. Install signal handlers (SIGINT/SIGTERM -> doCleanup)
  4. Run pipeline (single call)
  5. Print summary
  6. Exit (ad-hoc process.exit calls)
```

### Target cli.ts Structure (after changes)
```
cli.ts action handler:
  1. Parse + validate input (including --retry, --teardown)
  2. Create backend (backendConfig)
  3. Install signal handlers (SIGINT/SIGTERM -> doCleanup)
  4. LIFECYCLE LOOP:
     a. Run pipeline (initial)
     b. FOR i = 1..retryCount when errorCount > 0:
        - Print retry banner
        - clearCheckpointErrors(outputDir)
        - Run pipeline again (concurrency: 1)
     c. (Reports generated inside last runPipeline call)
  5. Print summary
  6. Teardown if --teardown flag set
  7. Exit with structured code (0/1/2)
```

### Pattern 1: Checkpoint Error Clearing
**What:** New `clearCheckpointErrors(outputDir)` function in `checkpoint.ts`
**When to use:** Before each retry attempt
**Implementation:**
```typescript
// In src/infra/checkpoint.ts
export function clearCheckpointErrors(outputDir: string): number {
  const checkpoint = loadCheckpoint(outputDir);
  if (!checkpoint) return 0;

  const before = checkpoint.entries.length;
  checkpoint.entries = checkpoint.entries.filter(e => e.status !== 'error');
  const cleared = before - checkpoint.entries.length;

  if (cleared > 0) {
    saveCheckpoint(outputDir, checkpoint);
  }
  return cleared;
}
```

### Pattern 2: Retry Loop in cli.ts
**What:** Wrap runPipeline in a retry loop that clears errors between attempts
**Key detail:** Concurrency drops to 1 for retries (locked decision)
```typescript
let lastResult = pipelineResult;
const maxRetries = parseInt(opts.retry ?? "0", 10);

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  if (lastResult.errorCount === 0) break;

  const cleared = clearCheckpointErrors(opts.outputDir);
  console.log(`\n=== Retry ${attempt}/${maxRetries}: ${cleared} errored opportunities ===\n`);

  lastResult = await runPipeline(opts.input, {
    ...pipelineOptions,
    concurrency: 1,  // Always concurrency 1 for retries
  }, logger);
}
```

### Pattern 3: Structured Exit Codes
**What:** Replace ad-hoc process.exit calls with a single exit point
**Mapping:**
- `0`: All opportunities scored (errorCount === 0)
- `1`: Errors remain after retries (errorCount > 0)
- `2`: Fatal failure (thrown exception -- parse error, infra down, etc.)

### Pattern 4: Teardown Control
**What:** `--teardown` flag controls whether cloud resources are cleaned up
**Key insight:** Current code ALWAYS calls `doCleanup()` in the finally block (cli.ts:231). For `--teardown` semantics:
- Without `--teardown`: Current behavior stays -- cleanup still runs on SIGINT/SIGTERM but NOT on normal completion (this needs verification -- see current code which DOES cleanup always)
- With `--teardown`: Explicitly tear down after lifecycle completes

**IMPORTANT FINDING:** Current cli.ts line 231 ALREADY calls `doCleanup()` in the finally block unconditionally. The `--teardown` flag's role is actually about making this behavior explicit and controllable. Two options:
1. `--teardown` is the default and `--no-teardown` opts out (keeps current always-cleanup behavior)
2. `--teardown` enables cleanup; without it, cloud resources are left running for reuse

**Recommendation:** Option 2 aligns better with the requirement spec ("User passes `--teardown`" implies opt-in). Change the finally block to only cleanup when `--teardown` is set OR on fatal failure. This lets users keep pods running between multiple evaluation runs.

### Anti-Patterns to Avoid
- **Nesting runPipeline changes for retry:** The retry loop belongs in cli.ts, NOT inside pipeline-runner.ts. Pipeline runner should remain a single-invocation function.
- **Re-parsing input on each retry:** Input parsing happens once before the loop. Only runPipeline is re-called.
- **Clearing scored entries:** Only clear `error` entries from checkpoint. Never touch `scored` or `skipped`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI flag parsing | Custom argv parsing | Commander `.option()` | Already used throughout cli.ts |
| Checkpoint persistence | Manual JSON read/write in retry loop | Existing `loadCheckpoint` / `saveCheckpoint` | Atomic write, backup, Zod validation already built |

## Common Pitfalls

### Pitfall 1: getCompletedNames Includes Errors
**What goes wrong:** Assuming `getCompletedNames` only returns scored items
**Why it happens:** The function maps ALL entries regardless of status (line 68 of checkpoint.ts)
**How to avoid:** The `clearCheckpointErrors` approach is correct -- physically remove error entries from checkpoint before retry so they're no longer in `completed` set
**Warning signs:** Retries run but skip all errored opportunities (0 newly scored)

### Pitfall 2: Report Generation Timing
**What goes wrong:** Reports generated after initial run don't get updated after retries
**Why it happens:** `runPipeline` generates reports internally (lines 496-507 of pipeline-runner.ts)
**How to avoid:** Each `runPipeline` call regenerates reports. The LAST retry iteration produces the final reports, which is correct behavior -- no extra work needed.
**Warning signs:** Report shows errors that were actually resolved by retries

### Pitfall 3: Cost Tracker Lifecycle Across Retries
**What goes wrong:** Cost tracker `start()`/`stop()` called multiple times across retry loop
**Why it happens:** Cost tracker is started/stopped in cli.ts around the pipeline call
**How to avoid:** Start cost tracker once before the retry loop, stop once after. Move `costTracker.start()` and `costTracker.stop()` outside the retry loop.
**Warning signs:** Cost summary shows only last retry's GPU time, not total

### Pitfall 4: Double Teardown
**What goes wrong:** `doCleanup()` called both in finally block and in explicit teardown
**Why it happens:** Current code has cleanup in finally + signal handlers
**How to avoid:** The `cleanedUp` boolean guard (cli.ts:167) already prevents double execution. Keep this pattern.
**Warning signs:** "Cloud resources torn down" printed twice (actually prevented by guard)

### Pitfall 5: Backend Creation for Retry
**What goes wrong:** Creating a new backend for each retry attempt
**Why it happens:** Misunderstanding that the existing `backendConfig.chatFn` can be reused
**How to avoid:** Backend is created once. All retry calls share the same `backendConfig.chatFn`. Only `concurrency` changes.
**Warning signs:** RunPod provisions new endpoints for each retry (expensive, slow)

### Pitfall 6: Teardown on Fatal Failure Leaving Orphaned Pods
**What goes wrong:** Fatal exception before teardown logic runs, cloud resources remain
**Why it happens:** `process.exit(2)` bypasses cleanup
**How to avoid:** Wrap entire lifecycle in try/catch. The catch block should ALWAYS call doCleanup regardless of `--teardown` flag (orphaned pods cost money). Then exit with code 2.
**Warning signs:** RunPod dashboard shows running pods after failed evaluations

## Code Examples

### Existing: Commander Option Pattern
```typescript
// Source: cli.ts:64-65
.option("--skip-sim", "Skip simulation phase (scoring only)")
.option("--sim-timeout <ms>", "Per-opportunity simulation timeout in milliseconds")
```

### Existing: Checkpoint Load + Complete Check
```typescript
// Source: checkpoint.ts:66-69
export function getCompletedNames(checkpoint: Checkpoint | null): Set<string> {
  if (!checkpoint) return new Set();
  return new Set(checkpoint.entries.map((e) => e.l3Name));
}
```

### Existing: Signal Handler Cleanup Guard
```typescript
// Source: cli.ts:167-176
let cleanedUp = false;
const doCleanup = async () => {
  if (cleanedUp) return;
  cleanedUp = true;
  if (backendConfig.cleanup) {
    console.log("\nTearing down cloud resources...");
    await backendConfig.cleanup();
    console.log("Cloud resources torn down.");
  }
};
```

### Existing: PipelineResult Error Tracking
```typescript
// Source: pipeline-runner.ts:93-107
export interface PipelineResult {
  triageCount: number;
  scoredCount: number;
  errorCount: number;
  errors: string[];
  // ... other fields
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual retry via re-running CLI | Automated retry via `--retry N` | Phase 17 | Eliminates manual intervention for transient errors |
| Manual teardown via RunPod dashboard | Automated via `--teardown` | Phase 17 | Prevents orphaned cloud resources |
| Ad-hoc process.exit codes | Structured 0/1/2 exit codes | Phase 17 | Enables scripted CI/cron usage |

## Open Questions

1. **Should `--teardown` change current always-cleanup behavior?**
   - What we know: Current cli.ts ALWAYS cleans up in the finally block (line 231). The `--teardown` flag implies opt-in behavior.
   - What's unclear: Whether users want pods to persist between runs (for multiple evaluations against same pod)
   - Recommendation: Make `--teardown` opt-in. Without it, leave cloud resources running. On fatal failure, always clean up regardless. This is the most useful behavior for iterative development.

2. **Should the initial pipeline run disable report generation?**
   - What we know: Each runPipeline call generates reports. Intermediate reports from failed runs waste time.
   - What's unclear: Whether report generation time is significant enough to optimize
   - Recommendation: Don't optimize. Report generation is fast (file writes). Each retry produces correct cumulative reports. The simplicity of not forking pipeline behavior outweighs minor time savings.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `assert/strict` |
| Config file | None (convention-based, co-located `*.test.ts` files) |
| Quick run command | `npx tsx --test src/infra/checkpoint.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTO-01 | `clearCheckpointErrors` removes error entries, preserves scored/skipped | unit | `npx tsx --test src/infra/checkpoint.test.ts` | Needs new tests |
| AUTO-01 | Retry loop calls runPipeline with concurrency 1 after clearing errors | unit | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | Needs new tests |
| AUTO-02 | `--teardown` triggers cleanup on completion; always cleans up on fatal | unit | `npx tsx --test src/cli.test.ts` | Needs new file |
| AUTO-03 | Full lifecycle: score -> retry -> report -> teardown in sequence | integration | Manual (requires real backend) | Manual-only |
| AUTO-04 | Exit code 0 when all scored, 1 when errors remain, 2 on fatal | unit | `npx tsx --test src/cli.test.ts` | Needs new file |

### Sampling Rate
- **Per task commit:** `npx tsx --test src/infra/checkpoint.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/infra/checkpoint.test.ts` -- add tests for new `clearCheckpointErrors` function (file exists, needs new test cases)
- [ ] CLI-level tests for retry loop and exit codes -- may need lightweight test harness or test via pipeline-runner.test.ts with mocked pipeline

## Sources

### Primary (HIGH confidence)
- Direct code analysis of `src/cli.ts` (267 lines) -- complete current CLI implementation
- Direct code analysis of `src/infra/checkpoint.ts` (194 lines) -- checkpoint system including `getCompletedNames` behavior
- Direct code analysis of `src/pipeline/pipeline-runner.ts` (562 lines) -- pipeline result shape, error tracking, report generation
- Direct code analysis of `src/infra/backend-factory.ts` (112 lines) -- BackendConfig.cleanup pattern

### Secondary (MEDIUM confidence)
- CONTEXT.md locked decisions -- user-validated implementation approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing project code
- Architecture: HIGH -- clear integration points identified in existing code, all patterns verified by reading source
- Pitfalls: HIGH -- identified through direct code analysis (checkpoint behavior, cost tracker lifecycle, teardown guard)

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- internal codebase, no external dependencies changing)
