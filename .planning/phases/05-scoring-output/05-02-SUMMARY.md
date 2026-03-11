---
phase: 05-scoring-output
plan: 02
subsystem: output
tags: [markdown, formatting, adoption-risk, tier1-report, tdd]

# Dependency graph
requires:
  - phase: 03-triage
    provides: TriageResult type with RedFlag tagged union and tier assignments
  - phase: 04-scoring-engine
    provides: ScoringResult type with three-lens scores, sub-dimension reasons, and composite
  - phase: 05-scoring-output plan 01
    provides: Pure formatter pattern and output directory conventions
provides:
  - formatAdoptionRisk pure function for adoption-risk.md generation
  - formatTier1Report pure function for tier1-report.md generation
affects: [05-03, 07-pipeline-orchestration]

# Tech tracking
tech-stack:
  added: []
  patterns: [flag-reason-generation, sub-dimension-label-mapping, assessment-synthesis, tier1-filtering-via-set]

key-files:
  created:
    - src/output/format-adoption-risk.ts
    - src/output/format-adoption-risk.test.ts
    - src/output/format-tier1-report.ts
    - src/output/format-tier1-report.test.ts
  modified: []

key-decisions:
  - "Generated human-readable reason strings from typed RedFlag union fields since actual type has no generic reason property"
  - "Tier 1 filtering uses Set<string> of l3_names passed by caller rather than re-implementing tier criteria"
  - "Assessment section synthesizes strongest/weakest lens dimensions and simulation eligibility programmatically"

patterns-established:
  - "Flag reason generation: switch on RedFlag type to produce human-readable explanations from type-specific fields"
  - "Sub-dimension label mapping: Record<string, string> for converting snake_case names to Title Case display labels"
  - "Section-builder pattern: small functions returning string blocks composed into full markdown document"

requirements-completed: [SCOR-08, OUTP-03, OUTP-04]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 5 Plan 2: Markdown Report Formatters Summary

**Adoption risk assessment and tier 1 deep analysis markdown formatters with narrative reason strings from scored/triaged data**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T11:41:19Z
- **Completed:** 2026-03-11T11:45:44Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Implemented adoption risk formatter grouping opportunities by 5 red flag types with auto-generated reason strings
- Implemented tier 1 deep analysis formatter with all 9 sub-dimension scores, narrative reasons, and synthesized assessments
- Full TDD coverage: 23 tests across 2 test files, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement adoption risk markdown formatter** - `b672c57` (feat)
2. **Task 2: Implement tier 1 report markdown formatter** - `79efd42` (feat)

## Files Created/Modified
- `src/output/format-adoption-risk.ts` - Pure function producing markdown report grouping flagged opportunities by 5 red flag types
- `src/output/format-adoption-risk.test.ts` - 10 tests for empty input, grouping, multi-flag, skipped marking, formatting
- `src/output/format-tier1-report.ts` - Pure function producing deep analysis report with per-dimension narratives and assessment synthesis
- `src/output/format-tier1-report.test.ts` - 13 tests for filtering, sorting, all lens sections, assessment synthesis, formatting

## Decisions Made
- RedFlag tagged union has type-specific fields (e.g., lowConfidencePct, l4Count) but no generic reason string -- implemented flagReason() switch to generate human-readable reasons from typed data
- Tier 1 report accepts tier1Names as Set<string> from caller rather than re-deriving tier criteria, maintaining separation of concerns
- Assessment section programmatically identifies strongest and weakest dimensions by normalized scores to generate narrative
- Skipped opportunities rendered with markdown strikethrough (~~name~~) in adoption risk table

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted to existing RedFlag tagged union type**
- **Found during:** Task 1 (Adoption risk formatter)
- **Issue:** Plan assumed RedFlag has a generic `reason: string` field, but actual type is a tagged union with type-specific fields (e.g., CONFIDENCE_GAP has lowConfidencePct, ORPHAN has l4Count)
- **Fix:** Created flagReason() function that switches on RedFlag type to generate human-readable reason strings from typed data
- **Files modified:** src/output/format-adoption-risk.ts
- **Verification:** All 10 tests pass with correct reason strings

**2. [Rule 3 - Blocking] Adapted to existing ScoringResult type shape**
- **Found during:** Task 2 (Tier 1 report formatter)
- **Issue:** Plan specified ScoredOpportunity type with named lens fields (technical, adoption, value), but actual ScoringResult uses lenses.technical/adoption/value with LensScore containing subDimensions array
- **Fix:** Used r.lenses.technical pattern and findSub() for name-based sub-dimension lookup, consistent with format-scores-tsv.ts approach
- **Files modified:** src/output/format-tier1-report.ts
- **Verification:** All 13 tests pass with correct lens rendering

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Necessary adaptations to work with existing Phase 3/4 type system. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 formatters (2 TSV + 2 markdown) now complete for evaluation output
- Write-evaluation orchestrator (Plan 03) can compose all formatters to produce the evaluation/ directory
- All formatters follow pure function pattern for easy composition

## Self-Check: PASSED

All 4 created files verified on disk. Both task commits (b672c57, 79efd42) verified in git log.

---
*Phase: 05-scoring-output*
*Completed: 2026-03-11*
