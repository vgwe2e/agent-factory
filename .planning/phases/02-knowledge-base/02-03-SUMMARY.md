---
phase: 02-knowledge-base
plan: 03
subsystem: knowledge
tags: [orchestration, decision-matrix, archetype-routing, process-builder, agentic-ai]

# Dependency graph
requires:
  - phase: 01-project-foundation
    provides: "LeadArchetype type and hierarchy export types"
provides:
  - "Orchestration decision guide JSON with 8 scenarios, 17 criteria, 4 patterns, 3 archetype mappings"
  - "Full-text orchestration guide markdown for LLM prompt context"
  - "Typed query functions for archetype-to-route mapping, criteria lookup, scenario filtering"
  - "Criterion reverse-lookup for scoring engine integration"
affects: [04-scoring-engine, 05-scoring-output, 06-simulation]

# Tech tracking
tech-stack:
  added: []
  patterns: [json-import-with-type-assertion, map-based-lookup-structures]

key-files:
  created:
    - src/data/orchestration/decision-guide.json
    - src/data/orchestration/decision-guide.md
    - src/types/orchestration.ts
    - src/knowledge/orchestration.ts
    - src/knowledge/orchestration.test.ts
  modified: []

key-decisions:
  - "archetype_mapping section added to JSON as custom bridge between hierarchy LeadArchetype and orchestration routes"
  - "Import assertion with { type: 'json' } for ES module JSON import compatibility"

patterns-established:
  - "Knowledge query module pattern: JSON data + typed Maps for O(1) lookups + exported query functions"

requirements-completed: [KNOW-03]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 2 Plan 3: Orchestration Decision Guide Summary

**Bundled orchestration decision framework with typed query layer mapping DETERMINISTIC/AGENTIC/GENERATIVE archetypes to Process/AgenticAI/Hybrid routes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T03:57:17Z
- **Completed:** 2026-03-11T04:00:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extracted Aera orchestration decision guide into structured JSON (8 scenarios, 17 decision criteria split 6/6/5, 4 integration patterns, 3 archetype mappings)
- Copied full-text markdown guide for LLM prompt inclusion in Phases 4 and 6
- Built typed query module with Map-based O(1) lookups for archetype routing, criteria, scenarios, patterns, and reverse criterion lookup
- All 20 tests passing with TDD workflow (RED -> GREEN)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract orchestration decision data into structured JSON** - `aaf7ea2` (feat)
2. **Task 2: Create orchestration query module with tests (RED)** - `cb8f537` (test)
3. **Task 2: Create orchestration query module with tests (GREEN)** - `c197bc8` (feat)

## Files Created/Modified
- `src/data/orchestration/decision-guide.json` - Structured decision matrix with scenarios, criteria, patterns, and archetype mappings
- `src/data/orchestration/decision-guide.md` - Full-text orchestration guide for LLM prompt context
- `src/types/orchestration.ts` - TypeScript types: OrchestrationRoute, DecisionCriterion, DecisionScenario, IntegrationPattern, ArchetypeMapping, DecisionGuide
- `src/knowledge/orchestration.ts` - Query functions: getRouteForArchetype, getDecisionCriteria, getAllScenarios, getScenariosByRoute, getIntegrationPatterns, getIntegrationPattern, matchCriteria, getDecisionGuide
- `src/knowledge/orchestration.test.ts` - 20 tests covering all query functions and archetype alignment

## Decisions Made
- Added `archetype_mapping` section to JSON as a custom bridge (not in source doc) connecting hierarchy export's `lead_archetype` field to orchestration routes -- this is the key link for Phase 4 scoring
- Used `import ... with { type: "json" }` assertion syntax for ES module JSON imports (NodeNext module resolution)
- Cast imported JSON through `unknown` to typed `DecisionGuide` since resolveJsonModule types are structural

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Orchestration query module ready for Phase 4 scoring engine to map archetypes to routes
- Full-text markdown ready for Phase 4 and 6 LLM prompt context inclusion
- Decision criteria reverse-lookup ready for scoring rule evaluation

## Self-Check: PASSED

All 5 created files verified on disk. All 3 task commits (aaf7ea2, cb8f537, c197bc8) verified in git history.

---
*Phase: 02-knowledge-base*
*Completed: 2026-03-11*
