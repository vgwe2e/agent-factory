---
phase: 12-vllm-client-adapter
plan: 01
subsystem: scoring
tags: [vllm, openai-api, json-schema, chat-adapter, structured-output]

# Dependency graph
requires:
  - phase: 07-scoring-pipeline
    provides: ChatResult type, ollamaChat interface, JSON schemas from zodToJsonSchema
provides:
  - "createVllmChatFn: ChatFn adapter for vLLM OpenAI-compatible API"
  - "translateToResponseFormat: Ollama format to vLLM response_format translation"
  - "validateScoringSchemas: pre-flight schema compatibility validation"
affects: [12-vllm-client-adapter, 13-runpod-provider, 14-dual-mode-config]

# Tech tracking
tech-stack:
  added: []
  patterns: [ChatFn adapter pattern, schema translation layer, pre-flight validation]

key-files:
  created:
    - src/scoring/vllm-client.ts
    - src/scoring/vllm-client.test.ts
    - src/scoring/schema-translator.ts
    - src/scoring/schema-translator.test.ts
  modified: []

key-decisions:
  - "Resolve $ref inline during translation rather than rejecting -- zodToJsonSchema produces $ref for repeated Zod shapes, resolved by re-generating with $refStrategy:none in validateScoringSchemas and resolving inline in translateToResponseFormat"
  - "Strip root-level additionalProperties:false per research flag about vLLM xgrammar compatibility"

patterns-established:
  - "ChatFn adapter: factory function returning ChatFn-compatible closure over baseUrl/model"
  - "Schema translation: separate module for format conversion, keeping client adapter thin"
  - "Pre-flight validation: validate schemas before starting expensive cloud scoring run"

requirements-completed: [VLLM-01, VLLM-02, VLLM-04]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 12 Plan 01: vLLM Client Adapter Summary

**ChatFn adapter for vLLM OpenAI-compatible API with schema translation and pre-flight validation for all three scoring lens schemas**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T20:57:37Z
- **Completed:** 2026-03-11T21:02:18Z
- **Tasks:** 2
- **Files created:** 4 (685 lines total)

## Accomplishments
- Schema translator converts Ollama-style raw JSON schemas to vLLM response_format envelope, handling $schema stripping, additionalProperties removal, and $ref resolution
- Pre-flight validation confirms all three scoring lens schemas (technical, adoption, value) are vLLM-compatible
- ChatFn adapter wraps vLLM /v1/chat/completions with same interface as ollamaChat -- drop-in replacement
- 19 tests covering translation, validation, HTTP/network errors, request structure

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1: Schema translator with pre-flight validation**
   - `385c154` (test: add failing tests for schema translator)
   - `4eb9719` (feat: implement schema translator with pre-flight validation)
2. **Task 2: vLLM ChatFn adapter**
   - `4179d21` (test: add failing tests for vLLM client adapter)
   - `432ed33` (feat: implement vLLM ChatFn adapter)

## Files Created/Modified
- `src/scoring/schema-translator.ts` - translateToResponseFormat, validateScoringSchemas, $ref resolution, structural validation (228 lines)
- `src/scoring/schema-translator.test.ts` - 8 tests: wrapping, stripping, $ref resolution, pre-flight validation (140 lines)
- `src/scoring/vllm-client.ts` - createVllmChatFn factory, VLLM_TIMEOUT_MS/VLLM_TEMPERATURE constants (84 lines)
- `src/scoring/vllm-client.test.ts` - 11 tests: request structure, response extraction, HTTP/network errors, constants (233 lines)

## Decisions Made
- **$ref resolution strategy:** zodToJsonSchema produces $ref for repeated Zod object shapes (e.g., SubDimensionShape used in 3 TechnicalLens properties). Since vLLM xgrammar does not support $ref, translateToResponseFormat resolves them inline. Additionally, validateScoringSchemas re-generates schemas with $refStrategy:"none" for clean validation.
- **additionalProperties stripping:** Followed research flag from STATE.md -- strip root-level additionalProperties:false to avoid vLLM xgrammar issues.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added $ref resolution to translateToResponseFormat**
- **Found during:** Task 1 (Schema translator implementation)
- **Issue:** The real scoring schemas from zodToJsonSchema contain $ref references (e.g., `"$ref": "#/properties/data_readiness"` for repeated SubDimensionShape). Plan listed $ref as unsupported keyword but also required all three real schemas to pass validation.
- **Fix:** Added resolveRefs() helper that inlines local $ref pointers. Also used $refStrategy:"none" in validateScoringSchemas for clean generation.
- **Files modified:** src/scoring/schema-translator.ts
- **Verification:** All 8 schema-translator tests pass, including $ref resolution test
- **Committed in:** 4eb9719 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for correctness -- without $ref resolution, the real scoring schemas would fail vLLM validation. No scope creep.

## Issues Encountered
- Pre-existing test failures (20) in full suite: stale dist/ compiled tests, missing Ford export file, Ollama-dependent modules. Not caused by this plan's changes. Out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- vLLM client adapter ready for integration into scoring pipeline
- Phase 12 Plan 02 can build on createVllmChatFn to wire into the scoring pipeline
- Phase 13 (RunPod provider) can use vllm-client.ts with RunPod serverless endpoint URLs
- Pre-flight validation available for CI/pre-run checks

## Self-Check: PASSED

All 4 created files verified on disk. All 4 task commits verified in git log.

---
*Phase: 12-vllm-client-adapter*
*Completed: 2026-03-11*
