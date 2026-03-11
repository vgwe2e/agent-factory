# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

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

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~10 | 11 | Established TDD + DI + fine-grained planning pattern |

### Cumulative Quality

| Milestone | Tests | Coverage | Tech Debt Items |
|-----------|-------|----------|-----------------|
| v1.0 | 412 | — | 9 (2 medium, 7 low) |

### Top Lessons (Verified Across Milestones)

1. Wire integration early — gap closure phases are avoidable overhead
2. Milestone audits catch real bugs, not just process issues
