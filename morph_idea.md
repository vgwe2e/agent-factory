# Aera Skill Feasibility Engine — Product Vision

## The Idea

Morph **agent-factory** from an open-ended problem-discovery loop into a **curated catalog evaluation engine** that systematically scores, simulates, and specs Aera Technology Decision Intelligence skills for a target client.

Instead of the agent trawling Reddit and HN for pain points, you feed it a **structured hierarchy export** (like `ford_hierarchy_v2_export.json` — 2,016 L4 activities across 362 L3 opportunities grouped into 5 L1 domains) and the agent works through that catalog overnight, producing a ranked feasibility report and implementation specs.

---

## Why This Is Better Than Open-Ended Discovery

| Open-ended agent-factory | Aera Skill Feasibility Engine |
|---|---|
| Unbounded search space (all of Reddit/HN) | Bounded catalog (N opportunities, pre-scored) |
| Must discover *what* to build | Must evaluate *how viable* each skill is |
| TAM is speculative | Value is pre-quantified (`combined_max_value` per opportunity) |
| No client context | Rich client context (revenue, COGS, inventory, ERP stack) |
| Ships toy repos | Ships implementation specs an SE team can execute |

The loop is tighter, the output is actionable, and the overnight run is 10x more productive.

---

## Input: What the Agent Receives

A single JSON export containing everything it needs:

```
ford_hierarchy_v2_export.json
├── meta                    # Project name, version, dates
├── company_context         # Ford: $185B revenue, 171K employees, SAP S/4HANA
│   ├── industry            # "Automotive"
│   ├── financials          # Revenue, COGS, SGA, EBITDA, inventory value
│   └── enterprise_apps     # SAP S/4HANA, detected integrations
├── industry_analysis       # Industry-specific intelligence
├── hierarchy               # 2,016 L4 activities (the atomic units)
│   ├── id, name, description
│   ├── l1 / l2 / l3       # Plan | Make | Move & Fulfill | Procure | Service
│   ├── financial_rating    # HIGH / MEDIUM / LOW
│   ├── value_metric        # COGS, WORKING_CAPITAL, REVENUE, EBITDA, SGA
│   ├── ai_suitability      # HIGH / MEDIUM / LOW
│   └── decision_articulation  # The decision this activity supports
├── l3_opportunities        # 362 grouped opportunities (the skill candidates)
│   ├── opportunity_name    # e.g. "Autonomous Demand Modeling & Forecast Optimization"
│   ├── opportunity_summary # Natural language description
│   ├── lead_archetype      # DETERMINISTIC (203) | AGENTIC (156) | GENERATIVE (1)
│   ├── combined_max_value  # Dollar value estimate (e.g. $19.5M)
│   ├── implementation_complexity  # HIGH / MEDIUM / LOW
│   ├── quick_win           # Boolean — can this ship fast?
│   ├── l4_count            # How many L4 activities compose this opportunity
│   └── rationale           # Why these L4s form a coherent skill
├── program_focuses         # Client strategic priorities
├── cross_functional_skills # Skills spanning multiple domains
└── pipeline_status         # Which stages are already complete
```

**Key insight**: The hierarchy already contains feasibility signals — `ai_suitability`, `financial_rating`, `implementation_complexity`, `lead_archetype`, and `combined_max_value`. The agent doesn't start from zero; it starts from a pre-analyzed catalog and deepens the evaluation.

---

## The Loop (Replaces program.md)

### Phase 1 — Catalog Ingestion & Triage

1. Load the JSON export
2. Parse `company_context` to understand the client (industry, scale, ERP, financials)
3. Read all 362 `l3_opportunities` as skill candidates
4. **Fast triage** — bin into priority tiers:
   - **Tier 1** (evaluate first): `quick_win = true` AND `combined_max_value > $5M`
   - **Tier 2**: `ai_suitability = HIGH` across constituent L4s
   - **Tier 3**: Everything else
5. Log triage results to `evaluation/triage.tsv`

### Phase 2 — Deep Feasibility Scoring

For each opportunity (starting with Tier 1), score across **three lenses** — Can We Build It, Will It Land, and Is It Worth It:

#### Lens 1: Technical Feasibility (Can We Build It?)

| Dimension | What it measures | Signals from JSON | Score |
|---|---|---|---|
| **Data Readiness** | Can the required data be sourced from SAP S/4HANA + standard integrations? | `value_metric` (COGS/WC data exists in SAP), `enterprise_applications` | 0-3 |
| **Aera Platform Fit** | Does this map cleanly to Aera components (Streams, Cortex, Process Builder, Agent Teams)? | `lead_archetype`, `supporting_archetypes` | 0-3 |
| **Archetype Confidence** | How well-defined is the orchestration pattern? | Archetype clarity + `rating_confidence` across L4s | 0-3 |

#### Lens 2: Adoption Realism (Will Anyone Actually Use It?)

This is the lens that catches "technically sound but operationally dead" skills. The JSON already contains strong signals:

| Dimension | What it measures | Signals from JSON | Score |
|---|---|---|---|
| **Decision Density** | What % of L4 activities in this L3 have `decision_exists = true`? Low density = administrative or passive area where people aren't making active decisions. No decisions = no one to adopt the skill. | `decision_exists` across constituent L4s. **Ford data**: 6 L3s have 0% decision density (Workforce Training, Regulatory Affairs, Customer Communication, Dispatch, Service Event Execution, Regulatory Compliance). These are dead zones for DI skills. | 0-3 |
| **Financial Gravity** | Do the L4s carry real financial weight? An area where everything is MEDIUM/LOW financial rating means the org isn't measuring or caring about outcomes there. No financial pressure = no urgency to adopt. | `financial_rating` distribution across L4s. **Ford data**: 115 L3s have zero HIGH-financial L4s — over a third of the catalog. These are where skills go to die. | 0-3 |
| **Impact Proximity** | Is this a FIRST-order impact (direct P&L) or SECOND-order (indirect/supporting)? First-order areas have people who own numbers and will fight for tools that move them. Second-order areas have committees. | `impact_order` across L4s. FIRST-order dominant = 3, mixed = 2, SECOND-order dominant = 1, no first-order = 0 | 0-3 |
| **Confidence Signal** | How confident was the rating engine in its own assessment? LOW confidence often means the area is ambiguous, poorly defined, or doesn't map cleanly to standard patterns — all red flags for adoption. | `rating_confidence` across L4s. **Ford data**: 515 L4s rated LOW confidence, 181 HIGH. Opportunities built on LOW-confidence L4s are shakier. | 0-3 |

**Adoption Score Interpretation**:
- **10-12**: Strong adoption conditions — active decision-makers, financial accountability, first-order P&L impact
- **7-9**: Moderate — some adoption friction but addressable with change management
- **4-6**: Risky — the area may not have the organizational energy to adopt
- **0-3**: Dead zone — technically possible but operationally DOA. Skip unless the client specifically asks for it.

#### Lens 3: Value & Efficiency (Is It Worth It?)

| Dimension | What it measures | Signals from JSON | Score |
|---|---|---|---|
| **Value Density** | `combined_max_value / implementation_complexity` — raw ROI signal | `combined_max_value`, `implementation_complexity` | 0-3 |
| **Simulation Viability** | Can a local model meaningfully prototype the decision logic overnight? | `decision_articulation` clarity, archetype complexity | 0-3 |

#### Composite Scoring

```
Technical Feasibility  (3 dims × 0-3)  = max 9   — weight: 0.30
Adoption Realism       (4 dims × 0-3)  = max 12  — weight: 0.45
Value & Efficiency     (2 dims × 0-3)  = max 6   — weight: 0.25

Composite = (Technical / 9 × 0.30) + (Adoption / 12 × 0.45) + (Value / 6 × 0.25)
Range: 0.0 to 1.0
```

**Why adoption is weighted highest**: A score of 9/9 technical + 0/12 adoption = 0.30 composite. The engine won't recommend building something nobody will use, no matter how clean the architecture is. Conversely, a moderate technical fit (6/9) with strong adoption (10/12) and good value (5/6) scores 0.78 — that's a real opportunity.

**Threshold rule** (carried over from agent-factory): Track the highest composite score among evaluated opportunities. Only promote to simulation if the score meets or exceeds `0.60`. This creates the same ratcheting dynamic — but now the ratchet rewards *deployable* skills, not just *buildable* ones.

#### Automatic Red Flags

The agent should flag and deprioritize opportunities that hit any of these:

| Red Flag | Condition | Action |
|---|---|---|
| **Dead Zone** | Decision density = 0% across all L4s | Auto-skip, log as "no active decisions" |
| **No Stakes** | Zero HIGH financial ratings + SECOND-order impact only | Demote to Tier 3, note "low organizational pressure" |
| **Confidence Gap** | >50% of L4s have `rating_confidence = LOW` | Flag as "assessment uncertain", reduce simulation priority |
| **Phantom Opportunity** | `opportunity_exists = false` | Skip entirely (only 2 in Ford data, but guard against it) |
| **Orphan L4s** | L3 has `l4_count < 3` | Flag as "thin opportunity" — may not justify a standalone skill |

### Phase 3 — Lightweight Simulation

For opportunities with composite score >= 0.60, the agent produces:

1. **Decision Flow Sketch** — Mermaid diagram of the skill's decision logic
2. **Component Map** — Which Aera components handle each step:
   - Data ingestion: Streams / DDM Crawlers / Interface Node
   - Logic: Remote Functions / Cortex Models / Script Nodes
   - Orchestration: Process Builder flows / Agent Functions / Agent Teams
   - UI: Dashboards, CWB screens, recommendation views
3. **Mock Decision Test** — A concrete scenario with sample inputs/outputs:
   - "Given Ford's Q3 inventory at $14.9B and a 40% demand spike in F-150s..."
   - Expected decision: "Increase reorder point by 25%, expedite from Supplier X"
   - Can the decision logic be expressed? Are the inputs available?
4. **Integration Surface** — What connects to what (SAP → Aera → Process → UI)

### Phase 4 — Spec Generation

For simulated opportunities that pass the mock decision test:

| Spec | Content |
|---|---|
| **Skill Architecture** | L4 activities → Aera components → orchestration pattern |
| **Data Requirements** | Source systems, tables, refresh cadence, volume estimates |
| **Process Builder Design** | Node-by-node flow with variable types and conditions |
| **UI Screens** | Screen inventory with component breakdown (using the 21 Aera components) |
| **Model Requirements** | If AI/ML: what model type, training data, Cortex vs Remote Function |
| **Agent Design** | If agentic: Agent Functions, Agent Teams, LLM routing |
| **Implementation Estimate** | Complexity tier, estimated sprint count, team composition |
| **Local Simulation Spec** | What model, context window, and tools would simulate this skill |

---

## Output Artifacts

After an overnight run, the human reviews:

```
evaluation/
├── triage.tsv              # All 362 opportunities, tier-sorted
├── feasibility-scores.tsv  # Scored opportunities with 9-dimension breakdown (3 lenses)
├── adoption-risk.md        # Red flags, dead zones, and adoption concerns
├── tier1-report.md         # Deep analysis of top-tier opportunities
├── simulations/
│   ├── <skill-name>/
│   │   ├── decision-flow.mermaid
│   │   ├── component-map.yaml
│   │   ├── mock-decision-test.md
│   │   └── integration-surface.md
│   └── ...
├── specs/
│   ├── <skill-name>-spec.md    # Full implementation spec
│   └── ...
├── summary.md              # Executive summary: top 10 opportunities ranked
├── dead-zones.md           # Areas the agent explicitly recommends AGAINST
├── model-recommendations.md # Which local models can simulate which skills
└── meta-reflection.md      # What the agent learned about this client's catalog
```

**Review flow**:
1. `cat evaluation/summary.md` — top 10 at a glance
2. `cat evaluation/dead-zones.md` — what to avoid (saves client time)
3. `cat evaluation/feasibility-scores.tsv` — full ranked list with 3-lens breakdown
4. Browse `evaluation/simulations/<name>/` — see the decision logic
5. Read `evaluation/specs/<name>-spec.md` — hand to SE team

---

## What Changes from agent-factory

| Component | Before (agent-factory) | After (feasibility engine) |
|---|---|---|
| **Input** | Reddit/HN/GitHub | Structured JSON hierarchy export |
| **Research phase** | Discover problems | Triage & score catalog |
| **Scoring** | DEMAND x GAP x TOOLS x TAM | Data Readiness x Platform Fit x Archetype Confidence x Simulation Viability x Value Density |
| **Build phase** | Ship a working agent repo | Generate implementation spec |
| **Threshold** | Composite score ratchet | Feasibility score ratchet |
| **Output** | `builds/<agent>/` with code | `evaluation/specs/<skill>/` with architecture |
| **Overnight goal** | 3-5 built agents | 10-20 scored opportunities, 5-10 simulated, 3-5 fully specced |
| **program.md** | Generic discovery loop | Catalog-driven evaluation loop |
| **seed harness** | Composio-powered agent template | Aera component reference + Skill Builder knowledge |

### What Stays the Same

- **Loop-forever pattern** — agent works autonomously until interrupted
- **Ratcheting threshold** — quality floor rises as better opportunities surface
- **File-based persistence** — everything on disk, git committed
- **Context management** — summarize, archive, reset between iterations
- **Meta-reflections** — every N evaluations, reflect on patterns

---

## The Aera Knowledge Base (from `/Users/vincent.wicker/Documents/area`)

The agent has access to deep platform knowledge:

- **21 UI components** with 209 mapped properties (`reference/components/`)
- **22 Process Builder nodes** with procedures and patterns (`tools/process_builder_index.json`)
- **28 expert agents** for routing and guidance (`.claude/agents/`)
- **Orchestration decision guide** — Process vs Agent vs Hybrid framework
- **Skill Builder playbook** — feature decomposition, classification, scaffolding
- **Economic challenger philosophy** — ROI-first optimization approach
- **Component schemas** with parent-child relationships and validation rules

This is what makes the simulation meaningful — the agent isn't guessing at Aera capabilities, it's evaluating against the actual component catalog and known platform constraints.

---

## Local Model Strategy

For overnight autonomous runs:

| Task | Model Requirement | Recommended |
|---|---|---|
| Catalog triage (parsing, binning) | Fast, structured output | Llama 3.1 8B / Qwen 2.5 7B |
| Feasibility scoring (reasoning over descriptions) | Strong reasoning, 8K+ context | Llama 3.1 70B / Qwen 2.5 32B |
| Decision flow generation (architecture design) | Long context, code generation | DeepSeek-V3 / Qwen 2.5 72B |
| Spec writing (detailed technical docs) | Long output, instruction following | Llama 3.1 70B / Mistral Large |

**Hardware floor**: 64GB RAM for 70B quantized models (Q4), or 32GB for 8B-32B models. Apple Silicon M-series preferred for Ollama.

---

## Success Criteria

After one overnight run against a real client export:

- [ ] All 362 opportunities triaged and tier-sorted
- [ ] 50+ opportunities scored across all 3 lenses (9 dimensions)
- [ ] Dead zones identified and documented (expect ~30% of catalog to be flagged)
- [ ] 10+ opportunities simulated with decision flows and component maps
- [ ] 5+ opportunities fully specced with implementation architecture
- [ ] Summary report identifies the 3 highest-value quick wins
- [ ] No recommended skill has an Adoption Realism score below 7/12
- [ ] Every spec maps to real Aera components (no hallucinated capabilities)
- [ ] Model recommendations are hardware-realistic for the user's machine
- [ ] Everything git committed and reviewable in the morning

---

## Archetype Distribution (Ford Example)

The 362 opportunities break down as:

| Archetype | Count | What it means for simulation |
|---|---|---|
| **DETERMINISTIC** | 203 (56%) | Process Builder-heavy — simulate with workflow generation |
| **AGENTIC** | 156 (43%) | Agent Teams + LLM routing — simulate with prompt chains |
| **GENERATIVE** | 1 (<1%) | Content generation — standard LLM task |

This tells us the engine needs strong Process Builder knowledge (majority of opportunities) and agentic orchestration patterns (large minority). The Aera reference materials cover both.

### Domain Distribution

| L1 Domain | Opportunities | Example |
|---|---|---|
| **Make** | 83 | Production scheduling, quality control, yield optimization |
| **Procure Source & Buy** | 76 | Supplier risk, contract optimization, spend analytics |
| **Move & Fulfill** | 73 | Logistics optimization, warehouse management, last-mile |
| **Plan** | 69 | Demand forecasting, S&OP, inventory optimization |
| **Service** | 61 | Warranty analytics, parts planning, field service optimization |
