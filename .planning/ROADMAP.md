# Roadmap: Aera Skill Feasibility Engine

## Overview

This roadmap delivers a CLI-based catalog evaluation engine that ingests Aera hierarchy exports and produces ranked feasibility reports with implementation specs. The journey moves from reliable ingestion through calibrated scoring to simulation and overnight resilience. Phases are ordered so that each builds on verified output from the previous one -- scoring depends on clean ingestion, simulation depends on calibrated scores, and resilience wraps a pipeline that already produces correct results.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Foundation** - CLI entry point, Zod-validated ingestion, Ollama connectivity (completed 2026-03-11)
- [x] **Phase 2: Knowledge Base** - Bundle Aera UI, Process Builder, and orchestration references (completed 2026-03-11)
- [x] **Phase 3: Triage & Red Flags** - Tier binning with 8B model and automatic disqualification filters (completed 2026-03-11)
- [x] **Phase 4: Scoring Engine** - Three-lens scoring with weighted composite and threshold gate (completed 2026-03-11)
- [ ] **Phase 5: Scoring Output** - TSV and markdown reports for scores, triage, and analysis
- [ ] **Phase 6: Simulation** - Decision flows, component maps, mock tests, integration surfaces
- [ ] **Phase 7: Pipeline Orchestration** - Two-model strategy, logging, unattended mode, context management
- [ ] **Phase 8: Resilience & Recovery** - Error handling, crash recovery, checkpointing, git auto-commit
- [ ] **Phase 9: Final Reports & Reflection** - Executive summary, dead zones, meta-reflection, simulation bundles

## Phase Details

### Phase 1: Project Foundation
**Goal**: User can ingest any compatible hierarchy export and get validated, structured data ready for downstream processing
**Depends on**: Nothing (first phase)
**Requirements**: INGST-01, INGST-02, INGST-03, INGST-04, INFR-06
**Success Criteria** (what must be TRUE):
  1. User can run `aera-evaluate --input export.json` and see the pipeline start
  2. Engine rejects a malformed JSON file with a clear, specific error message identifying what failed validation
  3. Engine correctly parses company context (industry, revenue, ERP stack) from a valid export and displays it
  4. Engine reads all L3 opportunities and L4 activities from the export without data loss
  5. Engine connects to Ollama and confirms local model availability without any cloud API calls
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md -- Scaffold TypeScript project, define Zod schemas for hierarchy validation
- [ ] 01-02-PLAN.md -- CLI entry point with --input flag, ingestion pipeline, company context display
- [ ] 01-03-PLAN.md -- Ollama connectivity check and model availability verification

### Phase 2: Knowledge Base
**Goal**: Engine has self-contained Aera reference data that downstream scoring and simulation can query
**Depends on**: Phase 1
**Requirements**: KNOW-01, KNOW-02, KNOW-03
**Success Criteria** (what must be TRUE):
  1. Engine can look up any of the 21 UI components and their 209 properties from its bundled data
  2. Engine can look up any of the 22 Process Builder nodes with their procedures and patterns
  3. Engine can query the orchestration decision guide to determine Process vs Agent vs Hybrid routing for a given opportunity type
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md -- Bundle 21 UI component JSONs with typed query layer for component lookups
- [ ] 02-02-PLAN.md -- Bundle Process Builder node reference with typed query layer for node and pattern lookups
- [ ] 02-03-PLAN.md -- Bundle orchestration decision guide with typed query layer for routing decisions

### Phase 3: Triage & Red Flags
**Goal**: Engine rapidly bins all opportunities into priority tiers and automatically disqualifies or demotes bad candidates before expensive scoring
**Depends on**: Phase 1
**Requirements**: TRIG-01, TRIG-02, TRIG-03, FLAG-01, FLAG-02, FLAG-03, FLAG-04, FLAG-05
**Success Criteria** (what must be TRUE):
  1. Engine bins opportunities into Tier 1 (quick_win + value > $5M), Tier 2 (high AI suitability), and Tier 3 (everything else) using the 8B model
  2. Engine auto-skips dead zone opportunities (0% decision density) and phantom opportunities (opportunity_exists = false)
  3. Engine demotes no-stakes opportunities and flags confidence gaps and orphan/thin opportunities
  4. Engine outputs triage results as a TSV sorted by tier
  5. Engine processes Tier 1 first, then Tier 2, then Tier 3 in all downstream work
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md -- Define triage types and implement red flag detection (FLAG-01 through FLAG-05)
- [ ] 03-02-PLAN.md -- Tier engine and triage pipeline with sorting (TRIG-01, TRIG-03)
- [ ] 03-03-PLAN.md -- TSV output formatting (TRIG-02)

### Phase 4: Scoring Engine
**Goal**: Engine produces calibrated, three-lens scores for every non-disqualified opportunity with adoption realism weighted highest
**Depends on**: Phase 2, Phase 3
**Requirements**: SCOR-01, SCOR-02, SCOR-03, SCOR-04, SCOR-05, SCOR-06
**Success Criteria** (what must be TRUE):
  1. Engine scores each opportunity on Technical Feasibility (Data Readiness, Aera Platform Fit, Archetype Confidence) producing a 0-9 score
  2. Engine scores each opportunity on Adoption Realism (Decision Density, Financial Gravity, Impact Proximity, Confidence Signal) producing a 0-12 score
  3. Engine scores each opportunity on Value & Efficiency (Value Density, Simulation Viability) producing a 0-6 score
  4. Engine computes weighted composite (0.30/0.45/0.25) and only promotes opportunities with composite >= 0.60 to simulation
  5. Engine classifies each opportunity by archetype (DETERMINISTIC, AGENTIC, GENERATIVE) and routes to appropriate evaluation patterns
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md -- Scoring types, Zod schemas, composite math, confidence computation, archetype router
- [ ] 04-02-PLAN.md -- Ollama scoring client, lens prompt templates, schema validation tests
- [ ] 04-03-PLAN.md -- Lens scorer functions, scoring pipeline orchestrator
- [ ] 04-04-PLAN.md -- Gap closure: knowledge context builder and CLI wiring for triage + scoring pipeline

### Phase 5: Scoring Output
**Goal**: User can review complete scoring and triage results as structured TSV files and readable markdown reports
**Depends on**: Phase 4
**Requirements**: SCOR-07, SCOR-08, OUTP-01, OUTP-02, OUTP-03, OUTP-04
**Success Criteria** (what must be TRUE):
  1. Engine produces evaluation/triage.tsv with all opportunities sorted by tier
  2. Engine produces evaluation/feasibility-scores.tsv with full 9-dimension breakdowns for every scored opportunity
  3. Engine produces evaluation/adoption-risk.md identifying red-flagged opportunities with specific flag types and reasoning
  4. Engine produces evaluation/tier1-report.md with deep narrative analysis of top-tier opportunities
  5. Engine produces scored opportunities as a markdown report with analysis narrative alongside the raw TSV data
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md -- Define scoring/triage type contracts and implement TSV formatters (triage.tsv + feasibility-scores.tsv)
- [ ] 05-02-PLAN.md -- Implement markdown report formatters (adoption-risk.md + tier1-report.md)
- [ ] 05-03-PLAN.md -- Wire formatters into writeEvaluation orchestrator and run full test suite

### Phase 6: Simulation
**Goal**: Qualifying opportunities get concrete implementation artifacts -- decision flows, component maps, mock tests, and integration surfaces -- all grounded in real Aera components
**Depends on**: Phase 4, Phase 2
**Requirements**: SIMU-01, SIMU-02, SIMU-03, SIMU-04, KNOW-04
**Success Criteria** (what must be TRUE):
  1. Engine generates valid Mermaid decision flow diagrams for every opportunity with composite >= 0.60
  2. Engine produces YAML component maps linking each qualifying opportunity to specific Aera Streams, Cortex, Process Builder, and Agent Teams components
  3. Engine creates mock decision tests with sample inputs and expected outputs using actual client financials from the export
  4. Engine maps integration surfaces (source systems to Aera to process to UI) for each simulated opportunity
  5. Every component reference in generated maps and specs exists in the bundled Aera knowledge base (no hallucinated components)
**Plans**: 4 plans

Plans:
- [ ] 06-01-PLAN.md -- Simulation types, Zod schemas, validators (Mermaid structural + KNOW-04 knowledge base)
- [ ] 06-02-PLAN.md -- Decision flow and component map generators with LLM prompts and retry
- [ ] 06-03-PLAN.md -- Mock test and integration surface generators with LLM prompts and retry
- [ ] 06-04-PLAN.md -- Simulation pipeline orchestrator wiring all generators with file output

### Phase 7: Pipeline Orchestration
**Goal**: The full pipeline runs end-to-end with proper model switching, structured logging, and context management across hundreds of evaluations
**Depends on**: Phase 5, Phase 6
**Requirements**: INFR-02, INFR-04, INFR-05, INFR-07
**Success Criteria** (what must be TRUE):
  1. Engine switches between 8B model (for triage) and 32B model (for scoring/simulation) automatically with proper memory management
  2. Engine logs progress with pino structured logging showing pipeline stage and opportunity ID
  3. Engine summarizes, archives, and resets context between evaluation iterations to prevent context window overflow
  4. Engine runs the full pipeline unattended without requiring any user interaction after the initial command
**Plans**: 3 plans

Plans:
- [ ] 07-01-PLAN.md -- pino logger factory, ModelManager for Ollama model lifecycle, ollamaChat model parameter refactor
- [ ] 07-02-PLAN.md -- Context tracker with archive-to-disk and memory reset
- [ ] 07-03-PLAN.md -- Pipeline runner orchestrator and CLI wiring with --log-level and --output-dir flags

### Phase 8: Resilience & Recovery
**Goal**: Engine can survive failures during long overnight runs -- retrying, recovering, and resuming without losing completed work
**Depends on**: Phase 7
**Requirements**: INFR-01, INFR-03, INFR-08
**Success Criteria** (what must be TRUE):
  1. Engine recovers from individual LLM call failures via retry, fallback prompt, or skip-and-log without crashing the pipeline
  2. Engine auto-commits evaluation artifacts to git after each evaluation cycle
  3. Engine checkpoints progress so a crashed run can resume from the last completed evaluation without re-processing
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD
- [ ] 08-03: TBD
- [ ] 08-04: TBD
- [ ] 08-05: TBD

### Phase 9: Final Reports & Reflection
**Goal**: User gets a complete evaluation bundle with executive summary, dead zone warnings, catalog-level insights, and organized simulation output
**Depends on**: Phase 6, Phase 8
**Requirements**: OUTP-05, OUTP-06, OUTP-07, OUTP-08
**Success Criteria** (what must be TRUE):
  1. Engine produces evaluation/simulations/<skill-name>/ directories containing decision flows, component maps, and mock tests for each qualifying opportunity
  2. Engine produces evaluation/summary.md with an executive summary of the top 10 opportunities
  3. Engine produces evaluation/dead-zones.md explicitly recommending against specific areas with reasoning
  4. Engine produces evaluation/meta-reflection.md with catalog-level pattern analysis surfacing cross-cutting insights across all evaluated opportunities
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD
- [ ] 09-03: TBD
- [ ] 09-04: TBD
- [ ] 09-05: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5 > 6 > 7 > 8 > 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation | 0/3 | Complete    | 2026-03-11 |
| 2. Knowledge Base | 3/3 | Complete   | 2026-03-11 |
| 3. Triage & Red Flags | 3/3 | Complete | 2026-03-11 |
| 4. Scoring Engine | 3/4 | Gap closure | 2026-03-11 |
| 5. Scoring Output | 0/3 | Not started | - |
| 6. Simulation | 0/4 | Not started | - |
| 7. Pipeline Orchestration | 0/3 | Not started | - |
| 8. Resilience & Recovery | 0/5 | Not started | - |
| 9. Final Reports & Reflection | 0/5 | Not started | - |
