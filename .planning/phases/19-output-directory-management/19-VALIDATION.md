---
phase: 19
slug: output-directory-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` with `assert/strict` |
| **Config file** | none — convention-based, `npm test` runs `node --test` |
| **Quick run command** | `cd src && npx tsx --test cli.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test cli.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 0 | OUT-01 | unit | `cd src && npx tsx --test cli.test.ts` | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | OUT-01 | unit | `cd src && npx tsx --test cli.test.ts` | ❌ W0 | ⬜ pending |
| 19-01-03 | 01 | 1 | OUT-01 | unit | `cd src && npx tsx --test cli.test.ts` | ❌ W0 | ⬜ pending |
| 19-01-04 | 01 | 1 | OUT-02 | unit | `cd src && npx tsx --test cli.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/cli.test.ts` — add `describe("resolveOutputDir", ...)` test suite covering: ollama default, vllm default, explicit override, explicit override with backend

*Existing infrastructure covers framework and config; only new test stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Both backend runs coexist on disk | OUT-02 | Integration / filesystem | Run with `--backend ollama`, then `--backend vllm`; verify both dirs exist with separate results |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
