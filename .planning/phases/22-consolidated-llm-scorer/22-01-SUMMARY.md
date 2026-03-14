---
phase: 22-consolidated-llm-scorer
plan: 01
subsystem: scoring
tags: [zod, prompt-engineering, llm, platform-fit, sanity-check]

# Dependency graph
requires:
  - phase: 21-types-deterministic-foundation
    provides: PreScoreResult type, DimensionScores type, deterministic pre-scoring
provides:
  - ConsolidatedLensSchema Zod schema + consolidatedJsonSchema for LLM format parameter
  - SanityVerdict type and optional ScoringResult v1.3 fields
  - buildConsolidatedPrompt pure function for consolidated LLM scoring
affects: [22-02-scorer-function, 23-pipeline-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [4-layer audit prompt structure for consolidated scoring, per-dimension sanity check with worked examples]

key-files:
  created:
    - src/scoring/prompts/consolidated.ts
    - src/scoring/prompts/consolidated.test.ts
  modified:
    - src/scoring/schemas.ts
    - src/types/scoring.ts
    - src/scoring/schemas.test.ts

key-decisions:
  - "Consolidated schema uses SubDimensionShape for platform_fit (reuses existing pattern)"
  - "flagged_dimensions is optional array (omitted when sanity_verdict is AGREE)"
  - "ScoringResult v1.3 fields are all optional for backward compatibility with v1.2 checkpoints"
  - "Prompt includes dimension descriptions alongside scores for LLM context"

patterns-established:
  - "4-layer consolidated prompt: role, rubric+examples, constraints, calibration"
  - "Worked examples showing full JSON output shape at each score level"

requirements-completed: [LLM-02, LLM-03, LLM-05]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 22 Plan 01: Consolidated LLM Scorer Contracts Summary

**ConsolidatedLensSchema with platform fit + sanity check, SanityVerdict type, and 4-layer prompt builder with worked examples and per-dimension sanity checking**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T00:41:08Z
- **Completed:** 2026-03-14T00:45:06Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- ConsolidatedLensSchema validates platform_fit (0-3), sanity_verdict enum, sanity_justification, optional flagged_dimensions, and confidence level
- ScoringResult extended with optional v1.3 fields (sanityVerdict, sanityJustification, preScore) -- backward compatible
- buildConsolidatedPrompt produces 4-layer audit-compliant system prompt with 3 worked JSON examples and user message containing all 6 deterministic dimension scores with descriptions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ConsolidatedLensSchema and SanityVerdict type** - `22d7825` (feat)
2. **Task 2: Build consolidated prompt builder** - `98b66fa` (feat)

_Note: Both tasks followed TDD (RED then GREEN). Tests written first, then implementation._

## Files Created/Modified
- `src/scoring/schemas.ts` - Added ConsolidatedLensSchema + consolidatedJsonSchema export
- `src/scoring/schemas.test.ts` - 12 new tests for consolidated schema validation and JSON schema conversion
- `src/types/scoring.ts` - Added SanityVerdict type and 3 optional ScoringResult fields
- `src/scoring/prompts/consolidated.ts` - Pure prompt builder with 4-layer structure, 3 worked examples, negative constraints
- `src/scoring/prompts/consolidated.test.ts` - 12 tests for prompt structure, rubric, constraints, dimensions, context

## Decisions Made
- Consolidated schema reuses existing SubDimensionShape for platform_fit (consistency with other lens schemas)
- flagged_dimensions is optional (z.array(z.string()).optional()) since AGREE verdicts should not flag dimensions
- All 3 new ScoringResult fields are optional for v1.2 checkpoint backward compatibility
- Prompt includes dimension descriptions alongside numeric scores to give LLM context for sanity checking
- Worked examples cover all 3 verdict types (AGREE, PARTIAL, DISAGREE) at different platform fit levels

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema and prompt contracts ready for Plan 02 (consolidated scorer function)
- ConsolidatedLensSchema ready for scoreWithRetry integration
- consolidatedJsonSchema ready for Ollama/vLLM format parameter
- buildConsolidatedPrompt ready to be called by scoreConsolidated() in Plan 02

---
*Phase: 22-consolidated-llm-scorer*
*Completed: 2026-03-14*
