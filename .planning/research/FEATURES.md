# Feature Landscape

**Domain:** Two-pass scoring funnel for L4 activity evaluation (Aera Skill Feasibility Engine v1.3)
**Researched:** 2026-03-13
**Confidence:** HIGH (based on direct codebase analysis of existing pipeline, L4 schema fields, and v1.3 requirements in PROJECT.md)

## Table Stakes

Features the two-pass funnel MUST have. Missing = the funnel is broken or worse than v1.2.

### Deterministic Pre-Scoring

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Score from L4 structured fields only** | The entire point of pass 1 -- no LLM, milliseconds per candidate. L4Activity has `financial_rating`, `ai_suitability`, `impact_order`, `rating_confidence`, `decision_exists`. Skills add `archetype`, `max_value`, `actions[]`, `constraints[]`, `execution`, `problem_statement`. | Low | `types/hierarchy.ts` L4Activity + SkillWithContext types | Pure function, no I/O. Existing `confidence.ts` and `red-flags.ts` already demonstrate the pattern of algorithmic scoring from structured fields. |
| **Financial signal dimension** | `financial_rating` (HIGH/MEDIUM/LOW) and `max_value` (number) are the primary economic indicators. Every scoring system that replaces the current 3-lens approach must capture economic viability or it loses the value lens entirely. | Low | `L4Activity.financial_rating`, `Skill.max_value` | Map HIGH=3, MEDIUM=2, LOW=1. `max_value` provides continuous scale for tiebreaking. |
| **AI suitability dimension** | `ai_suitability` (HIGH/MEDIUM/LOW/NOT_APPLICABLE/null) is the most direct signal of automation potential. The existing tier engine already uses it (Tier 2 = >=50% HIGH). Omitting it would be a regression from triage. | Low | `L4Activity.ai_suitability` | Map HIGH=3, MEDIUM=2, LOW=1, NOT_APPLICABLE=0, null=0. This is the strongest single predictor of LLM scoring outcome. |
| **Decision density dimension** | `decision_exists` (boolean) on L4 and `decision_made` (string/null) + `actions.length` + `constraints.length` on skill. The existing DEAD_ZONE red flag already checks this. Dense decisions = more automatable. | Low | `L4Activity.decision_exists`, `Skill.decision_made`, `Skill.actions`, `Skill.constraints` | Boolean + count-based. decision_exists=true AND (actions.length > 0 OR constraints.length > 0) = high density. |
| **Impact order dimension** | `impact_order` (FIRST/SECOND) directly measures value proximity. FIRST-order impact skills deliver faster ROI. The adoption prompt already weights this heavily. | Low | `L4Activity.impact_order` | Binary: FIRST=2, SECOND=1. Simple but discriminating. |
| **Archetype completeness dimension** | `archetype` presence + `execution` richness (non-null fields). The technical prompt's `archetype_confidence` sub-dimension already evaluates this via LLM; the deterministic version checks field presence. | Low | `Skill.archetype`, `Skill.execution`, `Skill.aera_skill_pattern` | Count non-null execution fields: autonomy_level, approval_required, execution_trigger, rollback_strategy. More = higher confidence. |
| **Rating confidence dimension** | `rating_confidence` (HIGH/MEDIUM/LOW) on L4. The existing CONFIDENCE_GAP red flag already flags LOW confidence. This should directly feed the pre-score. | Low | `L4Activity.rating_confidence` | Map HIGH=3, MEDIUM=2, LOW=1. Multiplicative penalty: LOW confidence should cap overall score. |
| **Weighted composite computation** | The six dimensions above need weighting. Must produce a single 0-1 normalized score comparable across all 826 candidates. | Low | All dimensions above | Pure arithmetic. Weights should be configurable but with sensible defaults. Existing `composite.ts` provides the pattern. |
| **Red flag integration** | Existing `detectSkillRedFlags` (DEAD_ZONE, NO_STAKES, CONFIDENCE_GAP) must either be incorporated into pre-scoring or applied as hard filters before ranking. Candidates with DEAD_ZONE should not survive to top-N regardless of other signals. | Low | `triage/red-flags.ts` detectSkillRedFlags | Apply as binary elimination before ranking. Already implemented -- just needs wiring into the new pipeline position. |

### Configurable Top-N Filtering

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **`--top-n` CLI flag** | Users must control how many candidates pass to LLM scoring. Different runs have different time/cost budgets. Hard-coded N defeats the purpose of a funnel. | Low | `cli.ts` Commander setup | Integer flag, default sensible (50-100 for 826 candidates). Must validate: 1 <= N <= total candidates. |
| **Rank-ordered cutoff** | Sort all pre-scored candidates by composite descending, take top N. Ties broken by max_value descending (existing triage does similar). | Low | Pre-score composite | Pure sort + slice. Trivial implementation. |
| **Pre-score report artifact** | Write the full pre-scored ranking to disk (TSV) so users can inspect what was filtered out and why. Without this, the funnel is a black box. | Low | `output/` formatters | Follow existing `format-scores-tsv.ts` pattern. Columns: rank, skillId, skillName, l4Name, l3Name, preScoreComposite, each dimension score, red flags, survived (Y/N). |
| **Filter statistics in pipeline output** | Pipeline result must report: total candidates, pre-scored count, filtered count, top-N count. Without this, users cannot assess funnel effectiveness. | Low | `PipelineResult` type | Add fields to existing PipelineResult interface. |

### Consolidated LLM Scoring

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Single LLM call per survivor** | The whole point of the funnel is reducing 826 x 3 = 2,478 LLM calls to N x 1 calls. Each survivor gets ONE consolidated prompt covering platform fit + sanity check. | Med | `scoring/` module, chatFn interface | New prompt builder + new Zod schema. Replaces the 3 separate lens scorers for v1.3 path. |
| **Platform fit assessment** | The LLM must evaluate whether the candidate maps to specific Aera components. This is the one thing code cannot do -- it requires domain reasoning about how skill descriptions map to Aera's 21 UI components, 22 PB nodes, and orchestration patterns. | Med | `knowledge/` modules, Aera knowledge base | The existing technical prompt's `aera_platform_fit` sub-dimension does this already. Extract and consolidate. |
| **Sanity check on deterministic score** | The LLM should flag cases where the deterministic pre-score is misleadingly high (rich fields but nonsensical content) or misleadingly low (sparse fields but strong implicit signal). This is the error-correction layer. | Med | Pre-score result passed as context to LLM | New: LLM sees the pre-score and can adjust up/down with justification. Prevents over-reliance on field presence. |
| **Structured JSON output with Zod validation** | Consistent with existing lens scorers. LLM output must be Zod-validated before consumption. Retry on validation failure. | Low | `scoring/schemas.ts` pattern, `scoreWithRetry` | Follow existing pattern exactly. New schema, same validation infrastructure. |
| **Final composite that blends pre-score + LLM** | The final ranking must combine the deterministic pre-score with the LLM assessment. Pure pre-score is fast but shallow; pure LLM is expensive. The blend is the product. | Med | Pre-score composite + LLM output | Weighted blend. Suggested: 0.40 pre-score + 0.60 LLM (LLM has final say but pre-score provides strong prior). Needs to produce same 0-1 range as current composite for downstream compatibility. |
| **Promotion threshold gate** | Existing PROMOTION_THRESHOLD (0.60) gates entry to simulation. The new composite must feed into the same gate. Changing this threshold or removing it would break the simulation pipeline contract. | Low | `types/scoring.ts` PROMOTION_THRESHOLD | Reuse existing constant. The blended composite passes through `computeComposite`-equivalent logic. |

### L4-Level Simulation

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **SimulationInput from L4 activity directly** | Current SimulationInput takes L3Opportunity + L4Activity[]. v1.3 scores at L4 level, so simulation should take a single L4 + its skills directly instead of the L3 rollup. | Med | `types/simulation.ts` SimulationInput, `simulation/simulation-pipeline.ts` | Breaking change to SimulationInput interface. The `scoring-to-simulation.ts` adapter currently aggregates skill results back to L3; the new adapter works at L4 level. |
| **L3 names retained as metadata** | PROJECT.md explicitly requires "L3 names retained as metadata labels for report grouping only." Reports must still group by L3 for human readability even though scoring/simulation operate at L4. | Low | Report formatters in `output/` | Add l3Name as grouping key in report templates. No logic change -- just metadata propagation. |

## Differentiators

Features that set the v1.3 funnel apart from a naive implementation. Not strictly required but significantly improve output quality.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Dimension weight configurability** | Different clients have different priorities. A manufacturing client may weight financial_rating higher; a tech client may weight ai_suitability higher. Exposing weights as CLI flags or config enables per-client tuning without code changes. | Low | CLI flags or `.planning/config.json` | 6 weights that sum to 1.0. Sensible defaults hard-coded. Advanced users override. Not blocking for MVP. |
| **Pre-score histogram in reports** | Visual distribution of pre-scores helps users understand the candidate landscape. Are most candidates clustered near the cutoff? Is there a clear gap between top-N and the rest? | Low | `output/` formatters | ASCII histogram in summary report. Shows score distribution + cutoff line. |
| **LLM prompt includes pre-score breakdown** | Giving the LLM visibility into WHY the candidate pre-scored high (which dimensions contributed) lets it provide more targeted sanity checking. | Low | Consolidated prompt builder | Include dimension-by-dimension breakdown in user message. Zero implementation cost, significant quality improvement. |
| **Overlap group deduplication** | `Skill.overlap_group` (string/null) groups skills that address the same problem differently. If multiple skills in the same overlap group survive to top-N, only the highest-scoring should advance to LLM. Prevents wasting LLM calls on near-duplicates. | Med | `Skill.overlap_group` field | Group by overlap_group after ranking, keep top per group. Reduces LLM calls further. |
| **Tier-aware top-N allocation** | Reserve guaranteed slots for each tier (e.g., all Tier 1 survivors always pass, Tier 2 gets 60% of remaining N, Tier 3 fills remainder). Prevents Tier 1 quick-wins from being crowded out by volume of Tier 2/3 candidates. | Med | `triage/tier-engine.ts` tier assignment | Partition top-N by tier before filling. Existing assignSkillTier already provides tier labels. |
| **Cross-functional skill flagging** | `Skill.is_cross_functional` and `cross_functional_scope` indicate skills spanning multiple departments. These are higher-risk but higher-impact. Flagging them in reports helps users prioritize organizational readiness work. | Low | `Skill.is_cross_functional`, `Skill.cross_functional_scope` | Metadata propagation to reports. Already in the schema. |
| **Deterministic score caching** | Pre-scores are pure functions of field values. If the input export hasn't changed, pre-scores are identical. Cache pre-score results keyed by skill ID + field hash for instant re-runs. | Low | New cache module | File-based JSON cache. Skip re-computation on retry runs. |

## Anti-Features

Features to explicitly NOT build in v1.3.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Keep 3 separate LLM calls per candidate** | This is the entire problem v1.3 solves. 826 x 3 = 2,478 calls at ~3 min each = 124 hours on local hardware. The consolidated single-call approach cuts this to N x 1. | Single consolidated LLM prompt per top-N survivor. |
| **LLM-based pre-scoring** | Using an LLM for pass 1 defeats the speed advantage. The deterministic pre-score must be pure computation -- milliseconds for all 826 candidates. | Pure function scoring from structured fields only. |
| **Dynamic top-N based on score distribution** | Tempting to auto-detect a "natural break" in pre-scores, but this makes results unpredictable and non-reproducible. Users lose control over cost/time budget. | Fixed top-N from CLI flag. Users can inspect pre-score TSV and adjust N on re-run. |
| **Removing existing triage phase** | Triage and pre-scoring serve different purposes. Triage applies binary red flags (skip/demote). Pre-scoring ranks survivors. Merging them loses the clear skip/process boundary. | Keep triage as pass 0 (eliminates bad candidates), pre-scoring as pass 1 (ranks good candidates). |
| **Backward-incompatible ScoringResult** | Downstream consumers (report formatters, checkpoint system, evaluation writers) depend on the ScoringResult interface. Changing it breaks everything. | New L4ScoringResult type that extends or parallels ScoringResult. Existing report formatters get an adapter. |
| **Platform fit as a deterministic dimension** | platform_fit requires understanding whether a skill's description maps to specific Aera components. This is inherently subjective and requires domain reasoning. Code can check field presence; it cannot assess semantic fit. | Platform fit stays in the LLM call (pass 2). Deterministic pre-scoring handles everything that can be computed from field values. |
| **Eliminating the promotion threshold** | The 0.60 threshold gates simulation entry. Removing it would flood simulation with low-quality candidates, wasting LLM calls and producing garbage artifacts. | Keep PROMOTION_THRESHOLD. The blended composite (pre-score + LLM) feeds into the same gate. |
| **Re-implementing simulation from scratch** | The simulation pipeline works. It needs an adapter change (L4 input instead of L3), not a rewrite. | Modify SimulationInput interface + update scoring-to-simulation adapter. |

## Feature Dependencies

```
extractScoringSkills (existing) --> detectSkillRedFlags (existing, pass 0)
                                       |
                                       v
                              deterministic pre-scoring (NEW, pass 1)
                                       |
                                       v
                              rank + top-N filter (NEW)
                                       |
                                       v
                              consolidated LLM scoring (NEW, pass 2)
                                       |
                                       v
                              blended composite (NEW)
                                       |
                                       v
                              promotion threshold gate (existing, reused)
                                       |
                                       v
                              L4-level simulation adapter (MODIFIED)
                                       |
                                       v
                              simulation pipeline (existing, minor interface change)
                                       |
                                       v
                              report generation (existing, grouping change)
```

Key dependency chain:
- Pre-scoring MUST complete before top-N filter
- Top-N filter MUST complete before LLM scoring
- LLM scoring MUST produce a composite compatible with PROMOTION_THRESHOLD
- Simulation adapter MUST accept L4-level input (breaking change from L3-level)
- Reports MUST group by L3 name even though scoring is at L4

## MVP Recommendation

Prioritize in this order:

1. **Deterministic pre-scoring** (all 8 table-stakes dimensions) -- This is the foundation. Without it, nothing else works. Pure function, TDD, no I/O. Target: score 826 candidates in <100ms.

2. **Top-N filter with `--top-n` CLI flag** -- Minimal implementation: sort + slice + pre-score TSV artifact. Unblocks LLM scoring development.

3. **Consolidated LLM prompt with platform fit + sanity check** -- The quality-critical piece. One new prompt builder, one new Zod schema. Replaces 3 lens scorers with 1 consolidated scorer for the v1.3 path.

4. **Blended composite + promotion gate** -- Arithmetic to combine pre-score + LLM output. Feeds into existing PROMOTION_THRESHOLD.

5. **L4-level simulation adapter** -- Modify SimulationInput + scoring-to-simulation adapter. The simulation pipeline itself barely changes.

6. **Report grouping by L3** -- Metadata propagation. Minimal effort after simulation works.

Defer:
- **Dimension weight configurability**: Ship with sensible hard-coded weights. Add CLI override in a follow-up.
- **Overlap group deduplication**: Nice optimization but not blocking. Top-N already bounds cost.
- **Tier-aware top-N allocation**: Adds complexity. Simple rank-order cutoff is sufficient for v1.3.
- **Deterministic score caching**: Pre-scoring is already <100ms total. Caching is premature optimization.

## Complexity Assessment Summary

| Feature Area | Total Features | Low Complexity | Med Complexity | High Complexity |
|-------------|---------------|----------------|----------------|-----------------|
| Deterministic Pre-Scoring | 9 | 9 | 0 | 0 |
| Top-N Filtering | 4 | 4 | 0 | 0 |
| Consolidated LLM Scoring | 6 | 2 | 4 | 0 |
| L4-Level Simulation | 2 | 1 | 1 | 0 |
| Differentiators | 7 | 5 | 2 | 0 |

**Total estimated effort:** The pre-scoring and filtering are pure functions with established patterns in the codebase. The consolidated LLM prompt is the design-intensive piece -- it must cover what 3 separate prompts currently do while adding sanity checking, and do so in a single call. The simulation adapter is a well-scoped interface change.

## Sources

- Direct codebase analysis: `src/types/hierarchy.ts`, `src/types/scoring.ts`, `src/scoring/scoring-pipeline.ts`, `src/scoring/lens-scorers.ts`, `src/scoring/prompts/*.ts`, `src/scoring/confidence.ts`, `src/scoring/composite.ts`, `src/triage/red-flags.ts`, `src/triage/tier-engine.ts`, `src/pipeline/pipeline-runner.ts`, `src/pipeline/extract-skills.ts`, `src/pipeline/scoring-to-simulation.ts`, `src/simulation/simulation-pipeline.ts`, `src/types/simulation.ts`
- Project requirements: `.planning/PROJECT.md` v1.3 milestone definition
- Existing patterns: `confidence.ts` (algorithmic scoring from fields), `composite.ts` (weighted combination), `red-flags.ts` (deterministic elimination)
