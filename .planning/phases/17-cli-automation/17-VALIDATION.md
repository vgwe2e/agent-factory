---
phase: 17
slug: cli-automation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `assert/strict` |
| **Config file** | None (convention-based, co-located `*.test.ts` files) |
| **Quick run command** | `npx tsx --test src/infra/checkpoint.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx --test src/infra/checkpoint.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | AUTO-01 | unit | `npx tsx --test src/infra/checkpoint.test.ts` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | AUTO-01 | unit | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 1 | AUTO-02 | unit | `npx tsx --test src/cli.test.ts` | ❌ W0 | ⬜ pending |
| 17-02-02 | 02 | 1 | AUTO-04 | unit | `npx tsx --test src/cli.test.ts` | ❌ W0 | ⬜ pending |
| 17-03-01 | 03 | 2 | AUTO-03 | integration | Manual (requires real backend) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/infra/checkpoint.test.ts` — add tests for new `clearCheckpointErrors` function (file exists, needs new test cases)
- [ ] `src/cli.test.ts` — new file for CLI-level retry loop and exit code tests (or test via pipeline-runner.test.ts with mocked pipeline)

*Existing test infrastructure (node:test, assert/strict) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full lifecycle: score → retry → report → teardown | AUTO-03 | Requires real RunPod backend and hierarchy export | Run `npx tsx src/cli.ts --input ford.json --backend vllm --retry 3 --teardown` and verify all stages complete |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
