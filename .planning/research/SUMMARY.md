# Project Research Summary

**Project:** Aera Skill Feasibility Engine v1.3 — L4 Two-Pass Scoring Funnel
**Domain:** Pipeline optimization for LLM-based feasibility scoring at scale
**Researched:** 2026-03-13
**Confidence:** HIGH (all research based on direct codebase analysis; no external API or library unknowns)

## Executive Summary

The v1.3 milestone targets a 98% reduction in LLM calls (2,478 down to ~50) by inserting a deterministic pre-scoring pass before the existing LLM scoring phase. The approach is straightforward in concept: score all 826 L4 activity candidates algorithmically using their structured fields, rank them, and let only the top-N survivors through to a single consolidated LLM call that assesses platform fit and sanity-checks the algorithmic score. Zero new dependencies are required; every infrastructure primitive (Semaphore, checkpoint, retry, progress, chatFn injection) is already proven across v1.0–v1.2.

The recommended approach is to build bottom-up in four phases: types and deterministic foundation first (pure functions, no LLM, no pipeline changes), then the consolidated LLM scorer in isolation, then pipeline integration with a `--scoring-mode` feature flag preserving v1.2 behavior for comparison runs, and finally a validation pass comparing promoted sets between modes on real Ford data. The critical architectural decision is to treat the deterministic score as a gate (filter), not a blend with the LLM score. This keeps the two scoring systems cleanly separated and avoids the score calibration drift problem that corrupts rankings when dissimilar scales are arithmetically combined.

The two highest-risk areas are: (1) score calibration between the deterministic pass and LLM output — top-N survivors must meaningfully correlate with what the LLM would have promoted, requiring a calibration test before committing to any top-N value; and (2) the simulation adapter — the current `scoring-to-simulation.ts` groups results by L3 and picks the best skill, which silently breaks when the scoring unit shifts to L4. Both risks are addressable with targeted integration tests and must be designed before implementation, not patched after.

## Key Findings

### Recommended Stack

No new dependencies are required. The deterministic pre-scorer is pure TypeScript arithmetic (5-15 lines per signal function) following the same pattern as `scoring/confidence.ts`. The consolidated LLM prompt follows the same pattern as `scoring/prompts/technical.ts`: pure function returning `ChatMessage[]`, Zod-validated output, `chatFn` injection, `scoreWithRetry` wrapping. All new modules reuse Semaphore, checkpoint, retry-policy, timeout, and progress infrastructure unchanged.

**Core technologies (reused, no additions):**
- TypeScript + Zod + zod-to-json-schema: type safety + LLM output validation — proven across 3 milestones, 552+ tests
- Commander (`--top-n`, `--scoring-mode` flags): same pattern as existing `--max-tier`, `--concurrency`
- In-house Semaphore + checkpoint: bounded concurrency and resume — no changes required
- In-house `callWithResilience` + `withTimeout`: LLM retry and timeout — unchanged interface
- Pino structured logging: funnel statistics output — already in place

### Expected Features

**Must have (table stakes):**
- Deterministic pre-scoring from L4 structured fields only (ai_suitability, financial_rating, decision_exists, impact_order, rating_confidence, plus skill-level continuous fields for tie-breaking) — core funnel gate
- `--top-n` CLI flag with configurable default (50) — controls LLM budget per run
- Pre-score TSV artifact written to output directory — makes the filter transparent and auditable
- Single consolidated LLM call per survivor covering platform fit + deterministic sanity check — the 98% call reduction
- Synthesized `lenses` field on ScoringResult from deterministic signals — ensures all 10+ existing report formatters work unchanged
- Filter statistics in pipeline summary (total candidates, survivors, eliminated, cutoff score) — funnel observability
- L3 names retained as metadata on every scored L4 — report grouping unchanged
- `--scoring-mode two-pass | three-lens` flag — enables A/B validation against v1.2 behavior

**Should have (differentiators):**
- Cluster-aware top-N cutoff (include all L4s tied at the boundary score) — prevents splitting related L4s
- LLM prompt includes deterministic score breakdown — enables targeted sanity checking
- Tier-aware top-N slot allocation (Tier 1 always passes) — prevents quick-wins from being crowded out by volume
- Overlap group deduplication (skip near-duplicate survivors) — reduces LLM calls further
- Two-phase progress tracker (fast pre-score phase vs slow LLM phase) — accurate pipeline UX

**Defer to v2+:**
- Dimension weight configurability via CLI flags — weights need Ford dataset validation before user exposure
- Deterministic score caching — pre-scoring is already <100ms total; premature optimization
- Pre-score histogram in reports — nice to have, not blocking MVP

### Architecture Approach

The new pipeline inserts three components between skill extraction and simulation: a synchronous deterministic scorer over all 826 candidates (<100ms), a top-N filter (pure rank + slice), then a semaphore-bounded consolidated LLM scorer over survivors only. A `lens-synthesis` step maps deterministic signals back to the existing `lenses: { technical, adoption, value }` shape so all downstream consumers (10+ report formatters, simulation bridge, checkpoint) remain unchanged. The `--scoring-mode` branch in `pipeline-runner.ts` allows running the v1.2 three-lens path for comparison and validation. The triage pipeline (`triageOpportunities`) is retired as a scoring gate — its red-flag signals are absorbed into deterministic scoring as near-zero scores rather than discrete skip/demote actions.

**Major new components:**
1. `scoring/deterministic-signals.ts` — 7 pure signal functions (financialSignal, aiSuitabilitySignal, dataReadiness, decisionClarity, impactSignal, specCompleteness, archetypeSignal), individually testable with no mocking
2. `scoring/deterministic-scorer.ts` — weighted composite over all 826 L4 candidates, purely synchronous, <100ms total
3. `pipeline/top-n-filter.ts` — rank-ordered cutoff producing `{ survivors, eliminated, cutoffScore, totalCandidates }`
4. `scoring/consolidated-scorer.ts` — single LLM call per survivor: platformFit (score 0-3, components[], reason) + sanityCheck (AGREE/DISAGREE/PARTIAL)
5. `scoring/lens-synthesis.ts` — maps deterministic signals to `lenses` shape, preserving all downstream consumers unchanged
6. `scoring/composite.ts` (modified) — new `computeHybridComposite` alongside preserved `computeComposite`

### Critical Pitfalls

1. **Score calibration drift between deterministic and LLM scores** — Build a calibration test before anything else: run 50-100 L4s through both the deterministic scorer AND the full 3-call LLM pipeline, compute Spearman rank correlation. If rho < 0.6, widen top-N or add more features. Never arithmetically combine the two scores — the deterministic score is a gate only; the final composite comes exclusively from the LLM.

2. **Simulation adapter breakage (silent)** — The current `scoring-to-simulation.ts` groups by L3 and picks the best skill per group. V1.3 shifts the scoring unit to L4, causing the adapter to silently include unscored L4s in simulation input. Redesign the adapter contract alongside the scoring redesign; add an assertion `input.l4s.every(l4 => scoredL4Ids.has(l4.id))` and an integration test verifying fully populated SimulationInput from L4-level scored results.

3. **Consolidated LLM prompt quality degradation** — Replacing 3 focused prompts (~1,100 tokens each) with 1 consolidated prompt risks positional attention bias on later sub-dimensions and rubric interference between lenses. Prototype and A/B test on 20 L4s before committing — if consolidated prompt score variance drops below 50% of 3-call variance, split into 2 calls. Use explicit XML-like delimiters to segment rubrics.

4. **Top-N threshold sensitivity** — The Ford hierarchy has clusters of similar L4s producing many tied deterministic scores. A hard rank cutoff at N vs N+1 may differ by 0.001. Implement cluster-aware cutoff (include all L4s tied at the boundary), add a sensitivity test asserting >90% overlap between top-48, top-50, and top-52 result sets.

5. **Checkpoint format migration** — V1.3 changes the scoring unit from skill to L4 activity. Safe approach: keep `version: 1`, add `l4Id` as optional field alongside `skillId`, update `getCompletedNames()` to check all three. Test with a real v1.2 `.checkpoint.json` from `evaluation-vllm/` before any scoring changes.

## Implications for Roadmap

Based on combined research, a 4-phase structure is recommended. The dependency chain is strict: types must precede scorers, scorers must precede pipeline wiring, pipeline wiring must precede validation.

### Phase 1: Types + Deterministic Foundation

**Rationale:** All downstream work depends on the new type contracts. Building pure functions first (no LLM, no pipeline changes) allows rapid TDD with `makeSkillWithContext()` factories and zero mocking. Checkpoint migration safety check belongs here — the pipeline must be able to resume before it runs at scale.
**Delivers:** `DeterministicScore` and `ConsolidatedLlmResult` types on `ScoringResult` (optional, backward-compatible); 7 signal extractor functions with TDD; `deterministicScorer`; `filterTopN`; additive checkpoint migration.
**Addresses:** Deterministic pre-scoring (all table-stakes dimensions), top-N CLI filter, filter statistics, L3 metadata preservation.
**Avoids:** L3 metadata orphaning (Pitfall 7), checkpoint format breakage (Pitfall 5), feature selection bias — include skill-level continuous fields (actions count, constraint count, max_value) to generate >200 distinct scores across 826 L4s and avoid cluster ties.
**Research flag:** Standard patterns. Follows existing `confidence.ts` and `composite.ts` patterns exactly. No deeper research needed.

### Phase 2: Consolidated LLM Scorer

**Rationale:** The consolidated prompt is the design-intensive piece and the largest quality risk. Building and testing it in isolation (before touching the pipeline runner) allows rapid iteration with mock chatFn responses and side-by-side comparison against the 3-call pipeline before committing to the architecture.
**Delivers:** `scoring/prompts/consolidated.ts` prompt builder; `ConsolidatedLensSchema` Zod schema + JSON schema; `scoreOneConsolidated` function with `chatFn` injection; `computeHybridComposite`; `synthesizeLenses`.
**Uses:** Existing `buildKnowledgeContext()`, `chatFn` injection pattern, `scoreWithRetry`, `zod-to-json-schema`.
**Implements:** Consolidated scorer with platform fit (0-3 score + Aera component citations) + sanity check (AGREE/DISAGREE/PARTIAL + optional adjustedComposite).
**Avoids:** Consolidated prompt quality degradation (Pitfall 3) — A/B test against 3-call pipeline on 20 L4s before finalizing; test suite breakage (Pitfall 10) — write new tests first, mark old 3-call tests as `skip` with reason.
**Research flag:** Needs prompt engineering validation. Define the A/B test protocol (which L4s, pass/fail threshold: variance >= 50% of 3-call, rho >= 0.6) in the phase plan before writing the prompt.

### Phase 3: Pipeline Integration

**Rationale:** Wire new components into the pipeline runner only after Phases 1+2 are independently validated. The `--scoring-mode` feature flag is the safety net — it preserves v1.2 behavior for Phase 4 A/B comparisons without a separate code branch.
**Delivers:** Updated `pipeline-runner.ts` with two-pass flow and `--scoring-mode` branch; `--top-n` and `--scoring-mode` CLI flags; updated `scoring-to-simulation.ts` adapter for L4-level input; two-phase progress tracker (fast pre-score + slow LLM phases displayed separately).
**Implements:** Full pipeline integration, explicit triage/deterministic-scoring boundary resolution, simulation adapter for L4-first flow.
**Avoids:** Triage/deterministic overlap (Pitfall 8) — resolve explicitly which pipeline stages remain and which are retired; simulation adapter breakage (Pitfall 4) — redesign adapter contract in this phase, not after; LLM call regression (Pitfall 9) — set hard budget target (max calls = top-N x 1.5) and log actual vs budgeted prominently.
**Research flag:** Standard patterns. Commander flags and pipeline-runner wiring follow established patterns. Simulation adapter needs an explicit design decision but not external research.

### Phase 4: Validation + Report Compatibility

**Rationale:** Cannot ship without verifying the funnel does not silently eliminate candidates the 3-call system would have promoted. The calibration test from Pitfall 1 is the acceptance gate.
**Delivers:** Calibration test suite with Spearman rho measurement; full Ford 826-candidate run with both scoring modes side-by-side; report formatter verification (all 10+ formatters produce correct output from v1.3 `ScoringResult[]`); `pipeline-metadata.json` artifact in output directory (version, timestamp, top-N, weights, call count).
**Addresses:** Score calibration drift (Pitfall 1), test suite compatibility (Pitfall 10), output structure consistency (Pitfall 12).
**Avoids:** Shipping a funnel that silently downgrades quality without a detection mechanism.
**Research flag:** Standard validation patterns. Define pass/fail thresholds in the phase plan: rho >= 0.6, subdimension score stdev >= 0.3 on 0-3 scale, LLM call count <= top-N x 1.5.

### Phase Ordering Rationale

- Phase 1 before Phase 2: type contracts must exist before scorers are implemented; the checkpoint migration is a prerequisite for any scoring runs.
- Phase 2 before Phase 3: consolidated prompt quality must be empirically validated before embedding in the pipeline runner; changing the prompt after pipeline integration is expensive.
- Phase 3 before Phase 4: can only validate end-to-end behavior after the full pipeline is wired; simulation adapter contract is resolved in Phase 3 not Phase 4.
- Checkpoint migration is Phase 1 (not Phase 3) because resume correctness is a precondition for any LLM scoring at scale.
- Triage/deterministic overlap is Phase 3 (not deferred) because two conflicting filter stages in the pipeline cannot be left unresolved during integration.

### Research Flags

Phases needing deeper attention during planning:
- **Phase 2 (Consolidated LLM Scorer):** Prompt quality is empirical, not derivable from code analysis. Must prototype and A/B test before committing. Phase plan must specify: which 20 L4s, what metrics (variance ratio, rank correlation), and the pass/fail thresholds.
- **Phase 4 (Validation):** Calibration thresholds (rho >= 0.6, stdev >= 0.3) are informed estimates, not validated against Ford data. Phase plan must define what happens if thresholds are not met: widen top-N, add features to deterministic scorer, or split consolidated prompt into 2 calls.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Types + Deterministic Foundation):** Follows `confidence.ts` / `composite.ts` patterns exactly. TDD, pure functions, no unknowns.
- **Phase 3 (Pipeline Integration):** Follows established pipeline-runner and Commander patterns. Simulation adapter is a known interface change, not a discovery task.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase analysis. All referenced modules exist with proven interfaces. Zero external dependencies needed. |
| Features | HIGH | Derived from L4 Zod schema (source of truth), existing scoring patterns, and PROJECT.md requirements. |
| Architecture | HIGH | Component boundaries are well-defined extensions of existing patterns. No greenfield design required. |
| Pitfalls | HIGH | Derived from existing type contracts and pipeline flow analysis. Score calibration and simulation adapter risks are concrete, not speculative. |

**Overall confidence:** HIGH

### Gaps to Address

- **Consolidated prompt token budget:** Qwen 2.5 32B at 8K context may be tight once all Aera knowledge context (21 UI components, 22 PB nodes, capabilities) and sub-dimension rubrics are included in one system message. Measure actual token counts in Phase 2 prototype. If system message exceeds 5K tokens, either prune non-essential context or split into 2 calls (platform fit + sanity check separately).
- **Deterministic weight validation:** The proposed weights (ai_suitability: 0.35, financial_rating: 0.25, decision_exists: 0.20, impact_order: 0.10, rating_confidence: 0.10) are rationale-backed but untested against real Ford data. Phase 4 calibration will surface whether they need adjustment. Export as named constants for easy tuning during development.
- **platform_fit unresolved debt:** A memory note flags that `platform_fit` in scoring was not resolved during the 2026-03-13 pass. The consolidated LLM prompt is the intended resolution — the `platformFit.score` field in `ConsolidatedLlmResult` replaces the previously unresolved `aera_platform_fit` sub-dimension from the existing technical lens. This should be confirmed as the fix during Phase 2 planning.
- **Feature discrimination target:** PITFALLS.md flags that using only L4 enum fields (low cardinality: 3-4 values each) may produce only 50-80 distinct deterministic scores across 826 L4s, causing excessive ties. The deterministic scorer must also include skill-level continuous fields (actions.length, constraints.length, max_value, execution field presence) to reach >200 distinct values. Validate this target during Phase 1 before building the top-N filter.

## Sources

### Primary (HIGH confidence)
- Codebase direct analysis: `src/scoring/composite.ts`, `src/scoring/confidence.ts`, `src/scoring/lens-scorers.ts`, `src/scoring/prompts/technical.ts`, `src/scoring/schemas.ts`, `src/types/scoring.ts`, `src/types/hierarchy.ts`, `src/schemas/hierarchy.ts` — scoring patterns, field inventory, type contracts
- Codebase direct analysis: `src/pipeline/pipeline-runner.ts`, `src/pipeline/extract-skills.ts`, `src/pipeline/scoring-to-simulation.ts` — pipeline flow and adapter contracts
- Codebase direct analysis: `src/infra/checkpoint.ts`, `src/infra/semaphore.ts`, `src/infra/retry-policy.ts`, `src/infra/timeout.ts` — infrastructure interfaces
- Codebase direct analysis: `src/triage/triage-pipeline.ts`, `src/triage/red-flags.ts`, `src/triage/tier-engine.ts` — existing gate logic to be absorbed
- Codebase direct analysis: `src/simulation/simulation-pipeline.ts`, `src/types/simulation.ts` — SimulationInput contract
- Project charter: `.planning/PROJECT.md` — v1.3 milestone definition, Ford 826 L4 candidate count, pipeline flow target

### Secondary (MEDIUM confidence)
- Performance extrapolation from v1.2 cloud run timings — single consolidated LLM call latency is untested; ~10 min for top-50 on H100 is estimated
- Spearman rank correlation threshold (rho >= 0.6) for calibration validation — standard practice for two-stage ranking systems; exact threshold needs empirical validation on Ford data
- Positional bias in long prompts — well-documented in transformer attention literature; specific degradation threshold for Qwen 2.5 32B at 8K context needs empirical measurement

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
