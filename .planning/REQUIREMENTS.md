# Requirements: Aera Skill Feasibility Engine

**Defined:** 2026-03-12
**Core Value:** Produce actionable, adoption-realistic implementation specs for Aera skills — not just technically feasible ones, but ones real users will actually adopt.

## v1.2 Requirements

Requirements for Cloud Pipeline Hardening milestone. Each maps to roadmap phases.

### Report Generation

- [x] **RPT-01**: Pipeline loads checkpoint data into `allScoredResults[]` on resume so reports reflect all scored opportunities, not just current run
- [x] **RPT-02**: `writeFinalReports` and `writeEvaluation` produce complete output without requiring external `regen-reports.ts` script
- [x] **RPT-03**: Summary report shows correct total counts (scored, simulated, errors) across all checkpoint entries

### Simulation Configuration

- [ ] **SIM-01**: User can pass `--skip-sim` flag to bypass simulation phase entirely when only scores are needed
- [x] **SIM-02**: User can configure simulation timeout via `--sim-timeout <ms>` flag (default: current value)
- [x] **SIM-03**: Simulation errors are logged with reason and do not block scoring completion

### Automation

- [ ] **AUTO-01**: CLI `--retry <N>` flag automatically retries errored opportunities up to N times with concurrency 1
- [ ] **AUTO-02**: CLI `--teardown` flag automatically stops and deletes RunPod pod on pipeline completion or failure
- [ ] **AUTO-03**: Single CLI invocation handles full lifecycle: score → retry → report → teardown
- [ ] **AUTO-04**: Pipeline exit code reflects final status (0 = all scored, 1 = errors remain, 2 = fatal)

### RunPod Provisioning

- [ ] **PROV-01**: `/setup-runpod-vllm` skill uses GraphQL API with `dockerArgs` instead of `VLLM_ARGS` env var
- [ ] **PROV-02**: Provisioning validates model is loaded by checking `/v1/models` response matches requested model
- [ ] **PROV-03**: Provisioning times out after 15 minutes if pod never becomes ready, with actionable error message
- [ ] **PROV-04**: Provisioning uses correct `--gpu-id` flag (not `--gpu-type`) when falling back to `runpodctl`

### Output Management

- [ ] **OUT-01**: Output directory auto-namespaces by backend type (`evaluation-ollama/`, `evaluation-vllm/`) when `--output-dir` is not explicitly set
- [ ] **OUT-02**: Local Ollama runs and cloud vLLM runs never clobber each other's output by default

### Model Caching

- [ ] **CACHE-01**: `/setup-runpod-vllm` skill supports creating and attaching a network volume for model weights
- [ ] **CACHE-02**: Subsequent pod launches reuse cached model weights from network volume, skipping HuggingFace download

## Future Requirements

### Advanced Pipeline

- **ADV-01**: Configurable scoring weights via CLI flags
- **ADV-02**: Partial re-evaluation of specific opportunities by name
- **ADV-03**: Golden test suite comparing Ollama vs vLLM scores
- **ADV-04**: Full implementation spec generation for simulated opportunities

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-GPU / tensor parallelism | Single A100 sufficient for Qwen 32B; complexity not justified |
| Auto-scaling pod count | One pod handles 362 opportunities in target time |
| Web UI for pipeline monitoring | CLI-only pattern validated; `tail -f` sufficient |
| Switching to RunPod Serverless | Serverless adds ~2min queue latency vs ~5-10s direct pod access |
| Model fine-tuning integration | Off-the-shelf models only per project constraint |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RPT-01 | Phase 15 | Complete |
| RPT-02 | Phase 15 | Complete |
| RPT-03 | Phase 15 | Complete |
| SIM-01 | Phase 16 | Pending |
| SIM-02 | Phase 16 | Complete |
| SIM-03 | Phase 16 | Complete |
| AUTO-01 | Phase 17 | Pending |
| AUTO-02 | Phase 17 | Pending |
| AUTO-03 | Phase 17 | Pending |
| AUTO-04 | Phase 17 | Pending |
| PROV-01 | Phase 18 | Pending |
| PROV-02 | Phase 18 | Pending |
| PROV-03 | Phase 18 | Pending |
| PROV-04 | Phase 18 | Pending |
| OUT-01 | Phase 19 | Pending |
| OUT-02 | Phase 19 | Pending |
| CACHE-01 | Phase 20 | Pending |
| CACHE-02 | Phase 20 | Pending |

**Coverage:**
- v1.2 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after roadmap creation*
