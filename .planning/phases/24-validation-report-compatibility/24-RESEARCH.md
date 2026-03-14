# Phase 24: Validation + Report Compatibility - Research

**Researched:** 2026-03-14
**Domain:** Statistical validation, report formatter compatibility, integration testing
**Confidence:** HIGH

## Summary

Phase 24 validates that the v1.3 two-pass scoring funnel produces meaningful rankings and that all downstream report formatters work correctly with the new ScoringResult shape. The phase has four requirements: calibration testing (VAL-01), score discrimination (VAL-02), formatter compatibility (VAL-03), and full Ford end-to-end run (VAL-04).

The core technical challenges are: (1) implementing Spearman rank correlation from scratch (no external library needed -- the formula is simple), (2) mapping v1.2 LLM composite scores to v1.3 deterministic pre-scores for the same L4 activities, (3) structurally comparing v1.3 formatter output against v1.2 baselines despite column changes between versions, and (4) orchestrating a full Ford 826-candidate run in both scoring modes.

**Primary recommendation:** Implement Spearman rank correlation as a pure utility function, use the on-disk evaluation-vllm/ baseline TSVs as ground truth for both calibration and structural parity, and create permanent regression tests that run on every `npm test` invocation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Report formatter verification strategy**: Automated diff comparing v1.3 formatter output against existing evaluation-vllm/ Ford run (real v1.2 baseline data). Structural parity required: same columns, same sections, same formatting between v1.2 and v1.3 report output. Numeric values and rankings are expected to differ (different scoring methodology) -- not a failure. The scoring mode header annotation (e.g., `Scoring Mode: two-pass`) is the only accepted structural addition in v1.3 output. Any missing column, broken section, or formatting change = test failure.
- **Test durability**: Permanent test in the test suite, not a one-time script. Test loads v1.2 reports from evaluation-vllm/ directory as baseline. Synthesizes equivalent v1.3 ScoringResults (with sanityVerdict, preScore, synthesized LensScores). Runs each of the 10+ formatters on v1.3 data. Asserts structural match against v1.2 baseline output. Runs on every `npm test` invocation to catch future regressions.

### Claude's Discretion
- Calibration test implementation (Spearman rank correlation computation, VAL-01)
- Score discrimination test approach (>200 distinct values, VAL-02)
- Side-by-side Ford run protocol and output directory structure (VAL-04)
- How to synthesize realistic v1.3 ScoringResults from v1.2 data for the formatter test
- Which specific structural assertions per formatter (column names, section headers, etc.)
- Whether to use a shared test fixture factory or per-formatter fixtures

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VAL-01 | Calibration test measuring Spearman rank correlation between deterministic pre-scores and v1.2 LLM composite scores (target rho >= 0.6) | Spearman formula documented below; v1.2 composite scores available in evaluation-vllm/evaluation/feasibility-scores.tsv (336 rows); Ford export JSON available for pre-scoring |
| VAL-02 | Deterministic scorer produces >200 distinct score values across 826 L4 candidates (prevents excessive ties) | preScoreAll returns PreScoreResult[] with composite rounded to 4 decimal places; 6 dimensions with continuous-ish ranges; test runs preScoreAll on Ford data and counts unique composites |
| VAL-03 | All existing report formatters produce correct output from v1.3 ScoringResult | 10 formatters identified with input/output signatures; v1.2 baseline files on disk for structural comparison; ScoringResult type has backward-compatible shape with optional new fields |
| VAL-04 | Full Ford 826-candidate run completes with both scoring modes for side-by-side comparison | CLI supports --scoring-mode two-pass and three-lens (from Phase 23); Ford export at .planning/ford_hierarchy_v3_export.json; existing evaluation-vllm/ is v1.2 three-lens baseline |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in | Test framework | Project convention per CLAUDE.md |
| node:assert/strict | built-in | Assertions | Project convention |
| node:fs/promises | built-in | Read baseline files | Standard Node.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | Spearman correlation is ~20 lines of code | No external stats library warranted |

**Installation:** No new dependencies required.

## Architecture Patterns

### Recommended Project Structure
```
src/
  validation/
    spearman.ts              # Pure function: Spearman rank correlation
    spearman.test.ts         # Unit tests for the correlation utility
    calibration.test.ts      # VAL-01: Loads Ford data, pre-scores, correlates with v1.2 composites
    discrimination.test.ts   # VAL-02: Counts distinct pre-score values across 826 candidates
  output/
    formatter-compat.test.ts # VAL-03: Structural parity tests for all 10 formatters
```

### Pattern 1: Spearman Rank Correlation
**What:** Computes Spearman's rho between two ranked lists. Uses the standard formula: `rho = 1 - (6 * sum(d_i^2)) / (n * (n^2 - 1))` where d_i is the rank difference for each observation.
**When to use:** VAL-01 calibration test.
**Example:**
```typescript
// Pure function, no dependencies
export function spearmanRho(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) throw new Error("Need >= 2 paired observations");
  const n = x.length;
  const rankX = fractionalRanks(x);
  const rankY = fractionalRanks(y);
  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = rankX[i] - rankY[i];
    sumD2 += d * d;
  }
  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

// Fractional ranking handles ties correctly
function fractionalRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    const avgRank = (i + j + 1) / 2; // 1-based average
    for (let k = i; k < j; k++) ranks[indexed[k].i] = avgRank;
    i = j;
  }
  return ranks;
}
```

### Pattern 2: Data Loading for Calibration
**What:** Load v1.2 composite scores from the baseline TSV, load Ford export JSON, run pre-scorer, then correlate.
**When to use:** VAL-01 and VAL-02 tests.
**Key insight:** The v1.2 baseline TSV (`evaluation-vllm/evaluation/feasibility-scores.tsv`) has 336 rows at L3 opportunity level (column: `l3_name`). The v1.3 pre-scorer operates at L4 level (826 candidates). To correlate, you need to either:
  - **Option A (recommended):** Aggregate v1.3 L4 pre-scores up to L3 level (average or max composite per l3Name), then correlate with v1.2 L3 composites. This gives ~336 paired observations.
  - **Option B:** Run the v1.2 three-lens scorer on individual L4s -- but this requires LLM calls and defeats the purpose of a fast deterministic test.

Option A is the right approach. The pre-scorer already populates `l3Name` on each PreScoreResult.

### Pattern 3: Structural Parity Testing
**What:** Compare v1.3 formatter output structure (not values) against v1.2 baseline files.
**When to use:** VAL-03.
**Key detail -- column mismatch in feasibility-scores.tsv:**
The v1.2 baseline has columns: `l3_name, opportunity_name, l1_name, l2_name, archetype, ...`
The current formatScoresTsv produces: `skill_id, skill_name, l4_name, l3_name, l2_name, l1_name, archetype, ...`
This was changed in a prior commit (`984b849 feat(scoring): refactor pipeline to score at skill level instead of L3 rollups`). The TSV column headers are already different. Structural parity for TSVs should verify:
1. The 9 sub-dimension columns are present (data_readiness, platform_fit, archetype_conf, tech_total, decision_density, financial_gravity, impact_proximity, confidence_signal, adoption_total, value_density, simulation_viability, value_total)
2. The composite, confidence, promotes_to_sim columns are present
3. Rows are tab-separated with correct column count

For markdown reports (summary.md, dead-zones.md, meta-reflection.md, tier1-report.md, adoption-risk.md), structural parity means:
1. Same section headers (## headings)
2. Same table column headers
3. Same markdown structure (tables, bullet lists, horizontal rules)
4. The only allowed addition is the `Scoring Mode:` header line from Phase 23

### Pattern 4: ScoringResult Synthesis from v1.2 Data
**What:** Create v1.3-shaped ScoringResult objects that carry the new optional fields while maintaining backward-compatible structure.
**When to use:** VAL-03 formatter compatibility test.
**Example:**
```typescript
function synthesizeV13ScoringResult(v12Row: ParsedTsvRow): ScoringResult {
  // Build LensScore objects from v1.2 sub-dimension values
  // Add optional v1.3 fields
  return {
    skillId: v12Row.l3_name,     // Use l3_name as skillId for backward compat
    skillName: v12Row.opportunity_name ?? v12Row.l3_name,
    l4Name: v12Row.l3_name,      // Synthetic -- v1.2 didn't have L4
    l3Name: v12Row.l3_name,
    l2Name: v12Row.l2_name,
    l1Name: v12Row.l1_name,
    archetype: v12Row.archetype as LeadArchetype,
    lenses: {
      technical: buildLensFromV12(v12Row, "technical"),
      adoption: buildLensFromV12(v12Row, "adoption"),
      value: buildLensFromV12(v12Row, "value"),
    },
    composite: v12Row.composite,
    overallConfidence: v12Row.confidence as ConfidenceLevel,
    promotedToSimulation: v12Row.promotes_to_sim === "Y",
    scoringDurationMs: 0,
    // v1.3 optional fields
    sanityVerdict: "AGREE",
    sanityJustification: "Synthetic v1.3 result for compatibility testing",
    preScore: 0.75,
  };
}
```

### Anti-Patterns to Avoid
- **Snapshot testing for report content:** Don't snapshot entire report text -- values differ between v1.2 and v1.3. Test structure only (headers, column counts, section presence).
- **Requiring exact TSV column match with v1.2:** The feasibility-scores.tsv columns already changed pre-v1.3. Focus on sub-dimension columns and data columns being present.
- **External stats library for Spearman:** The formula is trivial. Adding a dependency (e.g., simple-statistics) is unnecessary overhead.
- **Running LLM calls in validation tests:** All validation tests must be deterministic and fast. Use pre-computed baselines and synthesized data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TSV parsing | Custom split/regex parser | Simple `line.split('\t')` with header mapping | TSV is trivial -- no quoting edge cases in this data |
| JSON schema validation | Manual field checks | Existing Zod schemas from `schemas/hierarchy.ts` | Already validated by `parseExport` |

**Key insight:** This phase is about validation, not building infrastructure. Everything needed already exists -- the work is writing tests that exercise it.

## Common Pitfalls

### Pitfall 1: L3-vs-L4 Granularity Mismatch in Calibration
**What goes wrong:** v1.2 scored at L3 level (336 opportunities), v1.3 pre-scores at L4 level (826 activities). You cannot directly pair them 1:1.
**Why it happens:** The scoring unit changed between versions.
**How to avoid:** Aggregate L4 pre-scores to L3 level before correlation. Use max or mean composite per l3Name.
**Warning signs:** If you get 826 vs 336 observations, the pairing is wrong.

### Pitfall 2: Ties Inflating Spearman Rho
**What goes wrong:** If many pre-scores are identical (e.g., all 0 for eliminated candidates), the fractional ranking handles it correctly, but the rho may be misleadingly high or low.
**Why it happens:** Red flag elimination sets composites to near-zero, creating a large cluster of ties.
**How to avoid:** Filter out eliminated candidates (survived=false) before computing correlation. Only correlate survivors.
**Warning signs:** If >50% of values are tied at the same score.

### Pitfall 3: Structural Parity vs Value Parity Confusion
**What goes wrong:** Tests fail because numeric values differ between v1.2 and v1.3 output.
**Why it happens:** The CONTEXT.md explicitly says "Numeric values and rankings are expected to differ."
**How to avoid:** Extract structure (headers, section names, column counts, table shapes) and compare those. Never compare actual values.
**Warning signs:** Test assertions on specific numbers or rankings.

### Pitfall 4: Ford Export Path Assumption
**What goes wrong:** Test hardcodes a path to the Ford export that doesn't exist in CI or on other machines.
**Why it happens:** The Ford export is at `.planning/ford_hierarchy_v3_export.json` -- not a standard location.
**How to avoid:** Tests that need the Ford export should check for its existence and skip with a clear message if absent. Use `describe.skip` or conditional `it.skip` pattern.
**Warning signs:** Tests that fail silently or with confusing errors when data files are missing.

### Pitfall 5: Formatter Input Signature Mismatch
**What goes wrong:** Some formatters take `ScoringResult[]` only, others take `(ScoringResult[], TriageResult[], SimulationPipelineResult, ...)`. The test must provide correct inputs for each.
**Why it happens:** Each formatter has a different signature (documented below in Code Examples).
**How to avoid:** Map each formatter to its required inputs and synthesize all of them.

## Code Examples

### All Formatter Signatures (from source)

```typescript
// 1. formatScoresTsv(results: ScoringResult[]): string
//    Input: ScoringResult[]
//    Output: TSV with sub-dimension scores

// 2. formatTriageTsv(opportunities: TriageResult[]): string
//    Input: TriageResult[]
//    Output: TSV with tier/flags -- does NOT consume ScoringResult

// 3. formatAdoptionRisk(opportunities: TriageResult[], date?: string): string
//    Input: TriageResult[]
//    Output: Markdown with red flag sections

// 4. formatDeadZones(triaged: TriageResult[], _scored: ScoringResult[], date?: string): string
//    Input: TriageResult[], ScoringResult[]
//    Output: Markdown with dead zone/phantom/no-stakes sections

// 5. formatSummary(scored: ScoringResult[], triaged: TriageResult[],
//                   simResults: SimulationPipelineResult,
//                   companyName: string, date?: string, simSkipped?: boolean): string
//    Input: ScoringResult[], TriageResult[], SimulationPipelineResult
//    Output: Markdown executive summary

// 6. formatMetaReflection(triaged: TriageResult[], scored: ScoringResult[],
//                          simResults: SimulationPipelineResult,
//                          date?: string, simSkipped?: boolean): string
//    Input: TriageResult[], ScoringResult[], SimulationPipelineResult
//    Output: Markdown catalog-level analysis

// 7. formatTier1Report(scored: ScoringResult[], tier1Names: Set<string>,
//                       companyName: string, date?: string): string
//    Input: ScoringResult[], Set<string>
//    Output: Markdown deep analysis per tier-1 opportunity

// 8. formatPreScoreTsv(results: PreScoreResult[]): string
//    Input: PreScoreResult[] -- v1.3 only, no v1.2 baseline
//    Output: TSV with deterministic dimension scores

// 9. formatSimulationFilterTsv(simResults: SimulationPipelineResult): string
//    Input: SimulationPipelineResult
//    Output: TSV with verdict/scores

// 10. formatImplementationShortlistTsv(scored: ScoringResult[],
//                                       simResults: SimulationPipelineResult,
//                                       verdicts: SimulationFilterVerdict[]): string
//     Input: ScoringResult[], SimulationPipelineResult, verdict filter
//     Output: TSV with implementation readiness
```

### Structural Assertion Helpers

```typescript
// Extract markdown section headers from report content
function extractSections(md: string): string[] {
  return md.split("\n")
    .filter(line => /^#{1,3} /.test(line))
    .map(line => line.trim());
}

// Extract TSV column headers
function extractTsvColumns(tsv: string): string[] {
  return tsv.split("\n")[0].split("\t");
}

// Compare section structures
function assertSectionsMatch(actual: string, baseline: string, allowedAdditions: string[] = []): void {
  const actualSections = extractSections(actual);
  const baselineSections = extractSections(baseline);
  // Every baseline section must appear in actual
  for (const section of baselineSections) {
    assert.ok(actualSections.includes(section), `Missing section: ${section}`);
  }
  // Any extra section in actual must be in allowedAdditions
  for (const section of actualSections) {
    if (!baselineSections.includes(section)) {
      assert.ok(allowedAdditions.includes(section), `Unexpected section: ${section}`);
    }
  }
}
```

### V1.2 Baseline Files Available

| File | Path | Content | Rows |
|------|------|---------|------|
| feasibility-scores.tsv | evaluation-vllm/evaluation/feasibility-scores.tsv | L3-level scoring | 336 |
| feasibility-scores-v2.tsv | evaluation-vllm/evaluation/feasibility-scores-v2.tsv | Same structure, different run | 336 |
| triage.tsv | evaluation-vllm/evaluation/triage.tsv | Tier assignments | ~362 |
| summary.md | evaluation-vllm/evaluation/summary.md | Executive summary | ~50 lines |
| dead-zones.md | evaluation-vllm/evaluation/dead-zones.md | Dead zone report | varies |
| meta-reflection.md | evaluation-vllm/evaluation/meta-reflection.md | Catalog analysis | ~80 lines |
| tier1-report.md | evaluation-vllm/evaluation/tier1-report.md | Deep analysis | varies |
| adoption-risk.md | evaluation-vllm/evaluation/adoption-risk.md | Red flag report | varies |
| simulation-filter.tsv | evaluation-vllm/evaluation/simulation-filter.tsv | Verdict TSV | varies |
| implementation-shortlist.tsv | evaluation-vllm/evaluation/implementation-shortlist.tsv | ADVANCE verdicts | varies |
| manual-review-queue.tsv | evaluation-vllm/evaluation/manual-review-queue.tsv | REVIEW+HOLD | varies |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| L3 opportunity scoring (3 LLM calls each) | L4 deterministic pre-score + top-N LLM | v1.3 Phase 21-23 | 2478 calls -> ~50 calls |
| feasibility-scores.tsv with l3_name/opportunity_name columns | skill_id/skill_name/l4_name columns | Pre-v1.3 refactor (984b849) | Column headers already differ from v1.2 baseline |

**Critical finding:** The feasibility-scores.tsv formatter was already refactored to skill-level BEFORE v1.3. The v1.2 baseline on disk has different columns than what the current code produces even in three-lens mode. This means "structural parity" for the TSV formatter must focus on the sub-dimension and aggregate columns (data_readiness through promotes_to_sim), not the identity columns (skill_id vs l3_name).

## Open Questions

1. **Spearman rho threshold of 0.6 -- is it achievable?**
   - What we know: STATE.md flags this as an estimate, not validated. 0.6 is a "moderate" correlation.
   - What's unclear: Whether deterministic signals from structured fields meaningfully correlate with LLM-assessed scores. The LLM considers context, nuance, and domain knowledge that deterministic scoring cannot.
   - Recommendation: Implement the test, run it, and report the actual rho. If < 0.6, document the gap and adjust the threshold or scoring weights. This is a calibration exercise, not a pass/fail gate.

2. **L3 aggregation method for calibration**
   - What we know: v1.2 scores are at L3 level, v1.3 pre-scores at L4 level.
   - What's unclear: Whether to use max, mean, or weighted-mean of L4 pre-scores when aggregating to L3.
   - Recommendation: Use max composite per L3 (mirrors the "best opportunity" heuristic). Also report mean for comparison.

3. **VAL-04 side-by-side run feasibility**
   - What we know: three-lens mode requires an LLM backend (Ollama or vLLM). two-pass mode only needs LLM for survivors.
   - What's unclear: Whether a full 826-candidate three-lens run is expected to complete during this phase, or if the existing evaluation-vllm/ serves as the three-lens baseline.
   - Recommendation: Use evaluation-vllm/ as the three-lens baseline. Only run two-pass mode for new data. The side-by-side comparison is then: existing v1.2 output vs new v1.3 two-pass output.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none -- uses npx tsx --test |
| Quick run command | `cd src && npx tsx --test validation/spearman.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VAL-01 | Spearman rho >= 0.6 between pre-scores and v1.2 composites | integration | `cd src && npx tsx --test validation/calibration.test.ts` | Wave 0 |
| VAL-02 | >200 distinct pre-score values across 826 candidates | integration | `cd src && npx tsx --test validation/discrimination.test.ts` | Wave 0 |
| VAL-03 | All formatters produce structurally correct output from v1.3 ScoringResult | unit | `cd src && npx tsx --test output/formatter-compat.test.ts` | Wave 0 |
| VAL-04 | Full Ford run in both scoring modes | manual/integration | Manual CLI invocation -- requires LLM backend | N/A (manual) |

### Sampling Rate
- **Per task commit:** `cd src && npx tsx --test validation/spearman.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/validation/spearman.ts` -- Spearman rank correlation utility
- [ ] `src/validation/spearman.test.ts` -- Unit tests for correlation function
- [ ] `src/validation/calibration.test.ts` -- VAL-01 calibration test
- [ ] `src/validation/discrimination.test.ts` -- VAL-02 discrimination test
- [ ] `src/output/formatter-compat.test.ts` -- VAL-03 structural parity tests

## Sources

### Primary (HIGH confidence)
- Project source code: `src/types/scoring.ts`, `src/output/format-*.ts`, `src/scoring/deterministic/` -- direct code reading
- V1.2 baseline data: `src/evaluation-vllm/evaluation/` -- on-disk output from real Ford run
- Phase 23 plans: `.planning/phases/23-pipeline-integration/23-02-PLAN.md` -- defines PIPE-03 LensScore synthesis
- CONTEXT.md: `.planning/phases/24-validation-report-compatibility/24-CONTEXT.md` -- locked decisions

### Secondary (MEDIUM confidence)
- Spearman rank correlation formula -- standard statistics, well-known

### Tertiary (LOW confidence)
- Rho >= 0.6 threshold achievability -- untested, flagged in STATE.md as estimate

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing project infrastructure
- Architecture: HIGH -- test patterns well-established in project, all formatter signatures inspected
- Pitfalls: HIGH -- identified from direct code reading (L3 vs L4 granularity, column mismatch, tie handling)

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable -- no external dependencies)
