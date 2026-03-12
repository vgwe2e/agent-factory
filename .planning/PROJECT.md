# Aera Skill Feasibility Engine

## What This Is

A catalog evaluation engine that ingests Aera hierarchy exports (L1-L4 activities, L3 opportunities), scores them across three adoption-weighted lenses, simulates qualifying opportunities with real Aera component maps, and produces ranked feasibility reports with implementation artifacts. Supports both local Ollama models for offline overnight runs and cloud-accelerated vLLM on H100 GPUs for sub-30-minute scoring via RunPod.

## Core Value

Produce actionable, adoption-realistic implementation specs for Aera skills — not just technically feasible ones, but ones that real users in real organizations will actually adopt and use.

## Requirements

### Validated

- ✓ Ingest any client hierarchy JSON export with Zod validation — v1.0
- ✓ Parse company context (industry, financials, ERP stack) from export — v1.0
- ✓ Triage all L3 opportunities into priority tiers (Tier 1/2/3) — v1.0
- ✓ Score opportunities across 3 lenses: Technical Feasibility, Adoption Realism, Value & Efficiency — v1.0
- ✓ Apply automatic red flags (dead zone, no stakes, confidence gap, phantom, orphan L4s) — v1.0
- ✓ Weight adoption realism highest (0.45) in composite scoring — v1.0
- ✓ Use ratcheting threshold (0.60 minimum) for simulation promotion — v1.0
- ✓ Generate Mermaid decision flow diagrams for qualifying opportunities — v1.0
- ✓ Map opportunities to Aera components (Streams, Cortex, Process Builder, Agent Teams) — v1.0
- ✓ Produce mock decision tests with sample inputs/outputs using client financials — v1.0
- ✓ Bundle Aera knowledge base (21 UI components, 22 PB nodes, orchestration patterns) — v1.0
- ✓ Run fully locally via Ollama (8B triage, 32B reasoning) — v1.0
- ✓ Single CLI command starts full pipeline, runs unattended overnight — v1.0
- ✓ Output evaluation/ directory with TSVs, markdown reports, Mermaid diagrams, YAML component maps — v1.0
- ✓ Git auto-commit artifacts during run with checkpoint recovery — v1.0
- ✓ Context management (summarize, archive, reset between iterations) — v1.0
- ✓ Meta-reflections surfacing catalog-level patterns — v1.0
- ✓ vLLM client adapter implementing ChatFn interface for cloud backends — v1.1
- ✓ Concurrent pipeline runner with semaphore-bounded parallel scoring — v1.1
- ✓ Cloud infrastructure provisioning (ephemeral H100, health checks, auto-teardown) — v1.1
- ✓ CLI --backend flag to select ollama or vllm backend — v1.1
- ✓ Concurrent-safe checkpoint system for parallel opportunity processing — v1.1

### Active

#### v1.2 — Cloud Pipeline Hardening

- [ ] Report generation includes checkpoint data on resume runs
- [ ] Simulation phase can be skipped (`--skip-sim`) or configured with custom timeouts
- [ ] End-to-end automation: one command handles score + retry + report + teardown
- [ ] RunPod provisioning succeeds on first attempt with correct model via GraphQL API
- [ ] Backend-aware output directories (auto-namespace by backend type)
- [ ] Network volume support for model weight persistence across runs

### Future

- [ ] Generate full implementation specs for simulated opportunities (SPEC-01, SPEC-02)
- [ ] Model recommendations for local model to skill matching (ADVN-01)
- [ ] Configurable scoring weights via CLI flags (ADVN-02)
- [ ] Partial re-evaluation of specific opportunities (ADVN-03)
- [ ] Full Ford 339-opportunity E2E run on cloud backend with output verification (VAL-01)
- [ ] Golden test suite comparing Ollama vs vLLM scores (VAL-02)
- [ ] Documented performance benchmarks (VAL-03)

### Out of Scope

- Cloud as the *only* backend — local Ollama path must always work, cloud is opt-in
- Mobile or web UI — CLI-only, artifacts reviewed via cat/less
- Real-time evaluation — batch pattern validated in v1.0
- Modifying existing agent-factory code — coexistence confirmed
- Multi-client concurrent runs — one export at a time
- Training or fine-tuning models — off-the-shelf Ollama models only
- Multi-GPU / multi-instance — single H100 sufficient for Qwen 30B

## Context

Shipped v1.1 with cloud-accelerated scoring. ~218K LOC TypeScript, 552 tests, 14 phases across 2 milestones.

## Current Milestone: v1.2 Cloud Pipeline Hardening

**Goal:** Make the cloud evaluation pipeline reliable, automated, and fast enough to complete a full 362-opportunity Ford hierarchy evaluation in under 30 minutes on a single A100 GPU with zero manual intervention.

**Target features:**
- Fix report generation to include checkpoint data on resume
- Add --skip-sim flag and simulation timeout configuration
- Integrate retry loop and report regen into CLI (replace run-full-eval.sh)
- Fix RunPod provisioning — use GraphQL API, validate model loading, add timeout
- Backend-aware output directories (auto-namespace by backend type)
- Network volume support for model weight persistence
Tech stack: TypeScript (ESM strict), Zod, Commander, Pino, js-yaml, Ollama REST API, vLLM OpenAI-compatible API, RunPod GraphQL API, dotenv.
Pipeline: CLI → Zod ingestion → 8B triage → 32B scoring → simulation → final reports → git commit.
Cloud path: CLI → RunPod provision → vLLM health poll → concurrent scoring (semaphore-bounded) → cost tracking → auto-teardown.
Ford hierarchy export (2,016 L4s, 362 L3s) used as reference dataset.
Hardware: Apple Silicon 36GB for local; RunPod H100 ($5.58/hr) for cloud.

Known tech debt: 12 items across v1.0 (9) and v1.1 (3). See `.planning/MILESTONES.md` for inventory.

## Constraints

- **Hardware**: 36GB Apple Silicon — max model size ~32B quantized (Q4). No 70B models.
- **Runtime**: Ollama default (offline). Optional vLLM cloud backend requires network access + RunPod API key.
- **Schema**: Must handle the hierarchy JSON schema without manual preprocessing.
- **Aera fidelity**: Every generated spec must map to real Aera components from bundled knowledge base.
- **Coexistence**: Must not modify or break existing agent-factory code.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bundle Aera knowledge into engine | Eliminates external path dependency, makes engine self-contained | ✓ Good — 21 UI + 22 PB nodes bundled, KNOW-04 enforced |
| Local models only (no Claude API) | Overnight unattended runs need zero cloud dependency | ✓ Good — fully offline pipeline confirmed |
| Client-agnostic schema | Ford is test case but engine handles any compatible export | ✓ Good — Zod validation accepts any conforming JSON |
| Adoption Realism weighted 0.45 | Prevents technically sound but operationally dead skills | ✓ Good — core differentiator validated |
| Parallel to existing code | Preserves agent-factory discovery capability | ✓ Good — zero conflicts in coexistence |
| 32B model ceiling | Hardware constraint (36GB), Qwen 2.5 32B Q4 sweet spot | ✓ Good — quality sufficient for structured output |
| Node.js built-in test runner | Zero-dependency testing with node:test | ✓ Good — 552 tests, fast execution |
| Dependency injection throughout | chatFn, parseExportFn, runSimulationPipelineFn injectable | ✓ Good — enabled thorough unit testing |
| Result type pattern | `{success, data} \| {success, error}` over exceptions | ✓ Good — clean error propagation |
| Three-tier resilience | retry → fallback prompt → skip-and-log | ✓ Good — overnight stability |
| Resolve $ref inline in schema translation | vLLM xgrammar rejects $ref; zodToJsonSchema produces $ref for repeated shapes | ✓ Good — all 3 scoring schemas pass pre-flight |
| Explicit backend field in PipelineOptions | Existing tests inject chatFn but expect Ollama model management | ✓ Good — zero regressions in 16 pipeline tests |
| RunPod GraphQL API over SDK | SDK lacks endpoint creation/deletion methods | ✓ Good — full lifecycle managed programmatically |
| Async createBackend factory | Cloud provisioning requires await for RunPod endpoint | ✓ Good — clean async/await flow |
| costTracker via PipelineOptions (not global) | Testability and explicit dependency injection | ✓ Good — 2 new tests with deterministic assertions |
| Non-fatal cloud-cost.json write | Artifact write failure should not break scoring pipeline | ✓ Good — consistent with evaluation artifact patterns |

---
*Last updated: 2026-03-12 after v1.2 milestone start*
