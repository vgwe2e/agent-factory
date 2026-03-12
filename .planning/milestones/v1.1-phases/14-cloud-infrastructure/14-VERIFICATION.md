---
phase: 14-cloud-infrastructure
verified: 2026-03-11T23:10:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Cost summary is included in evaluation output artifacts"
    - "provision() throws on health timeout instead of silently returning a potentially unhealthy endpoint"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Run `aera-evaluate --backend vllm --input export.json` with RUNPOD_API_KEY set (requires real RunPod account)"
    expected: "Engine provisions H100 endpoint, waits for health, scores all opportunities, tears down, prints GPU-hours and estimated cost, and writes evaluation/cloud-cost.json with gpuSeconds/gpuHours/estimatedCost/ratePerHour"
    why_human: "Full end-to-end flow requires live RunPod API key and a real H100 endpoint; cannot be verified programmatically without network access and credentials"
  - test: "Press Ctrl+C during a cloud run"
    expected: "Terminal prints 'Tearing down cloud resources...' and 'Cloud resources torn down.' within 60 seconds; RunPod dashboard shows endpoint deleted"
    why_human: "Signal handler behavior requires live process signal injection and observable RunPod side effect"
---

# Phase 14: Cloud Infrastructure Verification Report

**Phase Goal:** Engine can provision, use, and tear down an ephemeral H100 GPU endpoint automatically -- user only provides a RunPod API key
**Verified:** 2026-03-11T23:10:00Z
**Status:** human_needed
**Re-verification:** Yes -- after gap closure (Plan 03)

## Re-Verification Summary

Previous verification (initial, 2026-03-11) found one gap blocking CLOUD-03:
`costSummary` was present in `PipelineResult` and emitted as a pino log line but was never written to an evaluation artifact file. A secondary issue: `provision()` silently returned on health timeout instead of throwing.

Plan 03 (gap closure) addressed both. This re-verification confirms both fixes are in the codebase and all 49 Phase 14 tests pass.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User runs `--backend vllm` with RUNPOD_API_KEY and engine provisions, scores, and tears down automatically | VERIFIED | `cli.ts` calls `createBackend(backend, { runpodApiKey: process.env.RUNPOD_API_KEY })`, backend-factory cloud path calls `provider.provision()`, returns `cleanup` and `chatFn`. Signal handlers and try/finally both call `doCleanup()`. 49 Phase 14 tests pass. |
| 2 | If the process receives SIGINT or SIGTERM, the cloud endpoint is torn down within 60 seconds | VERIFIED | `process.on("SIGINT", ...)` and `process.on("SIGTERM", ...)` at lines 154-155 of `cli.ts` call `doCleanup()` then exit. Cloud endpoint has `idleTimeout: 60` (line 127 of `cloud-provider.ts`) as additional TTL. Idempotent `cleanedUp` flag prevents double teardown. |
| 3 | If the process crashes with an unhandled error, the cloud endpoint is torn down via finally block | VERIFIED | `cli.ts` try/finally: `try { costTracker.start(); pipelineResult = await runPipeline(...) } finally { costTracker.stop(); await doCleanup(); }`. Any throw propagates after cleanup executes. |
| 4 | After a run completes, the terminal shows GPU-hours consumed and estimated dollar cost | VERIFIED | `cli.ts` lines 217-224: `=== Cloud Cost ===` section prints `cost.gpuHours`, `cost.estimatedCost`, and `cost.ratePerHour` after pipeline completes, guarded by `if (backendConfig.costTracker)`. |
| 5 | Cost summary is included in evaluation output artifacts | VERIFIED | `pipeline-runner.ts` lines 408-418: after `costSummary` is computed, writes `evaluation/cloud-cost.json` via `fs.writeFile(costPath, JSON.stringify(costSummary, null, 2), "utf-8")`. Non-fatal try/catch. Test "writes cloud-cost.json when costTracker is provided" confirms content matches `CostSummary` shape. Test "does not write cloud-cost.json when no costTracker" confirms Ollama path is unaffected. |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/infra/cloud-provider.ts` | RunPod serverless endpoint lifecycle: create, health poll, teardown | VERIFIED | Exports `createCloudProvider`, `CloudProvider`, `CloudProviderConfig`, `ProvisionedEndpoint`. Creates endpoints via GraphQL `saveEndpoint` mutation. Polls `/health` endpoint. Tears down via `deleteEndpoint` mutation. Health timeout now throws `Error` with message "vLLM health check timed out after Ns -- model may not be loaded on endpoint <id>" instead of silently returning. 253 lines, substantive. |
| `src/infra/cost-tracker.ts` | GPU time accumulation and dollar cost estimation | VERIFIED | Exports `createCostTracker`, `CostTracker`, `CostSummary`, `DEFAULT_H100_RATE`. `start()`, `stop()`, `summary()` methods. `formatDuration` and `formatCost` helpers. 89 lines, substantive. |
| `src/infra/backend-factory.ts` | Extended backend factory with cloud provisioning path | VERIFIED | `createBackend` is `async`, returns `Promise<BackendConfig>`. Three vLLM paths: user-managed (vllmUrl), cloud (runpodApiKey), error. `BackendConfig` extended with `cleanup?`, `costTracker?`, `endpointId?`. |
| `src/cli.ts` | Signal handler teardown, dotenv loading, cost summary display, RUNPOD_API_KEY support | VERIFIED | `import "dotenv/config"` at line 11. SIGINT/SIGTERM handlers. try/finally around runPipeline. Cloud cost display after pipeline. `process.env.RUNPOD_API_KEY` passed to `createBackend`. |
| `src/pipeline/pipeline-runner.ts` | Cost tracker integration, cloud-cost.json written to evaluation/ directory | VERIFIED | `costTracker?: CostTracker` in `PipelineOptions`. `costSummary?: CostSummary` in `PipelineResult`. After costSummary computed (line 404), writes `evaluation/cloud-cost.json` (lines 408-418). Non-fatal try/catch. Both `fs` and `path` imported at lines 44-45. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/cli.ts` | `src/infra/cloud-provider.ts` | Signal handlers calling teardown on SIGINT/SIGTERM | WIRED | `doCleanup()` calls `backendConfig.cleanup()` which calls `provider.teardown(endpoint)`. SIGINT/SIGTERM handlers wired at lines 154-155. |
| `src/cli.ts` | `src/infra/cost-tracker.ts` | Cost summary printed after pipeline completes | WIRED | `backendConfig.costTracker.summary()` called in CLI cloud cost section. Prints `gpuHours`, `estimatedCost`, `ratePerHour`. |
| `src/infra/backend-factory.ts` | `src/infra/cloud-provider.ts` | createBackend provisions endpoint when backend=vllm and no vllmUrl | WIRED | `import { createCloudProvider } from "./cloud-provider.js"`. Called when `options?.runpodApiKey` is truthy. |
| `src/pipeline/pipeline-runner.ts` | `evaluation/cloud-cost.json` | fs.writeFile after costSummary computed | WIRED | Lines 408-418: `fs.mkdir(evalDir, { recursive: true })` then `fs.writeFile(costPath, JSON.stringify(costSummary, null, 2), "utf-8")`. Pattern "cloud-cost.json" at line 410. Both `node:fs/promises` and `node:path` imported. |
| `src/pipeline/pipeline-runner.ts` | `src/infra/cost-tracker.ts` | Pipeline receives costTracker in PipelineOptions | WIRED | `costTracker?: CostTracker` in `PipelineOptions` (line 74). `costSummary = options.costTracker?.summary()` at line 404. Note: start/stop lifecycle is in `cli.ts` wrapping the entire pipeline call -- functionally equivalent to wrapping the scoring phase. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLOUD-01 | 14-01, 14-02 | Engine programmatically provisions ephemeral H100 endpoint via RunPod API | SATISFIED | `cloud-provider.ts` creates endpoint via RunPod GraphQL `saveEndpoint` mutation with `gpuIds: "NVIDIA H100 80GB HBM3"`. Backend factory invokes on `runpodApiKey` path. REQUIREMENTS.md shows `[x]` checked and Phase 14 Complete. |
| CLOUD-02 | 14-01, 14-02 | Engine auto-tears-down cloud instance on completion, crash, or signal (SIGINT/SIGTERM) | SATISFIED | Three-layer teardown: SIGINT/SIGTERM signal handlers, try/finally block, and `idleTimeout: 60` on the endpoint. All paths call `provider.teardown()`. REQUIREMENTS.md shows `[x]` checked. |
| CLOUD-03 | 14-01, 14-02, 14-03 | Engine tracks and reports GPU-hours consumed and estimated cost per run | SATISFIED | Terminal output (CLI cost display) + `evaluation/cloud-cost.json` artifact (pipeline-runner.ts lines 408-418). Both channels confirmed. REQUIREMENTS.md shows `[x]` checked. Gap from initial verification closed by Plan 03. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | -- | -- | -- | No anti-patterns found in gap-closure files |

Previous warning (health timeout silent return) was resolved: `cloud-provider.ts` line 212 now throws `Error` with "vLLM health check timed out after Ns" instead of returning the endpoint silently.

---

### Test Results

**Phase 14 source tests (all 4 suites):**
- `infra/cloud-provider.test.ts` -- includes new "provision() throws when vLLM health check times out" test
- `infra/cost-tracker.test.ts`
- `infra/backend-factory.test.ts`
- `pipeline/pipeline-runner.test.ts` -- includes new "writes cloud-cost.json when costTracker is provided" and "does not write cloud-cost.json when no costTracker" tests

Result: 49 tests, 49 pass, 0 fail

**Full suite note:** Running `npm test` shows 20 failures in `dist/` compiled tests due to missing `dist/data/` JSON assets. These failures are pre-existing and unrelated to Phase 14 -- they are build-artifact issues affecting simulation and knowledge modules. All Phase 14 source tests run clean via `npx tsx --test`.

**Commits verified (all exist in git log):**
- `a8a966d` test(14-03): add failing tests for cloud-cost.json artifact
- `817a608` feat(14-03): write cloud-cost.json to evaluation directory
- `d9700a6` test(14-03): add failing test for health timeout throw
- `fe98907` fix(14-03): throw on vLLM health check timeout instead of silent return

---

### Human Verification Required

#### 1. Full cloud provisioning end-to-end flow

**Test:** Set `RUNPOD_API_KEY` in `.env`, run `npx tsx cli.ts --input export.json --backend vllm`
**Expected:** Terminal shows "RunPod endpoint: <id>", scoring proceeds, teardown message appears, "=== Cloud Cost ===" section prints GPU-hours and dollar cost, and `evaluation/cloud-cost.json` exists in the output directory containing `gpuSeconds`, `gpuHours`, `estimatedCost`, and `ratePerHour`.
**Why human:** Requires live RunPod API key, real H100 hardware provisioning, and observable external side effect. Programmatic verification cannot test the RunPod GraphQL endpoint or real endpoint health polling.

#### 2. Signal handler teardown under Ctrl+C

**Test:** Start a cloud run (`--backend vllm` with `RUNPOD_API_KEY`), press Ctrl+C during scoring
**Expected:** Within 60 seconds: "Tearing down cloud resources..." and "Cloud resources torn down." appear in terminal. RunPod dashboard confirms endpoint is deleted or deleting.
**Why human:** Requires live process signal injection and RunPod API observation.

---

### Summary

All five observable truths are now verified. The initial gap (costSummary not written to evaluation artifact files) was closed by Plan 03:

- `pipeline-runner.ts` now writes `evaluation/cloud-cost.json` after the cost summary is computed, using a non-fatal try/catch pattern consistent with other evaluation artifact writers in the codebase.
- `cloud-provider.ts` now throws a descriptive error when the vLLM health poll times out, preventing the caller from scoring against a potentially unresponsive endpoint.
- Two new tests confirm the cloud-cost.json behavior (written with costTracker, not written without).
- One new test confirms provision() rejects with an error matching /health/i and /timed out/i.

All three CLOUD requirements (CLOUD-01, CLOUD-02, CLOUD-03) are fully satisfied. Phase goal is achieved at the automated verification level. Two items remain for human verification due to requiring live cloud infrastructure.

---

_Verified: 2026-03-11T23:10:00Z_
_Re-verification: Yes (initial: gaps_found 4/5, re-verification: human_needed 5/5)_
_Verifier: Claude (gsd-verifier)_
