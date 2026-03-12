---
phase: 12-vllm-client-adapter
verified: 2026-03-11T21:12:42Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 12: vLLM Client Adapter Verification Report

**Phase Goal:** Users can score opportunities through a vLLM backend using the same interface and CLI as the existing Ollama path
**Verified:** 2026-03-11T21:12:42Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `createVllmChatFn` returns a ChatFn that sends POST to `/v1/chat/completions` with correct OpenAI-compatible body | VERIFIED | `vllm-client.ts` lines 55-65; 11/11 tests pass including body structure test |
| 2 | Ollama format parameter (raw JSON schema) is translated to vLLM `response_format` with `json_schema` type | VERIFIED | `translateToResponseFormat` in `schema-translator.ts` lines 144-168; wraps, strips `$schema`, resolves `$ref` |
| 3 | All three scoring schemas (technical, adoption, value) pass pre-flight compatibility validation | VERIFIED | `validateScoringSchemas()` tested against real schemas; test "returns valid:true for all three real scoring schemas" passes |
| 4 | vLLM HTTP errors and timeouts return `{ success: false, error: string }` matching ChatResult union | VERIFIED | `vllm-client.ts` lines 67-82; HTTP error and network error tests pass |
| 5 | User can run `aera-evaluate --backend vllm --vllm-url http://host:8000 --input export.json` and scoring uses vLLM | VERIFIED | CLI `--backend` and `--vllm-url` flags present; `createBackend` called with result passed as `chatFn` to `runPipeline` |
| 6 | User can omit `--backend` flag and behavior is identical to v1.0 (Ollama, sequential) | VERIFIED | `--backend` defaults to `"ollama"`; `createBackend("ollama")` returns `ollamaChat` unchanged; `useLocalModels = options.backend !== "vllm"` preserves full Ollama path |
| 7 | Engine runs `validateScoringSchemas` before starting a vLLM scoring run and exits with clear error if validation fails | VERIFIED | `backend-factory.ts` lines 61-67; `createBackend("vllm")` calls `validateScoringSchemas()` and throws descriptive error on failure; CLI wraps in try/catch and exits with RED message |
| 8 | Pipeline injects the vLLM ChatFn into `scoreOneOpportunity` without any changes to `scoring-pipeline.ts` | VERIFIED | `pipeline-runner.ts` line 227 passes `options.chatFn` to `scoreOneOpportunity`; `scoring-pipeline.ts` already had DI — unchanged |

**Score:** 8/8 truths verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Lines | Status | Details |
|----------|----------|-------|--------|---------|
| `src/scoring/vllm-client.ts` | ChatFn adapter for vLLM OpenAI-compatible API | 84 | VERIFIED | Exports `createVllmChatFn`, `VLLM_TIMEOUT_MS`, `VLLM_TEMPERATURE`; substantive implementation |
| `src/scoring/vllm-client.test.ts` | Tests for vLLM client adapter | 233 (min 80) | VERIFIED | 11 tests; all pass |
| `src/scoring/schema-translator.ts` | Ollama format to vLLM response_format translation and pre-flight validation | 228 | VERIFIED | Exports `translateToResponseFormat`, `validateScoringSchemas`, `VllmResponseFormat` |
| `src/scoring/schema-translator.test.ts` | Tests for schema translation and validation | 140 (min 60) | VERIFIED | 8 tests; all pass |

### Plan 02 Artifacts

| Artifact | Expected | Lines | Status | Details |
|----------|----------|-------|--------|---------|
| `src/infra/backend-factory.ts` | Factory that creates ChatFn + config from --backend flag | 77 | VERIFIED | Exports `createBackend`, `Backend`, `BackendConfig`, `VllmBackendOptions` |
| `src/infra/backend-factory.test.ts` | Tests for backend factory | 79 (min 60) | VERIFIED | 7 tests; all pass |
| `src/cli.ts` | Updated CLI with --backend and --vllm-url flags | — | VERIFIED | Both flags present; version bumped to v1.1.0 |
| `src/pipeline/pipeline-runner.ts` | Updated pipeline that uses backend factory ChatFn | — | VERIFIED | `backend` field in PipelineOptions; `useLocalModels` guard at lines 169, 335 |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/scoring/vllm-client.ts` | `src/scoring/schema-translator.ts` | `import translateToResponseFormat` | WIRED | Line 13: `import { translateToResponseFormat } from "./schema-translator.js"` |
| `src/scoring/vllm-client.ts` | `src/scoring/ollama-client.ts` | shared `ChatResult` type | WIRED | Line 12: `import type { ChatResult } from "./ollama-client.js"` |

### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/infra/backend-factory.ts` | `src/scoring/vllm-client.ts` | `import createVllmChatFn` | WIRED | Line 11: `import { createVllmChatFn } from "../scoring/vllm-client.js"` |
| `src/infra/backend-factory.ts` | `src/scoring/schema-translator.ts` | `import validateScoringSchemas` | WIRED | Line 12: `import { validateScoringSchemas } from "../scoring/schema-translator.js"` |
| `src/cli.ts` | `src/infra/backend-factory.ts` | `import createBackend` | WIRED | Line 15: `import { createBackend } from "./infra/backend-factory.js"` |
| `src/pipeline/pipeline-runner.ts` | `src/infra/backend-factory.ts` | receives `chatFn` from backend factory via `PipelineOptions` | WIRED | CLI passes `backendConfig.chatFn` and `backend` to `runPipeline`; pipeline uses `options.chatFn` at line 227 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VLLM-01 | 12-01, 12-02 | User can score opportunities via vLLM backend using same ChatFn interface | SATISFIED | `createVllmChatFn` returns a function matching the `ChatFn` signature; injected into scoring pipeline via `PipelineOptions.chatFn` |
| VLLM-02 | 12-01 | Engine translates Zod JSON schemas to vLLM `response_format` with `json_schema` type | SATISFIED | `translateToResponseFormat` wraps Ollama-style schemas into `{ type: "json_schema", json_schema: { name, strict, schema } }`; handles `$schema` stripping, `$ref` resolution, `additionalProperties` stripping |
| VLLM-03 | 12-02 | User can select backend via `--backend ollama\|vllm` CLI flag (default: ollama) | SATISFIED | Commander option with `.choices(["ollama", "vllm"]).default("ollama")` at `cli.ts` lines 43-47; `--vllm-url` flag at lines 48-51 |
| VLLM-04 | 12-01, 12-02 | Engine validates scoring schemas against vLLM before starting pipeline | SATISFIED | `createBackend("vllm")` calls `validateScoringSchemas()` and throws with descriptive error if invalid; CLI catches and exits before pipeline starts |

All four requirements verified as SATISFIED. No orphaned requirements found — all VLLM-01 through VLLM-04 appear in REQUIREMENTS.md and are mapped to Phase 12.

---

## Anti-Patterns Found

No anti-patterns detected in any of the six key files:

- No TODO/FIXME/PLACEHOLDER comments
- No stub return values (`return null`, `return {}`, `return []`)
- No empty handlers or console-log-only implementations
- All functions have substantive implementations

---

## Test Results

| Test Suite | Tests | Pass | Fail |
|-----------|-------|------|------|
| `scoring/schema-translator.test.ts` | 8 | 8 | 0 |
| `scoring/vllm-client.test.ts` | 11 | 11 | 0 |
| `infra/backend-factory.test.ts` | 7 | 7 | 0 |
| `pipeline/pipeline-runner.test.ts` | 16 | 16 | 0 |
| **Phase 12 total** | **42** | **42** | **0** |

**Full suite:** 345 pass, 20 fail. The 20 failures are pre-existing and unrelated to Phase 12:

- 2 failures in `parseExport` — missing `ford_hierarchy_v2_export.json` fixture (file not checked into repo)
- 18 failures in `dist/` compiled test files — stale compiled output from earlier phases

Both failure categories were documented in SUMMARY.md for Plan 01 and Plan 02 as pre-existing. No regressions introduced by Phase 12.

---

## Human Verification Required

### 1. End-to-end vLLM scoring run

**Test:** Run `npx tsx cli.ts --backend vllm --vllm-url http://<running-vllm-host>:8000 --input export.json` against a real vLLM server loaded with a Qwen 2.5 model.
**Expected:** Scoring completes with structured JSON output from vLLM; results written to `./evaluation`; no Ollama model management messages in output.
**Why human:** Requires a live vLLM instance (H100/RunPod) that is not available in automated verification.

### 2. Default Ollama path unchanged

**Test:** Run `npx tsx cli.ts --input export.json` (no `--backend`) against a running Ollama instance.
**Expected:** Behavior identical to pre-Phase 12 v1.0; output shows `Backend: ollama (local)`.
**Why human:** Requires a running Ollama instance; verifies no behavioral regression in the default path.

### 3. Schema validation failure UX

**Test:** Temporarily corrupt a scoring schema and run `--backend vllm --vllm-url http://localhost:8000`.
**Expected:** Pipeline exits before scoring with a RED error message listing the specific schema failures.
**Why human:** Requires code modification to inject a bad schema; verifies the user-facing error message quality.

---

## Summary

Phase 12 fully achieves its goal. All six required artifacts exist with substantive implementations (84-233 lines each). All six key dependency links are wired. The ChatFn adapter pattern is complete end-to-end: `schema-translator.ts` handles format translation, `vllm-client.ts` handles the HTTP call, `backend-factory.ts` handles selection and pre-flight validation, `cli.ts` exposes the `--backend`/`--vllm-url` flags, and `pipeline-runner.ts` routes the injected `chatFn` to scoring without touching `scoring-pipeline.ts`.

All four VLLM requirements (VLLM-01 through VLLM-04) are satisfied with direct code evidence. The existing Ollama path is provably unchanged — `createBackend("ollama")` returns the original `ollamaChat` function, and 16/16 pipeline-runner tests continue to pass.

---

_Verified: 2026-03-11T21:12:42Z_
_Verifier: Claude (gsd-verifier)_
