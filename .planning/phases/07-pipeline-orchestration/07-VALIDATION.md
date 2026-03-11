---
phase: 7
slug: pipeline-orchestration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | None (uses package.json test script) |
| **Quick run command** | `cd src && npx tsx --test {changed_test_file}` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test {changed_test_file}`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | INFR-02 | unit | `cd src && npx tsx --test infra/logger.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 0 | INFR-04 | unit (mocked fetch) | `cd src && npx tsx --test infra/model-manager.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 0 | INFR-04 | unit | `cd src && npx tsx --test scoring/ollama-client.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 0 | INFR-05 | unit | `cd src && npx tsx --test pipeline/context-tracker.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 0 | INFR-07 | integration (mocked LLM) | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/infra/logger.ts` + `src/infra/logger.test.ts` — pino factory and child binding tests (INFR-02)
- [ ] `src/infra/model-manager.ts` + `src/infra/model-manager.test.ts` — model lifecycle tests (INFR-04)
- [ ] `src/pipeline/pipeline-runner.ts` + `src/pipeline/pipeline-runner.test.ts` — end-to-end orchestrator tests (INFR-07)
- [ ] `src/pipeline/context-tracker.ts` + `src/pipeline/context-tracker.test.ts` — context archive/reset tests (INFR-05)
- [ ] `npm install pino pino-pretty` — pino dependency installation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Model swap memory reclaim on Apple Silicon | INFR-04 | Requires real Ollama with 36GB hardware | 1. Run pipeline with both models 2. Monitor `ollama ps` between swaps 3. Verify no OOM |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
