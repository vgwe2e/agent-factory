# Requirements: Aera Skill Feasibility Engine

**Defined:** 2026-03-10
**Core Value:** Produce actionable, adoption-realistic implementation specs for Aera skills — not just technically feasible ones, but ones real users will actually adopt.

## v1 Requirements

### Ingestion

- [ ] **INGST-01**: User can run full pipeline with a single CLI command (`aera-evaluate --input export.json`)
- [ ] **INGST-02**: Engine validates hierarchy JSON against Zod schema and rejects malformed exports with clear error messages
- [ ] **INGST-03**: Engine parses company context (industry, revenue, COGS, employee count, ERP stack) from export metadata
- [ ] **INGST-04**: Engine reads all L3 opportunities and constituent L4 activities from hierarchy export

### Scoring

- [ ] **SCOR-01**: Engine scores each opportunity on Technical Feasibility lens (Data Readiness, Aera Platform Fit, Archetype Confidence) — 0-9 scale
- [ ] **SCOR-02**: Engine scores each opportunity on Adoption Realism lens (Decision Density, Financial Gravity, Impact Proximity, Confidence Signal) — 0-12 scale
- [ ] **SCOR-03**: Engine scores each opportunity on Value & Efficiency lens (Value Density, Simulation Viability) — 0-6 scale
- [ ] **SCOR-04**: Engine computes weighted composite score (Technical 0.30, Adoption 0.45, Value 0.25) — 0.0 to 1.0 range
- [ ] **SCOR-05**: Engine applies ratcheting threshold — only promotes opportunities with composite >= 0.60 to simulation
- [ ] **SCOR-06**: Engine classifies each opportunity by archetype (DETERMINISTIC, AGENTIC, GENERATIVE) and routes to appropriate evaluation patterns
- [ ] **SCOR-07**: Engine outputs scored opportunities as TSV with all dimension breakdowns
- [ ] **SCOR-08**: Engine outputs scored opportunities as markdown report with analysis

### Red Flags

- [ ] **FLAG-01**: Engine auto-skips opportunities where decision density = 0% across all L4s (dead zone)
- [ ] **FLAG-02**: Engine demotes opportunities with zero HIGH financial ratings + SECOND-order impact only (no stakes)
- [ ] **FLAG-03**: Engine flags opportunities where >50% of L4s have rating_confidence = LOW (confidence gap)
- [ ] **FLAG-04**: Engine skips opportunities where opportunity_exists = false (phantom)
- [ ] **FLAG-05**: Engine flags opportunities where l4_count < 3 (orphan/thin opportunity)

### Triage

- [ ] **TRIG-01**: Engine bins opportunities into Tier 1 (quick_win + value > $5M), Tier 2 (high AI suitability), Tier 3 (everything else)
- [ ] **TRIG-02**: Engine outputs triage results as TSV sorted by tier
- [ ] **TRIG-03**: Engine processes Tier 1 opportunities first, then Tier 2, then Tier 3

### Simulation

- [ ] **SIMU-01**: Engine generates Mermaid decision flow diagrams for qualifying opportunities (composite >= 0.60)
- [ ] **SIMU-02**: Engine produces YAML component maps linking opportunities to specific Aera components (Streams, Cortex, Process Builder, Agent Teams)
- [ ] **SIMU-03**: Engine creates mock decision tests with sample inputs/outputs using actual client financials from the export
- [ ] **SIMU-04**: Engine maps integration surfaces (source systems → Aera → process → UI) for each simulated opportunity

### Knowledge Base

- [ ] **KNOW-01**: Engine bundles Aera UI component reference (21 components, 209 properties) from ~/Documents/area
- [ ] **KNOW-02**: Engine bundles Process Builder node reference (22 nodes with procedures and patterns)
- [ ] **KNOW-03**: Engine bundles orchestration decision guide (Process vs Agent vs Hybrid framework)
- [ ] **KNOW-04**: Every generated component map and spec references only real Aera components from the bundled knowledge base

### Infrastructure

- [ ] **INFR-01**: Engine recovers gracefully from individual LLM call failures (retry, fallback prompt, skip-and-log)
- [ ] **INFR-02**: Engine logs progress with pino structured logging (pipeline stage + opportunity ID)
- [ ] **INFR-03**: Engine auto-commits evaluation artifacts to git after each evaluation cycle
- [ ] **INFR-04**: Engine uses two-model strategy (8B for bulk triage, 32B for reasoning/scoring/simulation)
- [ ] **INFR-05**: Engine manages context across evaluations (summarize, archive, reset between iterations)
- [ ] **INFR-06**: Engine runs fully locally via Ollama with zero cloud API dependency
- [ ] **INFR-07**: Engine runs unattended overnight without user interaction
- [ ] **INFR-08**: Engine checkpoints progress so a crashed run can resume from last completed evaluation

### Output

- [ ] **OUTP-01**: Engine produces evaluation/triage.tsv with all opportunities tier-sorted
- [ ] **OUTP-02**: Engine produces evaluation/feasibility-scores.tsv with 9-dimension breakdown
- [ ] **OUTP-03**: Engine produces evaluation/adoption-risk.md with red flags and dead zones
- [ ] **OUTP-04**: Engine produces evaluation/tier1-report.md with deep analysis of top-tier opportunities
- [ ] **OUTP-05**: Engine produces evaluation/simulations/<skill-name>/ with decision flows, component maps, mock tests
- [ ] **OUTP-06**: Engine produces evaluation/summary.md with executive summary of top 10 opportunities
- [ ] **OUTP-07**: Engine produces evaluation/dead-zones.md with areas explicitly recommended against
- [ ] **OUTP-08**: Engine produces evaluation/meta-reflection.md with catalog-level pattern analysis

## v2 Requirements

### Spec Generation

- **SPEC-01**: Engine generates full implementation specs (skill architecture, data requirements, PB design, UI screens, model requirements, agent design, implementation estimate)
- **SPEC-02**: Engine produces evaluation/specs/<skill-name>-spec.md for each fully simulated opportunity

### Advanced Features

- **ADVN-01**: Engine produces model recommendations (which local models can simulate which skills)
- **ADVN-02**: Engine supports configurable scoring weights via CLI flags
- **ADVN-03**: Engine supports partial re-evaluation (re-score specific opportunities without re-running entire pipeline)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web UI / dashboard | CLI-only for v1; review artifacts via cat/less |
| Cloud model fallback (Claude API) | Must run fully offline; cost-free at scale |
| Real-time / interactive mode | Designed for batch overnight runs |
| Multi-client concurrent runs | One export at a time; queue manually |
| Model fine-tuning / training | Off-the-shelf Ollama models only |
| Database persistence | Files are the database (JSON, YAML, markdown, TSV) |
| Plugin / extension system | One pipeline, one domain; refactor later if needed |
| Modifying existing agent-factory code | Engine lives alongside it |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGST-01 | — | Pending |
| INGST-02 | — | Pending |
| INGST-03 | — | Pending |
| INGST-04 | — | Pending |
| SCOR-01 | — | Pending |
| SCOR-02 | — | Pending |
| SCOR-03 | — | Pending |
| SCOR-04 | — | Pending |
| SCOR-05 | — | Pending |
| SCOR-06 | — | Pending |
| SCOR-07 | — | Pending |
| SCOR-08 | — | Pending |
| FLAG-01 | — | Pending |
| FLAG-02 | — | Pending |
| FLAG-03 | — | Pending |
| FLAG-04 | — | Pending |
| FLAG-05 | — | Pending |
| TRIG-01 | — | Pending |
| TRIG-02 | — | Pending |
| TRIG-03 | — | Pending |
| SIMU-01 | — | Pending |
| SIMU-02 | — | Pending |
| SIMU-03 | — | Pending |
| SIMU-04 | — | Pending |
| KNOW-01 | — | Pending |
| KNOW-02 | — | Pending |
| KNOW-03 | — | Pending |
| KNOW-04 | — | Pending |
| INFR-01 | — | Pending |
| INFR-02 | — | Pending |
| INFR-03 | — | Pending |
| INFR-04 | — | Pending |
| INFR-05 | — | Pending |
| INFR-06 | — | Pending |
| INFR-07 | — | Pending |
| INFR-08 | — | Pending |
| OUTP-01 | — | Pending |
| OUTP-02 | — | Pending |
| OUTP-03 | — | Pending |
| OUTP-04 | — | Pending |
| OUTP-05 | — | Pending |
| OUTP-06 | — | Pending |
| OUTP-07 | — | Pending |
| OUTP-08 | — | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 0
- Unmapped: 44 ⚠️

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after initial definition*
