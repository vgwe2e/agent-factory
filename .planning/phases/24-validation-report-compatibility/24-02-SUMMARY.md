---
phase: 24-validation-report-compatibility
plan: 02
subsystem: testing
tags: [formatter, tsv, markdown, structural-parity, regression-test, v1.3]

# Dependency graph
requires:
  - phase: 22-deterministic-scoring
    provides: LensScore synthesis for v1.3 ScoringResult shape
  - phase: 23-pipeline-integration
    provides: Scoring mode annotation header in markdown reports
provides:
  - Permanent structural parity test for all 9 report formatters
  - Shared v1.3 fixture factories (makeV13ScoringResult, makeV13TriageResult, makeMinimalSimResult)
affects: [24-validation-report-compatibility]

# Tech tracking
tech-stack:
  added: []
  patterns: [structural-parity-testing, data-driven-section-normalization]

key-files:
  created:
    - src/output/formatter-compat.test.ts
  modified: []

key-decisions:
  - "H1/H2 structural comparison only -- H3 headers are data-driven and excluded from baseline matching"
  - "Company name normalized in H1 headers to avoid false failures from name differences"
  - "Numbered opportunity headers (## N. Name) excluded from structural comparison as data-driven"

patterns-established:
  - "Structural parity testing: compare report structure (sections, table columns) not values"
  - "Fixture factory pattern: shared makeV13ScoringResult/TriageResult/SimResult for all formatter tests"

requirements-completed: [VAL-03]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 24 Plan 02: Formatter Compatibility Summary

**17 structural parity tests verifying all 9 report formatters produce correct output from v1.3 ScoringResult objects against v1.2 evaluation-vllm/ baseline**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T01:32:31Z
- **Completed:** 2026-03-14T01:36:31Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- All 4 TSV formatters (scores, triage, simulation-filter, implementation-shortlist) verified with column presence, consistent column counts, and row count assertions
- All 5 markdown formatters (summary, dead-zones, meta-reflection, tier1-report, adoption-risk) verified with section header parity and table column parity against v1.2 baseline
- Shared v1.3 fixture factory creates realistic ScoringResult with sanityVerdict, preScore, and synthesized LensScores
- Tests skip gracefully when v1.2 baseline files are absent

## Task Commits

Each task was committed atomically:

1. **Task 1: TSV formatter structural parity tests** - `25df0df` (test)
2. **Task 2: Markdown formatter structural parity tests** - `84b0839` (test)

## Files Created/Modified
- `src/output/formatter-compat.test.ts` - 17 structural parity tests for all 9 formatters with shared v1.3 fixtures

## Decisions Made
- H1/H2 headers compared for structural parity; H3 headers excluded as data-driven (domain names, opportunity names vary with input data)
- Company name stripped from H1 headers before comparison (v1.2 baseline uses "Ford Motor Company", test uses "Ford")
- Numbered opportunity H2 headers in tier1 report excluded from matching (data-driven)
- Sub-dimension column names asserted as-is from current formatScoresTsv header (not v1.2 identity columns which already changed pre-v1.3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed assertSectionsMatch to handle data-driven section headers**
- **Found during:** Task 2 (Markdown formatter tests)
- **Issue:** Initial assertSectionsMatch compared ALL section headers including H3 (data-driven domain names like "### Service") and numbered H2 headers ("## 1. Warehouse & Inventory Management"), causing false failures
- **Fix:** Filter to H1/H2 only, exclude numbered opportunity headers, normalize company names in H1 headers
- **Files modified:** src/output/formatter-compat.test.ts
- **Verification:** All 17 tests pass
- **Committed in:** 84b0839 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test logic)
**Impact on plan:** Auto-fix was necessary for correct structural comparison. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- VAL-03 complete: all formatters produce structurally correct output from v1.3 ScoringResult
- Ready for VAL-01/VAL-02 calibration and discrimination tests (Plan 01)
- Ready for VAL-04 full Ford run (Plan 03)

---
## Self-Check: PASSED

- FOUND: src/output/formatter-compat.test.ts
- FOUND: 25df0df (Task 1 commit)
- FOUND: 84b0839 (Task 2 commit)

---
*Phase: 24-validation-report-compatibility*
*Completed: 2026-03-14*
