---
phase: 4
slug: scoring-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses package.json `"test": "node --test"` |
| **Quick run command** | `cd src && node --test scoring/*.test.ts --loader tsx` |
| **Full suite command** | `cd src && node --test **/*.test.ts --loader tsx` |
| **Estimated runtime** | ~5 seconds (all mocked, no LLM calls) |

---

## Sampling Rate

- **After every task commit:** Run `cd src && node --test scoring/*.test.ts --loader tsx`
- **After every plan wave:** Run `cd src && node --test **/*.test.ts --loader tsx`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | SCOR-01,02,03 | unit stubs | `cd src && node --test scoring/*.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | SCOR-01 | unit (mock LLM) | `cd src && node --test scoring/lens-scorers.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | SCOR-02 | unit (mock LLM) | `cd src && node --test scoring/lens-scorers.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | SCOR-03 | unit (mock LLM) | `cd src && node --test scoring/lens-scorers.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | SCOR-04 | unit | `cd src && node --test scoring/composite.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 1 | SCOR-05 | unit | `cd src && node --test scoring/composite.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 1 | SCOR-06 | unit | `cd src && node --test scoring/archetype-router.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 2 | ALL | integration (mock) | `cd src && node --test scoring/scoring-pipeline.test.ts --loader tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/scoring/composite.test.ts` — unit tests for SCOR-04, SCOR-05 (pure math)
- [ ] `src/scoring/confidence.test.ts` — unit tests for confidence tag computation
- [ ] `src/scoring/archetype-router.test.ts` — unit tests for SCOR-06 archetype classification
- [ ] `src/scoring/lens-scorers.test.ts` — unit tests for SCOR-01, SCOR-02, SCOR-03 with mocked Ollama responses
- [ ] `src/scoring/schemas.test.ts` — Zod schema validation of LLM output shapes

*All LLM-dependent tests use mocked Ollama responses for speed and determinism.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Score distribution quality | SCOR-01,02,03 | Requires real LLM + real Ford data | Run scoring on 5-10 real opportunities, check score distribution is not clustered |
| Prompt calibration | SCOR-01,02,03 | Subjective quality assessment | Review reason strings for coherence and specificity |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
