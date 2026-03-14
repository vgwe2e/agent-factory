---
phase: 23
slug: pipeline-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | `src/package.json` (test script) |
| **Quick run command** | `cd src && npx tsx --test {file}.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test {changed}.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | PIPE-02 | unit | `npx tsx --test cli.test.ts` | ✅ | ⬜ pending |
| 23-01-02 | 01 | 1 | PIPE-01 | unit | `npx tsx --test pipeline/pipeline-runner.test.ts` | ✅ | ⬜ pending |
| 23-02-01 | 02 | 1 | PIPE-03 | unit | `npx tsx --test scoring/lens-scorers.test.ts` | ✅ | ⬜ pending |
| 23-02-02 | 02 | 1 | PIPE-04 | unit | `npx tsx --test output/format-summary.test.ts` | ✅ | ⬜ pending |
| 23-03-01 | 03 | 2 | PIPE-05 | unit | `npx tsx --test infra/checkpoint.test.ts` | ✅ | ⬜ pending |
| 23-03-02 | 03 | 2 | SIM-01 | unit | `npx tsx --test simulation/simulation-pipeline.test.ts` | ✅ | ⬜ pending |
| 23-03-03 | 03 | 2 | SIM-02 | unit | `npx tsx --test pipeline/scoring-to-simulation.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full Ford 826-candidate end-to-end run | PIPE-01 | Requires vLLM backend + real data | Run `npm run dev -- --input ../path/to/export.json --scoring-mode two-pass` and verify reports generated |
| Three-lens mode produces identical output to v1.2 | PIPE-02 | Requires real LLM and comparison | Run both modes, diff output directories |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
