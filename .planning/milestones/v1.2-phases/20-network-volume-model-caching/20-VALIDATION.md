---
phase: 20
slug: network-volume-model-caching
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | none — `npm test` in `src/` runs all `*.test.ts` |
| **Quick run command** | `cd src && npx tsx --test infra/cloud-provider.test.ts` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx tsx --test infra/cloud-provider.test.ts`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | CACHE-01 | unit | `cd src && npx tsx --test infra/cloud-provider.test.ts` | Exists (extend) | ⬜ pending |
| 20-01-02 | 01 | 1 | CACHE-01 | unit | `cd src && npx tsx --test infra/cloud-provider.test.ts` | Exists (extend) | ⬜ pending |
| 20-01-03 | 01 | 1 | CACHE-01 | unit | `cd src && npx tsx --test infra/backend-factory.test.ts` | Exists (extend) | ⬜ pending |
| 20-01-04 | 01 | 1 | CACHE-02 | manual | N/A — requires real RunPod | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Tests for CACHE-01 extend existing test files (`cloud-provider.test.ts`, `backend-factory.test.ts`). No new test framework or fixture setup needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Subsequent launches reuse cached weights (faster `/v1/models`) | CACHE-02 | Requires real RunPod infrastructure with network volume | 1. Provision pod with `--network-volume <id>` 2. Wait for first launch to complete (downloads model) 3. Teardown pod 4. Re-provision with same volume 5. Observe faster `/v1/models` readiness (no HuggingFace download in logs) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
