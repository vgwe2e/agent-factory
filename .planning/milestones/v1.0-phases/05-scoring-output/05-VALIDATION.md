---
phase: 5
slug: scoring-output
status: draft
nyquist_compliant: true
wave_0_complete: true
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

All plans in this phase use `type: tdd`. TDD tasks create tests as the RED step before implementation (GREEN step), so tests are created inline at each task's wave -- no separate Wave 0 stub plan is needed.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 05-01-01 | 01 | 1 | (types+utils) | unit | `npx tsx --test src/output/tsv-utils.test.ts` | ⬜ pending |
| 05-01-02 | 01 | 1 | OUTP-01 | unit | `npx tsx --test src/output/format-triage-tsv.test.ts` | ⬜ pending |
| 05-01-03 | 01 | 1 | SCOR-07, OUTP-02 | unit | `npx tsx --test src/output/format-scores-tsv.test.ts` | ⬜ pending |
| 05-02-01 | 02 | 2 | OUTP-03 | unit | `npx tsx --test src/output/format-adoption-risk.test.ts` | ⬜ pending |
| 05-02-02 | 02 | 2 | SCOR-08, OUTP-04 | unit | `npx tsx --test src/output/format-tier1-report.test.ts` | ⬜ pending |
| 05-03-01 | 03 | 3 | All | integration | `npx tsx --test src/output/write-evaluation.test.ts` | ⬜ pending |
| 05-03-02 | 03 | 3 | All | suite | `npx tsx --test src/output/*.test.ts && npx tsx --test src/**/*.test.ts` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Not applicable. All plans use TDD (`type: tdd`), which creates tests in the RED step before writing implementation. Type contracts (src/types/scoring.ts, src/types/triage.ts) are created in Plan 01 Task 1 as a prerequisite within Wave 1.

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 not needed -- TDD plans create tests inline
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
