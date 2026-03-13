# Phase 24: Validation + Report Compatibility - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the two-pass funnel produces rankings that meaningfully correlate with v1.2 LLM rankings, and confirm all output artifacts are correct on real Ford data. Requirements: VAL-01, VAL-02, VAL-03, VAL-04.

</domain>

<decisions>
## Implementation Decisions

### Report formatter verification strategy
- **Automated diff** comparing v1.3 formatter output against existing evaluation-vllm/ Ford run (real v1.2 baseline data)
- **Structural parity** required: same columns, same sections, same formatting between v1.2 and v1.3 report output
- Numeric values and rankings are expected to differ (different scoring methodology) — not a failure
- The scoring mode header annotation (e.g., `Scoring Mode: two-pass`) is the only accepted structural addition in v1.3 output
- Any missing column, broken section, or formatting change = test failure

### Test durability
- **Permanent test** in the test suite, not a one-time script
- Test loads v1.2 reports from evaluation-vllm/ directory as baseline
- Synthesizes equivalent v1.3 ScoringResults (with sanityVerdict, preScore, synthesized LensScores)
- Runs each of the 10+ formatters on v1.3 data
- Asserts structural match against v1.2 baseline output
- Runs on every `npm test` invocation to catch future regressions

### Claude's Discretion
- Calibration test implementation (Spearman rank correlation computation, VAL-01)
- Score discrimination test approach (>200 distinct values, VAL-02)
- Side-by-side Ford run protocol and output directory structure (VAL-04)
- How to synthesize realistic v1.3 ScoringResults from v1.2 data for the formatter test
- Which specific structural assertions per formatter (column names, section headers, etc.)
- Whether to use a shared test fixture factory or per-formatter fixtures

</decisions>

<specifics>
## Specific Ideas

- The evaluation-vllm/ directory on disk contains real Ford v1.2 output — use this as the authoritative baseline, not synthetic data
- Structural parity means the formatters "just work" with v1.3 ScoringResult shape — the LensScore synthesis from Phase 22 is doing its job if structure matches
- Value differences are expected and acceptable — calibration quality is VAL-01's job (Spearman rho), not the formatter test's job

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `output/format-scores-tsv.ts`: Reads ScoringResult with lenses.technical, lenses.adoption, lenses.value and subDimension lookups — structural parity test must verify these columns exist
- `output/format-summary.ts`: Reads scored array, triaged array, simResults — needs v1.3 equivalents
- `output/format-adoption-risk.ts`, `format-dead-zones.ts`, `format-meta-reflection.ts`, `format-tier1-report.ts`: All consume ScoringResult — all need structural verification
- `output/format-simulation-filter-tsv.ts`, `format-implementation-shortlist-tsv.ts`: Newer formatters from v1.2 — also need verification
- `evaluation-vllm/` directory: Contains real Ford v1.2 run output (TSVs, markdown reports) — baseline for diff

### Established Patterns
- Co-located test files (`*.test.ts`) with node:test and assert/strict
- Pure formatter functions (no I/O) — easy to test with synthetic input
- makeL3()/makeL4() test fixture helpers — pattern for creating minimal test objects
- Each formatter already has its own test file with basic output assertions

### Integration Points
- `types/scoring.ts`: ScoringResult with new optional fields (sanityVerdict, sanityJustification, preScore) from Phase 22
- `types/scoring.ts`: LensScore shape — v1.3 synthesizes deterministic dimensions into this shape (Phase 22 decision)
- `output/write-final-reports.ts`: Orchestrates all formatter calls — scoring mode annotation added in Phase 23
- `evaluation-vllm/`: On-disk v1.2 output directory used as diff baseline

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-validation-report-compatibility*
*Context gathered: 2026-03-13*
