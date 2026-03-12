# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Cloud-Accelerated Scoring

**Shipped:** 2026-03-12
**Phases:** 3 | **Plans:** 7 | **Sessions:** ~3

### What Was Built
- vLLM ChatFn adapter with Zod-to-vLLM schema translation and pre-flight validation
- Backend factory with `--backend ollama|vllm` CLI flag preserving full backward compatibility
- Semaphore-bounded concurrent scoring with `--concurrency` flag and timeout protection
- Concurrent-safe checkpoint writer with debounced atomic writes
- Ephemeral H100 provisioning via RunPod GraphQL with auto-teardown and GPU cost tracking
- Progress tracker with in-flight/completed/errors/ETA structured logging

### What Worked
- **TDD continued to pay off**: 140 new tests across 3 phases, zero regressions in existing 412 tests
- **Dependency injection from v1.0**: ChatFn interface made vLLM adapter a true drop-in — no scoring code changed
- **Fine-grained planning**: 7 plans averaged ~3.5min execution each, same sweet spot as v1.0
- **Research before implementation**: Phase research caught RunPod SDK limitations (no create/delete) and vLLM xgrammar $ref issues before coding started
- **Milestone audit**: Caught cloud-cost.json gap and health timeout silent failure before shipping

### What Was Inefficient
- **Gap closure phase (14-03)**: 2 issues discovered by verification that should have been in the original plan — cost artifact write and health timeout behavior
- **RunPod SDK mismatch**: Plan assumed SDK had create/delete methods; had to pivot to GraphQL API mid-implementation (auto-fixed, but could have been caught in research)

### Patterns Established
- Async factory pattern: createBackend returns Promise for cloud provisioning flows
- Defense-in-depth cleanup: signal handlers + try/finally + cloud-side idle timeout
- Counting semaphore with direct slot handoff for bounded concurrency
- Debounced atomic checkpoint writes for concurrent-safe persistence
- Non-fatal artifact writing pattern (try/catch with logger.warn)

### Key Lessons
1. **Research catches API surface mismatches**: The RunPod SDK deviation was caught during research but not fully addressed in planning. Future plans should list API methods to call and verify they exist.
2. **Verification finds real gaps**: cloud-cost.json and health timeout were genuine gaps, not process noise. Keep verification as a mandatory step.
3. **ChatFn interface is the right abstraction**: Adding a completely new backend (vLLM) required zero changes to scoring logic thanks to the ChatFn interface from v1.0.
4. **Concurrency primitives are reusable**: Semaphore, withTimeout, and checkpoint writer are general-purpose — can serve future parallel workloads.

### Cost Observations
- Model mix: Quality profile (opus for execution)
- Sessions: ~3 sessions in 1 day
- Notable: 7 plans in ~26 minutes total — continued high throughput from fine-grained planning

---

## Milestone: v1.0 — Aera Skill Feasibility Engine MVP

**Shipped:** 2026-03-11
**Phases:** 11 | **Plans:** 31 | **Sessions:** ~10

### What Was Built
- Complete CLI pipeline: ingestion → triage → scoring → simulation → final reports → git commit
- Bundled Aera knowledge base (21 UI components, 22 PB nodes, orchestration decision guide)
- Three-lens scoring with adoption-weighted composites and archetype routing
- Simulation pipeline generating Mermaid flows, YAML component maps, mock tests, integration surfaces
- Overnight resilience with checkpoint recovery, three-tier retry, and git auto-commit
- 412 tests across 11 phases, all passing

### What Worked
- **TDD throughout**: Writing tests first caught schema mismatches early (Phase 1 enum corrections, Phase 2 property count discrepancy)
- **Dependency injection**: chatFn/parseExportFn injection made every module testable without Ollama running
- **Fine granularity planning**: 31 plans across 11 phases kept each unit of work small (~3min avg execution)
- **Pure function design**: Core scoring/triage/formatting logic has zero I/O side effects, enabling fast deterministic tests
- **Milestone audit**: Caught the writeEvaluation and simulation pipeline gaps before shipping — led to Phases 10-11

### What Was Inefficient
- **Gap closure phases**: Phases 10-11 were reactive (fixing integration gaps found by audit). Better upfront pipeline-runner wiring in Phase 7 would have avoided these
- **SUMMARY frontmatter gaps**: 3 requirements missing from Phase 7 SUMMARY frontmatter — bookkeeping overhead not automated
- **writeFinalReports ordering**: Placed after auto-commit in Phase 8, discovered only during audit — integration testing should have caught this earlier
- **Double parseExport**: cli.ts pre-flight parse + pipeline-runner.ts internal parse — architectural decision not revisited when pipeline runner was built

### Patterns Established
- Result type pattern: `{success, data} | {success, error}` for all fallible operations
- Zod-first schema design: define Zod schema, infer TypeScript types with `z.infer`
- DI via function parameters (chatFn, fetchFn) with production defaults
- Tagged union discriminated types for red flags and archetype routing
- Temperature 0.3 for structured LLM output (Mermaid, YAML)
- Non-fatal error handling: skip-and-log over crash for long-running pipelines

### Key Lessons
1. **Wire end-to-end early**: Building formatters/generators before wiring them into the pipeline runner created invisible gaps. Wire the skeleton pipeline first, then fill in implementations.
2. **Milestone audits catch real bugs**: The audit found that writeEvaluation and simulation pipeline were never called from the runner — these were real functional gaps, not just bookkeeping.
3. **3-minute plans are the sweet spot**: Average plan execution of 3 minutes kept context fresh and errors small. Plans that took 5-6 minutes (07-03, 06-02) were at the upper boundary.
4. **Knowledge base bundling pays off**: Having real Aera component data in the engine enabled KNOW-04 enforcement (no hallucinated components) — this would have been impossible with mock data.

### Cost Observations
- Model mix: Quality profile used throughout (opus for execution)
- Sessions: ~10 sessions across 2 days
- Notable: 31 plans in ~93 minutes total execution — high throughput from fine-grained planning

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Avg Plan Time | Key Change |
|-----------|----------|--------|-------|---------------|------------|
| v1.0 | ~10 | 11 | 31 | ~3min | Established TDD + DI + fine-grained planning pattern |
| v1.1 | ~3 | 3 | 7 | ~3.5min | Added research phase; ChatFn abstraction enabled painless backend addition |

### Cumulative Quality

| Milestone | Tests | Coverage | Tech Debt Items |
|-----------|-------|----------|-----------------|
| v1.0 | 412 | — | 9 (2 medium, 7 low) |
| v1.1 | 552 | — | 12 (2 medium, 10 low) |

### Top Lessons (Verified Across Milestones)

1. Wire integration early — gap closure phases are avoidable overhead (v1.0 Phases 10-11, v1.1 Plan 14-03)
2. Milestone audits catch real bugs, not just process issues (both milestones)
3. ChatFn/DI abstraction investment pays compounding returns (v1.1 vLLM adapter was zero-change to scoring)
4. Research before planning catches API surface mismatches (v1.1 RunPod SDK, vLLM xgrammar)
