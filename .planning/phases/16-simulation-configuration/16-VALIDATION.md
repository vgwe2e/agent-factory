---
phase: 16
slug: simulation-configuration
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-12
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `assert/strict` |
| **Config file** | None (project convention: `npx tsx --test`) |
| **Quick run command** | `cd src && npx tsx --test simulation/simulation-pipeline.test.ts pipeline/pipeline-runner.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test simulation/simulation-pipeline.test.ts pipeline/pipeline-runner.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | SIM-01 | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | SIM-01 | unit | `cd src && npx tsx --test output/format-summary.test.ts` | ✅ | ⬜ pending |
| 16-01-03 | 01 | 1 | SIM-01 | unit | `cd src && npx tsx --test output/format-tier1-report.test.ts` | ✅ | ⬜ pending |
| 16-02-01 | 02 | 1 | SIM-02 | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | ✅ | ⬜ pending |
| 16-02-02 | 02 | 1 | SIM-02 | unit | `cd src && npx tsx --test simulation/simulation-pipeline.test.ts` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 1 | SIM-03 | unit | `cd src && npx tsx --test simulation/simulation-pipeline.test.ts` | ✅ | ⬜ pending |
| 16-03-02 | 03 | 1 | SIM-03 | integration | `cd src && npx tsx --test pipeline/pipeline-runner.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. All test files already exist; only new test cases need to be added.

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
