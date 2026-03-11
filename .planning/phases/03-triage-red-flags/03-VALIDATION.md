---
phase: 3
slug: triage-red-flags
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses package.json scripts |
| **Quick run command** | `cd src && node --test triage/*.test.ts --loader tsx` |
| **Full suite command** | `cd src && node --test **/*.test.ts --loader tsx` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && node --test triage/*.test.ts --loader tsx`
- **After every plan wave:** Run `cd src && node --test **/*.test.ts --loader tsx`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | TRIG-01 | unit | `cd src && node --test triage/tier-engine.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 0 | FLAG-01, FLAG-02, FLAG-03, FLAG-04, FLAG-05 | unit | `cd src && node --test triage/red-flags.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 0 | TRIG-02 | unit | `cd src && node --test triage/format-tsv.test.ts --loader tsx` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 0 | TRIG-03 | unit | `cd src && node --test triage/triage-pipeline.test.ts --loader tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/triage/red-flags.test.ts` — stubs for FLAG-01 through FLAG-05
- [ ] `src/triage/tier-engine.test.ts` — stubs for TRIG-01
- [ ] `src/triage/format-tsv.test.ts` — stubs for TRIG-02
- [ ] `src/triage/triage-pipeline.test.ts` — stubs for TRIG-03, integration of flags + tiers

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
