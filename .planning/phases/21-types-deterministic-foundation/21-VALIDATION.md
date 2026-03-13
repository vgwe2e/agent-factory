---
phase: 21
slug: types-deterministic-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) + assert/strict |
| **Config file** | none — npm test in src/ runs all *.test.ts |
| **Quick run command** | `cd src && npx tsx --test scoring/deterministic/*.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test scoring/deterministic/*.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | DSCORE-02 | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | DSCORE-03 | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | ❌ W0 | ⬜ pending |
| 21-01-03 | 01 | 1 | DSCORE-04 | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | ❌ W0 | ⬜ pending |
| 21-01-04 | 01 | 1 | DSCORE-05 | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | ❌ W0 | ⬜ pending |
| 21-01-05 | 01 | 1 | DSCORE-06 | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | ❌ W0 | ⬜ pending |
| 21-01-06 | 01 | 1 | DSCORE-07 | unit | `cd src && npx tsx --test scoring/deterministic/dimensions.test.ts` | ❌ W0 | ⬜ pending |
| 21-02-01 | 02 | 1 | DSCORE-08 | unit | `cd src && npx tsx --test scoring/deterministic/composite.test.ts` | ❌ W0 | ⬜ pending |
| 21-02-02 | 02 | 1 | DSCORE-09 | unit | `cd src && npx tsx --test scoring/deterministic/red-flags.test.ts` | ❌ W0 | ⬜ pending |
| 21-03-01 | 03 | 2 | FILTER-02 | unit | `cd src && npx tsx --test scoring/deterministic/filter.test.ts` | ❌ W0 | ⬜ pending |
| 21-03-02 | 03 | 2 | FILTER-04 | unit | `cd src && npx tsx --test scoring/deterministic/filter.test.ts` | ❌ W0 | ⬜ pending |
| 21-03-03 | 03 | 2 | FILTER-05 | unit | `cd src && npx tsx --test scoring/deterministic/filter.test.ts` | ❌ W0 | ⬜ pending |
| 21-04-01 | 04 | 2 | FILTER-03 | unit | `cd src && npx tsx --test output/format-pre-score-tsv.test.ts` | ❌ W0 | ⬜ pending |
| 21-05-01 | 05 | 3 | DSCORE-01 | unit + perf | `cd src && npx tsx --test scoring/deterministic/pre-scorer.test.ts` | ❌ W0 | ⬜ pending |
| 21-05-02 | 05 | 3 | FILTER-01 | unit | `cd src && npx tsx --test cli.test.ts` | ✅ (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/types/scoring.ts` — add PreScoreResult, DETERMINISTIC_WEIGHTS, DimensionScores types
- [ ] `src/scoring/deterministic/dimensions.ts` + `.test.ts` — stubs for DSCORE-02 through DSCORE-07
- [ ] `src/scoring/deterministic/composite.ts` + `.test.ts` — stubs for DSCORE-08
- [ ] `src/scoring/deterministic/red-flags.ts` + `.test.ts` — stubs for DSCORE-09
- [ ] `src/scoring/deterministic/filter.ts` + `.test.ts` — stubs for FILTER-02, FILTER-04, FILTER-05
- [ ] `src/scoring/deterministic/pre-scorer.ts` + `.test.ts` — stubs for DSCORE-01
- [ ] `src/output/format-pre-score-tsv.ts` + `.test.ts` — stubs for FILTER-03

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
