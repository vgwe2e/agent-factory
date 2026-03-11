---
phase: 9
slug: final-reports-and-reflection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | None (uses package.json `"test": "node --test"`) |
| **Quick run command** | `npx tsx --test src/output/<changed-file>.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx --test src/output/<changed-file>.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | OUTP-06 | unit | `npx tsx --test src/output/format-summary.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 0 | OUTP-07 | unit | `npx tsx --test src/output/format-dead-zones.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 0 | OUTP-08 | unit | `npx tsx --test src/output/format-meta-reflection.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 0 | OUTP-05 | integration | `npx tsx --test src/output/write-final-reports.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | OUTP-06 | unit | `npx tsx --test src/output/format-summary.test.ts` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 1 | OUTP-07 | unit | `npx tsx --test src/output/format-dead-zones.test.ts` | ❌ W0 | ⬜ pending |
| 09-04-01 | 04 | 1 | OUTP-08 | unit | `npx tsx --test src/output/format-meta-reflection.test.ts` | ❌ W0 | ⬜ pending |
| 09-05-01 | 05 | 2 | OUTP-05 | integration | `npx tsx --test src/output/write-final-reports.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/output/format-summary.test.ts` — stubs for OUTP-06
- [ ] `src/output/format-dead-zones.test.ts` — stubs for OUTP-07
- [ ] `src/output/format-meta-reflection.test.ts` — stubs for OUTP-08
- [ ] `src/output/write-final-reports.test.ts` — integration stubs for OUTP-05

*Existing infrastructure covers test framework — only test files needed.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
