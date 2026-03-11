# Aera Skill Feasibility Engine

## What This Is

A catalog evaluation engine that ingests Aera hierarchy exports (L1-L4 activities, L3 opportunities), scores them across three adoption-weighted lenses, simulates qualifying opportunities with real Aera component maps, and produces ranked feasibility reports with implementation artifacts. Runs overnight on local Ollama models with checkpoint recovery, producing an evaluation/ directory an SE team can act on.

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

### Active

- [ ] Generate full implementation specs for simulated opportunities (SPEC-01, SPEC-02)
- [ ] Model recommendations for local model → skill matching (ADVN-01)
- [ ] Configurable scoring weights via CLI flags (ADVN-02)
- [ ] Partial re-evaluation of specific opportunities (ADVN-03)

### Out of Scope

- Claude API / cloud model dependency — engine runs fully offline, confirmed viable in v1.0
- Mobile or web UI — CLI-only, artifacts reviewed via cat/less
- Real-time evaluation — batch overnight pattern validated in v1.0
- Modifying existing agent-factory code — coexistence confirmed
- Multi-client concurrent runs — one export at a time
- Training or fine-tuning models — off-the-shelf Ollama models only
- Offline mode — Ollama must be running locally

## Context

Shipped v1.0 with 213K LOC TypeScript, 412 tests, 11 phases.
Tech stack: TypeScript (ESM strict), Zod, Commander, Pino, js-yaml, Ollama REST API.
Pipeline: CLI → Zod ingestion → 8B triage → 32B scoring → simulation → final reports → git commit.
Ford hierarchy export (2,016 L4s, 362 L3s) used as reference dataset.
Archetype distribution: ~56% DETERMINISTIC, ~43% AGENTIC, <1% GENERATIVE.
Hardware: Apple Silicon 36GB — 32B Q4 models confirmed viable.

Known tech debt: 9 items (writeFinalReports ordering, orphaned exports, switchDelayMs disabled).
See `.planning/MILESTONES.md` for full debt inventory.

## Constraints

- **Hardware**: 36GB Apple Silicon — max model size ~32B quantized (Q4). No 70B models.
- **Runtime**: Ollama only — no cloud API calls, no internet dependency during overnight runs.
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
| Node.js built-in test runner | Zero-dependency testing with node:test | ✓ Good — 412 tests, fast execution |
| Dependency injection throughout | chatFn, parseExportFn, runSimulationPipelineFn injectable | ✓ Good — enabled thorough unit testing |
| Result type pattern | `{success, data} \| {success, error}` over exceptions | ✓ Good — clean error propagation |
| Three-tier resilience | retry → fallback prompt → skip-and-log | ✓ Good — overnight stability |

---
*Last updated: 2026-03-11 after v1.0 milestone*
