---
phase: 23
slug: pipeline-integration
status: draft
nyquist_compliant: true
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
| 23-01-01 | 01 | 1 | PIPE-05 | unit | `npx tsx --test infra/checkpoint.test.ts` | yes | pending |
| 23-01-02 | 01 | 1 | SIM-01, SIM-02 | unit | `npx tsx --test pipeline/scoring-to-simulation.test.ts` | yes | pending |
| 23-01-03 | 01 | 1 | PIPE-02 | unit | `npx tsx --test cli.test.ts` | yes | pending |
| 23-02-01 | 02 | 2 | PIPE-01 | unit | `npx tsx --test pipeline/pipeline-runner.test.ts` | yes | pending |
| 23-02-02 | 02 | 2 | PIPE-01, PIPE-03 | integration | `npx tsx --test pipeline/pipeline-runner.test.ts` | yes | pending |
| 23-02-03 | 02 | 2 | PIPE-04 | unit | `npm test` | yes | pending |

*Status: pending / green / red / flaky*

---

## Requirement Coverage

| Requirement | Task(s) | Coverage Type |
|-------------|---------|---------------|
| PIPE-01 | 23-02-01, 23-02-02 | Two-pass pipeline integration + integration test |
| PIPE-02 | 23-01-03 | CLI --scoring-mode flag with three-lens option |
| PIPE-03 | 23-02-02 | Formatter verification test: ScoringResult -> formatScoresTsv with non-zero composite/lens |
| PIPE-04 | 23-02-03 | Scoring-mode header annotation in reports |
| PIPE-05 | 23-01-01 | Checkpoint V2 schema + mode-aware loading |
| SIM-01 | 23-01-02 | SimulationInput L4 extension + toL4SimulationInputs |
| SIM-02 | 23-01-02, 23-02-03 | L4-aware simulation slug/name derivation |

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
