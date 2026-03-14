# Roadmap: Aera Skill Feasibility Engine

## Milestones

- ✅ **v1.0 MVP** — Phases 1-11 (shipped 2026-03-11)
- ✅ **v1.1 Cloud-Accelerated Scoring** — Phases 12-14 (shipped 2026-03-12)
- ✅ **v1.2 Cloud Pipeline Hardening** — Phases 15-20 (shipped 2026-03-12)
- 🚧 **v1.3 L4 Two-Pass Scoring Funnel** — Phases 21-24 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-11) — SHIPPED 2026-03-11</summary>

- [x] Phase 1: Project Foundation (3/3 plans) — completed 2026-03-11
- [x] Phase 2: Knowledge Base (3/3 plans) — completed 2026-03-11
- [x] Phase 3: Triage & Red Flags (3/3 plans) — completed 2026-03-11
- [x] Phase 4: Scoring Engine (4/4 plans) — completed 2026-03-11
- [x] Phase 5: Scoring Output (3/3 plans) — completed 2026-03-11
- [x] Phase 6: Simulation (4/4 plans) — completed 2026-03-11
- [x] Phase 7: Pipeline Orchestration (3/3 plans) — completed 2026-03-11
- [x] Phase 8: Resilience & Recovery (3/3 plans) — completed 2026-03-11
- [x] Phase 9: Final Reports & Reflection (3/3 plans) — completed 2026-03-11
- [x] Phase 10: Wire writeEvaluation (1/1 plan) — completed 2026-03-11
- [x] Phase 11: Wire Simulation Pipeline (1/1 plan) — completed 2026-03-11

Full details: `milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Cloud-Accelerated Scoring (Phases 12-14) — SHIPPED 2026-03-12</summary>

- [x] Phase 12: vLLM Client Adapter (2/2 plans) — completed 2026-03-11
- [x] Phase 13: Concurrent Pipeline Runner (2/2 plans) — completed 2026-03-11
- [x] Phase 14: Cloud Infrastructure (3/3 plans) — completed 2026-03-11

Full details: `milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Cloud Pipeline Hardening (Phases 15-20) — SHIPPED 2026-03-12</summary>

- [x] Phase 15: Report Generation Fix (1/1 plan) — completed 2026-03-12
- [x] Phase 16: Simulation Configuration (2/2 plans) — completed 2026-03-12
- [x] Phase 17: CLI Automation (2/2 plans) — completed 2026-03-12
- [x] Phase 18: RunPod Provisioning Fix (1/1 plan) — completed 2026-03-12
- [x] Phase 19: Output Directory Management (1/1 plan) — completed 2026-03-12
- [x] Phase 20: Network Volume & Model Caching (1/1 plan) — completed 2026-03-12

Full details: `milestones/v1.2-ROADMAP.md`

</details>

### v1.3 L4 Two-Pass Scoring Funnel (In Progress)

**Milestone Goal:** Replace brute-force LLM scoring of L3 opportunities with a two-pass funnel that scores L4 activities deterministically, then applies focused LLM assessment only to configurable top-N survivors. Reduces LLM calls from ~2,478 to ~50.

- [x] **Phase 21: Types + Deterministic Foundation** - Pure-function scoring of all 826 L4 candidates from structured fields, plus top-N filtering with CLI control (completed 2026-03-13)
- [x] **Phase 22: Consolidated LLM Scorer** - Single LLM call per survivor covering platform fit assessment and deterministic sanity check (completed 2026-03-14)
- [ ] **Phase 23: Pipeline Integration** - Wire two-pass flow into pipeline-runner with scoring-mode switch and L4-level simulation adapter
- [ ] **Phase 24: Validation + Report Compatibility** - Calibration testing, full Ford run comparison, and report formatter verification

## Phase Details

### Phase 21: Types + Deterministic Foundation
**Goal**: Users can pre-score all 826 L4 candidates in under 100ms with zero LLM calls, producing a ranked and filtered candidate list ready for LLM assessment
**Depends on**: Phase 20 (v1.2 complete)
**Requirements**: DSCORE-01, DSCORE-02, DSCORE-03, DSCORE-04, DSCORE-05, DSCORE-06, DSCORE-07, DSCORE-08, DSCORE-09, FILTER-01, FILTER-02, FILTER-03, FILTER-04, FILTER-05
**Success Criteria** (what must be TRUE):
  1. Running the deterministic scorer on 826 L4 candidates completes in under 100ms and assigns a normalized 0-1 composite score to each candidate
  2. The `--top-n` CLI flag controls how many survivors pass to the next stage, with a default of 50 and cluster-aware tie handling at the boundary
  3. A pre-score TSV artifact appears in the output directory showing every candidate's rank, dimension scores, composite score, and survived status
  4. Pipeline output reports filter statistics: total candidates scored, survivors passed, candidates eliminated, and cutoff score
  5. Existing red flags (DEAD_ZONE, NO_STAKES, CONFIDENCE_GAP) result in near-zero deterministic scores or hard elimination, not separate triage logic
**Plans:** 3/3 plans complete
Plans:
- [x] 21-01-PLAN.md -- Types + dimensions + composite + red flags
- [x] 21-02-PLAN.md -- Top-N filter + pre-scorer orchestrator
- [x] 21-03-PLAN.md -- Pre-score TSV formatter + CLI --top-n flag

### Phase 22: Consolidated LLM Scorer
**Goal**: Each top-N survivor receives exactly one LLM call that assesses platform fit with Aera component citations and sanity-checks the deterministic pre-score
**Depends on**: Phase 21
**Requirements**: LLM-01, LLM-02, LLM-03, LLM-04, LLM-05, LLM-06
**Success Criteria** (what must be TRUE):
  1. Each survivor receives exactly one LLM call (not three) that returns a Zod-validated JSON response containing platform fit score (0-3) with specific Aera component citations and a sanity check verdict (AGREE/DISAGREE/PARTIAL)
  2. The LLM prompt includes the full deterministic score breakdown so the model can perform targeted sanity checking of individual dimensions
  3. A final composite score blends pre-score and LLM output, feeding into the existing 0.60 promotion threshold gate for simulation eligibility
  4. Validation failures trigger scoreWithRetry, consistent with v1.2 retry behavior
**Plans:** 2/2 plans complete
Plans:
- [x] 22-01-PLAN.md -- Schema + types + consolidated prompt builder
- [x] 22-02-PLAN.md -- Consolidated scorer function + composite blending

### Phase 23: Pipeline Integration
**Goal**: The full two-pass pipeline runs end-to-end from CLI invocation through deterministic scoring, LLM assessment, simulation, and reports -- with a feature flag preserving v1.2 behavior for comparison
**Depends on**: Phase 22
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, SIM-01, SIM-02
**Success Criteria** (what must be TRUE):
  1. `--scoring-mode two-pass` runs the full two-pass funnel (deterministic pre-score, top-N filter, consolidated LLM, simulation) and `--scoring-mode three-lens` runs the v1.2 three-lens path unchanged
  2. All 10+ existing report formatters produce correct output from v1.3 scoring results because deterministic signals are synthesized into the existing LensScore shape
  3. L3 opportunity names appear as metadata labels for report grouping but are not used as scoring units
  4. The checkpoint system supports L4-level scoring entries and can resume a v1.3 run without corrupting or losing v1.2 checkpoint data
  5. The simulation pipeline accepts L4 activities directly via an updated scoring-to-simulation adapter
**Plans:** 2 plans
Plans:
- [ ] 23-01-PLAN.md -- Checkpoint V2 + SimulationInput extension + L4 adapter + CLI scoring-mode flag
- [ ] 23-02-PLAN.md -- Pipeline-runner two-pass wiring + simulation L4 support + report annotations

### Phase 24: Validation + Report Compatibility
**Goal**: The two-pass funnel is verified to produce rankings that meaningfully correlate with v1.2 LLM rankings, and all output artifacts are confirmed correct on real Ford data
**Depends on**: Phase 23
**Requirements**: VAL-01, VAL-02, VAL-03, VAL-04
**Success Criteria** (what must be TRUE):
  1. A calibration test measures Spearman rank correlation between deterministic pre-scores and v1.2 LLM composite scores, achieving rho >= 0.6
  2. The deterministic scorer produces more than 200 distinct score values across 826 L4 candidates, confirming sufficient discrimination to avoid excessive ties
  3. A full Ford 826-candidate run completes successfully with both `--scoring-mode two-pass` and `--scoring-mode three-lens`, producing side-by-side output directories for manual comparison
  4. All existing report formatters (TSV, summary, adoption risk, dead zones, meta-reflection, tier-1 report) produce correct output from v1.3 ScoringResult without modification
**Plans**: TBD

## Progress

**Execution Order:** Phases 21 -> 22 -> 23 -> 24

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-11 | v1.0 | 31/31 | Complete | 2026-03-11 |
| 12-14 | v1.1 | 7/7 | Complete | 2026-03-12 |
| 15-20 | v1.2 | 8/8 | Complete | 2026-03-12 |
| 21. Types + Deterministic Foundation | v1.3 | 3/3 | Complete | 2026-03-13 |
| 22. Consolidated LLM Scorer | v1.3 | 2/2 | Complete | 2026-03-14 |
| 23. Pipeline Integration | v1.3 | 0/2 | Not started | - |
| 24. Validation + Report Compatibility | v1.3 | 0/TBD | Not started | - |

**Total:** 24 phases, 53+ plans, 3 milestones shipped, 1 in progress
