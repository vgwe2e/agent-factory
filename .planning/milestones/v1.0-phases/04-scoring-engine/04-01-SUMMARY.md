---
phase: 04-scoring-engine
plan: 01
subsystem: scoring
tags: [zod, zod-to-json-schema, composite-scoring, confidence, archetype-routing, tdd]

# Dependency graph
requires:
  - phase: 01-project-foundation
    provides: "L3Opportunity, L4Activity, CompanyContext types from hierarchy.ts"
  - phase: 02-knowledge-base
    provides: "getRouteForArchetype from orchestration.ts, ArchetypeMapping type"
provides:
  - "ScoringResult, LensScore, SubDimensionScore, CompositeResult, ConfidenceLevel types"
  - "Zod schemas for LLM output validation per lens (TechnicalLensSchema, AdoptionLensSchema, ValueLensSchema)"
  - "JSON schema conversions for Ollama format parameter"
  - "computeComposite: weighted composite calculation with promotion threshold gate"
  - "Confidence computation functions (technical, adoption, value, overall)"
  - "classifyArchetype: archetype classification with null fallback inference chain"
affects: [04-scoring-engine plan 02, 04-scoring-engine plan 03, 05-reports]

# Tech tracking
tech-stack:
  added: [zod-to-json-schema]
  patterns: [pure-function scoring modules, algorithmic confidence tags, archetype fallback chain]

key-files:
  created:
    - src/types/scoring.ts
    - src/scoring/schemas.ts
    - src/scoring/composite.ts
    - src/scoring/composite.test.ts
    - src/scoring/confidence.ts
    - src/scoring/confidence.test.ts
    - src/scoring/archetype-router.ts
    - src/scoring/archetype-router.test.ts
  modified:
    - src/package.json
    - src/package-lock.json

key-decisions:
  - "zod-to-json-schema for Ollama format parameter JSON schema generation"
  - "Confidence LOW checks evaluated before HIGH to prioritize caution"
  - "DETERMINISTIC as safe default archetype for empty L4 arrays"
  - "Archetype inference heuristic: decisionPct and aiPct thresholds at 0.3/0.5/0.6"

patterns-established:
  - "Pure scoring functions with no I/O: fully testable without Ollama"
  - "Algorithmic confidence from data signals, never LLM self-assessment"
  - "Three-step archetype fallback: export -> supporting_archetypes -> L4 heuristic"

requirements-completed: [SCOR-04, SCOR-05, SCOR-06]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 4 Plan 1: Scoring Types, Composite Math, Confidence, and Archetype Router Summary

**Pure-function scoring modules with 0.30/0.45/0.25 weighted composite, algorithmic confidence tags, and 3-step archetype fallback chain -- 30 tests, zero I/O**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T04:24:24Z
- **Completed:** 2026-03-11T04:27:54Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Complete scoring type system: ScoringResult, LensScore, SubDimensionScore, CompositeResult, ConfidenceLevel with WEIGHTS/MAX_SCORES/PROMOTION_THRESHOLD constants
- Zod schemas for all 3 lenses with JSON schema conversion for Ollama format parameter
- Deterministic composite math with correct 0.30/0.45/0.25 weighting and >= 0.60 threshold gate
- Per-lens algorithmic confidence (technical, adoption, value) with overall = lowest
- Archetype classification resolving null archetypes via export -> supporting_archetypes -> L4 heuristic -> DETERMINISTIC default

## Task Commits

Each task was committed atomically:

1. **Task 1: Define scoring types, Zod schemas, composite math, and confidence** - `3f28fd0` (feat)
2. **Task 2: Archetype classification with null fallback inference** - `c79acac` (feat)

_Note: TDD tasks -- tests written first (RED), then implementation (GREEN)._

## Files Created/Modified
- `src/types/scoring.ts` - All scoring types and constants (WEIGHTS, MAX_SCORES, PROMOTION_THRESHOLD)
- `src/scoring/schemas.ts` - Zod schemas for LLM output per lens + JSON schema conversion
- `src/scoring/composite.ts` - computeComposite: weighted blend + threshold gate
- `src/scoring/composite.test.ts` - 6 tests: perfect/zero scores, threshold boundary, normalization
- `src/scoring/confidence.ts` - Per-lens confidence computation from data signals
- `src/scoring/confidence.test.ts` - 15 tests: technical/adoption/value/overall confidence rules
- `src/scoring/archetype-router.ts` - classifyArchetype with 3-step fallback chain
- `src/scoring/archetype-router.test.ts` - 9 tests: direct export, fallback, L4 inference, empty default
- `src/package.json` - Added zod-to-json-schema dependency
- `src/package-lock.json` - Lock file updated

## Decisions Made
- Used zod-to-json-schema (not hand-written JSON schemas) for single source of truth between Zod validation and Ollama format parameter
- Confidence LOW conditions checked before HIGH in all lenses to prioritize caution (detect bad data first)
- DETERMINISTIC chosen as safe default archetype for empty L4 arrays (most conservative routing)
- Archetype inference thresholds: decisionPct < 0.3 && aiPct < 0.3 for GENERATIVE, decisionPct < 0.5 || aiPct > 0.6 for AGENTIC, else DETERMINISTIC

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All scoring types exported for Plans 02 and 03
- Zod schemas ready for LLM output validation in lens scorers (Plan 03)
- Composite and confidence functions ready for scoring pipeline integration
- Archetype router ready for per-opportunity classification in the pipeline

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (3f28fd0, c79acac) verified in git log.

---
*Phase: 04-scoring-engine*
*Completed: 2026-03-11*
