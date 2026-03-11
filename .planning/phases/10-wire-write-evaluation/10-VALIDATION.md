---
phase: 10
slug: wire-write-evaluation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none (built-in) |
| **Quick run command** | `npx tsx --test src/pipeline/pipeline-runner.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx --test src/pipeline/pipeline-runner.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SCOR-07 | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test | ⬜ pending |
| 10-01-02 | 01 | 1 | SCOR-08 | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test | ⬜ pending |
| 10-01-03 | 01 | 1 | TRIG-02 | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test | ⬜ pending |
| 10-01-04 | 01 | 1 | OUTP-01 | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test | ⬜ pending |
| 10-01-05 | 01 | 1 | OUTP-02 | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test | ⬜ pending |
| 10-01-06 | 01 | 1 | OUTP-03 | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test | ⬜ pending |
| 10-01-07 | 01 | 1 | OUTP-04 | integration | `npx tsx --test src/pipeline/pipeline-runner.test.ts` | New test | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. New tests go in the existing `pipeline-runner.test.ts` file using existing fixtures.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
