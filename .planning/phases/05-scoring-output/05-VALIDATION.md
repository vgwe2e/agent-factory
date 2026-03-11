---
phase: 5
slug: scoring-output
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — direct `node --test` invocation |
| **Quick run command** | `npx tsx --test src/output/*.test.ts` |
| **Full suite command** | `npx tsx --test src/**/*.test.ts` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx --test src/output/*.test.ts`
- **After every plan wave:** Run `npx tsx --test src/**/*.test.ts`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | SCOR-07, OUTP-02 | unit | `npx tsx --test src/output/format-scores-tsv.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | OUTP-01 | unit | `npx tsx --test src/output/format-triage-tsv.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 0 | OUTP-03 | unit | `npx tsx --test src/output/format-adoption-risk.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 0 | SCOR-08, OUTP-04 | unit | `npx tsx --test src/output/format-tier1-report.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 0 | All | integration | `npx tsx --test src/output/write-evaluation.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/output/format-triage-tsv.test.ts` — stubs for OUTP-01
- [ ] `src/output/format-scores-tsv.test.ts` — stubs for SCOR-07, OUTP-02
- [ ] `src/output/format-adoption-risk.test.ts` — stubs for OUTP-03
- [ ] `src/output/format-tier1-report.test.ts` — stubs for SCOR-08, OUTP-04
- [ ] `src/output/write-evaluation.test.ts` — integration stubs for full write orchestration
- [ ] `src/types/scoring.ts` — shared type contract (prerequisite, not test)
- [ ] `src/types/triage.ts` — shared type contract (prerequisite, not test)

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
