# Phase 21: Types + Deterministic Foundation - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure-function scoring of all 826 L4 candidates from structured fields (zero LLM calls, <100ms), producing a ranked and filtered candidate list ready for Phase 22 LLM assessment. Includes new types, deterministic scoring dimensions, top-N filtering with CLI control, and pre-score TSV artifact.

</domain>

<decisions>
## Implementation Decisions

### Scoring unit
- Score at **L4 activity level** (826 candidates), not skill level
- L4 is the deterministic filter unit; surviving L4s expand back to individual skills for Phase 22 LLM scoring
- Create a new **PreScoreResult type** separate from ScoringResult — clean separation, no risk to 10+ downstream consumers
- PreScoreResult includes: l4Id, l4Name, l3/l2/l1 names, dimension scores, composite, survived status, redFlags, skillCount

### Dimension weighting
- **Adoption-heavy** weights, mirroring v1.2 philosophy (adoption signals matter most for pre-filtering)
- Weights: financial_signal=0.25, ai_suitability=0.15, decision_density=0.20, impact_order=0.10, rating_confidence=0.10, archetype_completeness=0.20
- Financial signal: **categorical only** — HIGH=1.0, MEDIUM=0.5, LOW=0.0. max_value used for tiebreaking only (FILTER-02), not in dimension score
- AI suitability: HIGH=1.0, MEDIUM=0.5, LOW=0.25, NOT_APPLICABLE=0.0, null=0.0
- Decision density: **boolean + skill signal count** — decision_exists=0.5 base, plus skill richness bonus (0.0-0.5) from normalized sum of actions+constraints across all skills under the L4

### Red flag integration
- **Hard elimination** for DEAD_ZONE and NO_STAKES — removed before ranking, LLM assessment would be wasted
- **Penalty multiplier** for CONFIDENCE_GAP — composite * 0.3, can still survive if other signals are strong
- Red flags detected **per-L4** (not propagated from L3 grouping):
  - DEAD_ZONE: decision_exists=false AND every skill has 0 actions + 0 constraints
  - NO_STAKES: financial_rating=LOW AND impact_order=SECOND
  - CONFIDENCE_GAP: rating_confidence=LOW
- **PHANTOM and ORPHAN dropped** for L4 scoring — these are L3 properties, irrelevant at individual L4 level
- Eliminated L4s **still appear in pre-score TSV** with eliminated status and reason for audit visibility

### Tie-breaking and filtering
- Cluster-aware cutoff: include all ties at boundary score, **capped at top-N * 1.1** (10% overflow)
- If ties exceed the 10% cap, break remaining ties by max_value descending
- Final tiebreaker: **L4 ID ascending** for deterministic, reproducible output
- Filter statistics report both requested top-N and actual survivor count: "Requested: 50 | Actual survivors: 53 (3 ties at boundary included) | Eliminated: 773 | Cutoff: 0.72"

### Claude's Discretion
- Impact order dimension scoring (FIRST vs SECOND mapping)
- Rating confidence dimension scoring (HIGH/MEDIUM/LOW mapping)
- Archetype completeness dimension scoring (how to measure execution field richness)
- Pre-score TSV column ordering and formatting
- Internal function decomposition and module structure
- Performance optimization approach for <100ms target

</decisions>

<specifics>
## Specific Ideas

- Pre-score TSV includes one row per L4 with all dimension scores + skill_count column showing LLM workload per survivor
- Filter statistics should be transparent: show requested vs actual survivor count, with tie explanation
- Dimension weights should be defined as constants (like existing WEIGHTS in types/scoring.ts) for easy Phase 24 calibration adjustment

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `schemas/hierarchy.ts`: Zod schemas with all L4 fields needed for dimension scoring (financial_rating, ai_suitability, impact_order, rating_confidence, decision_exists)
- `types/hierarchy.ts`: L4Activity interface — the scoring input type
- `types/scoring.ts`: WEIGHTS, MAX_SCORES, PROMOTION_THRESHOLD constants — pattern for defining dimension weights
- `scoring/confidence.ts`: Pure-function confidence computation from structured fields — same pattern for deterministic dimensions
- `scoring/composite.ts`: computeComposite() — pattern for weighted normalized scoring
- `triage/red-flags.ts`: detectRedFlags() and detectSkillRedFlags() — existing red flag detection logic to adapt for per-L4 detection
- `pipeline/extract-skills.ts`: extractScoringSkills() — pattern for flattening hierarchy; surviving L4s will use similar expansion in Phase 22

### Established Patterns
- Pure functions with no I/O for scoring logic
- Result type pattern: `{success, data} | {success, error}`
- Constants defined in types/ modules (WEIGHTS, MAX_SCORES, PROMOTION_THRESHOLD)
- Zod schemas in schemas/ with TypeScript types inferred via z.infer
- Co-located test files with node:test and makeL3()/makeL4() helpers

### Integration Points
- `cli.ts`: Add --top-n flag (Commander option) alongside existing --backend, --concurrency flags
- `pipeline/pipeline-runner.ts`: Deterministic pre-scoring + filtering step inserted before LLM scoring
- `types/scoring.ts`: New PreScoreResult type and dimension weight constants
- Output directory: New pre-score TSV artifact alongside existing evaluation outputs

</code_context>

<deferred>
## Deferred Ideas

- Dimension weight configurability via CLI flags — ADVN-01, deferred until Ford validation
- Overlap group deduplication of near-duplicate survivors — ADVN-02
- Tier-aware top-N slot allocation (Tier 1 always passes) — ADVN-03
- Pre-score histogram in summary reports — ADVN-05

</deferred>

---

*Phase: 21-types-deterministic-foundation*
*Context gathered: 2026-03-13*
