# Phase 10: Wire writeEvaluation into Pipeline - Research

**Researched:** 2026-03-11
**Domain:** Pipeline wiring / integration gap closure
**Confidence:** HIGH

## Summary

Phase 10 is a low-complexity integration wiring task. The `writeEvaluation` function (Phase 5) is fully implemented, tested, and exported from `src/output/write-evaluation.ts`. It produces all 4 required output files (triage.tsv, feasibility-scores.tsv, adoption-risk.md, tier1-report.md) when called. The pipeline runner (`src/pipeline/pipeline-runner.ts`) already has an identical pattern for `writeFinalReports` (Phase 9) that was wired in Phase 9. The gap is simply that `writeEvaluation` is never imported or called from the pipeline runner.

The fix follows an established pattern: import the function, call it after the scoring loop completes (before or after `writeFinalReports`), handle the result as non-fatal (matching `writeFinalReports` error handling), and add integration tests verifying the 4 output files exist on disk after pipeline execution.

**Primary recommendation:** Add a single import and single call site in `pipeline-runner.ts` mirroring the existing `writeFinalReports` wiring pattern. Add integration tests to `pipeline-runner.test.ts` verifying all 4 evaluation files are written.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCOR-07 | Engine outputs scored opportunities as TSV with all dimension breakdowns | `formatScoresTsv` already works; wiring `writeEvaluation` into pipeline produces `feasibility-scores.tsv` |
| SCOR-08 | Engine outputs scored opportunities as markdown report with analysis | `formatTier1Report` already works; wiring produces `tier1-report.md` |
| TRIG-02 | Engine outputs triage results as TSV sorted by tier | `formatTriageTsv` already works; wiring produces `triage.tsv` |
| OUTP-01 | Engine produces evaluation/triage.tsv with all opportunities tier-sorted | Direct output of `writeEvaluation` call |
| OUTP-02 | Engine produces evaluation/feasibility-scores.tsv with 9-dimension breakdown | Direct output of `writeEvaluation` call |
| OUTP-03 | Engine produces evaluation/adoption-risk.md with red flags and dead zones | Direct output of `writeEvaluation` call |
| OUTP-04 | Engine produces evaluation/tier1-report.md with deep analysis of top-tier opportunities | Direct output of `writeEvaluation` call |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed. This phase uses only existing project code.

| Module | Location | Purpose | Status |
|--------|----------|---------|--------|
| writeEvaluation | `src/output/write-evaluation.ts` | Orchestrates writing 4 evaluation files | Fully implemented, tested |
| pipeline-runner | `src/pipeline/pipeline-runner.ts` | End-to-end pipeline orchestrator | Target for modification |
| formatTriageTsv | `src/output/format-triage-tsv.ts` | Formats triage TSV content | Used by writeEvaluation |
| formatScoresTsv | `src/output/format-scores-tsv.ts` | Formats scores TSV content | Used by writeEvaluation |
| formatAdoptionRisk | `src/output/format-adoption-risk.ts` | Formats adoption risk markdown | Used by writeEvaluation |
| formatTier1Report | `src/output/format-tier1-report.ts` | Formats tier 1 report markdown | Used by writeEvaluation |

### Installation

No new packages needed.

## Architecture Patterns

### Existing Wiring Pattern (writeFinalReports - lines 268-288 of pipeline-runner.ts)

The pipeline runner already has an identical pattern for `writeFinalReports` that should be replicated:

```typescript
// Source: src/pipeline/pipeline-runner.ts lines 268-288
const reportResult = await writeFinalReports(
  options.outputDir,
  allScoredResults,
  triageResults,
  emptySimResult,
  companyName,
);
if (reportResult.success) {
  logger.info({ files: reportResult.files.length }, "Final reports written");
} else {
  logger.warn({ error: reportResult.error }, "Final reports failed (non-fatal)");
}
```

### writeEvaluation Function Signature

```typescript
// Source: src/output/write-evaluation.ts
export async function writeEvaluation(
  outputDir: string,
  scoredOpportunities: ScoringResult[],
  triagedOpportunities: TriageResult[],
  companyName: string,
  date?: string,
): Promise<WriteResult>;

// WriteResult = { success: true; files: string[] } | { success: false; error: string }
```

### Required Data Already Available in Pipeline Runner

All parameters needed by `writeEvaluation` are already computed in `pipeline-runner.ts`:

| Parameter | Source in pipeline-runner.ts | Line |
|-----------|----------------------------|------|
| `outputDir` | `options.outputDir` | From PipelineOptions |
| `scoredOpportunities` | `allScoredResults` (ScoringResult[]) | Line 99 |
| `triagedOpportunities` | `triageResults` (TriageResult[]) | Line 136 |
| `companyName` | `data.company_context.company_name` | Line 276 |

### Insertion Point

The `writeEvaluation` call should go between step 10 (final archive flush, line 255) and step 10b (git auto-commit, line 258). This ensures:
1. All scoring results are accumulated in `allScoredResults`
2. Triage results are available from step 2
3. Evaluation files are written before git auto-commit captures them
4. Non-fatal error handling matches writeFinalReports pattern

Alternatively, it can go right before the `writeFinalReports` call (line 268), as both are output-writing steps. The key constraint is: **before git auto-commit** so the committed artifacts include the evaluation files.

### Anti-Patterns to Avoid
- **Making writeEvaluation failure fatal:** It must be non-fatal, matching writeFinalReports pattern. Pipeline should still return a valid PipelineResult even if file writing fails.
- **Changing writeEvaluation's interface:** The function is already tested and works. No modifications needed to write-evaluation.ts.
- **Duplicating formatter logic in pipeline-runner:** Use writeEvaluation as the single orchestration point.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TSV formatting | Manual TSV in pipeline | `writeEvaluation` -> `formatTriageTsv`/`formatScoresTsv` | Already handles headers, escaping, sorting |
| Markdown reports | Template strings in pipeline | `writeEvaluation` -> `formatAdoptionRisk`/`formatTier1Report` | Already handles all formatting |
| Directory creation | Manual `fs.mkdir` in pipeline | `writeEvaluation` does `mkdir -p` internally | Handles recursive creation |
| Error handling for file I/O | try/catch in pipeline | `writeEvaluation` returns Result type | Already wraps all errors |

## Common Pitfalls

### Pitfall 1: Calling writeEvaluation AFTER git auto-commit
**What goes wrong:** Evaluation files are written to disk but not included in the auto-commit, so they exist locally but aren't captured by INFR-03.
**How to avoid:** Insert the writeEvaluation call BEFORE the `autoCommitEvaluation` call (line 258).

### Pitfall 2: Forgetting to pass companyName
**What goes wrong:** `companyName` is derived as `data.company_context.company_name` for `writeFinalReports` (line 276). Same variable must be used for `writeEvaluation`.
**How to avoid:** Use the same `companyName` const already declared for writeFinalReports.

### Pitfall 3: Not testing file existence in integration tests
**What goes wrong:** Tests verify pipeline completes but don't check that the 4 specific files are on disk.
**How to avoid:** Add explicit `fs.existsSync` checks for all 4 files in `evaluation/` directory, mirroring the existing test on line 404-427 that checks writeFinalReports output.

### Pitfall 4: Not handling the non-fatal failure case
**What goes wrong:** If writeEvaluation fails (e.g., disk full), pipeline crashes instead of continuing.
**How to avoid:** Check `result.success` and log warning on failure, matching writeFinalReports pattern exactly.

## Code Examples

### Exact Change Needed in pipeline-runner.ts

```typescript
// Add to imports (top of file):
import { writeEvaluation } from "../output/write-evaluation.js";

// Add after step 10 (line 255, after archiveAndReset) and BEFORE step 10b (autoCommitEvaluation):

// 10a. Write evaluation output files (triage.tsv, feasibility-scores.tsv, adoption-risk.md, tier1-report.md)
const companyName = data.company_context.company_name;
const evalResult = await writeEvaluation(
  options.outputDir,
  allScoredResults,
  triageResults,
  companyName,
);
if (evalResult.success) {
  logger.info({ files: evalResult.files.length }, "Evaluation files written");
} else {
  logger.warn({ error: evalResult.error }, "Evaluation files failed (non-fatal)");
}
```

Note: `companyName` is currently declared on line 276. It needs to be moved earlier (or declared once before both calls use it).

### Integration Test Pattern

```typescript
// Mirror the existing "writes final report files" test (line 404)
it("writes evaluation output files after scoring completes", async () => {
  const fixture = makeFixtureExport();
  const chatFn = makeChatFn();
  const { fn: fetchFn } = makeFetchFn();

  await runPipeline("__fixture__", {
    outputDir: tmpDir,
    archiveThreshold: 100,
    chatFn,
    fetchFn,
    gitCommit: false,
    parseExportFn: async () => ({ success: true as const, data: fixture }),
  }, logger);

  const evalDir = path.join(tmpDir, "evaluation");
  assert.ok(fs.existsSync(path.join(evalDir, "triage.tsv")), "triage.tsv exists");
  assert.ok(fs.existsSync(path.join(evalDir, "feasibility-scores.tsv")), "feasibility-scores.tsv exists");
  assert.ok(fs.existsSync(path.join(evalDir, "adoption-risk.md")), "adoption-risk.md exists");
  assert.ok(fs.existsSync(path.join(evalDir, "tier1-report.md")), "tier1-report.md exists");
});
```

## State of the Art

| Aspect | Current State | After Phase 10 |
|--------|--------------|----------------|
| writeEvaluation | Implemented, tested, orphaned | Called from pipeline runner |
| triage.tsv | Never written at runtime | Written to evaluation/ on every run |
| feasibility-scores.tsv | Never written at runtime | Written to evaluation/ on every run |
| adoption-risk.md | Never written at runtime | Written to evaluation/ on every run |
| tier1-report.md | Never written at runtime | Written to evaluation/ on every run |
| Pipeline output files | 3 files (summary, dead-zones, meta-reflection) | 7 files (adds 4 evaluation files) |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none (built-in) |
| Quick run command | `npx tsx --test src/pipeline/pipeline-runner.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCOR-07 | feasibility-scores.tsv written during pipeline | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test in existing file |
| SCOR-08 | tier1-report.md written during pipeline | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test in existing file |
| TRIG-02 | triage.tsv written during pipeline | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test in existing file |
| OUTP-01 | evaluation/triage.tsv exists on disk | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test in existing file |
| OUTP-02 | evaluation/feasibility-scores.tsv exists on disk | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test in existing file |
| OUTP-03 | evaluation/adoption-risk.md exists on disk | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test in existing file |
| OUTP-04 | evaluation/tier1-report.md exists on disk | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test in existing file |

### Sampling Rate
- **Per task commit:** `npx tsx --test src/pipeline/pipeline-runner.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
None -- existing test infrastructure (`pipeline-runner.test.ts`) covers all phase requirements. New tests go in the existing file using existing fixtures.

## Open Questions

None. This phase is fully characterized with no ambiguity. The function exists, the call site is clear, the pattern is established, and the data is available.

## Sources

### Primary (HIGH confidence)
- `src/pipeline/pipeline-runner.ts` -- Current pipeline runner (read directly)
- `src/output/write-evaluation.ts` -- writeEvaluation implementation (read directly)
- `src/output/write-final-reports.ts` -- writeFinalReports pattern to mirror (read directly)
- `src/pipeline/pipeline-runner.test.ts` -- Existing integration tests (read directly)
- `.planning/v1.0-MILESTONE-AUDIT.md` -- Gap analysis confirming the wiring issue (read directly)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all code exists and was read directly
- Architecture: HIGH - pattern already established by writeFinalReports wiring
- Pitfalls: HIGH - derived from direct code analysis of insertion points and data flow

**Research date:** 2026-03-11
**Valid until:** Indefinite (internal codebase, no external dependencies)
