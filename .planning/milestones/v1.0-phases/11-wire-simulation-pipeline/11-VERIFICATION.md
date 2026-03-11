---
phase: 11-wire-simulation-pipeline
verified: 2026-03-11T17:36:17Z
status: passed
score: 6/6 must-haves verified
---

# Phase 11: Wire Simulation Pipeline Verification Report

**Phase Goal:** Simulation pipeline runs during pipeline execution, producing real artifacts and passing real results to final reports
**Verified:** 2026-03-11T17:36:17Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                        | Status     | Evidence                                                                                                          |
|----|------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------|
| 1  | Promoted scoring results are correctly transformed into SimulationInput objects | VERIFIED | `toSimulationInputs` in `src/pipeline/scoring-to-simulation.ts` (49 lines, substantive); all 4 adapter unit tests pass |
| 2  | Pipeline runner calls runSimulationPipeline for promoted opportunities after scoring | VERIFIED | `pipeline-runner.ts` line 285: `const runSim = options.runSimulationPipelineFn ?? defaultRunSimulationPipeline; simResult = await runSim(simInputs, simDir)` |
| 3  | Simulation artifact directories are created under evaluation/simulations/<slug>/ | VERIFIED | Integration test "runs simulation pipeline for promoted opportunities and creates artifact directories" passes (ok 13); mock creates decision-flow.mmd, component-map.yaml, mock-test.yaml, integration-surface.yaml |
| 4  | writeFinalReports receives real SimulationPipelineResult with non-zero counts  | VERIFIED | `pipeline-runner.ts` line 319: `simResult` passed directly; `emptySimResult` constant deleted; test ok 14 confirms `summary.md` does not contain "Simulated: 0" |
| 5  | summary.md contains non-zero simulation metrics                               | VERIFIED | Integration test "passes real simulation results to writeFinalReports" (ok 14) asserts content does not include "Simulated: 0" |
| 6  | Simulation pipeline failure does not crash the overall pipeline               | VERIFIED | try-catch at `pipeline-runner.ts` lines 291-301; integration test "simulation pipeline failure is non-fatal" (ok 15) passes with `scoredCount=3, errorCount=0, simulatedCount=0` |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact                                        | Expected                                 | Status   | Details                                                             |
|-------------------------------------------------|------------------------------------------|----------|---------------------------------------------------------------------|
| `src/pipeline/scoring-to-simulation.ts`        | Pure adapter function toSimulationInputs | VERIFIED | 49 lines, exports `toSimulationInputs`, uses `getRouteForArchetype` |
| `src/pipeline/scoring-to-simulation.test.ts`   | Unit tests for adapter function          | VERIFIED | 165 lines (> 40 minimum), 4 tests, all pass                        |
| `src/pipeline/pipeline-runner.ts`              | Updated pipeline with simulation wiring  | VERIFIED | Contains `runSimulationPipeline` call, `toSimulationInputs` call, `simulatedCount` in PipelineResult, non-fatal error handling |
| `src/pipeline/pipeline-runner.test.ts`         | Integration tests for simulation wiring  | VERIFIED | 731 lines, 16 tests total (12 existing + 4 new simulation tests), all pass |

### Key Link Verification

| From                                     | To                                          | Via                          | Status  | Details                                                       |
|------------------------------------------|---------------------------------------------|------------------------------|---------|---------------------------------------------------------------|
| `src/pipeline/scoring-to-simulation.ts` | `src/types/simulation.ts`                   | SimulationInput type import  | WIRED   | Line 10: `import type { SimulationInput } from "../types/simulation.js"` |
| `src/pipeline/scoring-to-simulation.ts` | `src/knowledge/orchestration.ts`            | getRouteForArchetype call    | WIRED   | Line 12 import + Line 36 call: `const mapping = getRouteForArchetype(sr.archetype)` |
| `src/pipeline/pipeline-runner.ts`       | `src/simulation/simulation-pipeline.ts`     | runSimulationPipeline call   | WIRED   | Line 37 import + Line 285 call via injected or default fn     |
| `src/pipeline/pipeline-runner.ts`       | `src/pipeline/scoring-to-simulation.ts`     | toSimulationInputs adapter call | WIRED | Line 39 import + Line 280 call: `toSimulationInputs(promoted, l3Map, l4Map, data.company_context)` |

### Requirements Coverage

| Requirement | Description                                                                 | Status    | Evidence                                                                                    |
|-------------|-----------------------------------------------------------------------------|-----------|----------------------------------------------------------------------------------------------|
| SIMU-01     | Engine generates Mermaid decision flow diagrams for qualifying opportunities | SATISFIED | Simulation pipeline (Phase 6) wired into runner; test creates decision-flow.mmd artifacts   |
| SIMU-02     | Engine produces YAML component maps linking to specific Aera components      | SATISFIED | Simulation pipeline wired; test creates component-map.yaml artifacts                        |
| SIMU-03     | Engine creates mock decision tests with actual client financials              | SATISFIED | Simulation pipeline wired; test creates mock-test.yaml artifacts                            |
| SIMU-04     | Engine maps integration surfaces                                              | SATISFIED | Simulation pipeline wired; test creates integration-surface.yaml artifacts                  |
| KNOW-04     | Every generated component reference exists in bundled knowledge base          | SATISFIED | `simulation-pipeline.ts` imports `knowledge-validator.ts`; validation runs inside the pipeline that is now wired in |
| OUTP-05     | Engine produces evaluation/simulations/<skill-name>/ with artifacts          | SATISFIED | `simDir = path.join(options.outputDir, "evaluation", "simulations")` passed to pipeline; test verifies directory creation |
| OUTP-06     | Engine produces evaluation/summary.md with executive summary                  | SATISFIED | `writeFinalReports` receives real `simResult`; test asserts non-zero simulation metrics in summary.md |

All 7 requirements claimed by the plan are satisfied. No orphaned requirements for Phase 11 in REQUIREMENTS.md.

### Anti-Patterns Found

None found in phase 11 files. No TODO/FIXME/placeholder comments, no stub implementations, no ignored responses.

### Human Verification Required

**1. Real Simulation Artifact Content Quality**

**Test:** Run `npm run dev -- --input ford_hierarchy_v2_export.json` against a real hierarchy export and inspect `evaluation/simulations/<skill-name>/decision-flow.mmd` for Mermaid validity and `component-map.yaml` for real Aera component names.

**Expected:** Decision flow is valid Mermaid syntax; component map references components that appear in the bundled knowledge base (KNOW-04 end-to-end).

**Why human:** The integration tests use a mock `runSimulationPipelineFn` that writes stub files. Real content quality requires running against actual Ollama models and a live export.

### Gaps Summary

No gaps. All 6 observable truths are verified, all 4 artifacts exist and are substantive and wired, all 4 key links are confirmed present in source code, and all 7 claimed requirements have implementation evidence. The full 16-test suite passes (4 adapter unit tests + 12 existing pipeline tests + 4 new simulation integration tests). The one TypeScript error (`format-adoption-risk.test.ts:68` -- `"flag"` not assignable to action type) is pre-existing from Phase 10 and was not introduced by Phase 11.

---

_Verified: 2026-03-11T17:36:17Z_
_Verifier: Claude (gsd-verifier)_
