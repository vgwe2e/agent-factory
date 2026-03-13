# Technology Stack: v1.3 L4 Two-Pass Scoring Funnel

**Project:** Aera Skill Feasibility Engine v1.3
**Researched:** 2026-03-13
**Overall confidence:** HIGH (all recommendations based on direct codebase analysis; zero external dependencies added)

## Executive Assessment

**No new dependencies required.** The entire v1.3 feature set builds on existing infrastructure. The deterministic pre-scoring is pure TypeScript arithmetic over already-parsed Zod-validated fields. The consolidated LLM prompt uses the same `chatFn` + `zodToJsonSchema` + `scoreWithRetry` pipeline already proven across 3 lenses and ~500 scoring runs. Adding libraries would increase surface area with zero benefit.

## Existing Stack -- Reuse As-Is

Already validated across v1.0-v1.2 (552+ tests, 20 phases). Listed for reference -- DO NOT modify.

| Technology | Version | v1.3 Role |
|------------|---------|-----------|
| TypeScript (ESM strict) | ^5.7.0 | All new modules |
| Zod | ^3.24.0 | Validate consolidated LLM output, define `L4PreScore` shape |
| zod-to-json-schema | ^3.25.1 | Convert `PlatformFitSchema` to JSON for Ollama/vLLM `format` parameter |
| Commander | ^13.0.0 | `--top-n` flag |
| Pino | ^10.3.1 | Structured logging for funnel stats |
| Node.js built-in test runner | Node 22+ | TDD for all new scoring logic |
| `Semaphore` (in-house) | N/A | Bounded concurrency for LLM calls on survivors |
| Checkpoint system (in-house) | N/A | Resume support for LLM pass |
| `callWithResilience` (in-house) | N/A | Retry + fallback for LLM calls |

## New Modules to Create (Zero New Dependencies)

### 1. Deterministic Pre-Scorer: `scoring/l4-pre-score.ts`

**What:** Pure function mapping L4 structured fields to a 0.0-1.0 deterministic score.

**Stack pattern:** Follows `scoring/composite.ts` -- pure arithmetic, typed constants, zero I/O. Export weights as named constants matching the existing `WEIGHTS` / `MAX_SCORES` pattern in `types/scoring.ts`.

**Input fields (all already Zod-validated in `schemas/hierarchy.ts` and propagated to `SkillWithContext` via `extract-skills.ts`):**

| Field | Type | Zod Schema | Weight | Rationale |
|-------|------|------------|--------|-----------|
| `ai_suitability` | `"HIGH" \| "MEDIUM" \| "LOW" \| "NOT_APPLICABLE" \| null` | `aiSuitabilitySchema` | 0.35 | Gate signal -- only field that directly measures automation potential. NOT_APPLICABLE/null = dead end. |
| `financial_rating` | `"HIGH" \| "MEDIUM" \| "LOW"` | `financialRatingSchema` | 0.25 | Value proxy without dominating (avoids "technically dead but expensive" trap). |
| `decision_exists` | `boolean` | `l4ActivitySchema` | 0.20 | Aera-specific signal -- articulated decision = maps to Decision Intelligence pattern. |
| `impact_order` | `"FIRST" \| "SECOND"` | `impactOrderSchema` | 0.10 | Priority tiebreaker. |
| `rating_confidence` | `"HIGH" \| "MEDIUM" \| "LOW"` | `ratingConfidenceSchema` | 0.10 | Meta-confidence discount -- LOW confidence in source ratings should reduce deterministic score. |

**Scoring algorithm -- Weighted enum mapping:**

```typescript
// Pattern: enum -> numeric lookup table + weighted sum
// Matches existing WEIGHTS/MAX_SCORES pattern in types/scoring.ts

const AI_SUITABILITY_MAP: Record<string, number> = {
  HIGH: 1.0, MEDIUM: 0.6, LOW: 0.2, NOT_APPLICABLE: 0.0,
};

const FINANCIAL_RATING_MAP: Record<string, number> = {
  HIGH: 1.0, MEDIUM: 0.6, LOW: 0.2,
};

const IMPACT_ORDER_MAP: Record<string, number> = {
  FIRST: 1.0, SECOND: 0.5,
};

const CONFIDENCE_MAP: Record<string, number> = {
  HIGH: 1.0, MEDIUM: 0.7, LOW: 0.4,
};

export const L4_FIELD_WEIGHTS = {
  ai_suitability: 0.35,
  financial_rating: 0.25,
  decision_exists: 0.20,
  impact_order: 0.10,
  rating_confidence: 0.10,
} as const;
```

**Why these specific weights:**
- `ai_suitability` at 0.35: The only field measuring automation potential. An L4 with `NOT_APPLICABLE` is a dead end regardless of financial value. This mirrors how the existing v1.0-v1.2 system weighted adoption highest (0.45) -- the "can this actually be automated?" question dominates.
- `financial_rating` at 0.25: Value matters but must not dominate. The v1.0 adoption-weighted composite was explicitly designed to prevent "technically dead but expensive" skills from scoring high. Same principle applies.
- `decision_exists` at 0.20: Aera's core product is Decision Intelligence. If a decision has been articulated, the L4 maps directly to the platform's central pattern.
- `impact_order` and `rating_confidence` at 0.10 each: Tiebreakers. Not strong enough to override the primary signals.

**Why NOT reuse the existing 3-lens structure:** The 3-lens system (technical 0.30, adoption 0.45, value 0.25) requires LLM reasoning about platform fit, user adoption patterns, and simulation viability. L4 structured fields are pre-computed enums covering a strict subset. Deterministic scoring replaces LLM calls for the ~80% of L4s that are clearly low-priority.

**Null handling:** `ai_suitability` can be `null` -- treat as 0.0 (same as NOT_APPLICABLE). This is consistent with the existing `confidence.ts` which treats null ai_suitability as a LOW confidence signal.

### 2. Consolidated LLM Prompt: `scoring/prompts/platform-fit.ts`

**What:** Single prompt combining platform fit assessment + sanity check into one LLM call.

**Stack pattern:** Follows `scoring/prompts/technical.ts` -- pure function returning `ChatMessage[]`, string interpolation, archetype emphasis lookup. No templating library needed.

**Why consolidate 3 calls into 1:**
- v1.2: 826 candidates x 3 LLM calls = 2,478 calls (unsustainable)
- v1.3: ~50 survivors x 1 LLM call = 50 calls (~15 min local, ~3 min cloud)
- Platform fit is the ONLY dimension requiring LLM reasoning -- it needs domain knowledge about Aera component mappings that code cannot replicate
- Adoption and value signals are already captured by `decision_exists`, `financial_rating`, `ai_suitability` in the deterministic pre-score

**New Zod schema (add to `scoring/schemas.ts`):**

```typescript
export const PlatformFitSchema = z.object({
  platform_fit: z.object({
    score: z.number().int().min(0).max(3),
    reason: z.string(),
    components: z.array(z.string()),  // Aera components cited
  }),
  sanity_check: z.object({
    override: z.enum(["PROMOTE", "DEMOTE", "NONE"]),
    reason: z.string(),
  }),
});
```

**Why `sanity_check` in the same call:** The LLM already has full context loaded when assessing platform fit. Asking "does the deterministic score seem right?" adds ~10 output tokens and catches systematic errors (e.g., L4 scored HIGH by all fields but maps to no Aera capability). Separate call would double latency for marginal benefit.

**Prompt design notes:**
- Inject the same `knowledgeContext` (21 UI components, 22 PB nodes, capabilities) used by the existing technical prompt
- Include the L4's deterministic pre-score so the LLM can assess whether to override
- Use the same archetype emphasis patterns from `prompts/technical.ts`
- Constrain `components` array to names from the bundled knowledge base to prevent hallucination

### 3. Funnel Orchestrator: `scoring/l4-funnel.ts`

**What:** Two-pass orchestrator: deterministic pre-score all L4s, sort, take top-N, run LLM on survivors.

**Stack pattern:** Follows `scoring/scoring-pipeline.ts` -- async generator yielding results, dependency-injected `chatFn`.

**Integration points (all existing infrastructure):**

| Integration | Mechanism | Existing Code |
|-------------|-----------|---------------|
| L4 data access | `SkillWithContext` already carries L4 fields (`financialRating`, `aiSuitability`, `impactOrder`, `ratingConfidence`, `decisionExists`) | `pipeline/extract-skills.ts` |
| LLM calls | Same `chatFn` injection + `scoreWithRetry` | `scoring/lens-scorers.ts`, `scoring/ollama-client.ts` |
| Checkpoint/resume | Same `createCheckpointWriter` / `loadCheckpoint` | `infra/checkpoint.ts` |
| Concurrency | Same `Semaphore` for bounded parallel LLM calls | `infra/semaphore.ts` |
| Progress | Same `createProgressTracker` | `pipeline/progress.ts` |
| Resilience | Same `callWithResilience` + `withTimeout` | `infra/retry-policy.ts`, `infra/timeout.ts` |

### 4. CLI Extension (modify `cli.ts`)

**What:** Add `--top-n <number>` flag.

**Stack pattern:** Same as existing `--max-tier`, `--concurrency`, `--skip-sim` flags in Commander chain.

```typescript
.option('--top-n <number>', 'Number of L4 survivors for LLM scoring (default: 50)', parseInt)
```

### 5. Type Additions (extend `types/scoring.ts`)

```typescript
/** Deterministic pre-score for an L4 activity. */
export interface L4PreScore {
  l4Id: string;
  l4Name: string;
  l3Name: string;   // Retained for report grouping
  l2Name: string;
  l1Name: string;
  fieldScores: {
    ai_suitability: number;     // 0.0-1.0
    financial_rating: number;   // 0.0-1.0
    decision_exists: number;    // 0.0 or 1.0
    impact_order: number;       // 0.0-1.0
    rating_confidence: number;  // 0.0-1.0
  };
  deterministicScore: number;   // Weighted sum, 0.0-1.0
  rank: number;                 // 1-based rank after sorting
  survivedToLlm: boolean;      // true if rank <= top-N
}

/** Combined result after both passes. */
export interface L4FunnelResult {
  preScore: L4PreScore;
  llmResult?: {
    platformFit: { score: number; reason: string; components: string[] };
    sanityCheck: { override: "PROMOTE" | "DEMOTE" | "NONE"; reason: string };
  };
  finalScore: number;           // Platform fit score (0.0-1.0) for survivors
  promotedToSimulation: boolean;
}
```

## Architecture Decisions

### Decision: Deterministic Score as Gate, NOT Blend

The deterministic score is a filter (top-N survive to LLM), not a component of the final composite.

**Rationale:**
- Blending deterministic + LLM scores creates coupling where tuning field weights changes LLM-scored results unpredictably
- The existing `PROMOTION_THRESHOLD` (0.60) already gates simulation entry
- Gate pattern is simpler to debug: "why was this L4 not scored?" is answered by rank vs. top-N
- The LLM platform fit score becomes the primary quality signal for survivors, undiluted by enum arithmetic
- `sanity_check.override` allows the LLM to DEMOTE a false-positive survivor or PROMOTE a near-miss

### Decision: Do NOT Make Weights CLI-Configurable in v1.3

**Rationale:**
- Weights need validation against the Ford 826-L4 dataset before user exposure
- CLI flag explosion (5 weights + normalization constraint) creates bad UX
- Future ADVN-02 milestone already captures "Configurable scoring weights via CLI flags"
- Export as named constants (matching `WEIGHTS` pattern) for easy adjustment during development

### Decision: L4-Level Pre-Scoring, NOT Skill-Level

The deterministic pre-score operates on L4 activities (826 candidates), not individual skills within L4s.

**Rationale:**
- The structured fields (`ai_suitability`, `financial_rating`, `decision_exists`, `impact_order`, `rating_confidence`) live on the L4 activity, not on individual skills
- All skills under an L4 share the same field values (they inherit from parent)
- Pre-scoring at L4 level matches the PROJECT.md target: "826 L4 scoring candidates"
- After top-N selection, the LLM scores individual skills within surviving L4s for granularity

## NOT Adding

| Library | Why Not |
|---------|---------|
| `mathjs`, `simple-statistics` | L4 field weighting is 5 enum lookups + a weighted sum. Pure TypeScript arithmetic. |
| `convict`, `cosmiconfig` | Weight config is a typed constant object (like `WEIGHTS` in `types/scoring.ts`). No runtime config loading. |
| `handlebars`, `mustache`, `langchain` | Existing string interpolation pattern in `prompts/*.ts` is clear, testable, zero-dependency. Template engines add indirection. |
| `typebox`, `arktype` | Zod is the validated choice. Mixing schema libs creates confusion. |
| `lodash`, `ramda` | `Array.sort()` with comparator is sufficient. Already proven in `triage-pipeline.ts`. |
| `p-queue`, `p-limit` | Existing in-house `Semaphore` class handles bounded concurrency. Pre-scoring is synchronous. |

## Performance Characteristics

| Operation | Count (Ford dataset) | Expected Time | Stack Used |
|-----------|---------------------|---------------|------------|
| Parse + validate | 1 | ~200ms | Zod |
| Deterministic pre-score all L4s | 826 | <50ms total | Pure TS arithmetic |
| Sort + rank | 826 | <5ms | `Array.sort()` |
| LLM platform fit (top-50, local Ollama) | 50 | ~15 min | chatFn + scoreWithRetry |
| LLM platform fit (top-50, cloud vLLM) | 50 | ~3 min | chatFn + Semaphore |

**Total wall time reduction:** v1.2 scored 826 skills x 3 LLM calls = ~4-6 hours locally. v1.3 targets 50 x 1 LLM call = ~15 min locally. This is the primary motivation for the two-pass architecture.

## New File Map

| File | Purpose | Dependencies |
|------|---------|-------------|
| `src/scoring/l4-pre-score.ts` | Deterministic pre-score from L4 fields | None (pure arithmetic) |
| `src/scoring/prompts/platform-fit.ts` | Consolidated LLM prompt builder | None (string interpolation) |
| `src/scoring/l4-funnel.ts` | Two-pass orchestrator | Existing chatFn, scoreWithRetry, Semaphore |
| `src/scoring/schemas.ts` (modify) | Add `PlatformFitSchema` | Existing Zod + zod-to-json-schema |
| `src/types/scoring.ts` (modify) | Add `L4PreScore`, `L4FunnelResult` types | None |
| `src/pipeline/pipeline-runner.ts` (modify) | Wire funnel into pipeline | Existing infrastructure |
| `src/cli.ts` (modify) | Add `--top-n` flag | Existing Commander |

## Installation

```bash
# No new packages needed
cd src
npm install  # Existing deps only
```

## Sources

- **Codebase analysis** (HIGH confidence): `src/scoring/composite.ts`, `src/scoring/confidence.ts`, `src/scoring/lens-scorers.ts`, `src/scoring/schemas.ts`, `src/scoring/prompts/technical.ts`, `src/types/scoring.ts`, `src/types/hierarchy.ts`, `src/schemas/hierarchy.ts`, `src/pipeline/extract-skills.ts`, `src/pipeline/pipeline-runner.ts`, `src/triage/triage-pipeline.ts`
- **L4 field definitions** (HIGH confidence): `schemas/hierarchy.ts` lines 148-164 -- Zod schema is the source of truth
- **Existing weighting pattern** (HIGH confidence): `types/scoring.ts` `WEIGHTS` constant -- shipped in v1.0, validated across 3 milestones
- **Ford dataset dimensions** (HIGH confidence): PROJECT.md -- "826 L4 scoring candidates"
- **Performance estimates** (MEDIUM confidence): Extrapolated from v1.2 cloud run timing -- single-call consolidation is untested
