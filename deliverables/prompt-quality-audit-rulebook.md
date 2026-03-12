# Prompt Quality Audit Rulebook

**Aera Skill Feasibility Engine -- Scoring Prompt Analysis & Reinforcement Rules**

**Date**: 2026-03-12
**Engine Version**: v1.1 (vLLM cloud backend, Qwen 2.5 32B)
**Dataset**: 322 scored opportunities from Ford hierarchy export
**Evaluation Backend**: vLLM on RunPod H100 GPUs

---

## Part 1: Scoring Distribution Analysis

### 1.1 Sub-Dimension Distribution Profiles

All statistics below are computed from the 322 scored rows in `src/evaluation-vllm/evaluation/feasibility-scores.tsv`.

#### Technical Feasibility Lens (3 sub-dimensions, max 9, weight 40%)

| Sub-Dimension | Min | Max | Mean | Median | Mode | Stdev | Distribution |
|---|---|---|---|---|---|---|---|
| data_readiness | 1 | 3 | 2.13 | 2.0 | 2 | 0.46 | 1: 4.7%, 2: 77.6%, 3: 17.7% |
| platform_fit | 0 | 0 | 0.00 | 0.0 | 0 | 0.00 | 0: 100.0% |
| archetype_confidence | 0 | 3 | 2.37 | 2.0 | 2 | 0.55 | 0: 0.3%, 1: 2.5%, 2: 57.1%, 3: 40.1% |

#### Adoption Realism Lens (4 sub-dimensions, max 12, weight 35%)

| Sub-Dimension | Min | Max | Mean | Median | Mode | Stdev | Distribution |
|---|---|---|---|---|---|---|---|
| decision_density | 1 | 3 | 2.91 | 3.0 | 3 | 0.37 | 1: 2.5%, 2: 4.3%, 3: 93.2% |
| financial_gravity | 1 | 3 | 2.32 | 2.0 | 2 | 0.51 | 1: 2.2%, 2: 63.4%, 3: 34.5% |
| impact_proximity | 1 | 3 | 2.37 | 2.0 | 2 | 0.50 | 1: 0.9%, 2: 61.5%, 3: 37.6% |
| confidence_signal | 0 | 3 | 1.71 | 2.0 | 2 | 0.60 | 0: 1.9%, 1: 31.1%, 2: 61.2%, 3: 5.9% |

#### Value & Efficiency Lens (2 sub-dimensions, max 6, weight 25%)

| Sub-Dimension | Min | Max | Mean | Median | Mode | Stdev | Distribution |
|---|---|---|---|---|---|---|---|
| value_density | 0 | 3 | 1.10 | 1.0 | 1 | 0.64 | 0: 15.8%, 1: 59.0%, 2: 24.8%, 3: 0.3% |
| simulation_viability | 1 | 3 | 2.20 | 2.0 | 2 | 0.45 | 1: 2.2%, 2: 75.8%, 3: 22.0% |

#### Composite Score

| Statistic | Value |
|---|---|
| Min | 0.33 |
| Max | 0.93 |
| Mean | 0.72 |
| Median | 0.70 |
| Stdev | 0.09 |

### 1.2 Collapsed Dimensions (>90% at single value)

Two sub-dimensions fail the discrimination test:

1. **platform_fit**: 100% at 0 -- COMPLETELY COLLAPSED. This is the most severe prompt failure in the system. Every opportunity scored 0 regardless of actual platform fit. Root cause analysis in Section 1.5.

2. **decision_density**: 93.2% at 3 (max). Nearly all opportunities score maximum decision density. This ceiling effect means the dimension adds almost no discriminative value to the composite. The prompt's rubric thresholds may be too loose for this dataset where most L4 activities have `decision_exists=true`.

### 1.3 Ceiling Effects (>70% at max)

- **decision_density**: 93.2% at score 3. See above.

### 1.4 Floor Effects (>70% at 0)

- **platform_fit**: 100.0% at score 0. See Section 1.5.

### 1.5 Cross-Dimension Correlation

Two correlations exceed r=0.50:

1. **data_readiness vs archetype_confidence**: r=0.554. Moderate correlation -- opportunities with richer data tend to have stronger archetype support. This is directionally reasonable (more data signals make archetype classification easier), so this is not necessarily redundancy.

2. **financial_gravity vs impact_proximity**: r=0.641. Stronger correlation -- these two adoption sub-dimensions tend to move together. When financial ratings are high, impact proximity also tends to be high. This is a partial redundancy concern: both are measuring how "financially significant" the opportunity is, just from different angles (financial_rating values vs. impact_order values). The adoption lens has 4 sub-dimensions, so some correlation is tolerable, but this pair provides less incremental discrimination than ideal.

### 1.6 Critical Known Issue: platform_fit = 0 for ALL 322 Opportunities

#### Diagnosis

The `aera_platform_fit` rubric in `src/scoring/prompts/technical.ts` (lines 69-73) reads:

```
**aera_platform_fit:**
- 0 = No matching capabilities or components; opportunity has no clear mapping to any Aera platform capability
- 1 = Weak fit; opportunity aligns with 1 capability pillar but no specific component match
- 2 = Moderate fit; maps to specific capabilities with identified components (e.g., forecasting -> Cortex Auto Forecast, exception management -> CWB Lifecycle)
- 3 = Strong fit; clear capability match with specific components and implementation pattern (e.g., demand forecasting -> Cortex Auto Forecast + STREAMS + Subject Areas)
```

The rubric itself is well-designed -- it references specific Aera capabilities by name (Cortex Auto Forecast, CWB Lifecycle, STREAMS, Subject Areas) at levels 2-3.

**However**, when the scoring run that produced these results was executed, the knowledge context injected into the prompt contained only:
- 21 UI component names with descriptions (Table, Dropdown, Label, etc.)
- 22 Process Builder node names with categories and purposes (IF, Data View, Transaction, etc.)

The LLM received UI widget names like "Table: Data display component for tabular data" and PB node names like "IF (control_flow): Conditional branching node" -- but had no information about business capabilities such as demand forecasting, inventory optimization, root cause analysis, exception management, or what types of supply chain problems Aera solves.

The rubric examples at levels 2-3 reference capabilities like "Cortex Auto Forecast" and "CWB Lifecycle" that were NOT present in the knowledge context at all. The LLM could not possibly score above 0 because it lacked the semantic bridge from opportunity descriptions (e.g., "Demand Forecasting & Analysis") to Aera capabilities (e.g., Cortex Auto Forecast is Aera's time-series forecasting engine).

#### What Was Fixed by Prompt 005 (Knowledge Enrichment)

The new knowledge enrichment (prompt 005) added three data files and updated the pipeline:

1. **`src/data/capabilities/platform-capabilities.json`**: 4-pillar taxonomy (Data Foundation, Intelligence Layer, Decision & Action, Orchestration) with 16 named capabilities, descriptions, and `best_for` arrays.

2. **`src/data/capabilities/use-case-mappings.json`**: 20 use-case-to-component mappings (e.g., "Demand Forecasting" -> Cortex Auto Forecast + STREAMS + Subject Areas).

3. **`src/data/capabilities/capability-keywords.json`**: Keyword classifications for AI/ML, Rule-Based, and Hybrid skill types.

4. **`src/knowledge/capabilities.ts`**: Loader module that reads these JSON files.

5. **`src/scoring/knowledge-context.ts`**: Updated `buildKnowledgeContext()` to include a `capabilities` string alongside `components` and `processBuilder`.

6. **`src/scoring/scoring-pipeline.ts`** (lines 62-65): Updated to prepend capabilities context to the knowledge string:
   ```
   const capabilitiesSection = knowledgeContext.capabilities
     ? `Platform Capabilities:\n${knowledgeContext.capabilities}\n\n`
     : "";
   const knowledgeStr = `${capabilitiesSection}UI Components:...`;
   ```

7. **`src/scoring/prompts/technical.ts`** (lines 69-73): Updated rubric text to reference capabilities and components at levels 1-3.

#### Assessment: Is the Enrichment Sufficient?

**Partially yes, but with significant gaps remaining.**

**What the enrichment provides:**
- The LLM now knows Cortex Auto Forecast does demand forecasting, RCA Service does root cause analysis, Safety Stock Service does inventory optimization, etc.
- Use-case mappings provide the semantic bridge: "Demand Forecasting" -> Cortex Auto Forecast + STREAMS + Subject Areas.
- Keyword classifications help the LLM classify opportunity text into AI/ML vs. Rule-Based vs. Hybrid.

**What remains insufficient:**

1. **"Best for" / "Not for" guidance is incomplete.** The reference repo at `/Users/vincent.wicker/Documents/area/reference/platform-capabilities-map.md` contains ~5,400 lines of detailed guidance including "Not For" sections, examples, and decision trees. The JSON distillation captures `best_for` as keyword arrays but loses the "Not For" boundary conditions. Without negative examples, the LLM may over-match capabilities (scoring 2-3 when it should score 1).

2. **Use-case mapping coverage.** The 20 mappings are a good start but incomplete for 322 diverse Ford supply chain opportunities. There are no explicit mappings for: warranty management, recall management, packaging logistics, customs/trade compliance, plant maintenance/predictive diagnostics, workforce/labor management, sustainability, connected vehicle/OTA. For these, the LLM must infer from keywords, which is less reliable.

3. **No "not-for" boundaries.** The enrichment tells the LLM what Aera CAN do but not what it CANNOT do. For example, Aera is not an MES (Manufacturing Execution System), not a WMS, not an ERP. Without these boundaries, the LLM cannot distinguish between "this opportunity maps to Aera" (score 2-3) and "this needs a different system" (score 0-1).

4. **Orchestration decision guide not included.** The reference repo's `orchestration-decision-guide.md` provides scenarios for when to use Process Builder vs. Agentic AI vs. Hybrid. This would improve archetype_confidence scoring as well.

**Predicted outcome of re-running with the enrichment:**
- platform_fit will no longer be uniformly 0. Expect it to distribute across 1-3 for most opportunities.
- However, without "not-for" boundaries, there is risk of score inflation -- most opportunities may cluster at 2-3 because the LLM has positive-match signals but no negative-match signals.

---

## Part 2: Prompt-Level Failure Analysis

### 2.1 Technical Feasibility Prompt (`src/scoring/prompts/technical.ts`)

**Rubric Clarity: GOOD (with platform_fit fix)**

The 0-3 levels for all three sub-dimensions are clearly distinguished with specific criteria. The updated platform_fit rubric (post-prompt-005) uses capability names and component mappings at levels 2-3, making it concrete. Adjacent levels (e.g., 1 vs 2) are distinguishable: 1 = "aligns with 1 capability pillar but no specific component match" vs 2 = "maps to specific capabilities with identified components."

**Grounding Quality: IMPROVED but INCOMPLETE**

- Pre-enrichment: CRITICAL FAILURE. Only UI widget names and PB node names.
- Post-enrichment: Now includes 4-pillar capability taxonomy, 20 use-case mappings, and keyword classifications.
- Remaining gap: No negative examples / "not-for" boundaries.

**Anchoring Bias Risk: MODERATE**

The prompt places the rubric in the system message and the opportunity data in the user message. The archetype emphasis text appears between the rubric and the "Return JSON" instruction. This ordering means the LLM reads the rubric first, then the emphasis instruction, then the knowledge context. The knowledge context is at the END of the system message -- after the "Return JSON" instruction line. This is suboptimal because the LLM may give less attention to content after the return format instruction.

**Archetype Emphasis Effectiveness: UNCERTAIN**

The ARCHETYPE_EMPHASIS blocks instruct the LLM to weight specific dimensions (e.g., DETERMINISTIC: "Weight 'aera_platform_fit' toward Process Builder capabilities"). Without A/B testing, we cannot confirm these change behavior. However, the archetype_confidence distribution (57% at 2, 40% at 3) shows reasonable spread, suggesting the LLM does differentiate archetype support levels.

**Input Signal Quality: GOOD**

The L4 activity format includes name, financial_rating, decision_exists, ai_suitability, and rating_confidence. For 8 or fewer L4s, descriptions are included (truncated to 200 chars). This is informative, though the compact format for >8 L4s drops descriptions entirely, which may lose relevant context for opportunities with many activities.

### 2.2 Adoption Realism Prompt (`src/scoring/prompts/adoption.ts`)

**Rubric Clarity: GOOD**

All four sub-dimensions have clear thresholds tied to L4 data fields:
- decision_density uses percentage thresholds (<25%, 25-75%, >75% decision_exists=true)
- financial_gravity uses majority/mix conditions on financial_rating
- impact_proximity uses FIRST/SECOND order criteria
- confidence_signal uses rating_confidence distribution

**Grounding Quality: HIGH**

This prompt does not require platform knowledge -- it scores based on L4 activity metadata (decision_exists, financial_rating, impact_order, rating_confidence, decision_articulation). All required signals are present in the L4 data passed to the prompt.

**Anchoring Bias Risk: LOW-MODERATE**

The decision_density rubric thresholds are algorithmic (<25%, 25-75%, >75%) and could actually be computed deterministically. The fact that 93.2% score at 3 suggests these thresholds are too loose for this dataset, not that the LLM is biased.

**Ceiling Effect Diagnosis for decision_density:**

The Ford hierarchy export appears to have most L4 activities with `decision_exists=true`. If >75% of L4s in nearly every opportunity have decisions, then the rubric correctly assigns 3 to nearly all. The issue is that the rubric's level-3 threshold (>75%) does not discriminate within a dataset where most opportunities exceed it. This is a rubric design issue, not a prompt failure.

### 2.3 Value & Efficiency Prompt (`src/scoring/prompts/value.ts`)

**Rubric Clarity: GOOD**

value_density uses clear percentage-of-revenue thresholds (<0.1%, 0.1-1%, >1%). simulation_viability uses qualitative criteria about decision flow clarity.

**Grounding Quality: HIGH**

Company financials (revenue, COGS) are included directly. The combined_max_value is provided with its revenue percentage pre-calculated. L4 value_metric fields provide per-activity value signals.

**Anchoring Bias Risk: LOW**

The prompt does not include examples that would anchor toward particular scores. The value_density distribution (59% at 1, 25% at 2, 16% at 0, 0.3% at 3) shows the LLM is NOT inflating scores despite being presented with monetary values. The near-absence of score-3 (0.3%) suggests the upstream value caps are working as intended -- the capped values rarely exceed 1% of revenue.

**NOTE ON VALUE LENS COMPRESSION**: The value_density distribution with 59% at 1 and only 0.3% at 3 is EXPECTED BEHAVIOR. The upstream pipeline caps values at COGS and de-duplicates overlapping opportunities. This means combined_max_value is a deliberately conservative floor. The prompt is correctly interpreting these capped values. The fact that simulation_viability has better spread (75.8% at 2, 22% at 3) while sharing the same opportunities confirms the two value sub-dimensions DO discriminate from each other, which is healthy.

---

## Part 3: Confidence Score Analysis

### 3.1 Distribution

| Level | Count | Percentage |
|---|---|---|
| HIGH | 295 | 91.6% |
| MEDIUM | 13 | 4.0% |
| LOW | 14 | 4.3% |

### 3.2 Confidence vs Composite Correlation

| Confidence | N | Mean Composite | Range |
|---|---|---|---|
| HIGH | 295 | 0.735 | [0.55, 0.93] |
| MEDIUM | 13 | 0.573 | [0.33, 0.75] |
| LOW | 14 | 0.644 | [0.55, 0.73] |

Confidence IS correlated with composite: HIGH-confidence opportunities average 0.735 composite vs 0.573 for MEDIUM and 0.644 for LOW. This is a calibration concern. Confidence should measure certainty of the assessment, not the score itself. High-confidence low-scoring opportunities should be as common as high-confidence high-scoring ones.

Note: Confidence is computed algorithmically (via `computeTechnicalConfidence()`, `computeAdoptionConfidence()`, `computeValueConfidence()` in `src/scoring/confidence.ts`), not by the LLM. So this correlation reflects the algorithmic confidence formula's coupling with the same input signals that drive scores.

### 3.3 False Confidence Cases

5 opportunities have HIGH confidence but composite < 0.60:

| Opportunity | Composite | Confidence |
|---|---|---|
| Supplier Risk & Resilience Management | 0.59 | HIGH |
| Warranty & Goodwill Policy Management | 0.59 | HIGH |
| Service Process Continuous Improvement | 0.59 | HIGH |
| Technology & Innovation Scouting | 0.56 | HIGH |
| Supplier Compliance & Ethics | 0.55 | HIGH |

These are borderline cases (composites just below 0.60). The confidence formula likely assigns HIGH based on L4 data quality signals (e.g., rating_confidence distribution) which can be strong even when scores are low. This is a mild calibration issue, not a critical failure.

### 3.4 Confidence Imbalance

91.6% HIGH is heavily skewed. If nearly every assessment has HIGH confidence, the signal provides no discrimination. This suggests the confidence thresholds are too loose -- either the Ford dataset has unusually complete L4 metadata, or the algorithmic formula needs tighter thresholds.

---

## Part 4: Simulation Prompt Analysis

### 4.1 Component Map Prompt (`src/simulation/prompts/component-map.ts`)

**Format Clarity: GOOD.** The prompt specifies "Output valid YAML format (no code fences)" and names exactly 5 required sections (streams, cortex, process_builder, agent_teams, ui). Per-entry structure (name, purpose, confidence) is clearly specified.

**Knowledge Grounding: MODERATE.** The prompt receives PB node names and UI component names as a glossary, plus integration pattern names. However, it does NOT receive the new capability-level knowledge (Cortex Auto Forecast, RCA Service, Safety Stock Service, etc.). The glossary only includes raw component names. This means the LLM must hallucinate the "cortex" section content since it does not know what Cortex capabilities exist.

**Effective Use of Knowledge Base: PARTIAL.** The instruction "Use these exact names when referencing known components. If a component is needed but not in the glossary, use a descriptive name and set confidence to 'inferred'" is a good guardrail. But since Cortex capabilities are not in the glossary, all AI/ML components will be marked as "inferred" even though they are well-defined platform capabilities.

### 4.2 Decision Flow Prompt (`src/simulation/prompts/decision-flow.ts`)

**Format Clarity: GOOD.** Clear instructions for Mermaid flowchart syntax ("flowchart TD", use --> for connections, capitalize "End"). The label convention ("PB: <node>, Cortex: <capability>, UI: <component>") is well-specified.

**Knowledge Grounding: MODERATE.** Same gap as component map -- PB node names and workflow patterns are provided but capability-level knowledge is not.

**Hallucination Risk: MODERATE.** The "Cortex: <capability>" label instruction implies the LLM should reference Cortex capabilities in flow diagrams, but without a list of valid capability names, it will invent them.

### 4.3 Integration Surface Prompt (`src/simulation/prompts/integration-surface.ts`)

**Format Clarity: GOOD.** Four required sections (source_systems, aera_ingestion, processing, ui_surface) with per-entry schemas specified. The "tbd" status instruction for unknown sources is a good guardrail.

**Knowledge Grounding: GOOD FOR SCOPE.** This prompt focuses on mapping enterprise applications to Aera ingestion streams, which is structural rather than capability-focused. The integration pattern names reference provides adequate grounding.

### 4.4 Mock Test Prompt (`src/simulation/prompts/mock-test.ts`)

**Format Clarity: GOOD.** Four required fields (decision, input, expected_output, rationale) with sub-field requirements. The "exactly 1 happy-path test case" instruction prevents over-generation.

**Financial Grounding: STRONG.** Real company financials (revenue, COGS, EBITDA, working capital, inventory value) are injected. The instruction "Input values MUST be derived from actual client financials provided below, not synthetic placeholder data" is an effective anti-hallucination guardrail.

**Knowledge Grounding: N/A.** This prompt does not reference platform components -- it tests decision logic. No grounding gap.

---

## Part 5: Reinforcement Rulebook

### Success Patterns (Preserve These)

1. **Value lens produces expected compression.** value_density correctly reflects upstream value caps: 59% at 1, 25% at 2, 0.3% at 3. The prompt is faithfully interpreting conservative inputs rather than inflating.

2. **simulation_viability discriminates well.** Despite value_density compression, simulation_viability has a different distribution (75.8% at 2, 22% at 3), confirming the two value sub-dimensions measure different things.

3. **financial_gravity shows healthy spread.** 63.4% at 2, 34.5% at 3, 2.2% at 1 -- three distinct score levels with meaningful proportions.

4. **confidence_signal captures low-confidence signals.** 31.1% at 1 and 1.9% at 0 shows the LLM does identify opportunities with weak rating confidence, providing meaningful downward pull on adoption scores.

5. **Zod schema validation prevents malformed responses.** The TechnicalLensSchema, AdoptionLensSchema, and ValueLensSchema enforce integer 0-3 scores with string reasons. Combined with `scoreWithRetry()`, this provides structural reliability.

6. **Mock test prompt grounding in real financials.** The instruction to use actual client financial data is an effective anti-hallucination pattern.

7. **Archetype emphasis pattern.** The per-archetype emphasis paragraphs are a clean, maintainable way to adjust scoring behavior by archetype without duplicating prompts.

### Failure Patterns (Fix These)

1. **platform_fit total collapse** -- 100% at 0 due to insufficient knowledge context (now partially fixed by prompt 005 enrichment).

2. **decision_density ceiling effect** -- 93.2% at max, providing near-zero discrimination.

3. **Confidence imbalance** -- 91.6% HIGH renders the confidence signal useless for prioritization.

4. **Simulation prompts lack capability knowledge** -- component map and decision flow prompts reference Cortex capabilities without providing a glossary of valid Cortex capability names.

5. **financial_gravity / impact_proximity partial redundancy** -- r=0.641 correlation means they measure overlapping constructs.

### Prompt Reinforcement Rules

---

#### TECH-01: Inject "Not-For" Boundaries into Platform Capabilities Context

**Problem**: The new knowledge enrichment provides only positive capability matches (`best_for` arrays) but no negative boundaries. The LLM knows what Aera CAN do but not what it CANNOT do.

**Evidence**: With 100% platform_fit = 0 in the current run, there is no data yet on over-matching. However, the Aera reference repo (`platform-capabilities-map.md`) explicitly states: "Not For: Transactional databases (Aera is analytical, not operational)", "Not For: Direct database queries", "Not For: Real-time streaming validation (Aera is batch-oriented)". These constraints are absent from the enriched knowledge context.

**Root Cause**: `platform-capabilities.json` contains `best_for` arrays but no `not_for` arrays. Without negative signals, the LLM has no basis for scoring 0 ("no matching capabilities") on any opportunity that loosely relates to data or decision-making.

**Fix**: Add `not_for` arrays to each capability in `platform-capabilities.json`. Example for STREAMS:

```json
{
  "name": "STREAMS (ETL)",
  "description": "SQL-based data transformation...",
  "best_for": ["data integration", "ETL pipelines", ...],
  "not_for": ["real-time streaming", "transactional databases", "direct operational systems"]
}
```

Then update `buildKnowledgeContext()` to include a condensed "Not-for" section:

```
[Platform Boundaries]
- Aera is an analytical decision platform, NOT an operational/transactional system
- Not a replacement for: MES, WMS, TMS, ERP, CRM
- Not for: real-time streaming, sub-second latency, direct operational control
```

**Expected Impact**: platform_fit scores distribute across 0-3 with meaningful discrimination. Opportunities requiring operational systems (e.g., "Vehicle Assembly Operations") should score 0-1; opportunities requiring forecasting and exception management should score 2-3.

**Success Criterion**: After re-evaluation, platform_fit uses at least 3 distinct values and has stdev > 0.5.

---

#### TECH-02: Add Missing Use-Case Mappings for Coverage Gaps

**Problem**: The 20 use-case mappings in `use-case-mappings.json` do not cover all opportunity domains in the Ford hierarchy.

**Evidence**: The 322 opportunities span domains including warranty management, recall management, packaging logistics, customs/trade compliance, plant maintenance, workforce management, sustainability, and connected vehicle/OTA. None of these have explicit use-case mappings.

**Root Cause**: The enrichment distilled mappings from the Aera reference repo's `when-to-use-guide.md` and `component-selection.yaml`, but focused on classic supply chain use cases. Service, maintenance, and connected vehicle domains were not included.

**Fix**: Add 8-10 additional use-case mappings to `use-case-mappings.json`:

```json
{"use_case": "Warranty Claims Analysis", "primary_components": ["RCA Service", "STREAMS"], "supporting_components": ["Subject Areas", "CWB Lifecycle", "UI Screens"], "skill_type": "Hybrid", "keywords": ["warranty", "claims", "defect", "recovery"]},
{"use_case": "Predictive Maintenance", "primary_components": ["Cortex Auto Forecast", "AutoML"], "supporting_components": ["STREAMS", "Subject Areas", "CWB Lifecycle"], "skill_type": "AI/ML", "keywords": ["maintenance", "predictive", "reliability", "uptime", "asset"]},
{"use_case": "Customs & Trade Compliance", "primary_components": ["STREAMS", "Remote Functions"], "supporting_components": ["Subject Areas", "Process Builder"], "skill_type": "Rule-Based", "keywords": ["customs", "trade", "tariff", "compliance", "regulatory", "export"]},
{"use_case": "Packaging & Container Management", "primary_components": ["STREAMS", "Remote Functions"], "supporting_components": ["Subject Areas", "UI Screens"], "skill_type": "Rule-Based", "keywords": ["packaging", "container", "returnable", "logistics"]}
```

**Expected Impact**: Improved platform_fit accuracy for service, maintenance, and compliance opportunities. Fewer opportunities relying on keyword-only matching.

**Success Criterion**: >80% of opportunities match at least one use-case mapping by keyword overlap.

---

#### ADOPT-01: Raise decision_density Threshold to Fix Ceiling Effect

**Problem**: 93.2% of opportunities score maximum (3) on decision_density, making it a near-constant that adds no discrimination.

**Evidence**: 300/322 opportunities score 3. The rubric defines level 3 as ">75% of L4s have decision_exists=true with clear articulation." The Ford dataset appears to have most L4 activities with decision_exists=true, so nearly all opportunities exceed the 75% threshold.

**Root Cause**: The rubric's level-3 threshold (>75%) is too low for this dataset. The prompt at `src/scoring/prompts/adoption.ts` lines 62-65:

```
**decision_density:**
- 0 = No automated decisions identified; no L4 activities have decision_exists=true
- 1 = Low decision density; <25% of L4s have identifiable decisions
- 2 = Moderate decision density; 25-75% of L4s have decision_exists=true
- 3 = High decision density; >75% of L4s have decision_exists=true with clear articulation
```

**Fix**: Raise the thresholds and add a quality requirement at level 3. Replace the rubric with:

```
**decision_density:**
- 0 = No automated decisions identified; no L4 activities have decision_exists=true
- 1 = Low decision density; <40% of L4s have identifiable decisions OR decisions lack articulation
- 2 = Moderate decision density; 40-85% of L4s have decision_exists=true with some articulation
- 3 = High decision density; >85% of L4s have decision_exists=true AND majority have clear, specific decision_articulation text (not generic/boilerplate)
```

The key change at level 3 is requiring "clear, specific decision_articulation text (not generic/boilerplate)" -- this forces the LLM to assess decision QUALITY, not just presence.

**Expected Impact**: decision_density distributes more evenly. Opportunities with many decision_exists=true but vague or missing decision_articulation should drop from 3 to 2.

**Success Criterion**: After re-evaluation, decision_density score-3 drops below 70% and at least 3 distinct values appear with meaningful proportions.

---

#### ADOPT-02: Reduce financial_gravity / impact_proximity Redundancy

**Problem**: financial_gravity and impact_proximity correlate at r=0.641, indicating partial construct overlap.

**Evidence**: financial_gravity distribution: 2.2% at 1, 63.4% at 2, 34.5% at 3. impact_proximity: 0.9% at 1, 61.5% at 2, 37.6% at 3. Both are concentrated at 2-3 with similar proportions.

**Root Cause**: Both dimensions draw from related L4 fields: financial_gravity uses `financial_rating` (HIGH/MEDIUM/LOW); impact_proximity uses `impact_order` (FIRST/SECOND). In the Ford dataset, HIGH financial_rating tends to co-occur with FIRST impact_order.

**Fix**: Differentiate the dimensions more sharply. Update impact_proximity to emphasize TIME-TO-VALUE rather than financial magnitude. In `src/scoring/prompts/adoption.ts`, replace the impact_proximity rubric:

Current:
```
**impact_proximity:**
- 0 = Only SECOND-order impact; benefits are indirect and hard to measure
- 1 = Mostly SECOND-order with some FIRST-order signals
- 2 = Mix of FIRST and SECOND-order impact with measurable KPIs
- 3 = FIRST-order impact on measurable KPIs; direct, visible business outcomes
```

Proposed:
```
**impact_proximity:**
- 0 = Only SECOND-order impact; benefits require multi-step causal chains to realize
- 1 = Mostly SECOND-order with some FIRST-order signals; value realization > 6 months
- 2 = Mix of FIRST and SECOND-order impact; some KPIs improve within 3-6 months
- 3 = FIRST-order impact on measurable KPIs; value visible within 90 days of deployment
```

Adding time-to-value language creates a dimension the LLM can score independently of financial_rating.

**Expected Impact**: Correlation drops below r=0.50, giving the adoption lens more independent signal.

**Success Criterion**: After re-evaluation, r(financial_gravity, impact_proximity) < 0.50.

---

#### CONF-01: Tighten Algorithmic Confidence Thresholds

**Problem**: 91.6% of opportunities receive HIGH confidence, rendering the signal useless.

**Evidence**: 295/322 = HIGH. Only 13 MEDIUM, 14 LOW. The confidence-composite correlation (HIGH mean=0.735, MEDIUM mean=0.573, LOW mean=0.644) shows confidence is partially coupled to score magnitude.

**Root Cause**: The confidence functions in `src/scoring/confidence.ts` likely have thresholds tuned for a different dataset or set too generously. With the Ford hierarchy's generally complete L4 metadata, nearly everything qualifies as HIGH.

**Fix**: Adjust the confidence computation to produce a more balanced distribution. Two options:

Option A (preferred): Add a composite-independence check. Confidence should be HIGH only when BOTH (a) the input data quality signals are strong AND (b) the sub-dimension scores are internally consistent (no sub-dimension is >2 points away from another within the same lens).

Option B: Simply raise the thresholds. Require a higher bar for HIGH confidence -- e.g., require that >80% of L4s have rating_confidence=HIGH (instead of the current threshold, which appears lower).

**Expected Impact**: HIGH confidence drops to 60-75% of opportunities. MEDIUM increases to 15-25%.

**Success Criterion**: After re-evaluation, no single confidence level exceeds 80% of the population.

---

#### SIM-01: Inject Capability Knowledge into Simulation Prompts

**Problem**: The component map and decision flow simulation prompts reference "Cortex" capabilities without providing a glossary of valid Cortex capability names.

**Evidence**: In `src/simulation/prompts/component-map.ts`, the system prompt says "Include exactly 5 sections: streams, cortex, process_builder, agent_teams, ui" but the glossary only provides PB node names and UI component names. No Cortex capability names are in the glossary. The decision flow prompt (`decision-flow.ts`) uses the label convention "Cortex: <capability>" without listing valid capabilities.

**Root Cause**: The simulation prompts were written before the capability knowledge was added. They pass `pbNodeNames` and `uiComponentNames` but not capability names.

**Fix**: Update `buildComponentMapPrompt()` and `buildDecisionFlowPrompt()` to accept and inject capability names. Example for component map:

```typescript
export function buildComponentMapPrompt(
  input: SimulationInput,
  pbNodeNames: string[],
  uiComponentNames: string[],
  integrationPatternNames: string[],
  capabilityNames: string[],  // NEW PARAMETER
): Array<{ role: string; content: string }> {
  // ...
  const systemPrompt = `...
Component Reference Glossary:

Platform Capabilities: ${capabilityNames.join(", ")}

Process Builder Nodes (22): ${pbNodeNames.join(", ")}

UI Components (21): ${uiComponentNames.join(", ")}
...`;
```

**Expected Impact**: Simulation artifacts use correct Aera capability names instead of hallucinated ones. Component maps reference "Cortex Auto Forecast" instead of inventing names.

**Success Criterion**: Manual review of 10 simulation component maps shows zero hallucinated Cortex capability names.

---

#### TECH-03: Move Knowledge Context Before Return Format Instruction

**Problem**: In the technical prompt, the knowledge context appears at the end of the system message, after the "Return JSON..." instruction.

**Evidence**: In `src/scoring/prompts/technical.ts` (lines 59-86), the message structure is:

```
You are an Aera platform technical feasibility assessor...
[Rubric for data_readiness, platform_fit, archetype_confidence]
[Archetype emphasis]
Return JSON with score and reason...
Available Aera platform knowledge:
${knowledgeContext}
```

The knowledge context is the last content in the system message. LLMs tend to give more attention to content near the beginning and just before the user message. Placing critical reference material after the format instruction risks it receiving less attention.

**Root Cause**: The prompt was structured with the return format instruction as a natural transition, but the knowledge context should precede it for maximum attention.

**Fix**: Restructure the system message to place knowledge context before the return format instruction:

```
You are an Aera platform technical feasibility assessor...

Available Aera platform knowledge:
${knowledgeContext}

Score each dimension as an integer from 0 to 3:
[Rubric]

${emphasis}

Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension.
```

**Expected Impact**: The LLM gives more weight to the knowledge context when scoring platform_fit, improving accuracy.

**Success Criterion**: Qualitative improvement in platform_fit reason text -- reasons should reference specific Aera capabilities by name.

---

### Guardrail Checks

These automated checks should run after every evaluation batch and fail loudly if triggered.

#### GC-01: Distribution Health Check

**What it checks**: Every sub-dimension must use at least 2 distinct score values.

**Implementation**:
```typescript
function checkDistributionHealth(scores: ScoringResult[]): string[] {
  const alerts: string[] = [];
  const dimensions = [
    "data_readiness", "platform_fit", "archetype_confidence",
    "decision_density", "financial_gravity", "impact_proximity",
    "confidence_signal", "value_density", "simulation_viability"
  ];
  for (const dim of dimensions) {
    const values = new Set(scores.map(s => getSubDimScore(s, dim)));
    if (values.size < 2) {
      alerts.push(`COLLAPSED: ${dim} has only ${values.size} distinct value(s): [${[...values].join(",")}]`);
    }
  }
  return alerts;
}
```

**Trigger threshold**: Alert if any sub-dimension has fewer than 2 distinct values across the full evaluation.

**Current state**: Would fire for `platform_fit` (1 distinct value: 0).

#### GC-02: Score Inflation Alert

**What it checks**: Median composite score should not exceed 0.85.

**Implementation**:
```typescript
function checkScoreInflation(scores: ScoringResult[]): string[] {
  const composites = scores.map(s => s.composite).sort((a, b) => a - b);
  const median = composites[Math.floor(composites.length / 2)];
  if (median > 0.85) {
    return [`INFLATION: Median composite is ${median.toFixed(3)} (threshold: 0.85)`];
  }
  return [];
}
```

**Trigger threshold**: Alert if median composite > 0.85.

**Current state**: Would NOT fire (median = 0.70).

#### GC-03: Confidence Calibration Check

**What it checks**: No single confidence level should exceed 85% of the population.

**Implementation**:
```typescript
function checkConfidenceCalibration(scores: ScoringResult[]): string[] {
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const s of scores) {
    counts[s.confidence]++;
  }
  const total = scores.length;
  const alerts: string[] = [];
  for (const [level, count] of Object.entries(counts)) {
    const pct = count / total * 100;
    if (pct > 85) {
      alerts.push(`CONFIDENCE_SKEW: ${level} confidence is ${pct.toFixed(1)}% of population (threshold: 85%)`);
    }
  }
  return alerts;
}
```

**Trigger threshold**: Alert if any confidence level > 85%.

**Current state**: Would fire for HIGH (91.6%).

#### GC-04: Knowledge Grounding Verification

**What it checks**: The knowledge context string injected into the technical prompt must contain at least 5 named Aera capabilities (not just UI/PB component names).

**Implementation**:
```typescript
function checkKnowledgeGrounding(knowledgeContext: KnowledgeContext): string[] {
  const requiredCapabilities = [
    "Cortex Auto Forecast", "RCA Service", "Safety Stock Service",
    "CWB Lifecycle", "Process Builder", "Remote Functions",
    "STREAMS", "Subject Areas", "AutoML"
  ];
  const capabilitiesStr = knowledgeContext.capabilities ?? "";
  const missing = requiredCapabilities.filter(c => !capabilitiesStr.includes(c));
  if (missing.length > 4) {
    return [`KNOWLEDGE_GAP: Missing ${missing.length}/${requiredCapabilities.length} required capabilities: ${missing.join(", ")}`];
  }
  return [];
}
```

**Trigger threshold**: Alert if more than 4 of the 9 core capabilities are absent from the knowledge context.

**Current state with enrichment**: Would NOT fire (all 9 are now present). Would have fired before enrichment.

#### GC-05: Ceiling/Floor Effect Check

**What it checks**: No sub-dimension should have >80% of scores at a single extreme (0 or max 3).

**Implementation**:
```typescript
function checkCeilingFloor(scores: ScoringResult[]): string[] {
  const alerts: string[] = [];
  const dimensions = [
    "data_readiness", "platform_fit", "archetype_confidence",
    "decision_density", "financial_gravity", "impact_proximity",
    "confidence_signal", "value_density", "simulation_viability"
  ];
  for (const dim of dimensions) {
    const vals = scores.map(s => getSubDimScore(s, dim));
    const total = vals.length;
    const at0 = vals.filter(v => v === 0).length;
    const at3 = vals.filter(v => v === 3).length;
    if (at0 / total > 0.80) {
      alerts.push(`FLOOR_EFFECT: ${dim} has ${(at0/total*100).toFixed(1)}% at 0 (threshold: 80%)`);
    }
    if (at3 / total > 0.80) {
      alerts.push(`CEILING_EFFECT: ${dim} has ${(at3/total*100).toFixed(1)}% at 3 (threshold: 80%)`);
    }
  }
  return alerts;
}
```

**Current state**: Would fire for `platform_fit` (100% at 0) and `decision_density` (93.2% at 3).

---

## Summary of Action Items

| Priority | Rule ID | Issue | Effort |
|---|---|---|---|
| P0 | TECH-01 | Add "not-for" boundaries to capability knowledge | Small (JSON + context builder update) |
| P0 | TECH-03 | Reorder knowledge context before return instruction | Trivial (prompt restructure) |
| P1 | TECH-02 | Add missing use-case mappings for coverage gaps | Small (JSON additions) |
| P1 | ADOPT-01 | Raise decision_density thresholds | Trivial (rubric text change) |
| P1 | SIM-01 | Inject capability knowledge into simulation prompts | Small (parameter + prompt additions) |
| P2 | ADOPT-02 | Differentiate impact_proximity from financial_gravity | Trivial (rubric text change) |
| P2 | CONF-01 | Tighten confidence thresholds | Medium (formula adjustment + testing) |

**Critical path to fixing platform_fit**: TECH-01 (not-for boundaries) + TECH-03 (knowledge ordering). The enrichment from prompt 005 provides the positive-match knowledge. Adding not-for boundaries and moving the knowledge context earlier in the prompt should produce meaningful platform_fit discrimination on the next evaluation run.
