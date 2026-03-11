---
phase: 8
slug: resilience-recovery
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Quick run command** | `cd src && npx tsx --test resilience/*.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test resilience/*.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | INFR-01 | unit | `npx tsx --test resilience/retry.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | INFR-03 | unit | `npx tsx --test resilience/git-commit.test.ts` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | INFR-08 | unit | `npx tsx --test resilience/checkpoint.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/resilience/retry.test.ts` — stubs for INFR-01 (retry/fallback/skip-and-log)
- [ ] `src/resilience/git-commit.test.ts` — stubs for INFR-03 (auto-commit artifacts)
- [ ] `src/resilience/checkpoint.test.ts` — stubs for INFR-08 (checkpoint/resume)

*Existing test infrastructure covers framework needs — no new dependencies.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Resume after crash mid-run | INFR-08 | Requires killing process | 1. Start eval run 2. Kill after 2 cycles 3. Resume 4. Verify no re-processing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
