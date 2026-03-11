# Phase 8: Resilience & Recovery - Research

**Researched:** 2026-03-11
**Domain:** Error handling, checkpointing, crash recovery for long-running Node.js CLI pipelines
**Confidence:** HIGH

## Summary

Phase 8 wraps the existing evaluation pipeline with three resilience capabilities: graceful LLM failure handling (INFR-01), automatic git commits after each evaluation cycle (INFR-03), and checkpoint/resume so crashed runs skip already-completed work (INFR-08).

The codebase already has foundational retry logic in `src/scoring/ollama-client.ts` (`scoreWithRetry` with exponential backoff and Zod validation). Phase 8 extends this into a full resilience layer: fallback prompts when retries exhaust, skip-and-log when fallback fails, checkpoint files that track completed opportunity names, and `child_process.execSync` git commits after each cycle.

**Primary recommendation:** Build three focused modules -- `src/infra/retry-policy.ts` (wraps existing `scoreWithRetry` with fallback + skip-and-log), `src/infra/checkpoint.ts` (JSON file read/write for resume state), `src/infra/git-commit.ts` (auto-commit via `child_process.execSync`). Wire them into the scoring pipeline's async generator loop without changing existing pure-function scoring logic.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | Engine recovers from individual LLM call failures (retry, fallback prompt, skip-and-log) | Existing `scoreWithRetry` provides retry+backoff base. Extend with fallback prompt strategy and skip-and-log at pipeline level. See Architecture Patterns section. |
| INFR-03 | Engine auto-commits evaluation artifacts to git after each evaluation cycle | Use `child_process.execSync` for `git add` + `git commit`. No npm dependency needed. See Git Auto-Commit pattern. |
| INFR-08 | Engine checkpoints progress so crashed run resumes from last completed evaluation | JSON checkpoint file in output directory tracking completed L3 names + timestamps. Filter already-completed from async generator. See Checkpoint pattern. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:child_process | built-in | Git auto-commit via execSync | Zero dependencies, synchronous commit guarantees ordering |
| node:fs | built-in | Checkpoint file read/write | Already used throughout codebase |
| node:test | built-in | Testing | Project convention per CLAUDE.md |
| zod | ^3.24.0 | Checkpoint schema validation | Already in project dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | All required functionality is available via Node.js built-ins and existing project dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| execSync for git | simple-git npm package | Adds dependency; execSync is sufficient for sequential commit operations |
| JSON checkpoint file | SQLite via better-sqlite3 | Overkill -- project explicitly states "files are the database" |
| Custom retry | p-retry npm package | scoreWithRetry already exists; extending it avoids new dependency |

**Installation:**
```bash
# No new dependencies required. All functionality uses Node.js built-ins + existing deps.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  infra/
    ollama.ts              # (existing) Ollama connectivity
    retry-policy.ts        # NEW: fallback prompt + skip-and-log wrapper
    retry-policy.test.ts   # NEW: tests
    checkpoint.ts          # NEW: checkpoint read/write/resume logic
    checkpoint.test.ts     # NEW: tests
    git-commit.ts          # NEW: auto-commit after evaluation cycle
    git-commit.test.ts     # NEW: tests
```

### Pattern 1: Resilient LLM Call (INFR-01)

**What:** Three-tier failure handling: retry (existing) -> fallback prompt -> skip-and-log

**When to use:** Every LLM call in the scoring and simulation pipelines.

**Design:**

The existing `scoreWithRetry` in `ollama-client.ts` already handles tier 1 (retry with exponential backoff, 3 attempts). Phase 8 adds two more tiers on top:

```typescript
// src/infra/retry-policy.ts

import type { ValidatedResult } from "../scoring/ollama-client.js";
import { scoreWithRetry } from "../scoring/ollama-client.js";
import type { ZodSchema } from "zod";

export interface RetryPolicyOptions<T> {
  /** Primary call function returning raw JSON string */
  primaryCall: () => Promise<string>;
  /** Fallback call function (simplified prompt) -- called if primary exhausts retries */
  fallbackCall?: () => Promise<string>;
  /** Zod schema for validation */
  schema: ZodSchema<T>;
  /** Max retries per attempt tier (default 3) */
  maxRetries?: number;
  /** Context for logging on skip */
  label: string;
}

export interface ResilientResult<T> {
  result: ValidatedResult<T>;
  /** Which tier resolved it: "primary" | "fallback" | "skipped" */
  resolvedVia: "primary" | "fallback" | "skipped";
  /** Error details if skipped */
  skipReason?: string;
}

export async function callWithResilience<T>(
  opts: RetryPolicyOptions<T>,
): Promise<ResilientResult<T>> {
  // Tier 1: Primary call with retries
  const primary = await scoreWithRetry(opts.schema, opts.primaryCall, opts.maxRetries);
  if (primary.success) {
    return { result: primary, resolvedVia: "primary" };
  }

  // Tier 2: Fallback prompt with retries
  if (opts.fallbackCall) {
    const fallback = await scoreWithRetry(opts.schema, opts.fallbackCall, opts.maxRetries);
    if (fallback.success) {
      return { result: fallback, resolvedVia: "fallback" };
    }
  }

  // Tier 3: Skip and log
  return {
    result: { success: false, error: `Skipped ${opts.label}: all attempts exhausted` },
    resolvedVia: "skipped",
    skipReason: primary.error,
  };
}
```

**Key insight:** The fallback prompt is a simplified version of the primary prompt -- fewer constraints, shorter context, more lenient schema. This handles cases where the model chokes on complex instructions but can handle simpler ones. The pipeline continues either way; skipped opportunities are logged but do not crash the run.

### Pattern 2: Checkpoint File (INFR-08)

**What:** JSON file that tracks which L3 opportunities have been fully evaluated, enabling resume-from-crash.

**When to use:** Written after each opportunity completes scoring; read at pipeline startup.

```typescript
// src/infra/checkpoint.ts

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { z } from "zod";

const CheckpointEntrySchema = z.object({
  l3Name: z.string(),
  completedAt: z.string(), // ISO 8601
  status: z.enum(["scored", "skipped", "error"]),
});

const CheckpointSchema = z.object({
  version: z.literal(1),
  inputFile: z.string(),
  startedAt: z.string(),
  entries: z.array(CheckpointEntrySchema),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type CheckpointEntry = z.infer<typeof CheckpointEntrySchema>;

const CHECKPOINT_FILENAME = ".checkpoint.json";

export function checkpointPath(outputDir: string): string {
  return `${outputDir}/${CHECKPOINT_FILENAME}`;
}

export function loadCheckpoint(outputDir: string): Checkpoint | null {
  const path = checkpointPath(outputDir);
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const parsed = CheckpointSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function saveCheckpoint(outputDir: string, checkpoint: Checkpoint): void {
  writeFileSync(checkpointPath(outputDir), JSON.stringify(checkpoint, null, 2));
}

export function getCompletedNames(checkpoint: Checkpoint | null): Set<string> {
  if (!checkpoint) return new Set();
  return new Set(checkpoint.entries.map(e => e.l3Name));
}
```

**Resume logic:** At pipeline start, load checkpoint. Build a `Set<string>` of completed L3 names. In the scoring generator loop, skip any opportunity whose name is in the set. This is O(1) per opportunity.

**Crash safety:** `writeFileSync` is atomic enough for this use case (single JSON file, <100KB). The checkpoint is written after each opportunity completes, so at worst one opportunity is re-evaluated on resume.

### Pattern 3: Git Auto-Commit (INFR-03)

**What:** After each evaluation cycle (all opportunities processed), stage and commit output files.

**When to use:** At the end of each full pipeline run, after all output files are written.

```typescript
// src/infra/git-commit.ts

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export interface GitCommitOptions {
  outputDir: string;
  message?: string;
  /** If false, skip commit (for testing or non-git environments) */
  enabled?: boolean;
}

export function autoCommitEvaluation(opts: GitCommitOptions): { committed: boolean; error?: string } {
  if (opts.enabled === false) return { committed: false };

  try {
    // Verify we are in a git repo
    execSync("git rev-parse --is-inside-work-tree", { stdio: "pipe" });

    // Stage evaluation output directory
    execSync(`git add "${opts.outputDir}"`, { stdio: "pipe" });

    // Check if there are staged changes
    const status = execSync("git diff --cached --quiet 2>&1 || echo CHANGES", {
      encoding: "utf-8",
    }).trim();

    if (!status.includes("CHANGES")) {
      return { committed: false }; // Nothing to commit
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const msg = opts.message ?? `chore(eval): auto-commit evaluation artifacts ${timestamp}`;

    execSync(`git commit -m "${msg}"`, { stdio: "pipe" });
    return { committed: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { committed: false, error: `Git auto-commit failed: ${message}` };
  }
}
```

**Key decisions:**
- `execSync` not `exec` -- commits must be synchronous to guarantee ordering before next cycle.
- `stdio: "pipe"` suppresses git output from cluttering the CLI.
- Non-fatal: if git commit fails (not a repo, nothing to commit, etc.), the pipeline logs and continues.
- The `enabled` flag allows tests to disable git operations via dependency injection.

### Anti-Patterns to Avoid

- **Wrapping the entire pipeline in try/catch:** This defeats the purpose. Individual failures should be caught at the LLM call level, not at the pipeline level. The pipeline should always run to completion, skipping failures.
- **In-memory-only state:** If the process crashes, all progress is lost. The checkpoint must be on disk.
- **Committing after every single opportunity:** Too many commits. Commit after each full evaluation cycle (all opportunities processed), not after each individual scoring.
- **Using git libraries (simple-git, isomorphic-git):** Adds dependency for something `execSync("git ...")` handles trivially. Project convention favors zero unnecessary dependencies.
- **Checkpoint in a database:** Project explicitly states "files are the database." JSON checkpoint aligns with this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exponential backoff retry | Custom retry loop | Existing `scoreWithRetry` in ollama-client.ts | Already tested, handles Zod validation, 3-attempt default |
| JSON schema validation | Manual field checks | Zod schemas (project standard) | Consistent with all other validation in the codebase |
| Git operations | Git library wrapper | `child_process.execSync` + raw git commands | Simpler, no dependency, sufficient for commit-only operations |

**Key insight:** Most of the retry infrastructure already exists. Phase 8 is about composing existing pieces (scoreWithRetry, Result types, file I/O) into a resilience layer, not building retry logic from scratch.

## Common Pitfalls

### Pitfall 1: Checkpoint File Corruption on Crash
**What goes wrong:** Process crashes mid-write, leaving a truncated JSON file that fails to parse on resume.
**Why it happens:** `writeFileSync` is not truly atomic on all filesystems.
**How to avoid:** Write to a temp file first, then rename (atomic on POSIX). Or: if checkpoint parse fails, treat as no checkpoint (restart from beginning) rather than crashing.
**Warning signs:** `SyntaxError: Unexpected end of JSON input` when loading checkpoint.

### Pitfall 2: Checkpoint Stale After Input Change
**What goes wrong:** User changes the input JSON file but the checkpoint still references old opportunity names. Pipeline skips everything thinking it is already done.
**Why it happens:** Checkpoint does not track which input file it belongs to.
**How to avoid:** Store `inputFile` path (or hash) in checkpoint. On resume, compare against current input. If different, ignore checkpoint and start fresh.
**Warning signs:** Pipeline reports "0 opportunities to process" when there should be work.

### Pitfall 3: Git Commit Fails Silently
**What goes wrong:** Auto-commit fails (not a git repo, unstaged changes only, commit hook rejects) but pipeline continues without the user knowing artifacts were not committed.
**Why it happens:** Error swallowed to keep pipeline running.
**How to avoid:** Log the failure clearly at WARN level. Return a structured result indicating whether commit succeeded. Do not crash the pipeline.
**Warning signs:** Missing commits in git log after overnight run.

### Pitfall 4: Fallback Prompt Returns Lower-Quality Scores
**What goes wrong:** Fallback prompt is too simplified, producing scores that are meaningless or all-zeros.
**Why it happens:** Fallback prompt removes too much context to get the model to respond.
**How to avoid:** Fallback prompt should simplify structure (fewer constraints) but keep essential context (opportunity data, company context). Validate that fallback scores are within expected ranges.
**Warning signs:** Opportunities scored via fallback all cluster at the same value.

### Pitfall 5: Resume Skips Scoring But Not Output Generation
**What goes wrong:** Pipeline resumes and skips scoring for completed opportunities, but output formatters expect all scoring results to be in memory.
**Why it happens:** Output formatters receive only the newly-scored results, missing previously-completed ones.
**How to avoid:** On resume, load previously-completed results from checkpoint (or from saved output files) and merge with newly-scored results before formatting output.
**Warning signs:** Output TSV has fewer rows than expected after a resumed run.

## Code Examples

### Wiring Resilience into Scoring Pipeline

The existing `scoreOpportunities` async generator in `scoring-pipeline.ts` yields results one at a time. Phase 8 wraps this with checkpoint logic:

```typescript
// Conceptual wiring in pipeline runner (Phase 7 creates this; Phase 8 adds resilience)

import { loadCheckpoint, saveCheckpoint, getCompletedNames } from "../infra/checkpoint.js";
import { autoCommitEvaluation } from "../infra/git-commit.js";

// At pipeline start:
const checkpoint = loadCheckpoint(outputDir);
const completed = getCompletedNames(checkpoint);

// In scoring loop -- filter already-done:
for (const triage of processable) {
  if (completed.has(triage.l3Name)) {
    // Already scored in a previous run -- skip
    continue;
  }

  const result = await scoreOneOpportunity(opp, l4s, company, knowledgeContext, chatFn);
  yield result;

  // Update checkpoint after each opportunity
  checkpoint.entries.push({
    l3Name: triage.l3Name,
    completedAt: new Date().toISOString(),
    status: "error" in result ? "error" : "scored",
  });
  saveCheckpoint(outputDir, checkpoint);
}

// After all opportunities processed:
autoCommitEvaluation({ outputDir, enabled: true });
```

### Testing Retry Policy Without Ollama

```typescript
// retry-policy.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { callWithResilience } from "./retry-policy.js";
import { z } from "zod";

const TestSchema = z.object({ score: z.number() });

describe("callWithResilience", () => {
  it("returns primary result on first success", async () => {
    const result = await callWithResilience({
      schema: TestSchema,
      primaryCall: async () => JSON.stringify({ score: 5 }),
      label: "test",
    });
    assert.equal(result.resolvedVia, "primary");
    assert.equal(result.result.success, true);
  });

  it("falls back when primary exhausts retries", async () => {
    let primaryCalls = 0;
    const result = await callWithResilience({
      schema: TestSchema,
      primaryCall: async () => { primaryCalls++; throw new Error("fail"); },
      fallbackCall: async () => JSON.stringify({ score: 3 }),
      label: "test",
      maxRetries: 1,
    });
    assert.equal(result.resolvedVia, "fallback");
    assert.equal(primaryCalls, 1);
  });

  it("skips when both primary and fallback fail", async () => {
    const result = await callWithResilience({
      schema: TestSchema,
      primaryCall: async () => { throw new Error("fail"); },
      fallbackCall: async () => { throw new Error("fail too"); },
      label: "test-opp",
      maxRetries: 1,
    });
    assert.equal(result.resolvedVia, "skipped");
    assert.equal(result.result.success, false);
  });
});
```

### Testing Checkpoint Without Filesystem Side Effects

```typescript
// checkpoint.test.ts -- use tmp directory
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCheckpoint, saveCheckpoint, getCompletedNames } from "./checkpoint.js";

describe("checkpoint", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "ckpt-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null when no checkpoint exists", () => {
    assert.equal(loadCheckpoint(tmpDir), null);
  });

  it("round-trips checkpoint data", () => {
    const cp = {
      version: 1 as const,
      inputFile: "test.json",
      startedAt: new Date().toISOString(),
      entries: [{ l3Name: "Opp A", completedAt: new Date().toISOString(), status: "scored" as const }],
    };
    saveCheckpoint(tmpDir, cp);
    const loaded = loadCheckpoint(tmpDir);
    assert.deepEqual(loaded, cp);
  });

  it("getCompletedNames returns set of completed L3 names", () => {
    const cp = {
      version: 1 as const,
      inputFile: "test.json",
      startedAt: new Date().toISOString(),
      entries: [
        { l3Name: "A", completedAt: "", status: "scored" as const },
        { l3Name: "B", completedAt: "", status: "skipped" as const },
      ],
    };
    const names = getCompletedNames(cp);
    assert.equal(names.has("A"), true);
    assert.equal(names.has("B"), true);
    assert.equal(names.has("C"), false);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm retry libraries (p-retry, async-retry) | Built-in retry in scoreWithRetry | Phase 4 (existing) | No external dependency needed |
| Database checkpointing (SQLite) | JSON file checkpoint | Project convention | "Files are the database" per REQUIREMENTS.md |
| git library (simple-git) | child_process.execSync | Node.js stable | No dependency for simple commit operations |

**Deprecated/outdated:**
- None relevant. All patterns use stable Node.js built-ins.

## Open Questions

1. **How should previously-scored results be loaded on resume?**
   - What we know: Checkpoint tracks which L3 names are done. Output TSV files contain the scored data.
   - What's unclear: Should resumed runs re-read output TSV to merge with new results, or should checkpoint store full ScoringResult objects?
   - Recommendation: Store minimal checkpoint (names + status only). Re-read output files on resume to merge. This keeps checkpoint small and avoids duplicating scored data.

2. **Should git auto-commit happen per-opportunity or per-cycle?**
   - What we know: INFR-03 says "after each evaluation cycle." A cycle is one full pipeline run.
   - What's unclear: If a run processes 50 opportunities over 6 hours, is one commit at the end acceptable? Or should there be periodic commits?
   - Recommendation: Commit after each evaluation cycle (full run). Checkpointing already protects against data loss mid-run since results are written to disk incrementally.

3. **Interaction with Phase 7 Pipeline Orchestrator**
   - What we know: Phase 7 creates the pipeline runner, logging, and model management. Phase 8 adds resilience on top.
   - What's unclear: Exact API surface of Phase 7's pipeline runner is not yet defined.
   - Recommendation: Design resilience modules (retry-policy, checkpoint, git-commit) as independent composable functions. They can be wired into whatever pipeline runner Phase 7 produces.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none -- uses `npm test` which runs `node --test` |
| Quick run command | `npx tsx --test src/infra/retry-policy.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-01 | LLM call retry -> fallback -> skip-and-log | unit | `npx tsx --test src/infra/retry-policy.test.ts` | Wave 0 |
| INFR-03 | Git auto-commit after evaluation cycle | unit | `npx tsx --test src/infra/git-commit.test.ts` | Wave 0 |
| INFR-08 | Checkpoint save/load/resume filtering | unit | `npx tsx --test src/infra/checkpoint.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsx --test src/infra/<module>.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `src/infra/retry-policy.test.ts` -- covers INFR-01
- [ ] `src/infra/checkpoint.test.ts` -- covers INFR-08
- [ ] `src/infra/git-commit.test.ts` -- covers INFR-03

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/scoring/ollama-client.ts` -- existing `scoreWithRetry` with exponential backoff
- Codebase analysis: `src/scoring/scoring-pipeline.ts` -- async generator pattern for incremental processing
- Codebase analysis: `src/types/scoring.ts`, `src/types/triage.ts` -- Result type pattern
- Project instructions: `CLAUDE.md` -- "files are the database," Node.js built-in test runner, Result type pattern
- Project requirements: `REQUIREMENTS.md` -- INFR-01, INFR-03, INFR-08 definitions

### Secondary (MEDIUM confidence)
- Node.js `child_process.execSync` documentation -- stable API, no version concerns
- Node.js `fs.writeFileSync` -- sufficient atomicity for checkpoint use case on macOS APFS

### Tertiary (LOW confidence)
- None. All findings verified against codebase and Node.js stable APIs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all Node.js built-ins, no new dependencies
- Architecture: HIGH -- patterns directly extend existing codebase conventions (Result types, DI, pure functions)
- Pitfalls: HIGH -- derived from concrete codebase analysis (checkpoint stale data, resume merge gap)

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no fast-moving dependencies)
