---
phase: 24
slug: validation-report-compatibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses npx tsx --test |
| **Quick run command** | `cd src && npx tsx --test validation/spearman.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test validation/spearman.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | VAL-01 | unit | `cd src && npx tsx --test validation/spearman.test.ts` | ❌ W0 | ⬜ pending |
| 24-01-02 | 01 | 1 | VAL-01 | integration | `cd src && npx tsx --test validation/calibration.test.ts` | ❌ W0 | ⬜ pending |
| 24-01-03 | 01 | 1 | VAL-02 | integration | `cd src && npx tsx --test validation/discrimination.test.ts` | ❌ W0 | ⬜ pending |
| 24-02-01 | 02 | 1 | VAL-03 | unit | `cd src && npx tsx --test output/formatter-compat.test.ts` | ❌ W0 | ⬜ pending |
| 24-03-01 | 03 | 2 | VAL-04 | manual | Manual CLI invocation | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/validation/spearman.ts` — Spearman rank correlation utility
- [ ] `src/validation/spearman.test.ts` — unit tests for correlation function
- [ ] `src/validation/calibration.test.ts` — VAL-01 calibration test (loads Ford data + v1.2 baseline)
- [ ] `src/validation/discrimination.test.ts` — VAL-02 discrimination test (counts distinct pre-scores)
- [ ] `src/output/formatter-compat.test.ts` — VAL-03 structural parity tests for all formatters

*Existing infrastructure covers test framework and assertion library.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full Ford 826-candidate run in both scoring modes | VAL-04 | Requires LLM backend (Ollama or vLLM) and ~30min runtime | Run `cd src && npm run dev -- --input ../.planning/ford_hierarchy_v3_export.json --scoring-mode two-pass` and `--scoring-mode three-lens`, compare output directories |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
