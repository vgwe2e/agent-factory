---
phase: 11
slug: wire-simulation-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none (uses npx tsx --test) |
| **Quick run command** | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test pipeline/pipeline-runner.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | SIMU-01, SIMU-02, SIMU-03, SIMU-04, OUTP-05 | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | OUTP-06 | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | — | unit | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 1 | — | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New test case in `pipeline-runner.test.ts` — "runs simulation pipeline for promoted opportunities and produces artifact directories"
- [ ] New test case in `pipeline-runner.test.ts` — "passes real simulation results to writeFinalReports (non-zero metrics in summary.md)"
- [ ] New test case in `pipeline-runner.test.ts` — "simulation pipeline failure is non-fatal"
- [ ] Adapter unit test — `toSimulationInputs` converts ScoringResult[] correctly

*Existing infrastructure covers framework install.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
