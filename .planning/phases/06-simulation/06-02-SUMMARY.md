---
phase: 06-simulation
plan: 02
subsystem: simulation
tags: [ollama, mermaid, yaml, llm-generators, retry, knowledge-validation]

# Dependency graph
requires:
  - phase: 06-simulation-01
    provides: "Types, Zod schemas, Mermaid validator, knowledge validator, extraction utilities"
  - phase: 02-knowledge-base
    provides: "PB nodes (22), UI components (21), workflow patterns (7), integration patterns (4)"
provides:
  - "buildDecisionFlowPrompt: prompt builder for Mermaid decision flow diagrams"
  - "generateDecisionFlow: LLM generator with retry and Mermaid validation"
  - "buildComponentMapPrompt: prompt builder for YAML component maps with glossary"
  - "generateComponentMap: LLM generator with retry, Zod validation, and KNOW-04 enforcement"
affects: [06-03-pipeline, 09-reports]

# Tech tracking
tech-stack:
  added: []
  patterns: [prompt-build-generate-validate-retry, knowledge-confidence-override, conversation-repair-context]

key-files:
  created:
    - src/simulation/prompts/decision-flow.ts
    - src/simulation/prompts/component-map.ts
    - src/simulation/generators/decision-flow-gen.ts
    - src/simulation/generators/decision-flow-gen.test.ts
    - src/simulation/generators/component-map-gen.ts
    - src/simulation/generators/component-map-gen.test.ts
  modified: []

key-decisions:
  - "Conversation repair context: failed LLM outputs appended as assistant messages with error feedback for retry"
  - "Knowledge confidence override: generator mutates ComponentMap entries in-place after Zod validation"
  - "Temperature 0.3 for both generators (per research recommendation for structured output)"

patterns-established:
  - "Prompt-build-generate-validate-retry: build messages, call Ollama, extract content, validate, retry with error context"
  - "Knowledge confidence override: post-validation step that enforces KNOW-04 by overriding LLM confidence flags"
  - "Conversation repair: append failed output + error as new messages rather than rebuilding from scratch"

requirements-completed: [SIMU-01, SIMU-02]

# Metrics
duration: 6min
completed: 2026-03-11
---

# Phase 6 Plan 02: Decision Flow and Component Map Generators Summary

**Mermaid decision flow and YAML component map generators with retry logic, structural validation, and KNOW-04 knowledge base confidence enforcement**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-11T12:18:57Z
- **Completed:** 2026-03-11T12:24:55Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Decision flow generator produces validated Mermaid flowcharts with Aera component labels (PB, Cortex, UI) and retries up to 3 times with conversation repair context
- Component map generator produces Zod-validated YAML with KNOW-04 enforced confidence flags (confirmed/inferred) per component entry
- Both generators use temperature 0.3, plain text output (no Ollama format parameter), and conversation-style retry with error context
- 12 tests passing with mocked LLM responses and real knowledge base data

## Task Commits

Each task was committed atomically:

1. **Task 1: Decision flow prompt builder and generator** - `8070c61` (feat)
2. **Task 2: Component map prompt builder and generator** - `19ef366` (feat)
3. **Type alignment fix** - `8fc9ba2` (fix)

## Files Created/Modified
- `src/simulation/prompts/decision-flow.ts` - Prompt builder for Mermaid flowcharts with PB nodes and orchestration route
- `src/simulation/prompts/component-map.ts` - Prompt builder for YAML component maps with full component glossary
- `src/simulation/generators/decision-flow-gen.ts` - Mermaid generator with extractMermaidBlock + validateMermaidFlowchart + retry
- `src/simulation/generators/decision-flow-gen.test.ts` - 6 tests: valid output, code fences, retry, 3-attempt failure, prompt content
- `src/simulation/generators/component-map-gen.ts` - YAML generator with parseAndValidateYaml + knowledge validation + confidence override
- `src/simulation/generators/component-map-gen.test.ts` - 6 tests: confirmed names, inferred names, code fences, retry, 3-attempt failure, prompt content

## Decisions Made
- Conversation repair context: on validation failure, append the failed assistant output and a user message with the error as new messages, rather than rebuilding the prompt from scratch. This gives the LLM context about what went wrong.
- Knowledge confidence override: after Zod validation, the generator mutates ComponentMap entries in-place to set confidence flags based on knowledge base lookup. This is the KNOW-04 enforcement step.
- Temperature 0.3 used for both generators (per Phase 6 research recommendation for structured output generation).
- Test fixtures use fabricated names ("Zylox*") to avoid substring-matching against real knowledge base entries in inferred validation tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed type mismatches between plan interface spec and actual hierarchy types**
- **Found during:** Task 1 and Task 2 (TypeScript compilation)
- **Issue:** Plan's interface spec used field names (l4_id, l4_name, business_process, export_date, etc.) that don't match the actual types in src/types/hierarchy.ts (id, name, description, etc.)
- **Fix:** Updated prompt builders to use correct field names (l4.name, opportunity.rationale, l4.description) and test fixtures to match actual L3Opportunity, L4Activity, CompanyContext shapes
- **Files modified:** src/simulation/prompts/decision-flow.ts, src/simulation/prompts/component-map.ts, src/simulation/generators/decision-flow-gen.test.ts, src/simulation/generators/component-map-gen.test.ts
- **Verification:** TypeScript compiles without errors, all 12 tests pass
- **Committed in:** 8fc9ba2

---

**Total deviations:** 1 auto-fixed (1 blocking type mismatch)
**Impact on plan:** Essential for TypeScript compilation. No scope creep.

## Issues Encountered
- Plan interface spec diverged from actual hierarchy types (likely drafted from earlier project state). Corrected to match real types.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both complex generators ready for Plan 03 (simpler YAML generators + pipeline orchestrator)
- Prompt-build-generate-validate-retry pattern established and reusable
- Knowledge base integration validated end-to-end with real data

---
*Phase: 06-simulation*
*Completed: 2026-03-11*
