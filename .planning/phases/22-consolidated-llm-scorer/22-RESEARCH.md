# Phase 22: Consolidated LLM Scorer - Research

**Researched:** 2026-03-13
**Domain:** LLM prompt engineering, Zod schema design, composite scoring blending
**Confidence:** HIGH

## Summary

Phase 22 replaces the v1.2 three-lens LLM scoring (3 calls per skill) with a single consolidated LLM call per top-N survivor from Phase 21. The call assesses platform fit (0-3 with Aera component citations) and sanity-checks the deterministic pre-score (AGREE/DISAGREE/PARTIAL). This is a well-scoped internal refactor: all infrastructure (ChatFn, scoreWithRetry, schema-translator, knowledge-context, backend-factory) already exists. The work is primarily: (1) new Zod schema for consolidated output, (2) new prompt builder, (3) new scorer function that synthesizes results into LensScore shape, (4) composite blending logic.

The codebase is mature with clear patterns. The three v1.2 prompt builders (technical.ts v3.0, adoption.ts v3.0, value.ts v3.0) serve as structural templates. The `scoreWithRetry<T>` generic in `ollama-client.ts` handles retry with Zod validation. The `schema-translator.ts` handles Ollama-to-vLLM format conversion. All of these are reused directly -- no new infrastructure needed.

**Primary recommendation:** Build `scoring/prompts/consolidated.ts` (pure prompt builder), `scoring/schemas.ts` additions (consolidated Zod schema + JSON schema), and `scoring/consolidated-scorer.ts` (scorer function + LensScore synthesis + composite blending) as three focused modules following established patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- DISAGREE verdict applies a -0.15 penalty to the final composite score
- PARTIAL verdict applies half penalty (-0.075)
- AGREE verdict applies no adjustment
- Penalties are hardcoded constants (DISAGREE_PENALTY = 0.15, PARTIAL_PENALTY = 0.075) -- not CLI-configurable per ADVN-01 deferral
- LLM sanity check justification text is preserved in scoring output for human review in reports
- Technical lens = platform_fit score from LLM (0-3) as the sole sub-dimension. Max score becomes 3 (not 9)
- Adoption and value lenses populated from deterministic dimensions scaled to 0-3 range
- New optional fields added to ScoringResult: `sanityVerdict`, `sanityJustification`, `preScore`. Backward compatible.
- Consolidated prompt built to /audit-prompt spec (4-layer structure, worked examples, negative constraints, confidence calibration, rubric anchoring)
- Use existing v1.2 prompts as structural templates
- Include 2-3 worked examples showing expected JSON for platform fit levels 1, 2, and 3
- Structured per-dimension sanity check: prompt lists each deterministic dimension and asks LLM to flag miscalibrated ones
- Carry forward existing negative constraints from v1.2 technical.ts and add consolidated-specific constraints

### Claude's Discretion
- Composite blending formula (how pre-score weight and LLM weight combine before penalty)
- Exact scaling math for deterministic 0-1 dimensions to 0-3 LensScore sub-dimension scores
- Prompt wording and rubric details beyond structural decisions above
- Zod schema field naming for the consolidated LLM response

### Deferred Ideas (OUT OF SCOPE)
- CLI-configurable penalty magnitudes (ADVN-01 scope -- weights need Ford validation first)
- Per-dimension override capability when LLM flags specific deterministic dimensions as miscalibrated
- A/B validation of consolidated prompt vs v1.2 three-lens prompts (Phase 24 scope -- VAL-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LLM-01 | Single consolidated LLM call per survivor covering platform fit + sanity check | New `scoreConsolidated()` function using existing `scoreWithRetry` + `ChatFn` pattern. One call replaces three. |
| LLM-02 | Platform fit scored 0-3 with specific Aera component citations from knowledge base | Prompt includes full `knowledgeContext` string (capabilities, components, PB nodes) exactly as v1.2 technical prompt does. Rubric requires citations at score >= 2. |
| LLM-03 | Sanity check evaluates pre-score (AGREE/DISAGREE/PARTIAL) with justification | Zod schema includes `sanity_verdict` enum and `sanity_justification` string. Prompt lists all 6 deterministic dimensions with their scores. |
| LLM-04 | Structured JSON validated by Zod, with scoreWithRetry for failures | Reuse `scoreWithRetry<ConsolidatedLensOutput>` directly. New Zod schema + JSON schema for format parameter. schema-translator handles vLLM conversion. |
| LLM-05 | LLM prompt includes deterministic score breakdown for targeted sanity checking | User message includes all 6 dimension scores (financial_signal, ai_suitability, decision_density, impact_order, rating_confidence, archetype_completeness) plus their composite. |
| LLM-06 | Final composite blends pre-score + LLM output, feeds into PROMOTION_THRESHOLD (0.60) gate | New `computeTwoPassComposite()` blends deterministic composite with LLM platform_fit normalized score, applies sanity penalty, gates at 0.60. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^3.24.0 | Schema validation for consolidated LLM response | Already used for all 3 lens schemas. `scoreWithRetry<T>` takes ZodSchema<T>. |
| zod-to-json-schema | ^3.25.1 | Convert Zod schema to JSON schema for Ollama format param | Already used in `schemas.ts`. Same pattern for consolidated schema. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:test | built-in | Test runner | All test files co-located as `*.test.ts` |
| node:assert/strict | built-in | Assertions | TDD approach per project conventions |

No new dependencies needed. Everything builds on existing libraries.

## Architecture Patterns

### Recommended Project Structure
```
src/scoring/
├── prompts/
│   ├── technical.ts          # (existing) template reference
│   ├── adoption.ts           # (existing) template reference
│   ├── value.ts              # (existing) template reference
│   └── consolidated.ts       # NEW: consolidated prompt builder
├── schemas.ts                # EXTEND: add ConsolidatedLensSchema + JSON schema
├── consolidated-scorer.ts    # NEW: scorer + LensScore synthesis + composite blend
├── consolidated-scorer.test.ts  # NEW: tests
├── ollama-client.ts          # (existing) scoreWithRetry reused directly
├── lens-scorers.ts           # (existing) NOT modified -- v1.2 path preserved
├── composite.ts              # (existing) NOT modified -- v1.2 path preserved
└── knowledge-context.ts      # (existing) reused directly
src/types/
└── scoring.ts                # EXTEND: add optional sanityVerdict, sanityJustification, preScore to ScoringResult
```

### Pattern 1: Pure Prompt Builder (no I/O)
**What:** Function takes typed inputs, returns `ChatMessage[]` (system + user). No fetch, no side effects.
**When to use:** All prompt construction. Established by `buildTechnicalPrompt()`, `buildAdoptionPrompt()`, `buildValuePrompt()`.
**Example:**
```typescript
// Source: existing pattern from scoring/prompts/technical.ts
export function buildConsolidatedPrompt(
  skill: SkillWithContext,
  knowledgeContext: string,
  preScore: PreScoreResult,
): ChatMessage[] {
  // system message: role, rubric, worked examples, constraints, calibration
  // user message: skill data + full deterministic score breakdown
  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
```

### Pattern 2: scoreWithRetry + ChatFn Injection
**What:** Generic retry with Zod validation. ChatFn injected for testability (defaults to ollamaChat).
**When to use:** Every LLM scoring call. Established pattern in all three lens scorers.
**Example:**
```typescript
// Source: existing pattern from scoring/lens-scorers.ts
const result = await scoreWithRetry(
  ConsolidatedLensSchema,
  async () => {
    const chatResult = await chatFn(messages, consolidatedJsonSchema);
    if (!chatResult.success) throw new Error(chatResult.error);
    return chatResult.content;
  },
  2, // maxRetries
);
```

### Pattern 3: LensScore Synthesis from Mixed Sources
**What:** Build LensScore objects from a mix of LLM output (technical lens) and deterministic scores (adoption, value lenses).
**When to use:** Phase 22 consolidated path only. v1.2 three-lens path unchanged.
**Example:**
```typescript
// Technical lens: single sub-dimension from LLM
const technical: LensScore = {
  lens: "technical",
  subDimensions: [{ name: "platform_fit", score: llmOutput.platform_fit.score, reason: llmOutput.platform_fit.reason }],
  total: llmOutput.platform_fit.score,
  maxPossible: 3,  // single sub-dimension, max 3
  normalized: llmOutput.platform_fit.score / 3,
  confidence: "MEDIUM", // or computed from data signals
};

// Adoption lens: deterministic dimensions scaled 0-1 -> 0-3
const adoptionSubDims = [
  { name: "financial_signal", score: Math.round(preScore.dimensions.financial_signal * 3), reason: "From deterministic scoring" },
  { name: "decision_density", score: Math.round(preScore.dimensions.decision_density * 3), reason: "From deterministic scoring" },
  // ... etc
];
```

### Pattern 4: Result Type Union (never-throw)
**What:** All functions return `{ success: true; data: T } | { success: false; error: string }`. No exceptions.
**When to use:** All LLM client interactions, all scorer functions.

### Anti-Patterns to Avoid
- **Modifying existing lens scorers:** v1.2 three-lens path must remain intact for PIPE-02 (scoring mode flag in Phase 23). The consolidated scorer is a NEW module alongside the existing ones.
- **Breaking LensScore shape:** Report formatters depend on `LensScore.subDimensions`, `total`, `maxPossible`, `normalized`, `confidence`. The consolidated path must produce the same shape with valid values.
- **Coupling prompt to scoring logic:** Keep `buildConsolidatedPrompt()` pure (no fetch, no scoring math). Keep `scoreConsolidated()` as the orchestrator that calls the prompt builder then the LLM.
- **Hardcoding model assumptions in prompt:** Use `knowledgeContext` string exactly as v1.2 does -- the knowledge modules handle data formatting.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema for LLM format param | Manual JSON schema object | `zodToJsonSchema(ConsolidatedLensSchema)` | Keeps Zod schema as single source of truth. Already used for 3 lens schemas. |
| Retry with validation | Custom retry loop | `scoreWithRetry<T>(schema, callFn, maxRetries, logger)` | Handles JSON parse, Zod validation, exponential backoff, timeout/connection detection. Battle-tested. |
| Ollama-to-vLLM format translation | Custom format converter | `translateToResponseFormat()` from `schema-translator.ts` | Strips $schema, resolves $ref, validates compatibility. Already handles edge cases. |
| Knowledge context string | Inline Aera component lists | `buildKnowledgeContext()` from `scoring/knowledge-context.ts` | Produces correctly formatted capabilities, components, PB nodes strings. |
| Confidence computation | Custom confidence logic | Reuse algorithmic confidence pattern from `confidence.ts` | Confidence derived from data signals, not LLM self-assessment. |

## Common Pitfalls

### Pitfall 1: Zod Schema / JSON Schema Mismatch
**What goes wrong:** Zod schema validates fine but JSON schema for Ollama format parameter produces unexpected structure (e.g., $ref not resolved, additionalProperties causing vLLM rejection).
**Why it happens:** `zodToJsonSchema` generates `$ref` for repeated shapes (like SubDimensionShape). vLLM xgrammar rejects `$ref`.
**How to avoid:** Use `zodToJsonSchema(schema, { $refStrategy: "none" })` for vLLM path. Run `validateScoringSchemas()` pre-flight. Add the new consolidated schema to the validation function.
**Warning signs:** Tests pass with mock chatFn but fail with real vLLM backend.

### Pitfall 2: MAX_SCORES Constant Mismatch
**What goes wrong:** `computeComposite()` uses `MAX_SCORES.technical = 9` (3 sub-dimensions * 3), but consolidated technical lens has `maxPossible = 3` (single platform_fit sub-dimension).
**Why it happens:** v1.2 composite assumes old max scores.
**How to avoid:** Phase 22 needs its own composite function (`computeTwoPassComposite`) that uses the correct maxPossible values (technical: 3, adoption: computed from deterministic scaling, value: computed from deterministic scaling). Do NOT modify `MAX_SCORES` or `computeComposite` -- v1.2 path uses them.
**Warning signs:** Composite scores wildly different from expected ranges.

### Pitfall 3: Deterministic 0-1 to 0-3 Scaling Rounding
**What goes wrong:** Naive `Math.round(dim * 3)` produces 0, 1, 2, 3 but with clumping. E.g., 0.4 * 3 = 1.2 -> 1, 0.5 * 3 = 1.5 -> 2 (standard rounding). This creates score jumps at unexpected boundaries.
**Why it happens:** Deterministic dimensions are continuous 0-1 floats; LensScore sub-dimensions are 0-3 integers.
**How to avoid:** Use consistent rounding: `Math.min(3, Math.round(dim * 3))` with explicit boundary documentation. Alternatively, keep deterministic dimensions as normalized floats in the composite calculation and only convert to integer sub-dimensions for display in LensScore.
**Warning signs:** Sub-dimension scores not matching intuitive expectations from raw dimension values.

### Pitfall 4: Sanity Penalty Exceeding Composite Range
**What goes wrong:** A -0.15 penalty on a composite near 0.60 drops it below threshold, but on a composite near 0.0 it goes negative.
**Why it happens:** Penalty is absolute, not relative.
**How to avoid:** Clamp final composite to [0, 1] range: `Math.max(0, Math.min(1, composite - penalty))`.
**Warning signs:** Negative composite scores in output.

### Pitfall 5: Prompt Token Budget
**What goes wrong:** Consolidated prompt is much larger than individual lens prompts because it includes: full knowledge context (capabilities, components, PB nodes), all 6 deterministic dimension scores with context, platform fit rubric, sanity check instructions, 2-3 worked examples, and negative constraints.
**Why it happens:** Combining three lenses + new sanity check into one prompt.
**How to avoid:** Keep worked examples concise (3-5 lines of JSON each). Reuse the existing condensed knowledge context format. The v1.2 technical prompt already includes the full knowledge context and works fine with both Ollama (qwen3:30b) and vLLM (Qwen2.5-32B). Estimate: consolidated prompt ~2500-3500 tokens system + ~500 tokens user. Well within model limits.
**Warning signs:** Timeouts on local Ollama (25min limit) or vLLM (5min limit) for simple candidates.

### Pitfall 6: ScoringResult Backward Compatibility
**What goes wrong:** Adding required fields to ScoringResult breaks v1.2 checkpoint loading and report formatters.
**Why it happens:** v1.2 ScoringResult objects in existing checkpoints won't have `sanityVerdict`, `sanityJustification`, `preScore`.
**How to avoid:** Make all new fields optional (`sanityVerdict?: ...`). Report formatters check for presence before using. CONTEXT.md already specifies backward compatibility.
**Warning signs:** Type errors in existing report formatters or checkpoint loading.

## Code Examples

### Consolidated Zod Schema
```typescript
// Source: pattern from scoring/schemas.ts
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const SubDimensionShape = z.object({
  score: z.number().int().min(0).max(3),
  reason: z.string(),
});

const SanityVerdictEnum = z.enum(["AGREE", "DISAGREE", "PARTIAL"]);

export const ConsolidatedLensSchema = z.object({
  platform_fit: SubDimensionShape,
  sanity_verdict: SanityVerdictEnum,
  sanity_justification: z.string(),
  flagged_dimensions: z.array(z.string()).optional(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export type ConsolidatedLensOutput = z.infer<typeof ConsolidatedLensSchema>;

export const consolidatedJsonSchema = zodToJsonSchema(
  ConsolidatedLensSchema as never,
) as Record<string, unknown>;
```

### ScoringResult Type Extension
```typescript
// Source: types/scoring.ts -- additions only
export type SanityVerdict = "AGREE" | "DISAGREE" | "PARTIAL";

export interface ScoringResult {
  // ... all existing fields unchanged ...

  /** v1.3: Sanity check verdict from consolidated LLM scorer. Absent in v1.2 results. */
  sanityVerdict?: SanityVerdict;
  /** v1.3: Sanity check justification text. Absent in v1.2 results. */
  sanityJustification?: string;
  /** v1.3: Deterministic pre-score composite (0-1). Absent in v1.2 results. */
  preScore?: number;
}
```

### Two-Pass Composite Blending
```typescript
// Source: Claude's discretion -- recommended formula

// Constants
const DISAGREE_PENALTY = 0.15;
const PARTIAL_PENALTY = 0.075;
const PRE_SCORE_WEIGHT = 0.50;
const LLM_WEIGHT = 0.50;

export function computeTwoPassComposite(
  preScoreComposite: number,         // 0-1 from deterministic
  platformFitNormalized: number,      // 0-1 (LLM score / 3)
  sanityVerdict: SanityVerdict,
): { composite: number; promotedToSimulation: boolean } {
  // Step 1: Blend pre-score and LLM platform fit
  const blended = (preScoreComposite * PRE_SCORE_WEIGHT) + (platformFitNormalized * LLM_WEIGHT);

  // Step 2: Apply sanity penalty
  const penalty = sanityVerdict === "DISAGREE" ? DISAGREE_PENALTY
    : sanityVerdict === "PARTIAL" ? PARTIAL_PENALTY
    : 0;

  const composite = Math.max(0, Math.min(1, blended - penalty));

  return {
    composite,
    promotedToSimulation: composite >= PROMOTION_THRESHOLD,
  };
}
```

### Deterministic Dimension to LensScore Sub-dimension Scaling
```typescript
// Source: Claude's discretion -- recommended approach

/**
 * Scale a deterministic 0-1 dimension score to a 0-3 integer sub-dimension.
 * Uses floor-based bucketing for predictable behavior:
 * - 0.00-0.24 -> 0
 * - 0.25-0.49 -> 1
 * - 0.50-0.74 -> 2
 * - 0.75-1.00 -> 3
 */
function scaleTo03(value: number): number {
  if (value >= 0.75) return 3;
  if (value >= 0.50) return 2;
  if (value >= 0.25) return 1;
  return 0;
}
```

### Adoption Lens from Deterministic Dimensions
```typescript
// Adoption lens: deterministic dimensions that map to adoption realism
// financial_signal -> financial_gravity equivalent
// decision_density -> decision_density equivalent
// impact_order -> impact_proximity equivalent
// rating_confidence -> confidence_signal equivalent
function buildAdoptionLensFromDeterministic(preScore: PreScoreResult): LensScore {
  const subDims: SubDimensionScore[] = [
    { name: "financial_signal", score: scaleTo03(preScore.dimensions.financial_signal), reason: "Deterministic: from financial_rating and max_value" },
    { name: "decision_density", score: scaleTo03(preScore.dimensions.decision_density), reason: "Deterministic: from decision_exists, actions, constraints" },
    { name: "impact_order", score: scaleTo03(preScore.dimensions.impact_order), reason: "Deterministic: from impact_order field" },
    { name: "rating_confidence", score: scaleTo03(preScore.dimensions.rating_confidence), reason: "Deterministic: from rating_confidence field" },
  ];
  const total = subDims.reduce((s, d) => s + d.score, 0);
  const maxPossible = 12; // 4 sub-dims * 3
  return {
    lens: "adoption",
    subDimensions: subDims,
    total,
    maxPossible,
    normalized: total / maxPossible,
    confidence: "HIGH", // deterministic = fully reproducible
  };
}
```

### Value Lens from Deterministic Dimensions
```typescript
// Value lens: deterministic dimensions that map to value & efficiency
// financial_signal -> value_density equivalent
// archetype_completeness -> simulation_viability equivalent (rich archetype = simulatable)
function buildValueLensFromDeterministic(preScore: PreScoreResult): LensScore {
  const subDims: SubDimensionScore[] = [
    { name: "value_density", score: scaleTo03(preScore.dimensions.financial_signal), reason: "Deterministic: from financial_rating and max_value" },
    { name: "simulation_viability", score: scaleTo03(preScore.dimensions.archetype_completeness), reason: "Deterministic: from archetype field richness" },
  ];
  const total = subDims.reduce((s, d) => s + d.score, 0);
  const maxPossible = 6; // 2 sub-dims * 3
  return {
    lens: "value",
    subDimensions: subDims,
    total,
    maxPossible,
    normalized: total / maxPossible,
    confidence: "HIGH",
  };
}
```

### Consolidated Scorer Function Signature
```typescript
// Source: pattern from scoring/lens-scorers.ts + scoring/scoring-pipeline.ts
export async function scoreConsolidated(
  skill: SkillWithContext,
  knowledgeContext: string,
  preScore: PreScoreResult,
  chatFn: ChatFn,
): Promise<ConsolidatedScorerResult> {
  // 1. Build prompt: buildConsolidatedPrompt(skill, knowledgeContext, preScore)
  // 2. Call LLM: scoreWithRetry(ConsolidatedLensSchema, callFn, 2)
  // 3. Build technical LensScore from LLM platform_fit
  // 4. Build adoption LensScore from deterministic dimensions
  // 5. Build value LensScore from deterministic dimensions
  // 6. Compute two-pass composite with sanity penalty
  // 7. Return ScoringResult with optional v1.3 fields populated
}
```

## State of the Art

| Old Approach (v1.2) | Current Approach (v1.3 Phase 22) | Impact |
|---------------------|----------------------------------|--------|
| 3 LLM calls per skill (tech + adoption + value) | 1 consolidated LLM call per top-N survivor | ~50 calls instead of 2,478+ for Ford dataset |
| LLM scores all dimensions from scratch | LLM scores only platform_fit (requires domain reasoning) + sanity-checks deterministic | LLM focused on what it does best |
| Skills as scoring unit | L4 activities as scoring unit (Phase 21) | Fewer, higher-quality candidates |
| No pre-filtering | Deterministic pre-score + top-N filter (Phase 21) | Massive cost/time reduction |

## Open Questions

1. **Composite blending weights (50/50 pre-score vs LLM)**
   - What we know: Pre-score is deterministic and fast; LLM adds platform fit judgment. Both contribute meaningfully.
   - What's unclear: Whether 50/50 is optimal or if LLM platform fit should have higher weight (it's the only dimension requiring domain reasoning).
   - Recommendation: Start with 50/50, document as tunable constant. Phase 24 validation (VAL-01) will reveal if adjustment needed.

2. **Adoption/value dimension-to-subdimension mapping**
   - What we know: CONTEXT.md says "deterministic dimensions scaled to 0-3 range" for adoption and value lenses.
   - What's unclear: Exact mapping of 6 deterministic dimensions to adoption (4 sub-dims) and value (2 sub-dims).
   - Recommendation: financial_signal + decision_density + impact_order + rating_confidence -> adoption; financial_signal + archetype_completeness -> value. This mirrors the v1.2 sub-dimension semantics most closely.

3. **schema-translator validation for consolidated schema**
   - What we know: `validateScoringSchemas()` currently checks only the 3 existing lens schemas.
   - What's unclear: Whether the consolidated schema (with enum field, optional array) will pass vLLM xgrammar validation.
   - Recommendation: Add consolidated schema to `validateScoringSchemas()` during implementation. Test with both backends.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None -- uses `node --test` directly |
| Quick run command | `npx tsx --test src/scoring/consolidated-scorer.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LLM-01 | Single consolidated LLM call per survivor | unit | `npx tsx --test src/scoring/consolidated-scorer.test.ts` | Wave 0 |
| LLM-02 | Platform fit 0-3 with Aera citations | unit | `npx tsx --test src/scoring/consolidated-scorer.test.ts` | Wave 0 |
| LLM-03 | Sanity check AGREE/DISAGREE/PARTIAL | unit | `npx tsx --test src/scoring/consolidated-scorer.test.ts` | Wave 0 |
| LLM-04 | Zod validation + scoreWithRetry | unit | `npx tsx --test src/scoring/consolidated-scorer.test.ts` | Wave 0 |
| LLM-05 | Prompt includes deterministic breakdown | unit | `npx tsx --test src/scoring/prompts/consolidated.test.ts` | Wave 0 |
| LLM-06 | Two-pass composite blending + threshold gate | unit | `npx tsx --test src/scoring/consolidated-scorer.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsx --test src/scoring/consolidated-scorer.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/scoring/consolidated-scorer.test.ts` -- covers LLM-01, LLM-02, LLM-03, LLM-04, LLM-06
- [ ] `src/scoring/prompts/consolidated.test.ts` -- covers LLM-05 (prompt content verification)
- [ ] Schema addition to `schemas.ts` -- ConsolidatedLensSchema + JSON schema export
- [ ] Type additions to `types/scoring.ts` -- SanityVerdict type, optional ScoringResult fields

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `scoring/ollama-client.ts`, `scoring/lens-scorers.ts`, `scoring/scoring-pipeline.ts`, `scoring/schemas.ts`, `scoring/schema-translator.ts`, `scoring/composite.ts`, `scoring/confidence.ts`, `scoring/knowledge-context.ts`
- Direct codebase inspection: `scoring/prompts/technical.ts` (v3.0), `scoring/prompts/adoption.ts` (v3.0), `scoring/prompts/value.ts` (v3.0)
- Direct codebase inspection: `types/scoring.ts`, `types/hierarchy.ts`
- Direct codebase inspection: `scoring/deterministic/pre-scorer.ts` (Phase 21 output)
- Direct codebase inspection: `infra/backend-factory.ts`, `scoring/vllm-client.ts`

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions (user-locked constraints on penalties, output shape, prompt structure)
- REQUIREMENTS.md (LLM-01 through LLM-06 specifications)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- all patterns directly observed in existing codebase, new modules follow exact same structure
- Pitfalls: HIGH -- identified from direct code inspection of schema translation, composite calculation, and type system

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable internal codebase, no external dependency concerns)
