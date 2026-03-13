# Milestones

## v1.2 Cloud Pipeline Hardening (Shipped: 2026-03-12)

**Phases:** 15-20 (8 plans, 15 tasks)
**Timeline:** 3 days (2026-03-10 → 2026-03-12)
**Stats:** 19 files changed, +2,181/-277 lines, 482 tests total
**Git range:** `feat(15-01)` → `docs(phase-20)` (56 commits)
**Audit:** passed — 18/18 requirements, 7 tech debt items (0 blockers, all informational)

**Key accomplishments:**

1. Checkpoint-aware report generation with archived score loading and deduplication on resume
2. Simulation configuration via `--skip-sim` and `--sim-timeout` CLI flags with per-opportunity error isolation
3. Full CLI lifecycle automation with `--retry`, `--teardown`, and structured exit codes (0/1/2)
4. RunPod provisioning hardened: GraphQL dockerArgs, `/v1/models` validation, 15min timeout, auto-teardown
5. Backend-aware output namespacing (`evaluation-ollama/`, `evaluation-vllm/`) preventing clobber
6. Network volume model caching via `--network-volume` flag for persistent model weights

### Known Tech Debt

| Phase | Item | Severity |
|-------|------|----------|
| 16 | Pre-existing TS2322 in format-adoption-risk.test.ts and vllm-client.test.ts | Low |
| 17 | Human verification pending: full cloud lifecycle E2E with real RunPod | Low |
| 18 | PROV-04 reinterpreted: runpodctl eliminated, replaced with --vllm-url guidance | Info |
| 18 | Pre-existing: 28 dist/ test failures (compiled artifacts from prior phases) | Low |
| 20 | Human verification pending: live network volume attachment speed-up | Low |
| 20 | CACHE-02 satisfied by RunPod infrastructure behavior, not application code | Info |

**Archives:** `milestones/v1.2-ROADMAP.md`, `milestones/v1.2-REQUIREMENTS.md`, `milestones/v1.2-MILESTONE-AUDIT.md`

---

## v1.1 Cloud-Accelerated Scoring (Shipped: 2026-03-12)

**Phases:** 12-14 (7 plans, 14 tasks)
**Timeline:** 2 days (2026-03-10 → 2026-03-12)
**Stats:** 41 files modified, +5,394 lines, 140 new tests (552 total)
**Git range:** `feat(12-01)` → `docs(phase-14)` (30 commits)
**Audit:** passed — 11/11 requirements, 5 tech debt items (all cosmetic/by-design)

**Key accomplishments:**

1. Drop-in vLLM ChatFn adapter with Zod-to-vLLM schema translation and pre-flight validation
2. Backend factory with `--backend ollama|vllm` CLI flag — zero regression for Ollama path
3. Semaphore-bounded concurrent scoring with configurable `--concurrency` flag
4. Concurrent-safe checkpoint system with debounced atomic writes and crash recovery
5. Ephemeral H100 provisioning via RunPod GraphQL API with auto-teardown and cost tracking
6. Defense-in-depth cloud cleanup: signal handlers + try/finally + 60s idle timeout

### Known Tech Debt

| Phase | Item | Severity |
|-------|------|----------|
| 14 | cloud-cost.json captures cost before costTracker.stop() (cosmetic, few seconds) | Low |
| 14 | SIGKILL/OOM does not trigger cleanup (mitigated by idleTimeout: 60) | Low |
| 13 | 100ms debounce window on checkpoint writes (hard crash may re-score) | Low |

**Archives:** `milestones/v1.1-ROADMAP.md`, `milestones/v1.1-REQUIREMENTS.md`, `milestones/v1.1-MILESTONE-AUDIT.md`

---

## v1.0 Aera Skill Feasibility Engine MVP (Shipped: 2026-03-11)

**Phases:** 1-11 (31 plans)
**Timeline:** 2 days (2026-03-10 → 2026-03-11)
**Stats:** 349 files modified, 213K LOC TypeScript, 412 tests passing
**Git range:** `feat(01-01)` → `feat(11-01)` (182 commits)
**Audit:** tech_debt — 44/44 requirements, 9 debt items (2 medium, 7 low)

**Key accomplishments:**

1. Full CLI pipeline — single `aera-evaluate --input export.json` runs Zod-validated ingestion through scoring, simulation, and report generation
2. Bundled Aera knowledge base — 21 UI components, 22 PB nodes, orchestration decision guide self-contained
3. Three-lens scoring engine — Technical Feasibility / Adoption Realism (0.45) / Value & Efficiency with archetype routing and 0.60 threshold
4. Simulation pipeline — Mermaid decision flows, YAML component maps, mock tests, integration surfaces grounded in real Aera components
5. Overnight resilience — checkpoint recovery, three-tier LLM retry/fallback/skip, git auto-commit, context archive/reset
6. 412 tests passing — 44/44 requirements verified across 11 phases with full cross-phase integration

### Known Tech Debt

| Phase | Item | Severity |
|-------|------|----------|
| 3 | Orphaned `triage/format-tsv.ts` (superseded by Phase 5) | Low |
| 4 | Orphaned `scoreOpportunities` async generator (unused) | Low |
| 5 | Type error in `format-adoption-risk.test.ts:68` | Low |
| 7 | `switchDelayMs=0` disables GPU memory reclaim delay | Medium |
| 7 | `PipelineOptions.logLevel` dead field | Low |
| 7 | SUMMARY frontmatter missing 3 req IDs | Low |
| 8 | `writeFinalReports` after `autoCommitEvaluation` — 3 files not committed | Medium |
| 11 | Simulation artifacts written twice (idempotent) | Low |
| 11 | Double `parseExport` call (cli.ts + pipeline-runner.ts) | Low |

**Archives:** `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`, `milestones/v1.0-MILESTONE-AUDIT.md`

---

