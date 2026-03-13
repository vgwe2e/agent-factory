# Domain Pitfalls: v1.3 L4 Two-Pass Scoring Funnel

**Domain:** Adding deterministic L4 pre-scoring funnel and consolidated LLM scoring to existing Aera Skill Feasibility Engine
**Researched:** 2026-03-13
**Focus:** Integration pitfalls when shifting scoring granularity from skill/L3 to L4, replacing 3 LLM calls with deterministic pre-score + 1 consolidated LLM call, and adapting downstream consumers

---

## Critical Pitfalls

Mistakes that cause rewrites, score corruption, or pipeline breakage.

### Pitfall 1: Score Calibration Drift Between Deterministic and LLM Scores

**What goes wrong:** The deterministic pre-score uses algorithmic rules (financial_rating, ai_suitability, impact_order, rating_confidence, decision_exists) to produce a numeric score. The LLM consolidated call produces its own scores. The two scoring systems operate on different scales, use different evidence, and reward different qualities. A deterministic score of 0.75 does not mean the same thing as an LLM composite of 0.75. When the pipeline combines or compares them, rankings become incoherent -- high-deterministic-score items get low LLM scores and vice versa, confusing consumers of the output.

**Why it happens:** The existing system has 9 sub-dimensions across 3 lenses (data_readiness, aera_platform_fit, archetype_confidence, decision_density, financial_gravity, impact_proximity, confidence_signal, value_density, simulation_viability), each scored 0-3 by the LLM with detailed rubrics. A deterministic pre-score can only assess a subset: financial_rating maps loosely to financial_gravity, ai_suitability maps loosely to aera_platform_fit, but there is no deterministic proxy for simulation_viability or archetype_confidence. The deterministic score rewards "data completeness" while the LLM rewards "platform fit quality." These are correlated but not identical. Developers assume high correlation and get burned when the top-N from deterministic scoring includes items the LLM would have ranked low.

**Consequences:** The top-N filter passes through L4s that are data-rich but platform-poor (or vice versa). LLM budget is wasted on low-quality candidates while strong candidates were filtered out by the deterministic pass. Final reports show inconsistent rankings -- an L4 with deterministic score 0.82 gets LLM composite 0.45, undermining trust in the entire system.

**Prevention:**
1. **Calibration dataset:** Before building the funnel, run 50-100 L4s through BOTH the deterministic scorer AND the full 3-call LLM pipeline. Compute rank correlation (Spearman rho). If rho < 0.6, the deterministic features are insufficient -- add more features or widen the top-N to compensate.
2. **Overshoot the funnel:** Set top-N = 2x the expected simulation count initially. Tighten only after validating correlation on real data.
3. **Never combine the two scores arithmetically.** The deterministic score is a filter (pass/fail for LLM phase), not a component of the final composite. Final composite comes exclusively from the LLM.
4. **Log both scores side-by-side** in the output TSV so calibration drift is visible over time.

**Detection:** After each run, compute rank correlation between deterministic pre-score and LLM composite for the top-N. If Spearman rho drops below 0.5, the deterministic scorer needs retuning.

**Phase that should address this:** Deterministic pre-scoring implementation phase. Build the calibration test BEFORE the filter logic.

---

### Pitfall 2: Top-N Threshold Sensitivity Creating Brittle Results

**What goes wrong:** The --top-n CLI flag creates a hard cutoff. With 826 L4 candidates, the difference between rank 50 and rank 51 may be a deterministic score delta of 0.001. Small changes to the scoring formula (rounding, field weighting) reshuffle the boundary. The same input data produces different LLM-scored results depending on tiny, non-meaningful score differences.

**Why it happens:** The Ford hierarchy has clusters of similar L4 activities (e.g., 15 procurement L4s with identical financial_rating=HIGH, ai_suitability=HIGH). Deterministic scoring from structured fields produces many tied or near-tied scores. A hard cutoff at rank N is arbitrary within these clusters.

**Consequences:** (1) Non-reproducibility: adding one L4 activity to the export reshuffles the boundary, changing which L4s get LLM-scored. (2) Cluster splitting: related L4s within the same L3 get inconsistent treatment -- some scored, some filtered. Reports show gaps in L3 coverage that confuse stakeholders. (3) Over-sensitivity to --top-n value: changing from 50 to 55 changes results significantly, making the parameter feel arbitrary.

**Prevention:**
1. **Tie-breaking with secondary sort:** When deterministic scores are equal, use a deterministic tiebreaker (L4 ID alphabetical, or parent L3 group completeness). Document the tiebreaker.
2. **Cluster-aware cutoff:** Instead of hard rank N, include all L4s whose deterministic score >= the score of the Nth item. This may admit N+K items but preserves cluster coherence.
3. **L3-group preservation:** If any L4 within an L3 group passes the cutoff, include ALL L4s from that L3 group. This prevents partial L3 coverage in reports. Cost: may admit 10-20% more LLM calls than strict top-N.
4. **Sensitivity analysis in tests:** Write a test that runs the deterministic scorer on the Ford export with top-N = 48, 50, 52. Assert that the overlap between the three sets is > 90%. If not, the scoring formula has insufficient discrimination.

**Detection:** Log the score distribution at the cutoff boundary. If score[N] - score[N+5] < 0.01, warn that the cutoff is in a dense region.

**Phase that should address this:** CLI/filter implementation phase. Design the cutoff logic with cluster awareness from the start, not as a patch.

---

### Pitfall 3: Consolidated LLM Prompt Quality Degradation

**What goes wrong:** Replacing 3 focused lens prompts (technical: 1,200 tokens, adoption: 1,100 tokens, value: 900 tokens) with 1 consolidated prompt means cramming 9 sub-dimensions, 3 rubrics, and all constraints into a single system message. The LLM's attention degrades on later sub-dimensions, producing lower-quality and less-differentiated scores for dimensions that appear late in the prompt.

**Why it happens:** The current 3-call architecture has a deliberate advantage: each prompt is laser-focused. The technical prompt includes Aera knowledge base context (which the adoption prompt does not need). The value prompt includes company financials (which the technical prompt does not need). A consolidated prompt must include ALL context for ALL lenses, inflating the system message significantly. With Qwen 2.5 32B at 8K context, this risks:
- System message consuming 4-5K tokens, leaving only 3K for the L4 data and response
- Positional bias: sub-dimensions described first (data_readiness, aera_platform_fit) get more attention than those described last (value_density, simulation_viability)
- Rubric interference: constraints from one lens leak into scoring of another (e.g., "do not score platform_fit >= 2 without citing capabilities" causing the LLM to also demand citations for financial_gravity)

**Consequences:** Score distributions collapse. Instead of discriminating across 9 sub-dimensions, the LLM produces clustered, undifferentiated scores. The adoption lens (currently weighted 0.45 -- the most important) may suffer most because its 4 sub-dimensions get squeezed between technical and value rubrics. The engine loses its core differentiator: adoption-weighted scoring.

**Prevention:**
1. **Measure before committing:** Run 20 L4s through both the 3-call pipeline and a consolidated prompt. Compare per-subdimension score variance. If consolidated prompt variance is <50% of 3-call variance, the prompt is too compressed.
2. **Two-call compromise:** If 1 call degrades quality, consider 2 calls: (a) deterministic pre-score + LLM platform_fit check, (b) LLM adoption+value combined (these share more context overlap). This halves LLM cost vs 3 calls while preserving quality.
3. **Structured prompt sections:** Use explicit XML-like delimiters (`<TECHNICAL_RUBRIC>`, `<ADOPTION_RUBRIC>`, `<VALUE_RUBRIC>`) to segment the consolidated prompt. This reduces cross-rubric interference.
4. **Output structure matters:** Require the LLM to produce sub-dimensions in a fixed order. Include a worked example in the prompt showing distinct scores across sub-dimensions.
5. **Context windowing:** Only include context relevant to the remaining LLM assessment. If deterministic scoring already handles financial_gravity and impact_proximity, the LLM prompt can omit those sub-dimensions entirely, reducing bloat.

**Detection:** Track per-subdimension score standard deviation across a run. If stdev < 0.3 for any subdimension (on a 0-3 scale), that subdimension is not discriminating.

**Phase that should address this:** Consolidated prompt design phase. Prototype and measure BEFORE replacing the existing 3-call pipeline.

---

### Pitfall 4: Simulation Pipeline Adapter Breakage

**What goes wrong:** The simulation pipeline (`simulation-pipeline.ts`) expects `SimulationInput` which contains `opportunity: L3Opportunity`, `l4s: L4Activity[]`, and `archetype`. The adapter (`scoring-to-simulation.ts`) currently groups skill-level scoring results back to L3, picking the best skill per L3 group. When v1.3 shifts the scoring unit to L4, this adapter breaks silently: it still groups by `l3Name`, but the scoring results no longer carry the same `SkillWithContext` fields. The simulation receives incomplete or wrong input.

**Why it happens:** The current flow is: Score skills -> group by L3 -> pick best per L3 -> build SimulationInput with L3Opportunity + all L4s under that L3. The v1.3 flow will be: Deterministic score L4s -> LLM score top-N L4s -> ??? -> simulation. The question mark is the adapter. If the adapter still groups by L3 and picks the "best L4" per L3, it may:
- Pick an L4 whose archetype does not match the L3's lead_archetype
- Include L4 activities in the simulation that were filtered OUT by the deterministic pass (the current adapter uses ALL L4s under an L3, not just scored ones)
- Lose skill-level execution details that simulation generators need (scenario-spec-gen uses problem_statement, actions, constraints)

**Consequences:** Simulation artifacts are generated from L3-level data that no longer reflects the actual scoring unit. Component maps cite Aera components from L4s that were not evaluated. Mock tests reference decisions from unscored activities. The simulation output is decorrelated from the scoring output.

**Prevention:**
1. **Redesign the adapter for L4-first flow:** The new adapter should take scored L4s (not skills, not L3 rollups) and pass them directly to simulation. Each L4 gets its own simulation, not one simulation per L3 group.
2. **Or, if L3-level simulation is preserved:** The adapter must filter `l4s` to only include L4s that passed BOTH deterministic and LLM scoring. This prevents the simulation from seeing unscored L4s.
3. **Type-level enforcement:** Change `SimulationInput` to accept either L3Opportunity or a new `L4ScoredActivity` type. Use a discriminated union so the simulation generators can handle both inputs. This prevents silent structural mismatches.
4. **Integration test:** Score 5 L4s, run them through the adapter, verify every field in the resulting SimulationInput is populated and consistent. Pay special attention to `archetype`, `composite`, and `l4s` array contents.

**Detection:** Add an assertion in the simulation pipeline: `assert(input.l4s.every(l4 => scoredL4Ids.has(l4.id)))` to verify every L4 fed to simulation was actually scored.

**Phase that should address this:** Simulation adapter phase. Do not defer this to "after scoring works" -- design the adapter contract alongside the scoring redesign.

---

### Pitfall 5: Checkpoint Format Migration Breaking Resume

**What goes wrong:** The v1.2 checkpoint schema stores `skillId` (or `l3Name` for backward compat) as the completion key. V1.3 changes the scoring unit to L4 activities. If the checkpoint format is updated to use `l4Id` instead of `skillId`, existing checkpoint files from interrupted v1.2 runs become unreadable. Worse, a partially-completed v1.3 run cannot resume if the checkpoint schema changes mid-development.

**Why it happens:** The checkpoint schema (`CheckpointSchema` in `infra/checkpoint.ts`) uses `version: z.literal(1)`. Adding L4-based entries requires either: (a) keeping version 1 with `l4Id` added as optional (backward-compatible but confusing), or (b) bumping to version 2 (clean but breaks resume of in-progress runs). Developers often pick (b) and forget that a user might have a partially-scored run from v1.2 that they expect to resume after upgrading to v1.3.

**Consequences:** (1) User upgrades to v1.3 mid-run, checkpoint is silently ignored, 400+ already-scored items are re-scored (hours of wasted GPU time). (2) Developer adds `l4Id` field but does not update `getCompletedNames()` to check it, causing the resume logic to skip nothing (all items re-scored). (3) Tests pass because they create fresh checkpoints; the migration path is never tested.

**Prevention:**
1. **Additive schema migration:** Keep `version: 1`. Add `l4Id` as an optional field alongside `skillId` and `l3Name`. Update `getCompletedNames()` to check all three: `e.l4Id ?? e.skillId ?? e.l3Name`. This is ugly but safe.
2. **If version bump is needed:** Implement a `migrateCheckpoint(v1) -> v2` function. Load the checkpoint, check version, migrate if needed, save. Test the migration with a real v1 checkpoint fixture from the Ford evaluation.
3. **Checkpoint migration test:** Take a real `.checkpoint.json` from `evaluation-vllm/` and write a test that loads it through the v1.3 code. Verify it reads correctly and resume logic skips the right items.
4. **Two-phase rollout:** Phase A: add `l4Id` field, keep `skillId` working. Phase B: after all users have migrated, deprecate `skillId`.

**Detection:** CI test that loads a v1.2 checkpoint fixture and verifies `getCompletedNames()` returns a non-empty set.

**Phase that should address this:** Checkpoint migration should be the FIRST implementation task, before any scoring changes. The pipeline must be able to resume before it can run.

---

## Moderate Pitfalls

### Pitfall 6: Deterministic Scorer Feature Selection Bias

**What goes wrong:** The deterministic scorer uses L4 structured fields as features: `financial_rating` (HIGH/MEDIUM/LOW), `ai_suitability` (HIGH/MEDIUM/LOW/NOT_APPLICABLE), `impact_order` (FIRST/SECOND), `rating_confidence` (HIGH/MEDIUM/LOW), `decision_exists` (boolean). These fields have low cardinality (3-4 values each). With 826 L4s, the scorer produces only ~50-80 distinct score values, creating massive ties. The feature set does not include any skill-level data (actions, constraints, execution), which is where the real discriminating signal lives.

**Prevention:** Include skill-level features in the deterministic score: count of actions, count of constraints, presence of execution.target_systems, non-null problem_statement fields, max_value magnitude. These continuous/count features break ties and increase discrimination. Test by computing the number of distinct deterministic scores across the Ford 826: target > 200 distinct values.

**Phase that should address this:** Deterministic scoring design phase. Validate feature discrimination before building the full pipeline.

### Pitfall 7: L3 Metadata Label Orphaning

**What goes wrong:** V1.3 keeps L3 names as "metadata labels for report grouping only." But existing report formatters (format-summary.ts, format-tier1-report.ts, format-scores-tsv.ts, format-dead-zones.ts) heavily rely on L3-level aggregation. If scoring results no longer carry L3 context (because the scoring unit is L4), these formatters produce empty or broken reports.

**Prevention:** Every L4 scoring result MUST carry `l3Name`, `l2Name`, `l1Name` fields (inherited from the L4Activity's `l3`, `l2`, `l1` fields). This is already the pattern in `SkillWithContext` -- ensure the new L4 scoring result type preserves it. Write a report formatter test with L4-level scoring results and verify all existing report formats render correctly with L3 grouping intact.

**Phase that should address this:** Types/schema design phase (first phase). Get the type contract right before implementing scorers.

### Pitfall 8: Triage Pipeline Becomes Redundant but Is Not Removed

**What goes wrong:** The v1.2 triage pipeline assigns L3 opportunities to tiers (Tier 1/2/3) based on red flags and value thresholds. V1.3 replaces this with deterministic L4 pre-scoring. If triage is left in the pipeline, there are now TWO filtering steps (triage at L3 level, then deterministic pre-score at L4 level) that can conflict. An L4 passes the deterministic filter but its parent L3 was triaged to Tier 3, so the pipeline applies the wrong model (8B instead of 32B) or skips it entirely due to --max-tier.

**Prevention:** Decide explicitly: does triage survive in v1.3, or does the deterministic pre-score replace it? If triage survives, it must operate on L4s (not L3s) and its output must be consistent with the deterministic pre-score. If triage is removed, update the CLI to remove --max-tier or redefine it in terms of deterministic score ranges. Do not leave two conflicting filter stages in the pipeline.

**Phase that should address this:** Pipeline redesign phase. Resolve the triage/deterministic-scoring overlap in the architecture before implementation.

### Pitfall 9: LLM Call Count Regression from Insufficient Deterministic Filtering

**What goes wrong:** The whole point of the two-pass funnel is reducing 826 x 3 = 2,478 LLM calls to N x 1 calls. If the deterministic pre-score is too lenient (high top-N) or the consolidated LLM prompt requires follow-up calls (retries, schema validation failures), actual LLM call count approaches or exceeds v1.2 levels. The cost savings that justified the rewrite evaporate.

**Prevention:** Set a hard budget target: max LLM calls = top-N x 1.5 (allowing 50% retry overhead). Track actual vs budgeted calls per run. If actual exceeds budget by > 20%, the funnel is not working -- either tighten deterministic filtering or fix the consolidated prompt's success rate. Log LLM call count prominently in the pipeline summary.

**Phase that should address this:** End-to-end integration testing phase. Verify call count against budget target with real Ford data.

### Pitfall 10: Existing Test Suite Assuming 3-Call Architecture

**What goes wrong:** The codebase has 552 tests, many of which mock `chatFn` and expect exactly 3 calls per scoring unit (one per lens). V1.3 changes this to 1 call for the consolidated LLM prompt plus 0 calls for deterministic scoring. Tests that assert `chatFn.callCount === 3` or that inject separate technical/adoption/value mock responses will all fail. The developer starts disabling tests to "fix later" and never does.

**Prevention:**
1. **Do not delete tests.** Mark the 3-call tests as `{ skip: true, reason: 'v1.3 consolidated prompt' }` with a tracking comment.
2. **Write replacement tests first** (TDD). The new consolidated prompt needs its own test suite: (a) test that a single chatFn call produces all 9 sub-dimensions, (b) test that deterministic scoring produces correct scores without any chatFn calls, (c) test that top-N filtering passes the right L4s.
3. **Keep the 3-call path as a fallback.** If the consolidated prompt fails Zod validation, fall back to 3 separate calls. This preserves the existing test infrastructure as the fallback path's test suite.

**Phase that should address this:** Every implementation phase. Write new tests BEFORE changing existing code. Never reduce test count.

---

## Minor Pitfalls

### Pitfall 11: Deterministic Score Weights Hardcoded Without Configuration

**What goes wrong:** The deterministic pre-scorer assigns weights to L4 fields (e.g., financial_rating=HIGH gets +3, ai_suitability=HIGH gets +2). These weights are hardcoded. When running on a different client export where financial_rating distributions differ, the scorer produces a different quality of filtering. There is no way to tune without code changes.

**Prevention:** Extract weights into a config object with sensible defaults. Expose via --prescore-weights CLI flag or a config file. At minimum, log the weights used at the start of each run.

### Pitfall 12: Output Directory Structure Inconsistency

**What goes wrong:** V1.2 writes to `evaluation-{backend}/evaluation/`. V1.3 output includes new artifacts (deterministic-scores.tsv, prescore-distribution.json) but these get written alongside v1.2 artifacts. Users comparing v1.2 and v1.3 runs cannot easily distinguish which artifacts came from which pipeline version.

**Prevention:** Include pipeline version in the output metadata. Add a `pipeline-metadata.json` to the evaluation directory with version, timestamp, top-N, feature weights, and call count. This makes each run self-documenting.

### Pitfall 13: Forgetting to Update progress.ts for Two-Phase Progress

**What goes wrong:** The current `createProgressTracker` reports progress as "X of Y scored" with a single counter. V1.3 has two distinct phases: deterministic pre-scoring (fast, 826 items in seconds) and LLM scoring (slow, N items in minutes). Using a single progress tracker makes it look like the pipeline is 99% done after the deterministic phase, then stalls for 30 minutes on the LLM phase.

**Prevention:** Create a two-phase progress tracker: Phase 1 reports "Pre-scoring: X/826" (expected: seconds). Phase 2 reports "LLM scoring: X/N" (expected: minutes per item). Log the phase transition clearly.

### Pitfall 14: Composite Score Formula Assuming 3-Lens Input

**What goes wrong:** `computeComposite()` in `scoring/composite.ts` takes `technicalTotal`, `adoptionTotal`, `valueTotal` as separate arguments and applies the 0.30/0.45/0.25 weights. If the consolidated LLM prompt produces a different output structure (e.g., all 9 sub-dimensions in a flat object instead of grouped by lens), the composite computation needs to regroup them. Developers forget to update `computeComposite()` and either pass wrong values or create a duplicate composite function.

**Prevention:** Keep the existing `computeComposite()` interface. The consolidated prompt should still return scores grouped by lens (technical, adoption, value). The prompt output schema should mirror the existing lens grouping even if it is a single call. This preserves all downstream consumers (composite, reports, TSV formatters).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Type/Schema Design | L3 metadata orphaning (Pitfall 7), checkpoint format incompatibility (Pitfall 5) | Define new ScoringResult type that preserves L3/L2/L1 fields. Plan checkpoint migration. |
| Deterministic Pre-Scoring | Feature selection bias (Pitfall 6), calibration drift (Pitfall 1) | Build calibration test suite alongside scorer. Validate feature discrimination on Ford data. |
| Top-N CLI Filter | Threshold sensitivity (Pitfall 2), cluster splitting | Implement cluster-aware cutoff, not hard rank cutoff. Sensitivity test with N-2, N, N+2. |
| Consolidated LLM Prompt | Quality degradation (Pitfall 3), test suite breakage (Pitfall 10) | Prototype and A/B test against 3-call pipeline before committing. Write new tests first. |
| Simulation Adapter | Adapter breakage (Pitfall 4) | Redesign adapter contract alongside scoring redesign. Integration test with scored L4 input. |
| Checkpoint Migration | Resume breakage (Pitfall 5) | Implement migration FIRST. Test with real v1.2 checkpoint fixture. |
| Pipeline Integration | Triage/deterministic overlap (Pitfall 8), LLM call regression (Pitfall 9) | Resolve triage role in architecture. Set and enforce LLM call budget. |
| Progress/Reporting | Two-phase progress (Pitfall 13), output structure (Pitfall 12) | Two-phase progress tracker. Pipeline metadata in output directory. |

---

## Risk Matrix

| Pitfall | Likelihood | Impact | Phase to Address | Risk Level |
|---------|-----------|--------|-----------------|------------|
| Score calibration drift (#1) | HIGH | HIGH | Deterministic scoring | CRITICAL |
| Top-N threshold sensitivity (#2) | HIGH | MEDIUM | CLI filter | HIGH |
| Consolidated prompt quality loss (#3) | MEDIUM | HIGH | LLM prompt design | HIGH |
| Simulation adapter breakage (#4) | HIGH | HIGH | Simulation adapter | CRITICAL |
| Checkpoint format migration (#5) | MEDIUM | HIGH | First phase | HIGH |
| Feature selection bias (#6) | HIGH | MEDIUM | Deterministic scoring | MEDIUM |
| L3 metadata orphaning (#7) | MEDIUM | MEDIUM | Type design | MEDIUM |
| Triage/deterministic overlap (#8) | LOW | MEDIUM | Architecture | MEDIUM |
| LLM call count regression (#9) | MEDIUM | MEDIUM | Integration testing | MEDIUM |
| Test suite breakage (#10) | HIGH | MEDIUM | Every phase | MEDIUM |

---

## Sources

- Existing codebase analysis: `src/scoring/scoring-pipeline.ts`, `src/scoring/lens-scorers.ts`, `src/scoring/composite.ts`, `src/scoring/prompts/technical.ts`, `src/scoring/prompts/adoption.ts`, `src/scoring/prompts/value.ts`
- Existing codebase analysis: `src/pipeline/pipeline-runner.ts`, `src/pipeline/scoring-to-simulation.ts`, `src/pipeline/extract-skills.ts`
- Existing codebase analysis: `src/infra/checkpoint.ts` (checkpoint schema, resume logic, atomic write pattern)
- Existing codebase analysis: `src/simulation/simulation-pipeline.ts`, `src/types/simulation.ts` (SimulationInput contract)
- Existing codebase analysis: `src/types/hierarchy.ts` (L4Activity, SkillWithContext, L3Opportunity field inventory)
- Existing codebase analysis: `src/types/scoring.ts` (ScoringResult, WEIGHTS, MAX_SCORES, PROMOTION_THRESHOLD)
- Project context: `.planning/PROJECT.md` (v1.3 target features, Ford 826 L4 candidate count, pipeline flow)
- LLM prompt engineering: Positional bias in long prompts is well-documented in transformer attention literature; consolidated prompts with >9 output fields consistently show degradation in later-positioned fields
- Score calibration: Rank correlation (Spearman rho) between heuristic and model-based scores is a standard validation technique for two-stage ranking systems
