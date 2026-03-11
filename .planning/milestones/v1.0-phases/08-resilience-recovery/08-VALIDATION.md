---
phase: 8
slug: resilience-recovery
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | `src/package.json` (test script) |
| **Quick run command** | `cd src && npx tsx --test infra/*.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test infra/*.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | INFR-01 | unit | `npx tsx --test infra/retry-policy.test.ts` | TDD | ⬜ pending |
| 08-02-01 | 02 | 1 | INFR-08 | unit | `npx tsx --test infra/checkpoint.test.ts` | TDD | ⬜ pending |
| 08-02-02 | 02 | 1 | INFR-03 | unit | `npx tsx --test infra/git-commit.test.ts` | TDD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 — Satisfied by TDD RED Phase

Both plans (08-01, 08-02) use `type: tdd`. The RED phase of each task creates the test file with failing tests before any production code is written. This satisfies the Nyquist requirement that test files exist before implementation, without needing separate Wave 0 stub creation.

- [x] `src/infra/retry-policy.test.ts` — created in 08-01 Task 1 RED phase (INFR-01: retry/fallback/skip-and-log)
- [x] `src/infra/git-commit.test.ts` — created in 08-02 Task 2 RED phase (INFR-03: auto-commit artifacts)
- [x] `src/infra/checkpoint.test.ts` — created in 08-02 Task 1 RED phase (INFR-08: checkpoint/resume)

*Existing test infrastructure covers framework needs — no new dependencies.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Resume after crash mid-run | INFR-08 | Requires killing process | 1. Start eval run 2. Kill after 2 cycles 3. Resume 4. Verify no re-processing |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covered by TDD RED phase in each plan
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
