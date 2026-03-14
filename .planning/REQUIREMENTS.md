# Requirements: Aera Skill Feasibility Engine v1.3

**Defined:** 2026-03-13
**Core Value:** Produce actionable, adoption-realistic implementation specs for Aera skills -- not just technically feasible ones, but ones real users will actually adopt.

## v1.3 Requirements

Requirements for the L4 Two-Pass Scoring Funnel. Each maps to roadmap phases.

### Deterministic Pre-Scoring

- [x] **DSCORE-01**: Score all L4 activities from structured fields only (no LLM), completing in <100ms for 826 candidates
- [x] **DSCORE-02**: Compute financial signal dimension from financial_rating (HIGH/MEDIUM/LOW) and max_value
- [x] **DSCORE-03**: Compute AI suitability dimension from ai_suitability field (HIGH/MEDIUM/LOW/NOT_APPLICABLE/null)
- [x] **DSCORE-04**: Compute decision density dimension from decision_exists, actions count, and constraints count
- [x] **DSCORE-05**: Compute impact order dimension from impact_order (FIRST/SECOND)
- [x] **DSCORE-06**: Compute rating confidence dimension from rating_confidence (HIGH/MEDIUM/LOW)
- [x] **DSCORE-07**: Compute archetype completeness dimension from archetype presence and execution field richness
- [x] **DSCORE-08**: Produce weighted composite (0-1 normalized) from all dimensions with sensible default weights
- [x] **DSCORE-09**: Integrate existing red flags (DEAD_ZONE, NO_STAKES, CONFIDENCE_GAP) as near-zero scores or hard elimination

### Top-N Filtering

- [x] **FILTER-01**: Add `--top-n` CLI flag (integer, configurable, default 50) controlling how many survivors pass to LLM scoring
- [x] **FILTER-02**: Rank all pre-scored candidates by composite descending, ties broken by max_value descending
- [x] **FILTER-03**: Write pre-score TSV artifact to output directory showing full ranking, scores, and survived Y/N
- [x] **FILTER-04**: Report filter statistics in pipeline output (total candidates, survivors, eliminated, cutoff score)
- [x] **FILTER-05**: Use cluster-aware cutoff — include all L4s tied at the boundary score

### Consolidated LLM Scoring

- [x] **LLM-01**: Single consolidated LLM call per survivor covering platform fit assessment + deterministic sanity check
- [x] **LLM-02**: Platform fit scored 0-3 with specific Aera component citations (from bundled knowledge base)
- [x] **LLM-03**: Sanity check evaluates deterministic pre-score (AGREE/DISAGREE/PARTIAL) with justification
- [x] **LLM-04**: Structured JSON output validated by Zod schema, with scoreWithRetry for validation failures
- [x] **LLM-05**: LLM prompt includes deterministic score breakdown for targeted sanity checking
- [x] **LLM-06**: Final composite blends pre-score + LLM output, feeding into existing PROMOTION_THRESHOLD (0.60) gate

### Pipeline Integration

- [x] **PIPE-01**: Updated pipeline-runner supports two-pass flow: deterministic pre-score → top-N filter → LLM scoring → simulation
- [x] **PIPE-02**: `--scoring-mode two-pass|three-lens` CLI flag for A/B comparison with v1.2 behavior
- [x] **PIPE-03**: Synthesize deterministic signals into existing LensScore shape so all report formatters work unchanged
- [x] **PIPE-04**: L3 names retained as metadata labels for report grouping (not as scoring unit)
- [x] **PIPE-05**: Checkpoint system supports L4-level scoring with backward-compatible resume from v1.2 checkpoints

### Simulation Adapter

- [x] **SIM-01**: SimulationInput accepts L4 activity directly instead of L3 opportunity rollup
- [x] **SIM-02**: scoring-to-simulation adapter produces L4-level simulation inputs from two-pass scoring results

### Validation

- [ ] **VAL-01**: Calibration test measuring Spearman rank correlation between deterministic pre-scores and v1.2 LLM composite scores (target rho >= 0.6)
- [ ] **VAL-02**: Deterministic scorer produces >200 distinct score values across 826 L4 candidates (prevents excessive ties)
- [x] **VAL-03**: All existing report formatters produce correct output from v1.3 ScoringResult
- [ ] **VAL-04**: Full Ford 826-candidate run completes with both scoring modes for side-by-side comparison

## Future Requirements

### Deferred from v1.3

- **ADVN-01**: Dimension weight configurability via CLI flags (weights need Ford validation first)
- **ADVN-02**: Overlap group deduplication (skip near-duplicate survivors)
- **ADVN-03**: Tier-aware top-N slot allocation (Tier 1 always passes)
- **ADVN-04**: Deterministic score caching (pre-scoring already <100ms)
- **ADVN-05**: Pre-score histogram in summary reports

### Carried from v1.2

- **SPEC-01**: Generate full implementation specs for simulated opportunities
- **SPEC-02**: Model recommendations for local model to skill matching
- **VAL-05**: Golden test suite comparing Ollama vs vLLM scores
- **VAL-06**: Documented performance benchmarks

## Out of Scope

| Feature | Reason |
|---------|--------|
| Keep 3 separate LLM calls per candidate | This is the problem v1.3 solves (2,478 → ~50 calls) |
| LLM-based pre-scoring | Defeats speed advantage; deterministic must be pure computation |
| Dynamic top-N from score distribution | Non-reproducible; users lose cost control |
| Removing triage entirely | Triage red flags still useful for report annotation |
| Platform fit as deterministic dimension | Requires domain reasoning about Aera component mapping |
| Backward-incompatible ScoringResult | 10+ downstream consumers depend on existing shape |
| Re-implementing simulation from scratch | Only the adapter needs updating, not the pipeline |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSCORE-01 | Phase 21 | Complete |
| DSCORE-02 | Phase 21 | Complete |
| DSCORE-03 | Phase 21 | Complete |
| DSCORE-04 | Phase 21 | Complete |
| DSCORE-05 | Phase 21 | Complete |
| DSCORE-06 | Phase 21 | Complete |
| DSCORE-07 | Phase 21 | Complete |
| DSCORE-08 | Phase 21 | Complete |
| DSCORE-09 | Phase 21 | Complete |
| FILTER-01 | Phase 21 | Complete |
| FILTER-02 | Phase 21 | Complete |
| FILTER-03 | Phase 21 | Complete |
| FILTER-04 | Phase 21 | Complete |
| FILTER-05 | Phase 21 | Complete |
| LLM-01 | Phase 22 | Complete |
| LLM-02 | Phase 22 | Complete |
| LLM-03 | Phase 22 | Complete |
| LLM-04 | Phase 22 | Complete |
| LLM-05 | Phase 22 | Complete |
| LLM-06 | Phase 22 | Complete |
| PIPE-01 | Phase 23 | Complete |
| PIPE-02 | Phase 23 | Complete |
| PIPE-03 | Phase 23 | Complete |
| PIPE-04 | Phase 23 | Complete |
| PIPE-05 | Phase 23 | Complete |
| SIM-01 | Phase 23 | Complete |
| SIM-02 | Phase 23 | Complete |
| VAL-01 | Phase 24 | Pending |
| VAL-02 | Phase 24 | Pending |
| VAL-03 | Phase 24 | Complete |
| VAL-04 | Phase 24 | Pending |

**Coverage:**
- v1.3 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after initial definition*
