# Phase 22: Consolidated LLM Scorer - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Each top-N survivor from Phase 21's deterministic pre-scoring receives exactly one LLM call that assesses platform fit with Aera component citations and sanity-checks the deterministic pre-score. Output feeds into the existing 0.60 promotion threshold for simulation eligibility.

Requirements: LLM-01 through LLM-06.

</domain>

<decisions>
## Implementation Decisions

### Sanity check behavior
- DISAGREE verdict applies a -0.15 penalty to the final composite score
- PARTIAL verdict applies half penalty (-0.075)
- AGREE verdict applies no adjustment
- Penalties are hardcoded constants (DISAGREE_PENALTY = 0.15, PARTIAL_PENALTY = 0.075) — not CLI-configurable per ADVN-01 deferral (weights need Ford validation first)
- LLM sanity check justification text is preserved in scoring output for human review in reports

### Output shape
- Synthesize consolidated LLM output into existing LensScore shape so all 10+ report formatters work unchanged
- Technical lens = platform_fit score from LLM (0-3) as the sole sub-dimension. Max score becomes 3 (not 9)
- Adoption and value lenses populated from deterministic dimensions scaled to 0-3 range (e.g., financial_signal, decision_density → adoption; value_density → value). Formatters that drill into sub-dimensions still work.
- New optional fields added to ScoringResult: `sanityVerdict` (AGREE/DISAGREE/PARTIAL), `sanityJustification` (string), `preScore` (number from deterministic phase). Backward compatible — v1.2 results won't have them.

### Prompt audit compliance
- Consolidated prompt built to /audit-prompt spec from the start (4-layer structure, worked examples, negative constraints, confidence calibration, rubric anchoring)
- Use existing v1.2 prompts (technical.ts v3.0, adoption.ts, value.ts) as structural templates
- Include 2-3 worked examples showing expected JSON for platform fit levels 1, 2, and 3 (weak fit, moderate with citations, strong with pattern)
- Structured per-dimension sanity check: prompt lists each deterministic dimension (financial_signal, ai_suitability, decision_density, impact_order, rating_confidence, archetype_completeness) and asks the LLM to flag miscalibrated ones
- Carry forward existing negative constraints from v1.2 technical.ts (e.g., "Do NOT score platform_fit >= 2 based on generic keyword overlap alone") and add new consolidated-specific constraints (e.g., "Do NOT let sanity check override more than 2 dimensions", "Do NOT assume all HIGH ai_suitability candidates deserve strong platform fit")

### Claude's Discretion
- Composite blending formula (how pre-score weight and LLM weight combine before penalty)
- Exact scaling math for deterministic 0-1 dimensions → 0-3 LensScore sub-dimension scores
- Prompt wording and rubric details beyond the structural decisions above
- Zod schema field naming for the consolidated LLM response

</decisions>

<specifics>
## Specific Ideas

- The v1.2 technical prompt's `aera_platform_fit` sub-dimension (scoring/prompts/technical.ts) is the closest ancestor to this consolidated prompt's platform fit assessment — use its rubric as a starting point
- The `scoreWithRetry` pattern from ollama-client.ts is the established retry mechanism (LLM-04 requires it)
- ChatFn interface (messages + format → ChatResult) must be preserved for both Ollama and vLLM compatibility
- The knowledge context string (capabilities + components + process builder) should be included in the prompt exactly as v1.2 does for technical scoring

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scoreWithRetry<T>(schema, callFn, maxRetries, logger)` in `scoring/ollama-client.ts` — generic Zod-validated retry wrapper, reuse directly for consolidated scorer
- `ChatFn` type signature in `scoring/ollama-client.ts` and `scoring/vllm-client.ts` — both backends implement this interface
- `buildTechnicalPrompt()` in `scoring/prompts/technical.ts` — v3.0 prompt with archetype emphasis, rubrics, negative constraints, confidence calibration. Template for consolidated prompt structure.
- `computeComposite()` in `scoring/composite.ts` — existing weighted composite calculator (weights: tech 0.30, adoption 0.45, value 0.25). May need adaptation for two-pass blending.
- Knowledge modules: `knowledge/capabilities.ts` (getAllCapabilitiesFlat, getUseCaseMappings, getPlatformBoundaries) for Aera component citation grounding

### Established Patterns
- Pure prompt builders (no I/O): `prompts/technical.ts`, `prompts/adoption.ts`, `prompts/value.ts` — system + user message pairs
- Zod schemas in `scoring/schemas.ts` with corresponding JSON schemas for format parameter
- `schema-translator.ts` converts Ollama JSON schemas to vLLM `response_format` — new consolidated schema must be translatable
- Result type pattern: `{ success: true; data: T } | { success: false; error: string }` throughout

### Integration Points
- `scoreOneSkill()` in `scoring/scoring-pipeline.ts` — currently calls 3 parallel lens scorers. Phase 22 creates the consolidated alternative.
- `ScoringResult` type in `types/scoring.ts` — will gain optional `sanityVerdict`, `sanityJustification`, `preScore` fields
- `PROMOTION_THRESHOLD` (0.60) in `types/scoring.ts` — final composite still gates against this
- `LensScore` shape in `types/scoring.ts` — sub-dimension array, total, maxPossible, normalized, confidence

</code_context>

<deferred>
## Deferred Ideas

- CLI-configurable penalty magnitudes (ADVN-01 scope — weights need Ford validation first)
- Per-dimension override capability when LLM flags specific deterministic dimensions as miscalibrated
- A/B validation of consolidated prompt vs v1.2 three-lens prompts (Phase 24 scope — VAL-01)

</deferred>

---

*Phase: 22-consolidated-llm-scorer*
*Context gathered: 2026-03-13*
