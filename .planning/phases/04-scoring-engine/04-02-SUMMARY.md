---
phase: 04-scoring-engine
plan: 02
subsystem: scoring
tags: [ollama, llm, prompts, zod, json-schema, retry]

# Dependency graph
requires:
  - phase: 04-scoring-engine/01
    provides: Zod schemas for LLM output validation, scoring types and constants
  - phase: 02-knowledge-base
    provides: Aera component and PB node knowledge for technical prompt context
provides:
  - Ollama chat wrapper with schema-constrained JSON and Result type
  - scoreWithRetry generic validator with exponential backoff
  - Technical Feasibility prompt builder (archetype-aware, knowledge-enriched)
  - Adoption Realism prompt builder (4 sub-dimensions, L4 decision/financial data)
  - Value & Efficiency prompt builder (revenue-relative, company financials)
  - Schema validation test suite (19 tests)
affects: [04-scoring-engine/03, 05-reporting, 06-simulation]

# Tech tracking
tech-stack:
  added: [zod-to-json-schema]
  patterns: [ollama-chat-wrapper, prompt-as-pure-function, retry-with-validation, result-type-io]

key-files:
  created:
    - src/scoring/ollama-client.ts
    - src/scoring/prompts/technical.ts
    - src/scoring/prompts/adoption.ts
    - src/scoring/prompts/value.ts
    - src/scoring/schemas.test.ts
  modified:
    - src/scoring/schemas.ts

key-decisions:
  - "Type assertion (as never) for zodToJsonSchema calls to work around Zod 3.25.x type incompatibility"
  - "L4 truncation threshold at 8 activities: >8 uses compact format omitting descriptions"
  - "Archetype emphasis injected per-lens in system prompt, not user prompt"
  - "Revenue percentage calculated inline in value prompt for LLM context"

patterns-established:
  - "Prompt builder pattern: pure function returning ChatMessage[] array"
  - "Archetype emphasis lookup: Record<LeadArchetype, string> per lens"
  - "Ollama Result type: success with content+durationMs or error string"

requirements-completed: [SCOR-01, SCOR-02, SCOR-03]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 4 Plan 02: Ollama Client & Lens Prompts Summary

**Ollama scoring client with retry-and-validate plus three archetype-aware lens prompt templates with concrete 0-3 rubric anchors**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T04:24:57Z
- **Completed:** 2026-03-11T04:29:43Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Ollama chat wrapper with format parameter, 120s timeout, and Result type (no exceptions)
- Generic scoreWithRetry function with Zod validation and exponential backoff (1s, 2s, 4s)
- Three lens prompt builders as pure functions with archetype-specific emphasis and concrete rubric anchors
- 19 schema validation tests covering parse/reject behavior and JSON schema structure

## Task Commits

Each task was committed atomically:

1. **Task 1: Ollama scoring client with retry-and-validate** - `1344784` (feat)
2. **Task 2: Lens prompt templates and schema validation tests** - `47395d7` (feat)

## Files Created/Modified
- `src/scoring/ollama-client.ts` - Ollama /api/chat wrapper with format param and retry-with-validate
- `src/scoring/prompts/technical.ts` - Technical Feasibility prompt with knowledge base context
- `src/scoring/prompts/adoption.ts` - Adoption Realism prompt with L4 decision/financial data
- `src/scoring/prompts/value.ts` - Value & Efficiency prompt with company financials
- `src/scoring/schemas.test.ts` - 19 tests for schema validation and JSON schema conversion
- `src/scoring/schemas.ts` - Fixed zod-to-json-schema type assertion for Zod 3.25.x

## Decisions Made
- Type assertion (`as never`) for zodToJsonSchema calls to resolve Zod 3.25.x / zod-to-json-schema type incompatibility
- L4 activity truncation at 8: opportunities with >8 L4s use compact format (omit descriptions) to stay within context window
- Archetype emphasis injected into system prompt (not user prompt) for consistent rubric framing
- Revenue percentage calculated inline in value prompt so LLM has relative context for scoring

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed zod-to-json-schema type assertion in schemas.ts**
- **Found during:** Task 2 (TypeScript compile verification)
- **Issue:** zodToJsonSchema() calls in Plan 01's schemas.ts produce "excessively deep type instantiation" errors with Zod 3.25.x
- **Fix:** Added `as never` type assertion on schema arguments and `as Record<string, unknown>` on return type
- **Files modified:** src/scoring/schemas.ts
- **Verification:** `npx tsc --noEmit` passes cleanly for all Plan 02 files
- **Committed in:** 47395d7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type assertion fix necessary for compilation. No scope creep.

## Issues Encountered
- Pre-existing TS errors in Plan 01 test files (composite.test.ts, confidence.test.ts) referencing modules not yet created by Plan 03 -- out of scope, ignored

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ollama client and all three prompt builders ready for Plan 03 scoring pipeline composition
- Schema tests provide fixture patterns for Plan 03 integration tests with mocked Ollama responses
- Prompt templates support null archetypes with default equal-weight emphasis

## Self-Check: PASSED

All 6 files verified present. Both task commits (1344784, 47395d7) verified in git log.

---
*Phase: 04-scoring-engine*
*Completed: 2026-03-11*
