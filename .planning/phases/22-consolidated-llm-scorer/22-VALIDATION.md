---
phase: 22
slug: consolidated-llm-scorer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none — uses `node --test` directly |
| **Quick run command** | `npx tsx --test src/scoring/consolidated-scorer.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx --test src/scoring/consolidated-scorer.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | LLM-04 | unit | `npx tsx --test src/scoring/consolidated-scorer.test.ts` | ❌ W0 | ⬜ pending |
| 22-01-02 | 01 | 1 | LLM-01, LLM-02, LLM-03 | unit | `npx tsx --test src/scoring/consolidated-scorer.test.ts` | ❌ W0 | ⬜ pending |
| 22-01-03 | 01 | 1 | LLM-05 | unit | `npx tsx --test src/scoring/prompts/consolidated.test.ts` | ❌ W0 | ⬜ pending |
| 22-01-04 | 01 | 1 | LLM-06 | unit | `npx tsx --test src/scoring/consolidated-scorer.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/scoring/consolidated-scorer.test.ts` — stubs for LLM-01, LLM-02, LLM-03, LLM-04, LLM-06
- [ ] `src/scoring/prompts/consolidated.test.ts` — stubs for LLM-05 (prompt content verification)
- [ ] Schema addition to `scoring/schemas.ts` — ConsolidatedLensSchema + JSON schema export
- [ ] Type additions to `types/scoring.ts` — SanityVerdict type, optional ScoringResult fields

*Existing infrastructure covers framework needs. No new dependencies.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| vLLM backend compatibility | LLM-04 | Requires live vLLM server | Run `npm run dev -- --backend vllm --vllm-url <url>` with consolidated scorer enabled |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
