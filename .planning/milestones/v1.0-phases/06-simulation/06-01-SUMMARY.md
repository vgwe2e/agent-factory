---
phase: 06-simulation
plan: 01
subsystem: simulation
tags: [zod, js-yaml, mermaid, validation, knowledge-base, yaml]

# Dependency graph
requires:
  - phase: 02-knowledge-base
    provides: "Bundled PB nodes (22), UI components (21), workflow patterns (7), integration patterns (4)"
provides:
  - "SimulationInput, SimulationResult, ComponentMap, MockTest, IntegrationSurface type contracts"
  - "Zod schemas for validating LLM-generated YAML artifacts"
  - "Mermaid flowchart structural validator (regex-based)"
  - "KNOW-04 knowledge base component reference validator"
  - "extractMermaidBlock, extractYamlBlock, slugify utilities"
  - "parseAndValidateYaml generic helper"
affects: [06-02-generators, 06-03-pipeline, 09-reports]

# Tech tracking
tech-stack:
  added: [js-yaml, "@types/js-yaml"]
  patterns: [yaml-parse-then-zod-validate, regex-based-mermaid-validation, knowledge-index-lookup]

key-files:
  created:
    - src/types/simulation.ts
    - src/simulation/schemas.ts
    - src/simulation/schemas.test.ts
    - src/simulation/utils.ts
    - src/simulation/utils.test.ts
    - src/simulation/validators/mermaid-validator.ts
    - src/simulation/validators/mermaid-validator.test.ts
    - src/simulation/validators/knowledge-validator.ts
    - src/simulation/validators/knowledge-validator.test.ts
  modified: []

key-decisions:
  - "Aera concept index skips entries that already exist as PB/UI nodes to prevent collision overwrites"
  - "Subgraph context tracking in Mermaid validator avoids false positives on subgraph end keywords"
  - "parseAndValidateYaml is async to allow future streaming/retry patterns"

patterns-established:
  - "YAML parse-then-validate: js-yaml.load() followed by Zod schema.parse() for LLM output validation"
  - "Knowledge index: Map<lowercase-name, prefixed-identifier> with case-insensitive + substring matching"
  - "Code fence extraction: regex strips mermaid/yaml/yml fences before parsing"

requirements-completed: [KNOW-04]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 6 Plan 01: Simulation Foundation Summary

**Zod-validated YAML schemas, Mermaid structural validator, and KNOW-04 knowledge base component validator with 32 passing tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T12:12:47Z
- **Completed:** 2026-03-11T12:17:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Full type contracts for simulation phase (SimulationInput, SimulationResult, all artifact types)
- Zod schemas validate/reject all 3 YAML artifact types (component maps, mock tests, integration surfaces)
- Mermaid validator catches 4 common LLM output issues (missing declaration, no edges, too short, lowercase end)
- Knowledge validator confirms/infers component references against all 54 knowledge base entries plus Aera concepts
- 32 tests passing with zero Ollama dependency

## Task Commits

Each task was committed atomically:

1. **Task 1: Simulation types, Zod schemas, and utility functions** - `f606536` (feat)
2. **Task 2: Mermaid validator and KNOW-04 knowledge base validator** - `a4214f3` (feat)

## Files Created/Modified
- `src/types/simulation.ts` - All simulation type contracts (SimulationInput, SimulationResult, ComponentMap, MockTest, IntegrationSurface)
- `src/simulation/schemas.ts` - Zod schemas for 3 YAML artifact types + parseAndValidateYaml helper
- `src/simulation/schemas.test.ts` - 17 schema validation tests
- `src/simulation/utils.ts` - extractMermaidBlock, extractYamlBlock, slugify utilities
- `src/simulation/utils.test.ts` - 7 utility function tests
- `src/simulation/validators/mermaid-validator.ts` - Regex-based Mermaid flowchart structural validation
- `src/simulation/validators/mermaid-validator.test.ts` - 7 Mermaid validator tests
- `src/simulation/validators/knowledge-validator.ts` - KNOW-04 component reference validation against bundled knowledge base
- `src/simulation/validators/knowledge-validator.test.ts` - 8 knowledge validator tests (uses real bundled data)

## Decisions Made
- Aera concept index preserves PB/UI node entries on lowercase collision (e.g., "action item" exists as both PB node and Aera concept -- PB entry preserved)
- Subgraph context tracking in Mermaid validator prevents false positives when "end" closes a subgraph block
- parseAndValidateYaml made async to support future retry/streaming patterns in generators

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed knowledge index collision between PB nodes and Aera concepts**
- **Found during:** Task 2 (Knowledge validator)
- **Issue:** PB nodes "Action Item" and "Stream" shared lowercase keys with Aera concepts "action item" and "streams", causing PB entries to be overwritten and PB count to drop from 22 to 21
- **Fix:** Added existence check before setting Aera concept entries in the index
- **Files modified:** src/simulation/validators/knowledge-validator.ts
- **Verification:** buildKnowledgeIndex test confirms exactly 22 PB nodes, 21 UI components, 7 patterns, 4 integration patterns
- **Committed in:** a4214f3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential for correctness of KNOW-04 validation. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in output/format-adoption-risk.test.ts (type "flag" not assignable) -- out of scope, not related to simulation changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All type contracts and validators ready for Plan 02 (LLM-dependent generators)
- Generators can import schemas, validators, and utilities directly
- Knowledge index provides confirmed/inferred classification for component maps
- No Ollama dependency in this plan -- generators in Plan 02 will add LLM integration

---
*Phase: 06-simulation*
*Completed: 2026-03-11*
