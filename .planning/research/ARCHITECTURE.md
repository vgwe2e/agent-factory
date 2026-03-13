# Architecture Patterns

**Domain:** L4 Two-Pass Scoring Funnel for Aera Skill Feasibility Engine
**Researched:** 2026-03-13

## Recommended Architecture

### High-Level Data Flow (v1.3)

```
CLI -> parse-export -> extractScoringSkills -> DETERMINISTIC PRE-SCORE (new)
  -> TOP-N FILTER (new) -> CONSOLIDATED LLM SCORE (new, 1 call per survivor)
  -> COMPOSITE + PROMOTION GATE (modified) -> simulation (modified) -> reports
```

The new pipeline inserts three components between skill extraction and simulation, replacing the existing triage+scoring path. The existing triage pipeline (`triageOpportunities`) is retired as a scoring gate -- its red-flag detection is absorbed into deterministic pre-scoring, and tier assignment is replaced by continuous rank ordering.

### Component Boundaries

| Component | Status | Responsibility | Communicates With |
|-----------|--------|---------------|-------------------|
| `scoring/deterministic-scorer.ts` | **NEW** | Score L4 activities from structured fields only (no LLM) | Receives `SkillWithContext[]`, produces `DeterministicScore[]` |
| `scoring/deterministic-signals.ts` | **NEW** | Individual signal extractors (pure functions) | Called by deterministic-scorer |
| `pipeline/top-n-filter.ts` | **NEW** | Rank by deterministic score, select top N | Receives `DeterministicScore[]`, produces `DeterministicScore[]` (survivors) |
| `scoring/consolidated-scorer.ts` | **NEW** | Single LLM call per survivor: platform fit + sanity check | Receives `SkillWithContext`, `DeterministicScore`, produces `ConsolidatedLlmResult` |
| `scoring/prompts/consolidated.ts` | **NEW** | Prompt builder for consolidated LLM call | Called by consolidated-scorer |
| `scoring/schemas.ts` | **MODIFIED** | Add `ConsolidatedLensSchema` + JSON schema | Consumed by consolidated-scorer |
| `scoring/composite.ts` | **MODIFIED** | Add `computeHybridComposite` alongside existing `computeComposite` | Now accepts `DeterministicScore` + `ConsolidatedLlmResult` |
| `types/scoring.ts` | **MODIFIED** | New types: `DeterministicScore`, `ConsolidatedLlmResult`, extended `ScoringResult` | Used everywhere |
| `pipeline/pipeline-runner.ts` | **MODIFIED** | Orchestrate new two-pass flow with `--scoring-mode` branch | Calls all new + modified components |
| `pipeline/scoring-to-simulation.ts` | **MODIFIED** | Accept L4-level survivors directly (not L3 rollup) | Receives `ScoringResult[]`, produces `SimulationInput[]` |
| `cli.ts` | **MODIFIED** | Add `--top-n` and `--scoring-mode` flags | Passes to pipeline runner |
| `triage/triage-pipeline.ts` | **DEPRECATED for scoring gate** | Red flags folded into deterministic signals; may remain for report annotations | No longer called in v1.3 scoring path |

### Existing Components That Do NOT Change

| Component | Why Unchanged |
|-----------|--------------|
| `ingestion/parse-export.ts` | Input format unchanged |
| `schemas/hierarchy.ts` | L4 schema unchanged |
| `pipeline/extract-skills.ts` | Already extracts `SkillWithContext[]` from hierarchy -- perfect input for deterministic scorer |
| `infra/checkpoint.ts` | Checkpoint per-skill pattern still works (keys by skillId) |
| `infra/semaphore.ts` | Still needed for concurrent LLM calls on survivors |
| `infra/backend-factory.ts` | Backend selection (ollama/vllm) unchanged |
| `infra/retry-policy.ts` | callWithResilience wraps LLM calls identically |
| `simulation/simulation-pipeline.ts` | Receives `SimulationInput[]`, internal logic unchanged |
| `output/` formatters | Consume `ScoringResult[]` which retains same shape via lens synthesis |
| `scoring/ollama-client.ts` | ollamaChat remains default ChatFn for local path |
| `scoring/confidence.ts` | Existing confidence functions reused by deterministic scorer |

---

## New Component Specifications

### 1. Deterministic Scorer (`scoring/deterministic-scorer.ts`)

**What:** Pure-function scorer that extracts numeric signals from L4 structured fields. Runs in milliseconds across all 826 candidates. No LLM, no network, no async.

**Input:** `SkillWithContext` (already available from `extractScoringSkills`)

**Output:**
```typescript
interface DeterministicScore {
  skillId: string;
  skillName: string;
  l4Name: string;
  l3Name: string;
  l2Name: string;
  l1Name: string;
  archetype: LeadArchetype;

  /** Individual signal scores, each 0.0-1.0 */
  signals: {
    financialSignal: number;     // from financial_rating + max_value
    aiSuitabilitySignal: number; // from ai_suitability enum
    dataReadiness: number;       // from execution.target_systems, constraints
    decisionClarity: number;     // from decision_exists, decision_articulation
    impactSignal: number;        // from impact_order + savings_type
    specCompleteness: number;    // from problem_statement, actions, execution field presence
    archetypeSignal: number;     // from archetype + aera_skill_pattern presence
  };

  /** Weighted composite of all signals, 0.0-1.0 */
  deterministicComposite: number;

  /** Algorithmic confidence from existing confidence functions */
  confidence: ConfidenceLevel;
}
```

**Signal design rationale:** Each signal maps directly to fields already present on `SkillWithContext`. The existing `confidence.ts` functions (`computeSkillTechnicalConfidence`, etc.) already demonstrate the pattern of deriving algorithmic assessments from these same fields. The deterministic scorer generalizes this into continuous 0-1 scores rather than HIGH/MEDIUM/LOW buckets.

**Signal weight suggestion (tunable):**
| Signal | Weight | Rationale |
|--------|--------|-----------|
| financialSignal | 0.20 | Value drives business case |
| aiSuitabilitySignal | 0.20 | Expert-assigned automation fit |
| dataReadiness | 0.15 | Integration feasibility |
| decisionClarity | 0.15 | Adoption prerequisite |
| impactSignal | 0.10 | First-order > second-order |
| specCompleteness | 0.10 | Richer spec = better LLM assessment |
| archetypeSignal | 0.10 | Known pattern = lower risk |

**Absorbs from triage:** The existing red flags (DEAD_ZONE, PHANTOM, NO_STAKES, CONFIDENCE_GAP, ORPHAN) become zero or near-zero deterministic signals rather than discrete skip/demote actions:
- DEAD_ZONE: `decisionClarity = 0`
- NO_STAKES: `financialSignal = 0 + impactSignal = 0`
- PHANTOM: Does not apply at skill level (L3-only concept)
- CONFIDENCE_GAP: Low `specCompleteness`
- ORPHAN: Low `specCompleteness` (single L4 with sparse fields)

No separate skip/demote logic needed -- these naturally rank to the bottom of the ordered list and get eliminated by the top-N filter.

### 2. Signal Extractors (`scoring/deterministic-signals.ts`)

**What:** Pure functions, one per signal. Each takes `SkillWithContext` and returns `number` (0.0-1.0). Individually testable with no mocking needed.

```typescript
export function computeFinancialSignal(skill: SkillWithContext): number;
export function computeAiSuitabilitySignal(skill: SkillWithContext): number;
export function computeDataReadiness(skill: SkillWithContext): number;
export function computeDecisionClarity(skill: SkillWithContext): number;
export function computeImpactSignal(skill: SkillWithContext): number;
export function computeSpecCompleteness(skill: SkillWithContext): number;
export function computeArchetypeSignal(skill: SkillWithContext): number;
```

**Pattern:** Follows the exact same pattern as `confidence.ts` -- pure functions operating on structured data with no external dependencies. Each function is 5-15 lines of field inspection and normalization.

**Example implementation:**
```typescript
export function computeFinancialSignal(skill: SkillWithContext): number {
  let score = 0;
  if (skill.financialRating === "HIGH") score += 0.5;
  else if (skill.financialRating === "MEDIUM") score += 0.25;
  // max_value normalization against TIER1_VALUE_THRESHOLD
  if (skill.max_value > 5_000_000) score += 0.5;
  else if (skill.max_value > 1_000_000) score += 0.3;
  else if (skill.max_value > 0) score += 0.1;
  return Math.min(score, 1.0);
}
```

### 3. Top-N Filter (`pipeline/top-n-filter.ts`)

**What:** Ranks `DeterministicScore[]` by `deterministicComposite` descending, returns top N. Pure function.

```typescript
interface TopNFilterResult {
  survivors: DeterministicScore[];
  eliminated: DeterministicScore[];
  cutoffScore: number;   // the score at the N-th position
  totalCandidates: number;
}

export function filterTopN(
  scores: DeterministicScore[],
  topN: number,
): TopNFilterResult;
```

**CLI integration:** New `--top-n` flag on Commander CLI. Default 50 for Ford's 826 candidates (~6% pass rate). Tunable per run based on budget and exploration needs.

**Why a separate module:** Keeps the gate logic isolated and testable. The pipeline runner calls `filterTopN` and logs the cutoff score + elimination count for transparency and tuning.

### 4. Consolidated LLM Scorer (`scoring/consolidated-scorer.ts`)

**What:** Single LLM call per survivor that assesses platform fit and sanity-checks the deterministic score. Replaces the 3 separate lens calls (`scoreTechnical`, `scoreAdoption`, `scoreValue`).

**Input:** `SkillWithContext` + `DeterministicScore` (so the LLM sees both the raw data and the algorithmic assessment)

**Output:**
```typescript
interface ConsolidatedLlmResult {
  platformFit: {
    score: number;         // 0-3: how well this maps to Aera components
    components: string[];  // suggested Aera components
    reason: string;
  };
  sanityCheck: {
    agreement: "AGREE" | "DISAGREE" | "PARTIAL";
    adjustedComposite?: number;  // only if DISAGREE, LLM's suggested score
    reason: string;
  };
}
```

**Why one call instead of three:**
- v1.2: 3 LLM calls x 826 candidates = 2,478 calls. Unsustainable at scale.
- v1.3: 1 LLM call x 50 survivors = 50 calls. ~50x reduction.
- Platform fit requires domain knowledge (Aera components) that code cannot assess deterministically.
- Sanity check catches cases where deterministic signals are misleading (e.g., well-specified activity that is actually a duplicate or organizationally blocked).

**Knowledge context injection:** The `buildKnowledgeContext()` output (components, process builder, capabilities) is still injected into the consolidated prompt, same as the current technical prompt uses it. This is the primary value of the LLM call -- matching skill descriptions to Aera platform capabilities.

**ChatFn injection:** Follows existing pattern. `scoreOneConsolidated(skill, detScore, knowledgeContext, chatFn)` accepts `chatFn` as parameter, defaulting to `ollamaChat`. Works identically with vllm backend.

### 5. Updated Composite (`scoring/composite.ts`)

**Modified to merge two score sources. Existing `computeComposite` preserved for backward compatibility.**

```typescript
export function computeHybridComposite(
  deterministic: DeterministicScore,
  llm: ConsolidatedLlmResult,
): CompositeResult;
```

**Merge strategy:**
- Base: `deterministicComposite` (0.0-1.0)
- LLM platform fit normalized: `platformFit.score / 3` (0.0-1.0)
- If `sanityCheck.agreement === "AGREE"`: final = `0.70 * deterministic + 0.30 * platformFit`
- If `sanityCheck.agreement === "DISAGREE"` and `adjustedComposite` provided: final = `0.50 * deterministic + 0.20 * platformFit + 0.30 * adjustedComposite`
- If `sanityCheck.agreement === "PARTIAL"`: final = `0.60 * deterministic + 0.30 * platformFit + 0.10 * deterministicComposite` (reduced LLM influence)

The existing `PROMOTION_THRESHOLD` (0.60) still gates simulation promotion.

---

## Integration Points with Existing Pipeline

### Pipeline Runner Changes (`pipeline-runner.ts`)

The pipeline runner currently follows this flow:
```
parse -> extractSkills -> triage -> modelSetup -> score(each skill, 3 LLM calls) -> simulation -> reports
```

v1.3 changes it to:
```
parse -> extractSkills -> deterministicScore(all) -> topNFilter -> modelSetup -> consolidatedScore(each survivor, 1 LLM call) -> simulation -> reports
```

**Key changes in `runPipeline`:**

1. **Branch on `--scoring-mode`:** When `scoringMode === "two-pass"` (default), use new path. When `scoringMode === "three-lens"`, preserve v1.2 behavior for comparison/validation runs.

2. **Replace triage call** with deterministic scoring in the two-pass path. Triage is not called for scoring gating. It may optionally remain for report annotation (red flag labels in TSV output) but does not control which skills proceed.

3. **Add deterministic scoring step** (synchronous, fast) right after `extractScoringSkills`:
   ```typescript
   const deterministicScores = scoreAllDeterministic(allSkills);
   logger.info({ total: deterministicScores.length }, "Deterministic scoring complete");
   ```

4. **Add top-N filter** between deterministic scoring and LLM scoring:
   ```typescript
   const { survivors, eliminated, cutoffScore } = filterTopN(deterministicScores, options.topN ?? 50);
   logger.info({ survivors: survivors.length, eliminated: eliminated.length, cutoffScore }, "Top-N filter applied");
   ```

5. **Replace semaphore-bounded `scoreOneSkill` loop** with semaphore-bounded `scoreOneConsolidated` loop over survivors only. Checkpoint system still works -- keys by `skillId`. The existing `Semaphore`, `withTimeout`, `callWithResilience`, and `createCheckpointWriter` are all reused.

6. **Model management simplification:** Only one model needed for the two-pass path (the scoring model, for consolidated calls). The triage model (`qwen3:8b`) is no longer loaded. `modelManager.ensureScoringModel()` remains for Ollama backend.

7. **Simulation bridge update:** `toSimulationInputs` currently groups by L3 and takes highest-composite skill. For v1.3, survivors are already the best candidates. The L3 grouping can remain for report organization, but each survivor passes through individually. The function signature stays the same; the input is just a smaller, pre-filtered set.

### ScoringResult Type Evolution

The existing `ScoringResult` type must accommodate both v1.2 (three lenses) and v1.3 (deterministic + consolidated) paths without breaking downstream consumers.

**Strategy: Extend with optional fields, synthesize `lenses` for backward compatibility.**

```typescript
export interface ScoringResult {
  // Existing fields (unchanged)
  skillId: string;
  skillName: string;
  l4Name: string;
  l3Name: string;
  l2Name: string;
  l1Name: string;
  archetype: LeadArchetype;
  lenses: {
    technical: LensScore;
    adoption: LensScore;
    value: LensScore;
  };
  composite: number;
  overallConfidence: ConfidenceLevel;
  promotedToSimulation: boolean;
  scoringDurationMs: number;

  // NEW v1.3 fields (optional for backward compat)
  deterministicScore?: DeterministicScore;
  consolidatedLlm?: ConsolidatedLlmResult;
  scoringMethod?: "three-lens" | "two-pass";
}
```

The `lenses` field is **synthesized** from deterministic signals to maintain report compatibility:
- Technical lens: maps from `dataReadiness + archetypeSignal + aiSuitabilitySignal`
- Adoption lens: maps from `decisionClarity + impactSignal + specCompleteness + financialSignal`
- Value lens: maps from `financialSignal`

This means all existing report formatters (`format-scores-tsv.ts`, `format-summary.ts`, `format-tier1-report.ts`, etc.) work **unchanged**.

### CLI Changes

New flags in `cli.ts` (Commander):

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `--top-n <number>` | number | 50 | Number of survivors after deterministic scoring |
| `--scoring-mode <mode>` | "two-pass" or "three-lens" | "two-pass" | v1.3 funnel vs v1.2 legacy mode |

The `--scoring-mode three-lens` flag preserves the complete v1.2 behavior (triage + 3 LLM calls per skill) for validation and comparison runs. This is important for the transition period.

### Checkpoint Compatibility

The checkpoint system keys entries by `skillId`. Both v1.2 and v1.3 use `skillId` as the key. The checkpoint entry gains an optional `scoringMethod` field for clarity but existing checkpoints are compatible. Resume across scoring modes is not supported (different skill sets may be scored), but resume within the same mode works.

---

## Data Flow Detail

### v1.2 (current): Skill Through Pipeline

```
L4Activity[] --(extractScoringSkills)--> SkillWithContext[]
  --(triageOpportunities)--> TriageResult[]  (skip/demote/process, tier 1/2/3)
  --(filter processable, sort by tier)--> TriageResult[]
  --(for each: scoreOneSkill)--> ScoringResult[]  (3 LLM calls each)
    scoreTechnical:  chatFn(buildTechnicalPrompt(...), technicalJsonSchema)
    scoreAdoption:   chatFn(buildAdoptionPrompt(...), adoptionJsonSchema)
    scoreValue:      chatFn(buildValuePrompt(...), valueJsonSchema)
  --(computeComposite)--> composite score + promotion gate (>= 0.60)
  --(toSimulationInputs)--> SimulationInput[]  (groups by L3, takes best skill)
  --(runSimulationPipeline)--> SimulationResult[]
  --(writeFinalReports)--> Reports
```

### v1.3 (target): Skill Through Pipeline

```
L4Activity[] --(extractScoringSkills)--> SkillWithContext[]  (826 items)
  --(scoreAllDeterministic)--> DeterministicScore[]  (826 items, <100ms)
    7 signals extracted per skill (pure functions, no LLM)
    Weighted composite computed per skill
  --(filterTopN(scores, 50))--> survivors: DeterministicScore[]  (~50 items)
    Log: cutoff score, eliminated count
  --(for each survivor: scoreOneConsolidated)--> ConsolidatedLlmResult[]  (1 LLM call each)
    chatFn(buildConsolidatedPrompt(skill, detScore, knowledge), consolidatedJsonSchema)
  --(computeHybridComposite)--> final composite + promotion gate (>= 0.60)
  --(synthesizeLenses for report compat)--> ScoringResult[]
  --(toSimulationInputs)--> SimulationInput[]
  --(runSimulationPipeline)--> SimulationResult[]
  --(writeFinalReports)--> Reports
```

### LLM Call Reduction

| Metric | v1.2 | v1.3 (N=50) | Reduction |
|--------|------|-------------|-----------|
| Candidates scored by LLM | 826 | 50 | 94% |
| LLM calls per candidate | 3 | 1 | 67% |
| Total LLM calls | 2,478 | 50 | **98%** |
| Estimated cloud time (H100) | ~4 hours | ~10 min | 96% |
| Estimated cloud cost | ~$22 | ~$1 | 95% |

---

## Patterns to Follow

### Pattern 1: Pure Function Scoring Signals
**What:** Each deterministic signal is a standalone pure function with no dependencies.
**When:** Any signal derivation from structured data.
**Why:** Matches existing `confidence.ts` pattern exactly. Trivially testable with `makeL4()` / skill factories -- no mocking, no async, no I/O.
**Example:**
```typescript
export function computeFinancialSignal(skill: SkillWithContext): number {
  let score = 0;
  if (skill.financialRating === "HIGH") score += 0.5;
  else if (skill.financialRating === "MEDIUM") score += 0.25;
  if (skill.max_value > 5_000_000) score += 0.5;
  else if (skill.max_value > 1_000_000) score += 0.3;
  else if (skill.max_value > 0) score += 0.1;
  return Math.min(score, 1.0);
}
```

### Pattern 2: Dependency Injection for LLM Calls
**What:** `scoreOneConsolidated` takes `chatFn` as parameter, defaults to `ollamaChat`.
**When:** Any LLM-calling function.
**Why:** Matches existing `scoreOneSkill`, `scoreTechnical`, etc. Enables test injection with deterministic mock responses.

### Pattern 3: Result Type Union for Error Propagation
**What:** `{ success: true; data: T } | { success: false; error: string }`
**When:** Any operation that can fail (LLM calls, I/O).
**Why:** Established codebase convention (`ChatResult`, `ParseResult`). Prevents thrown exceptions from breaking the pipeline runner's `Promise.allSettled` pattern.

### Pattern 4: Backward-Compatible Type Extension
**What:** Add optional fields to `ScoringResult` rather than creating a new incompatible type.
**When:** Evolving existing types that have many downstream consumers.
**Why:** All downstream consumers (10+ report formatters, simulation bridge, checkpoint, archived scores loader) continue working without modification. The `lenses` synthesis layer absorbs the format difference.

### Pattern 5: Feature Flag via CLI Mode
**What:** `--scoring-mode two-pass | three-lens` enables gradual migration.
**When:** Replacing core pipeline behavior.
**Why:** Allows A/B comparison of v1.2 vs v1.3 results on the same dataset. Critical for validating that the deterministic funnel doesn't eliminate high-quality candidates that the three-lens LLM scorer would have promoted.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Modifying Triage to Be the Deterministic Scorer
**What:** Trying to retrofit `triageOpportunities()` to produce continuous scores.
**Why bad:** Triage is designed for discrete categorization (skip/demote/process, tier 1/2/3). The `TriageResult` type is consumed by report formatters (`format-scores-tsv.ts` writes tier columns) and checkpoint logic. Forcing continuous scoring into triage creates an awkward hybrid that satisfies neither purpose.
**Instead:** Build deterministic scorer as a new module. Triage remains available for report annotations if backward-compatible reports need tier labels.

### Anti-Pattern 2: Having Deterministic Score Feed Into Three Lens Calls
**What:** Using deterministic score to "pre-filter" but still running 3 LLM calls per survivor.
**Why bad:** 50 survivors x 3 calls = 150 calls. Better than 2,478 but misses the insight that platform fit is the only assessment requiring an LLM. Financial, adoption, and value dimensions are fully deterministic from the structured export fields.
**Instead:** One consolidated LLM call per survivor covering platform fit (what code cannot assess) + sanity check (catches deterministic blind spots).

### Anti-Pattern 3: Breaking ScoringResult Shape
**What:** Creating a new result type for v1.3 that omits the `lenses` field.
**Why bad:** Every report formatter, the simulation bridge (`toSimulationInputs` reads `composite` and `archetype`), and the checkpoint system reference `ScoringResult.lenses`. Changing the shape requires touching 10+ files across output/, pipeline/, and simulation/.
**Instead:** Synthesize `lenses` from deterministic signals so downstream consumers are completely unaware of the scoring method change.

### Anti-Pattern 4: Making Top-N a Fixed Constant
**What:** Hardcoding N as a module-level constant in the scorer.
**Why bad:** Optimal N depends on dataset size (826 for Ford, could be 200 or 5000 for other clients), run budget, and exploratory needs. A constant prevents tuning.
**Instead:** CLI flag `--top-n` with sensible default. Log the cutoff score so users can evaluate whether N is too aggressive or too lenient.

### Anti-Pattern 5: Putting Lens Synthesis in Report Formatters
**What:** Each report formatter individually converting `DeterministicScore` to lens format.
**Why bad:** Duplicates conversion logic across 6+ formatters. One formatter gets it wrong, reports become inconsistent.
**Instead:** Lens synthesis happens once in the scoring layer (a `synthesizeLenses` function) before `ScoringResult` is constructed. Formatters receive the same `ScoringResult` shape they always have.

---

## Suggested Build Order

Based on dependency analysis, build bottom-up with testing at each layer.

### Phase 1: Types + Deterministic Foundation (no LLM, no pipeline changes)
1. **`types/scoring.ts`** -- Add `DeterministicScore`, `ConsolidatedLlmResult` types; extend `ScoringResult` with optional v1.3 fields
2. **`scoring/deterministic-signals.ts`** -- 7 pure signal functions, TDD with `makeSkillWithContext()` factory
3. **`scoring/deterministic-scorer.ts`** -- Orchestrates signals into `DeterministicScore`, TDD
4. **`pipeline/top-n-filter.ts`** -- Rank + slice with TDD

**Validation gate:** Run `scoreAllDeterministic` against Ford export. Verify distribution: top 50 should include high-value, high-AI-suitability skills. Compare against v1.2 triage Tier 1 results -- reasonable overlap expected.

**Dependencies:** None. All pure functions, no LLM, no pipeline changes.

### Phase 2: Consolidated LLM Scorer (LLM layer, isolated from pipeline)
5. **`scoring/prompts/consolidated.ts`** -- Prompt builder (follows existing `prompts/technical.ts` pattern)
6. **`scoring/schemas.ts`** -- Add `ConsolidatedLensSchema` + `consolidatedJsonSchema`
7. **`scoring/consolidated-scorer.ts`** -- Single LLM call with `chatFn` injection, TDD with mock chatFn
8. **`scoring/composite.ts`** -- Add `computeHybridComposite`, TDD with deterministic inputs
9. **`scoring/lens-synthesis.ts`** -- Map deterministic signals to `lenses` shape, TDD

**Dependencies:** Phase 1 types. LLM testing uses same mock patterns as existing lens scorers.

### Phase 3: Pipeline Integration (wiring)
10. **`pipeline/pipeline-runner.ts`** -- Wire new two-pass flow with `--scoring-mode` branch
11. **`cli.ts`** -- Add `--top-n`, `--scoring-mode` flags via Commander
12. **`pipeline/scoring-to-simulation.ts`** -- Verify it works with v1.3 `ScoringResult[]` (likely no changes needed due to lens synthesis)

**Dependencies:** Phases 1 + 2 complete.

### Phase 4: Validation + Report Compatibility
13. **Report formatter verification** -- Run all formatters against v1.3 `ScoringResult[]`, verify output
14. **Comparison run** -- Same Ford export with `--scoring-mode three-lens` and `--scoring-mode two-pass`, compare promoted sets
15. **Ford E2E validation** -- Full 826-candidate run, verify top-N distribution matches expectations

**Dependencies:** Phase 3 complete.

---

## Scalability Considerations

| Concern | At 826 L4s (Ford) | At 5,000 L4s | At 50,000 L4s |
|---------|-------------------|---------------|----------------|
| Deterministic scoring | <100ms (sync) | <500ms (sync) | <5s (sync) |
| Top-N filter | O(n log n) sort, trivial | Trivial | Trivial |
| LLM calls (N=50) | 50 calls, ~10 min H100 | 50 calls (same N) | 100 calls (scale N linearly) |
| Memory | All scores in memory, ~1MB | ~5MB | ~50MB, may want streaming |
| Checkpoint | Per-survivor, ~50 entries | ~50 entries (same) | ~100 entries |

The key scalability property: deterministic scoring is O(n) and the LLM call count is O(1) with respect to dataset size when N is fixed. This decouples cloud cost from dataset size.

---

## Sources

- Existing codebase analysis (HIGH confidence): `pipeline-runner.ts`, `scoring-pipeline.ts`, `lens-scorers.ts`, `composite.ts`, `confidence.ts`, `extract-skills.ts`, `triage-pipeline.ts`, `scoring-to-simulation.ts`, `tier-engine.ts`
- Type system analysis (HIGH confidence): `types/scoring.ts`, `types/hierarchy.ts`, `types/simulation.ts`, `types/triage.ts`, `schemas/hierarchy.ts`
- Project charter (HIGH confidence): `.planning/PROJECT.md` v1.3 milestone definition
- L4 field inventory (HIGH confidence): `SkillWithContext` interface -- `financialRating`, `aiSuitability`, `impactOrder`, `ratingConfidence`, `decisionExists`, `execution`, `problem_statement`, `actions`, `constraints`, `aera_skill_pattern`, `max_value`, `archetype`
