# Phase 21: Types + Deterministic Foundation - Research

**Researched:** 2026-03-13
**Domain:** Pure-function deterministic scoring, TypeScript type design, TSV output formatting
**Confidence:** HIGH

## Summary

Phase 21 introduces a deterministic pre-scoring layer that scores all 826 L4 activities from structured fields only (zero LLM calls), producing a ranked and filtered candidate list. The implementation is entirely within the existing project's established patterns: pure functions, Zod schemas, node:test TDD, and TSV output formatters.

The core work is: (1) define a new `PreScoreResult` type and dimension weight constants in `types/scoring.ts`, (2) implement 6 dimension scorer functions as pure computations over `L4Activity` fields, (3) implement composite scoring with weighted normalization, (4) implement per-L4 red flag detection adapted from existing `triage/red-flags.ts`, (5) implement top-N filtering with cluster-aware tie handling, (6) add `--top-n` CLI flag, and (7) produce a pre-score TSV artifact.

**Primary recommendation:** Follow the existing pure-function + co-located test pattern exactly. Each dimension scorer should be a separate exported function. The composite scorer and filter are separate modules. No new dependencies are needed -- this is pure TypeScript computation over existing types.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Score at **L4 activity level** (826 candidates), not skill level
- L4 is the deterministic filter unit; surviving L4s expand back to individual skills for Phase 22 LLM scoring
- Create a new **PreScoreResult type** separate from ScoringResult -- clean separation, no risk to 10+ downstream consumers
- PreScoreResult includes: l4Id, l4Name, l3/l2/l1 names, dimension scores, composite, survived status, redFlags, skillCount
- **Adoption-heavy** weights: financial_signal=0.25, ai_suitability=0.15, decision_density=0.20, impact_order=0.10, rating_confidence=0.10, archetype_completeness=0.20
- Financial signal: **categorical only** -- HIGH=1.0, MEDIUM=0.5, LOW=0.0. max_value used for tiebreaking only (FILTER-02), not in dimension score
- AI suitability: HIGH=1.0, MEDIUM=0.5, LOW=0.25, NOT_APPLICABLE=0.0, null=0.0
- Decision density: **boolean + skill signal count** -- decision_exists=0.5 base, plus skill richness bonus (0.0-0.5) from normalized sum of actions+constraints across all skills under the L4
- **Hard elimination** for DEAD_ZONE and NO_STAKES -- removed before ranking, LLM assessment would be wasted
- **Penalty multiplier** for CONFIDENCE_GAP -- composite * 0.3, can still survive if other signals are strong
- Red flags detected **per-L4** (not propagated from L3 grouping)
- DEAD_ZONE: decision_exists=false AND every skill has 0 actions + 0 constraints
- NO_STAKES: financial_rating=LOW AND impact_order=SECOND
- CONFIDENCE_GAP: rating_confidence=LOW
- **PHANTOM and ORPHAN dropped** for L4 scoring -- L3 properties, irrelevant at individual L4 level
- Eliminated L4s **still appear in pre-score TSV** with eliminated status and reason
- Cluster-aware cutoff: include all ties at boundary score, **capped at top-N * 1.1** (10% overflow)
- If ties exceed the 10% cap, break remaining ties by max_value descending
- Final tiebreaker: **L4 ID ascending** for deterministic, reproducible output
- Filter statistics report both requested top-N and actual survivor count

### Claude's Discretion
- Impact order dimension scoring (FIRST vs SECOND mapping)
- Rating confidence dimension scoring (HIGH/MEDIUM/LOW mapping)
- Archetype completeness dimension scoring (how to measure execution field richness)
- Pre-score TSV column ordering and formatting
- Internal function decomposition and module structure
- Performance optimization approach for <100ms target

### Deferred Ideas (OUT OF SCOPE)
- ADVN-01: Dimension weight configurability via CLI flags -- deferred until Ford validation
- ADVN-02: Overlap group deduplication of near-duplicate survivors
- ADVN-03: Tier-aware top-N slot allocation (Tier 1 always passes)
- ADVN-05: Pre-score histogram in summary reports

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSCORE-01 | Score all L4 activities from structured fields only, <100ms for 826 | Pure function over L4Activity array; single pass with map/reduce; no I/O |
| DSCORE-02 | Compute financial signal from financial_rating + max_value | Categorical map: HIGH=1.0, MEDIUM=0.5, LOW=0.0; max_value only for tiebreak |
| DSCORE-03 | Compute AI suitability from ai_suitability field | Categorical map: HIGH=1.0, MEDIUM=0.5, LOW=0.25, NOT_APPLICABLE/null=0.0 |
| DSCORE-04 | Compute decision density from decision_exists, actions, constraints | Boolean base + skill richness bonus; requires aggregating skill counts per L4 |
| DSCORE-05 | Compute impact order from impact_order field | Discretion: recommend FIRST=1.0, SECOND=0.25 |
| DSCORE-06 | Compute rating confidence from rating_confidence field | Discretion: recommend HIGH=1.0, MEDIUM=0.6, LOW=0.2 |
| DSCORE-07 | Compute archetype completeness from archetype + execution fields | Discretion: measure execution field presence across skills |
| DSCORE-08 | Weighted composite 0-1 from all dimensions | Follow `scoring/composite.ts` pattern; weights from CONTEXT.md locked decisions |
| DSCORE-09 | Red flags as hard elimination or penalty | Per-L4 detection adapted from `triage/red-flags.ts`; DEAD_ZONE/NO_STAKES eliminate, CONFIDENCE_GAP penalizes |
| FILTER-01 | --top-n CLI flag, default 50 | Commander `.option("--top-n <n>", ..., "50")` in cli.ts |
| FILTER-02 | Rank by composite DESC, ties by max_value DESC | Aggregated max_value per L4 = sum of skill max_values |
| FILTER-03 | Pre-score TSV artifact to output directory | New formatter in `output/format-pre-score-tsv.ts` following existing TSV pattern |
| FILTER-04 | Filter statistics in pipeline output | Return stats object from filter function; CLI prints summary |
| FILTER-05 | Cluster-aware cutoff at boundary | Include ties at boundary, cap at 1.1x, then break by max_value then L4 ID |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | strict, ES2022 | Type definitions and implementation | Project standard |
| node:test | built-in | Test runner | Project convention -- co-located .test.ts files |
| assert/strict | built-in | Test assertions | Project convention |
| Zod | existing | Schema validation (if needed for PreScoreResult) | Already in project for all schemas |
| Commander | existing | CLI --top-n flag | Already used in cli.ts |

### Supporting
No new dependencies needed. This phase is pure computation over existing types.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom sorting | lodash sortBy | Unnecessary dep; native Array.sort sufficient for 826 items |
| Zod schema for PreScoreResult | Plain TypeScript interface | PreScoreResult is internal between scoring and filter; Zod optional unless it crosses module boundary |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  scoring/
    deterministic/
      dimensions.ts          # 6 dimension scorer functions (pure)
      dimensions.test.ts     # TDD tests for each dimension
      composite.ts           # Weighted composite from dimensions (pure)
      composite.test.ts      # Composite scoring tests
      red-flags.ts           # Per-L4 red flag detection (pure)
      red-flags.test.ts      # Red flag tests
      filter.ts              # Top-N filtering with cluster-aware cutoff (pure)
      filter.test.ts         # Filter tests
      pre-scorer.ts          # Orchestrator: dimensions + composite + flags + filter
      pre-scorer.test.ts     # Integration tests
    deterministic.ts         # Re-export barrel (optional)
  types/
    scoring.ts               # Add PreScoreResult, DETERMINISTIC_WEIGHTS, etc.
  output/
    format-pre-score-tsv.ts       # TSV formatter for pre-score artifact
    format-pre-score-tsv.test.ts  # TSV formatter tests
  cli.ts                     # Add --top-n option
```

**Alternative:** Flat structure under `scoring/` (no subdirectory) if the team prefers. The existing codebase uses flat modules within scoring/, so a `scoring/deterministic-*.ts` naming pattern also works. However, since this is a conceptually distinct subsystem from LLM scoring, a subdirectory provides cleaner separation.

### Pattern 1: Pure Dimension Scorer Functions
**What:** Each dimension is a standalone pure function that takes an L4Activity (and optionally its skills) and returns a 0-1 normalized score.
**When to use:** Every DSCORE requirement.
**Example:**
```typescript
// Source: Pattern from scoring/confidence.ts
import type { L4Activity, Skill } from "../../types/hierarchy.js";

export function scoreFinancialSignal(l4: L4Activity): number {
  const MAP: Record<string, number> = { HIGH: 1.0, MEDIUM: 0.5, LOW: 0.0 };
  return MAP[l4.financial_rating] ?? 0.0;
}

export function scoreAiSuitability(l4: L4Activity): number {
  const MAP: Record<string, number> = { HIGH: 1.0, MEDIUM: 0.5, LOW: 0.25, NOT_APPLICABLE: 0.0 };
  return MAP[l4.ai_suitability ?? ""] ?? 0.0;
}

export function scoreDecisionDensity(l4: L4Activity): number {
  const base = l4.decision_exists ? 0.5 : 0.0;
  const totalSignals = l4.skills.reduce(
    (sum, s) => sum + (s.actions?.length ?? 0) + (s.constraints?.length ?? 0), 0
  );
  // Normalize: cap at a reasonable max (e.g., 20 signals across all skills)
  const MAX_SIGNALS = 20;
  const richness = Math.min(totalSignals / MAX_SIGNALS, 1.0) * 0.5;
  return base + richness;
}
```

### Pattern 2: Composite with Locked Weights
**What:** Weighted sum of normalized dimension scores, following the existing `scoring/composite.ts` pattern.
**When to use:** DSCORE-08.
**Example:**
```typescript
// Source: Pattern from scoring/composite.ts + CONTEXT.md locked weights
export const DETERMINISTIC_WEIGHTS = {
  financial_signal: 0.25,
  ai_suitability: 0.15,
  decision_density: 0.20,
  impact_order: 0.10,
  rating_confidence: 0.10,
  archetype_completeness: 0.20,
} as const;

export type DeterministicDimension = keyof typeof DETERMINISTIC_WEIGHTS;

export interface DimensionScores {
  financial_signal: number;
  ai_suitability: number;
  decision_density: number;
  impact_order: number;
  rating_confidence: number;
  archetype_completeness: number;
}

export function computeDeterministicComposite(scores: DimensionScores): number {
  let composite = 0;
  for (const [dim, weight] of Object.entries(DETERMINISTIC_WEIGHTS)) {
    composite += scores[dim as DeterministicDimension] * weight;
  }
  return composite;
}
```

### Pattern 3: Cluster-Aware Top-N Filter
**What:** Sort by composite DESC, take top-N, expand to include ties at boundary, cap at 1.1x, then tiebreak.
**When to use:** FILTER-01 through FILTER-05.
**Example:**
```typescript
export interface FilterResult {
  survivors: PreScoreResult[];
  eliminated: PreScoreResult[];
  stats: FilterStats;
}

export interface FilterStats {
  totalCandidates: number;
  requestedTopN: number;
  actualSurvivors: number;
  eliminated: number;
  cutoffScore: number;
  tiesAtBoundary: number;
}
```

### Pattern 4: Pre-Score TSV Formatter
**What:** Pure function that takes PreScoreResult[] and returns a TSV string, following `format-scores-tsv.ts` pattern.
**When to use:** FILTER-03.

### Anti-Patterns to Avoid
- **Mutating L4Activity objects:** All scoring must be read-only over input data. Create new PreScoreResult objects.
- **Coupling to LLM scoring types:** PreScoreResult is intentionally separate from ScoringResult. Do not import or extend ScoringResult.
- **Non-deterministic tiebreaking:** The final tiebreaker MUST be L4 ID ascending for reproducibility. Never use random or insertion-order tiebreaking.
- **Aggregating max_value into dimension score:** max_value is for tiebreaking only (FILTER-02), not the financial_signal dimension.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TSV escaping | Custom tab/newline handling | Existing `tsv-utils.ts` (tsvCell, tsvRow) | Already handles null, boolean, string edge cases |
| L4-to-skill mapping | Custom hierarchy traversal | L4Activity.skills array (already populated by Zod parse) | Skills are already nested under L4 in the parsed hierarchy |
| Red flag type system | New red flag union | Existing `RedFlag` tagged union from `types/triage.ts` | Reuse the same type; just detect a subset (3 of 5 flags) |

**Key insight:** The L4Activity type already contains every field needed for all 6 dimensions. The hierarchy JSON parse (`schemas/hierarchy.ts`) guarantees these fields are present and typed. No additional data loading or transformation is needed.

## Common Pitfalls

### Pitfall 1: Skill-Count Variance in Decision Density
**What goes wrong:** L4 activities have wildly different skill counts (1 to 20+). A naive sum of actions+constraints across skills creates a dimension that mostly correlates with skill count, not signal quality.
**Why it happens:** The CONTEXT.md specifies "normalized sum of actions+constraints across all skills under the L4" but doesn't specify the normalization constant.
**How to avoid:** Cap the signal count with a reasonable MAX_SIGNALS constant (e.g., 20). Use `Math.min(totalSignals / MAX_SIGNALS, 1.0)` so high-skill-count L4s don't automatically get max richness. The cap value should be derived from actual data distribution if possible.
**Warning signs:** All L4s with >5 skills getting identical decision_density scores.

### Pitfall 2: Floating-Point Ties at Boundary
**What goes wrong:** Cluster-aware cutoff compares composite scores for equality, but floating-point arithmetic can produce scores that differ by epsilon (e.g., 0.7200000000000001 vs 0.72).
**Why it happens:** Weighted sums of 6 dimensions with decimal weights.
**How to avoid:** Round composite scores to a fixed precision (4 decimal places) before comparison. Use `Math.round(score * 10000) / 10000` or compare with a tolerance of 1e-6.
**Warning signs:** Tests showing boundary tie counts varying between runs.

### Pitfall 3: max_value Aggregation for Tiebreaking
**What goes wrong:** FILTER-02 specifies "ties broken by max_value descending" but max_value lives on skills, not L4. Must aggregate correctly.
**Why it happens:** L4Activity itself has no max_value field; it lives on individual Skill objects.
**How to avoid:** Sum skill max_values per L4 during pre-scoring (or use the max skill max_value). Include this aggregated value in PreScoreResult for tiebreaking. Note: L3Opportunity has `combined_max_value` but that's at the wrong level.
**Warning signs:** All L4s having null/zero tiebreak values.

### Pitfall 4: Empty Skills Array
**What goes wrong:** Some L4 activities may have an empty skills array. Dimension scorers that aggregate over skills (decision_density, archetype_completeness) must handle this gracefully.
**Why it happens:** The Zod schema allows `skills: z.array(skillSchema)` which can be empty.
**How to avoid:** Always check `l4.skills.length === 0` before aggregating. For decision_density, an L4 with no skills and decision_exists=false should score 0.0 (and likely be DEAD_ZONE eliminated anyway).
**Warning signs:** Division by zero in skill aggregation; NaN in composite scores.

### Pitfall 5: Performance -- Avoid O(n^2)
**What goes wrong:** 826 L4s with nested skills could be slow if each dimension scorer independently iterates all skills.
**Why it happens:** Each of the 6 dimensions is a separate function. If each one iterates l4.skills independently, that's 6 * 826 * avg_skills iterations.
**How to avoid:** Pre-compute per-L4 aggregates (total actions, total constraints, skill count, execution field counts) in a single pass, then pass the aggregates to each dimension scorer. For 826 items with ~3-5 skills each, even the naive approach is well under 100ms, but pre-aggregation is cleaner.
**Warning signs:** Scoring taking >10ms (should be <5ms realistically).

## Code Examples

### PreScoreResult Type Definition
```typescript
// Add to types/scoring.ts
import type { RedFlag } from "./triage.js";

export const DETERMINISTIC_WEIGHTS = {
  financial_signal: 0.25,
  ai_suitability: 0.15,
  decision_density: 0.20,
  impact_order: 0.10,
  rating_confidence: 0.10,
  archetype_completeness: 0.20,
} as const;

export type DeterministicDimension = keyof typeof DETERMINISTIC_WEIGHTS;

export interface DimensionScores {
  financial_signal: number;
  ai_suitability: number;
  decision_density: number;
  impact_order: number;
  rating_confidence: number;
  archetype_completeness: number;
}

export interface PreScoreResult {
  l4Id: string;
  l4Name: string;
  l3Name: string;
  l2Name: string;
  l1Name: string;
  dimensions: DimensionScores;
  composite: number;
  survived: boolean;
  eliminationReason: string | null;  // e.g., "DEAD_ZONE", "NO_STAKES"
  redFlags: RedFlag[];
  skillCount: number;
  aggregatedMaxValue: number;  // sum of skill max_values, for tiebreaking
}
```

### Discretion Recommendations: Impact Order Dimension
```typescript
// DSCORE-05: Impact order scoring
// FIRST = direct, measurable impact -> high signal for automation value
// SECOND = indirect, harder to measure -> lower but non-zero signal
export function scoreImpactOrder(l4: L4Activity): number {
  return l4.impact_order === "FIRST" ? 1.0 : 0.25;
}
```

### Discretion Recommendations: Rating Confidence Dimension
```typescript
// DSCORE-06: Rating confidence scoring
// HIGH confidence = strong data backing the rating
// MEDIUM = reasonable but gaps exist
// LOW = speculative (also triggers CONFIDENCE_GAP penalty)
export function scoreRatingConfidence(l4: L4Activity): number {
  const MAP: Record<string, number> = { HIGH: 1.0, MEDIUM: 0.6, LOW: 0.2 };
  return MAP[l4.rating_confidence] ?? 0.0;
}
```

### Discretion Recommendations: Archetype Completeness Dimension
```typescript
// DSCORE-07: Archetype completeness scoring
// Measures how fully the L4's skills define execution requirements.
// A "complete" L4 has skills with execution fields populated, problem statements,
// and archetype-appropriate patterns.
export function scoreArchetypeCompleteness(l4: L4Activity): number {
  if (l4.skills.length === 0) return 0.0;

  let totalFields = 0;
  let populatedFields = 0;

  for (const skill of l4.skills) {
    // Check execution fields (8 possible)
    const exec = skill.execution;
    if (exec) {
      totalFields += 5; // target_systems, execution_trigger, execution_frequency, autonomy_level, approval_required
      if (exec.target_systems.length > 0) populatedFields++;
      if (exec.execution_trigger !== null) populatedFields++;
      if (exec.execution_frequency !== null) populatedFields++;
      if (exec.autonomy_level !== null) populatedFields++;
      if (exec.approval_required !== null) populatedFields++;
    } else {
      totalFields += 5;
    }

    // Check problem_statement presence
    totalFields += 1;
    if (skill.problem_statement && skill.problem_statement.quantified_pain.length > 0) {
      populatedFields++;
    }

    // Check archetype pattern presence
    totalFields += 1;
    if (skill.aera_skill_pattern !== null) populatedFields++;
  }

  return totalFields > 0 ? populatedFields / totalFields : 0.0;
}
```

### Per-L4 Red Flag Detection
```typescript
// Adapted from triage/red-flags.ts for L4-level detection
import type { L4Activity } from "../../types/hierarchy.js";
import type { RedFlag } from "../../types/triage.js";

export function detectL4RedFlags(l4: L4Activity): RedFlag[] {
  const flags: RedFlag[] = [];

  // DEAD_ZONE: no decision AND all skills have 0 actions + 0 constraints
  if (!l4.decision_exists) {
    const allEmpty = l4.skills.every(
      s => (s.actions?.length ?? 0) === 0 && (s.constraints?.length ?? 0) === 0
    );
    if (allEmpty) {
      flags.push({ type: "DEAD_ZONE", decisionDensity: 0 });
    }
  }

  // NO_STAKES: LOW financial + SECOND impact
  if (l4.financial_rating === "LOW" && l4.impact_order === "SECOND") {
    flags.push({ type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true });
  }

  // CONFIDENCE_GAP: LOW rating confidence
  if (l4.rating_confidence === "LOW") {
    flags.push({ type: "CONFIDENCE_GAP", lowConfidencePct: 1.0 });
  }

  return flags;
}
```

### CLI --top-n Flag
```typescript
// Add to cli.ts Commander options
.option(
  "--top-n <n>",
  "Number of top-scoring L4 candidates to pass to LLM scoring (default: 50)",
  "50",
)
```

### Test Factory Pattern
```typescript
// Following project convention: makeL4() helper in test files
function makeL4(overrides: Partial<L4Activity> = {}): L4Activity {
  return {
    id: "L4-001",
    name: "Test Activity",
    description: "Test description",
    l1: "L1 Area",
    l2: "L2 Domain",
    l3: "L3 Category",
    financial_rating: "MEDIUM",
    value_metric: "cost_reduction",
    impact_order: "FIRST",
    rating_confidence: "MEDIUM",
    ai_suitability: "HIGH",
    decision_exists: true,
    decision_articulation: null,
    escalation_flag: null,
    skills: [],
    ...overrides,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Score at L3 opportunity level | Score at L4 activity level | v1.3 (this phase) | 826 candidates instead of ~150 L3 groups |
| 3 LLM calls per candidate | Deterministic pre-filter then 1 LLM call | v1.3 (this phase) | 2,478 LLM calls -> ~50 calls |
| All candidates go to LLM | Top-N filter first | v1.3 (this phase) | Massive cost and time reduction |

**No deprecated patterns:** This is new functionality. The existing three-lens LLM scoring remains for Phase 23 backward compatibility (--scoring-mode flag).

## Open Questions

1. **MAX_SIGNALS constant for decision density normalization**
   - What we know: Skills have varying counts of actions and constraints (0-10+ each)
   - What's unclear: Actual distribution across 826 L4s in Ford data
   - Recommendation: Start with MAX_SIGNALS=20 as a reasonable cap. Phase 24 calibration (VAL-01, VAL-02) will validate whether this produces sufficient score diversity

2. **Archetype completeness: weight execution vs problem_statement vs pattern**
   - What we know: Skills have execution (8 fields), problem_statement (5 fields), and aera_skill_pattern
   - What's unclear: Which fields matter most for predicting LLM scoring outcome
   - Recommendation: Equal weight all checked fields (7 per skill as shown in example). Phase 24 calibration will validate

3. **Aggregated max_value for tiebreaking: sum vs max**
   - What we know: FILTER-02 says "ties broken by max_value descending" but max_value is per-skill
   - What's unclear: Whether sum (total value potential) or max (highest single skill) is better
   - Recommendation: Sum, as it captures the total value opportunity of the L4 activity. This aligns with L3Opportunity.combined_max_value pattern

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) + assert/strict |
| Config file | none -- npm test in src/ runs all *.test.ts |
| Quick run command | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DSCORE-01 | Score 826 L4s in <100ms | unit + perf | `cd src && npx tsx --test scoring/deterministic/pre-scorer.test.ts` | Wave 0 |
| DSCORE-02 | Financial signal dimension | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | Wave 0 |
| DSCORE-03 | AI suitability dimension | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | Wave 0 |
| DSCORE-04 | Decision density dimension | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | Wave 0 |
| DSCORE-05 | Impact order dimension | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | Wave 0 |
| DSCORE-06 | Rating confidence dimension | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | Wave 0 |
| DSCORE-07 | Archetype completeness dimension | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | Wave 0 |
| DSCORE-08 | Weighted composite 0-1 | unit | `cd src && npx tsx --test scoring/deterministic/composite.test.ts` | Wave 0 |
| DSCORE-09 | Red flag elimination/penalty | unit | `cd src && npx tsx --test scoring/deterministic/red-flags.test.ts` | Wave 0 |
| FILTER-01 | --top-n CLI flag | unit | `cd src && npx tsx --test cli.test.ts` | Existing (extend) |
| FILTER-02 | Rank + tiebreaking | unit | `cd src && npx tsx --test scoring/deterministic/filter.test.ts` | Wave 0 |
| FILTER-03 | Pre-score TSV artifact | unit | `cd src && npx tsx --test output/format-pre-score-tsv.test.ts` | Wave 0 |
| FILTER-04 | Filter statistics | unit | `cd src && npx tsx --test scoring/deterministic/filter.test.ts` | Wave 0 |
| FILTER-05 | Cluster-aware cutoff | unit | `cd src && npx tsx --test scoring/deterministic/filter.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx tsx --test scoring/deterministic/*.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/scoring/deterministic/dimensions.ts` + `.test.ts` -- covers DSCORE-02 through DSCORE-07
- [ ] `src/scoring/deterministic/composite.ts` + `.test.ts` -- covers DSCORE-08
- [ ] `src/scoring/deterministic/red-flags.ts` + `.test.ts` -- covers DSCORE-09
- [ ] `src/scoring/deterministic/filter.ts` + `.test.ts` -- covers FILTER-02, FILTER-04, FILTER-05
- [ ] `src/scoring/deterministic/pre-scorer.ts` + `.test.ts` -- covers DSCORE-01 (orchestrator + perf test)
- [ ] `src/output/format-pre-score-tsv.ts` + `.test.ts` -- covers FILTER-03
- [ ] `src/types/scoring.ts` -- add PreScoreResult, DETERMINISTIC_WEIGHTS, DimensionScores types

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/types/hierarchy.ts` -- L4Activity type with all fields needed for dimensions
- Existing codebase: `src/types/scoring.ts` -- WEIGHTS, MAX_SCORES, PROMOTION_THRESHOLD constant patterns
- Existing codebase: `src/scoring/composite.ts` -- Pure weighted composite pattern
- Existing codebase: `src/triage/red-flags.ts` -- Red flag detection pattern (detectRedFlags, detectSkillRedFlags)
- Existing codebase: `src/output/format-scores-tsv.ts` -- TSV output pattern
- Existing codebase: `src/output/tsv-utils.ts` -- tsvCell/tsvRow utilities
- Existing codebase: `src/pipeline/extract-skills.ts` -- Hierarchy flattening pattern
- Existing codebase: `src/cli.ts` -- Commander option pattern
- CONTEXT.md: Locked decisions with exact weights, mappings, and red flag rules

### Secondary (MEDIUM confidence)
- None needed -- all implementation details are derivable from existing codebase patterns and locked CONTEXT.md decisions

### Tertiary (LOW confidence)
- MAX_SIGNALS=20 normalization constant -- reasonable estimate, needs validation against Ford data distribution in Phase 24

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing project patterns
- Architecture: HIGH -- follows existing module structure, type patterns, and testing conventions exactly
- Pitfalls: HIGH -- identified from direct code inspection (floating-point, empty arrays, skill aggregation)
- Dimension scoring: MEDIUM -- discretionary dimensions (impact_order, rating_confidence, archetype_completeness) are recommendations pending Phase 24 calibration

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- no external dependencies to change)
