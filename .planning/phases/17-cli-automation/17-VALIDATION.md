---
phase: 17
slug: cli-automation
status: draft
nyquist_compliant: true
wave_0_complete: true
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

- **After every task commit:** Run relevant test file
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | AUTO-01 | unit | `npx tsx --test src/infra/checkpoint.test.ts` | Yes (existing file, new tests added) | pending |
| 17-02-01 | 02 | 2 | AUTO-02 | unit | `npx tsx --test src/cli.test.ts` | Created in Task 1 | pending |
| 17-02-02 | 02 | 2 | AUTO-04 | unit | `npx tsx --test src/cli.test.ts` | Created in Task 1 | pending |
| 17-02-03 | 02 | 2 | AUTO-01 | unit | `npx tsx --test src/cli.test.ts` | Created in Task 1 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Wave 0 is handled within the plans themselves:

- Plan 01 Task 1 creates checkpoint tests as part of TDD (RED phase writes tests first)
- Plan 02 Task 1 creates `src/cli.test.ts` as part of TDD (RED phase writes tests first)

No separate Wave 0 plan needed — test creation is the first task in each plan.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full lifecycle: score -> retry -> report -> teardown | AUTO-03 | Requires real RunPod backend and hierarchy export | Run `npx tsx src/cli.ts --input ford.json --backend vllm --retry 3 --teardown` and verify all stages complete |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (tests created as TDD first tasks)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
