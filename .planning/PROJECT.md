# Aera Skill Feasibility Engine

## What This Is

A catalog evaluation engine that takes a structured client hierarchy export (L1-L4 activities and L3 opportunities) and systematically scores, simulates, and specs Aera Decision Intelligence skills. It runs overnight on local models, producing a ranked feasibility report with implementation specs an SE team can execute. Built alongside the existing agent-factory code as a parallel capability.

## Core Value

Produce actionable, adoption-realistic implementation specs for Aera skills — not just technically feasible ones, but ones that real users in real organizations will actually adopt and use.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ingest any client hierarchy JSON export (schema-compatible with ford_hierarchy_v2_export.json)
- [ ] Parse company context (industry, financials, ERP stack) from export
- [ ] Triage all L3 opportunities into priority tiers (Tier 1/2/3)
- [ ] Score opportunities across 3 lenses: Technical Feasibility, Adoption Realism, Value & Efficiency
- [ ] Apply automatic red flags (dead zone, no stakes, confidence gap, phantom, orphan L4s)
- [ ] Weight adoption realism highest (0.45) in composite scoring
- [ ] Use ratcheting threshold (0.60 minimum) for simulation promotion
- [ ] Generate decision flow diagrams (Mermaid) for qualifying opportunities
- [ ] Map opportunities to Aera components (Streams, Cortex, Process Builder, Agent Teams)
- [ ] Produce mock decision tests with sample inputs/outputs using client financials
- [ ] Generate full implementation specs for simulated opportunities that pass
- [ ] Bundle Aera knowledge base (21 UI components, 22 PB nodes, orchestration patterns) into engine
- [ ] Run fully locally via Ollama (target: Qwen 2.5 32B ceiling for reasoning, 8B for triage)
- [ ] Single CLI command starts full pipeline, runs unattended overnight
- [ ] Output evaluation/ directory with TSVs, markdown reports, mermaid diagrams, YAML component maps
- [ ] Git commit all artifacts automatically during run
- [ ] Loop-forever pattern with context management (summarize, archive, reset between iterations)
- [ ] Meta-reflections every N evaluations to surface catalog-level patterns

### Out of Scope

- Claude API / cloud model dependency — engine must run fully offline on local models
- Mobile or web UI — CLI-only for v1, review artifacts via cat/less
- Real-time evaluation — designed for batch overnight runs, not interactive scoring
- Modifying or replacing existing agent-factory code — engine lives alongside it
- Multi-client concurrent runs — one export at a time
- Training or fine-tuning models — use off-the-shelf Ollama models only

## Context

- **Existing codebase**: agent-factory has a loop-forever discovery pattern, file-based persistence, git auto-commit, and context management. The engine reuses these patterns with new internals.
- **Aera knowledge base**: Located at ~/Documents/area with 21 UI components (209 properties), 22 Process Builder nodes, 28 expert agents, orchestration decision guide, Skill Builder playbook, and component schemas. Must be bundled into this project.
- **Reference data**: Ford hierarchy export (2,016 L4 activities, 362 L3 opportunities across 5 domains: Plan, Make, Move & Fulfill, Procure, Service) serves as the test dataset but engine must handle any compatible export.
- **Archetype distribution**: Typical exports are ~56% DETERMINISTIC (Process Builder-heavy), ~43% AGENTIC (Agent Teams + LLM routing), <1% GENERATIVE. Engine needs strong coverage of both PB and agentic patterns.
- **Hardware**: Apple Silicon 36GB — supports 32B quantized models comfortably. 70B models are not viable. Model strategy: Qwen 2.5 7B-8B for bulk triage/parsing, Qwen 2.5 32B for reasoning/scoring/spec writing.

## Constraints

- **Hardware**: 36GB Apple Silicon — max model size ~32B quantized (Q4). No 70B models.
- **Runtime**: Ollama only — no cloud API calls, no internet dependency during overnight runs.
- **Schema**: Must handle the hierarchy JSON schema as documented (meta, company_context, hierarchy, l3_opportunities, etc.) without requiring manual preprocessing.
- **Aera fidelity**: Every generated spec must map to real Aera components from the bundled knowledge base. No hallucinated capabilities.
- **Coexistence**: Must not modify or break existing agent-factory code (program.md, seed harness, Composio integration).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bundle Aera knowledge into engine | Eliminates external path dependency, makes engine self-contained and portable | — Pending |
| Local models only (no Claude API) | Overnight unattended runs need zero cloud dependency; cost-free at scale | — Pending |
| Client-agnostic schema | Ford is the test case but engine should work with any compatible hierarchy export | — Pending |
| Adoption Realism weighted 0.45 | Prevents recommending technically sound but operationally dead skills — the biggest real-world failure mode | — Pending |
| Parallel to existing code | Preserves agent-factory's original discovery capability while adding catalog evaluation | — Pending |
| 32B model ceiling | Hardware constraint (36GB). Qwen 2.5 32B Q4 is the sweet spot for reasoning quality vs memory | — Pending |

---
*Last updated: 2026-03-10 after initialization*
