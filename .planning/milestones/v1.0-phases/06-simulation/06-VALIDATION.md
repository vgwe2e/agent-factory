---
phase: 6
slug: simulation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses package.json `"test": "node --test"` |
| **Quick run command** | `cd src && node --test simulation/**/*.test.ts --loader tsx` |
| **Full suite command** | `cd src && node --test **/*.test.ts --loader tsx` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && node --test simulation/**/*.test.ts --loader tsx`
- **After every plan wave:** Run `cd src && node --test **/*.test.ts --loader tsx`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | SIMU-01 | unit | `cd src && node --test simulation/validators/mermaid-validator.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 0 | KNOW-04 | unit | `cd src && node --test simulation/validators/knowledge-validator.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 0 | SIMU-01,02,03,04 | unit | `cd src && node --test simulation/schemas.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | SIMU-01 | unit (mock LLM) | `cd src && node --test simulation/generators/decision-flow-gen.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | SIMU-02 | unit (mock LLM) | `cd src && node --test simulation/generators/component-map-gen.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 1 | SIMU-03 | unit (mock LLM) | `cd src && node --test simulation/generators/mock-test-gen.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 1 | SIMU-04 | unit (mock LLM) | `cd src && node --test simulation/generators/integration-surface-gen.test.ts --loader tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/simulation/validators/mermaid-validator.test.ts` — stubs for SIMU-01 structural validation
- [ ] `src/simulation/validators/knowledge-validator.test.ts` — stubs for KNOW-04 component matching
- [ ] `src/simulation/schemas.test.ts` — stubs for Zod schema validation for all 3 YAML artifact types
- [ ] `src/simulation/generators/decision-flow-gen.test.ts` — stubs for SIMU-01 with mocked LLM
- [ ] `src/simulation/generators/component-map-gen.test.ts` — stubs for SIMU-02 with mocked LLM + KNOW-04
- [ ] `src/simulation/generators/mock-test-gen.test.ts` — stubs for SIMU-03 with mocked LLM
- [ ] `src/simulation/generators/integration-surface-gen.test.ts` — stubs for SIMU-04 with mocked LLM

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mermaid renders correctly in viewer | SIMU-01 | Visual rendering quality | Copy generated Mermaid to mermaid.live, verify diagram readability |
| YAML artifacts match Aera domain expectations | SIMU-02,03,04 | Domain knowledge judgment | Review sample outputs against Aera documentation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
