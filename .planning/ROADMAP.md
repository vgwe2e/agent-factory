# Roadmap: Aera Skill Feasibility Engine

## Milestones

- ✅ **v1.0 MVP** — Phases 1-11 (shipped 2026-03-11)
- ✅ **v1.1 Cloud-Accelerated Scoring** — Phases 12-14 (shipped 2026-03-12)
- 🚧 **v1.2 Cloud Pipeline Hardening** — Phases 15-20 (in progress)

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

### 🚧 v1.2 Cloud Pipeline Hardening (In Progress)

**Milestone Goal:** Make the cloud evaluation pipeline reliable, automated, and fast enough to complete a full 362-opportunity Ford hierarchy evaluation in under 30 minutes on a single A100 GPU with zero manual intervention.

- [x] **Phase 15: Report Generation Fix** — Reports correctly reflect all scored opportunities including checkpoint-resumed data (completed 2026-03-12)
- [ ] **Phase 16: Simulation Configuration** — Users can skip or configure simulation phase without code changes
- [ ] **Phase 17: CLI Automation** — Single CLI invocation handles full lifecycle with retries and teardown
- [ ] **Phase 18: RunPod Provisioning Fix** — Pod provisioning succeeds on first attempt with correct model loaded
- [ ] **Phase 19: Output Directory Management** — Backend-aware output namespacing prevents local/cloud clobber
- [ ] **Phase 20: Network Volume & Model Caching** — Model weights persist across pod launches via network volumes

## Phase Details

### Phase 15: Report Generation Fix
**Goal**: Reports accurately reflect all scored opportunities regardless of whether the run resumed from checkpoint
**Depends on**: Nothing (first phase of v1.2, no ordering dependency on other v1.2 phases)
**Requirements**: RPT-01, RPT-02, RPT-03
**Success Criteria** (what must be TRUE):
  1. User resumes a partially-completed run and the final report includes all previously-checkpointed scores, not just the current session's scores
  2. User completes a run and `writeFinalReports` produces complete output without needing to manually run `regen-reports.ts`
  3. User inspects the summary report and sees correct totals for scored, simulated, and errored opportunities across all checkpoint entries
**Plans:** 1/1 plans complete
Plans:
- [ ] 15-01-PLAN.md — Load archived scores on resume and wire into report generation

### Phase 16: Simulation Configuration
**Goal**: Users can control simulation behavior via CLI flags without modifying source code
**Depends on**: Nothing (independent of Phase 15)
**Requirements**: SIM-01, SIM-02, SIM-03
**Success Criteria** (what must be TRUE):
  1. User passes `--skip-sim` and the pipeline completes scoring without entering the simulation phase
  2. User passes `--sim-timeout 60000` and simulations that exceed 60 seconds are terminated and logged as errors
  3. A simulation failure for one opportunity does not prevent remaining opportunities from being scored and reported
**Plans:** 2 plans
Plans:
- [x] 16-01-PLAN.md — Per-opportunity error isolation and timeout in simulation pipeline (TDD)
- [ ] 16-02-PLAN.md — CLI flags, pipeline-runner integration, and report formatter skip-sim awareness

### Phase 17: CLI Automation
**Goal**: A single CLI invocation handles the full cloud evaluation lifecycle -- score, retry errors, generate reports, tear down infrastructure
**Depends on**: Phase 15 (reports must work on resume), Phase 16 (simulation config needed for full lifecycle)
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04
**Success Criteria** (what must be TRUE):
  1. User passes `--retry 3` and the pipeline automatically re-scores errored opportunities up to 3 times at concurrency 1
  2. User passes `--teardown` and the RunPod pod is stopped and deleted after pipeline completes (or fails)
  3. User runs a single CLI command and it handles score, retry, report generation, and teardown without manual steps
  4. Pipeline exits with code 0 when all opportunities scored, 1 when errors remain after retries, 2 on fatal failure
**Plans**: TBD

### Phase 18: RunPod Provisioning Fix
**Goal**: RunPod pod provisioning works correctly on the first attempt using the GraphQL API with proper model validation
**Depends on**: Nothing (independent infrastructure fix)
**Requirements**: PROV-01, PROV-02, PROV-03, PROV-04
**Success Criteria** (what must be TRUE):
  1. Provisioning uses GraphQL API with `dockerArgs` to pass vLLM launch arguments (not `VLLM_ARGS` env var)
  2. After pod is running, provisioning confirms the requested model appears in `/v1/models` response before returning success
  3. If the pod does not become ready within 15 minutes, provisioning fails with a clear error message including pod ID and status
  4. When falling back to `runpodctl`, the correct `--gpu-id` flag is used instead of the non-existent `--gpu-type`
**Plans**: TBD

### Phase 19: Output Directory Management
**Goal**: Local and cloud evaluation runs produce output in separate directories by default, preventing accidental overwrites
**Depends on**: Nothing (independent, but benefits from Phase 17 integration)
**Requirements**: OUT-01, OUT-02
**Success Criteria** (what must be TRUE):
  1. Running with `--backend vllm` (without explicit `--output-dir`) writes results to `evaluation-vllm/` instead of `evaluation/`
  2. Running with `--backend ollama` (without explicit `--output-dir`) writes results to `evaluation-ollama/`
  3. A user who runs both local and cloud evaluations on the same hierarchy finds both result sets intact with no overwritten files
**Plans**: TBD

### Phase 20: Network Volume & Model Caching
**Goal**: Model weights are cached on a RunPod network volume so subsequent pod launches skip the HuggingFace download
**Depends on**: Phase 18 (provisioning must work correctly before adding volume support)
**Requirements**: CACHE-01, CACHE-02
**Success Criteria** (what must be TRUE):
  1. User can provision a RunPod pod with `--network-volume` and the pod mounts the volume for model weight storage
  2. On second pod launch with the same network volume, model loading completes significantly faster (no HuggingFace download) and `/v1/models` shows the model ready
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 15 → 16 → 17 → 18 → 19 → 20
Note: Phases 15, 16, 18, 19 are independent and could execute in parallel. Phase 17 depends on 15+16. Phase 20 depends on 18.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Foundation | v1.0 | 3/3 | Complete | 2026-03-11 |
| 2. Knowledge Base | v1.0 | 3/3 | Complete | 2026-03-11 |
| 3. Triage & Red Flags | v1.0 | 3/3 | Complete | 2026-03-11 |
| 4. Scoring Engine | v1.0 | 4/4 | Complete | 2026-03-11 |
| 5. Scoring Output | v1.0 | 3/3 | Complete | 2026-03-11 |
| 6. Simulation | v1.0 | 4/4 | Complete | 2026-03-11 |
| 7. Pipeline Orchestration | v1.0 | 3/3 | Complete | 2026-03-11 |
| 8. Resilience & Recovery | v1.0 | 3/3 | Complete | 2026-03-11 |
| 9. Final Reports & Reflection | v1.0 | 3/3 | Complete | 2026-03-11 |
| 10. Wire writeEvaluation | v1.0 | 1/1 | Complete | 2026-03-11 |
| 11. Wire Simulation Pipeline | v1.0 | 1/1 | Complete | 2026-03-11 |
| 12. vLLM Client Adapter | v1.1 | 2/2 | Complete | 2026-03-11 |
| 13. Concurrent Pipeline Runner | v1.1 | 2/2 | Complete | 2026-03-11 |
| 14. Cloud Infrastructure | v1.1 | 3/3 | Complete | 2026-03-11 |
| 15. Report Generation Fix | 1/1 | Complete    | 2026-03-12 | - |
| 16. Simulation Configuration | v1.2 | 1/2 | In progress | - |
| 17. CLI Automation | v1.2 | 0/0 | Not started | - |
| 18. RunPod Provisioning Fix | v1.2 | 0/0 | Not started | - |
| 19. Output Directory Management | v1.2 | 0/0 | Not started | - |
| 20. Network Volume & Model Caching | v1.2 | 0/0 | Not started | - |
