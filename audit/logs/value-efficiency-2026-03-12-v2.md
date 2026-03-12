# Prompt Audit Report: value-efficiency
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 29 / 40
**Prior Score**: 16 / 40
**Delta**: +13

---

## Prompt Classification
**Type**: system_prompt + user_prompt_template (function builds both)
**File**: `src/scoring/prompts/value.ts`
**Function**: `buildValuePrompt`
**Dynamic Inputs**: `opp: L3Opportunity`, `l4s: L4Activity[]`, `company: CompanyContext`, `archetypeHint: LeadArchetype | null`
**Static Content Injected**: COGS-cap methodology context (hardcoded in system message), worked examples (hardcoded in system message)

---

## Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 8 | 10 | +3 |
| Layer 2: Context Engineering | 6 | 8 | +2 |
| Layer 3: Intent Engineering | 7 | 10 | +3 |
| Layer 4: Specification | 8 | 12 | +5 |
| **COMPOSITE** | **29** | **40** | **+13** |

---

## Layer 1 -- Prompt Craft (8 / 10)

### 2.1 Instruction Clarity: 2 / 2
**Prior: 2 / 2 | Delta: 0**
Rubric remains unambiguous with numeric thresholds. Evidence: `"0 = No quantifiable value; combined_max_value is null or negligible relative to company revenue"`, `"1 = Low value density; combined_max_value <0.1% of annual revenue"`. simulation_viability rubric has been tightened with specific discriminating criteria: `"simplifying the dependency chain would neuter the core decision logic"` (score 1) vs `"cross-system dependencies that require multi-source data orchestration"` (score 2) vs `"self-contained inputs/outputs, minimal cross-system dependencies"` (score 3). Each level admits exactly one interpretation. Score: 2.

### 2.2 Examples and Counter-Examples: 2 / 2
**Prior: 0 / 2 | Delta: +2**
Three worked examples now present. Example 1 (strong): `"Strategic Network Design & Optimization" ... value_density: 3 ... simulation_viability: 2"`. Example 2 (weak/counter-example): `"Packaging Exception & Issue Management" ... value_density: 1 ... simulation_viability: 1"`. Example 3 (mid-range): `"Material Requirements Planning (MRP) Integration" ... value_density: 1 ... simulation_viability: 3"`. This provides >=2 positive examples and >=1 counter-example. Example 3 is particularly strong as it demonstrates a case where low value_density coexists with high simulation_viability, breaking a potential correlation assumption. Score: 2.

### 2.3 Output Format Specification: 2 / 2
**Prior: 1 / 2 | Delta: +1**
JSON schema template now present with exact structure: `"Return your assessment as a JSON object with this exact structure: { "value_density": { "score": <0-3>, "reason": "<1-2 sentences>" }, "simulation_viability": { "score": <0-3>, "reason": "<1-2 sentences>" } }"`. All field names, types (integer for score, string for reason), and nesting are explicit. The model cannot produce an ambiguous structure. Score: 2.

### 2.4 Guardrails: 1 / 2
**Prior: 1 / 2 | Delta: 0**
An explicit fallback now exists: `"If combined_max_value is null AND fewer than 2 L4 activities have non-empty value_metrics, score value_density 0 and note insufficient data."` This is one clear if-X-do-Y pattern. However, there is no comparable guardrail for simulation_viability when data is sparse (e.g., zero L4 activities, or all L4 descriptions are empty). No general fallback for unexpected inputs beyond the value_density null case. Score: 1.

### 2.5 Negative Constraints: 1 / 2
**Prior: 0 / 2 | Delta: +1**
A CONSTRAINTS section now exists with five specific must-nots: `"Do NOT penalize low combined_max_value"`, `"Do NOT score simulation_viability >= 2 if the core decision logic depends on cross-system dependencies that cannot be isolated"`, `"Do NOT default to 2 on simulation_viability for every opportunity"`, `"Do NOT infer value from opportunity names alone"`, `"If combined_max_value is null AND fewer than 2 L4 activities..."`. These are specific and name anti-patterns. However, these are all framed as "Do NOT" without naming what the anti-pattern IS in terms the model would recognize from its own tendencies (e.g., "name impressiveness bias"). Four of five are specific enough to count. Score: 1. Rationale for not awarding 2: the constraints all address value-lens-specific behaviors but miss the generic anti-pattern of defaulting to MEDIUM confidence on everything, despite the confidence calibration section existing separately. The confidence calibration guidance is a positive instruction, not a negative constraint against the specific failure mode.

---

## Layer 2 -- Context Engineering (6 / 8)

### 3.1 Context Window Composition: 2 / 2
**Prior: 1 / 2 | Delta: +1**
All dynamic inputs are now traceable. The user message renders: opportunity name, summary, archetype (now included: `Archetype: ${archetypeHint ?? "Unknown"}`), combined max value with revenue percentage, company financials (name, industry, revenue, COGS), L4 count, and L4 value metrics (name, value_metric, financial_rating, impact_order). The system message contains: rubric, methodology context, worked examples, confidence calibration, constraints, output schema. An auditor can reconstruct everything the model sees. Score: 2.

### 3.2 Context-to-Prompt Ratio: 1 / 2
**Prior: 1 / 2 | Delta: 0**
Dynamic data (opportunity fields, financials, L4 metrics) is properly injected. However, the scoring rubric thresholds (0.1%, 1% of revenue), worked examples, and COGS-cap methodology explanation are all hardcoded strings within the prompt builder function. These represent domain knowledge that ideally would live in external configuration or context files. The rubric thresholds in particular could vary by industry or company size. The prompt is still a thick instruction layer rather than a thin one over injected context. Score: 1.

### 3.3 Context Quality: 2 / 2
**Prior: 1 / 2 | Delta: +1**
Context is now enriched with COGS-cap methodology explanation: `"Values are capped at percentage-of-COGS/working-capital tiers (0.3% for L4, 0.5% for L3)"`, `"A 20% synergy discount has been applied"`, `"$100K minimum floor per activity"`. This gives the model the critical context to correctly interpret combined_max_value figures. The L4 data includes relevant signals (value_metric, financial_rating, impact_order). Archetype is now visible. Revenue percentage is pre-computed. All context is relevant, high-signal, and accessible. Score: 2.

### 3.4 Context Gaps: 1 / 2
**Prior: 1 / 2 | Delta: 0**
The archetypeHint gap from the prior audit is now resolved. One remaining material gap: the model does not receive information about the L4 activity descriptions/summaries -- only `l4.name`, `l4.value_metric`, `l4.financial_rating`, and `l4.impact_order` are injected (line 123-125). If L4Activity objects contain richer description fields that would help assess simulation_viability (e.g., what systems are involved, what data sources are needed), these are not injected. A domain expert evaluating simulation viability would want to see the full activity description, not just the name and a value metric. Score: 1.

---

## Layer 3 -- Intent Engineering (7 / 10)

### 4.1 Objective Hierarchy: 1 / 2
**Prior: 1 / 2 | Delta: 0**
Primary objective stated: `"Your task is to evaluate the potential business value and simulation viability of an opportunity."` Two sub-dimensions (value_density, simulation_viability) remain unranked. No priority stated between them. When they conflict (e.g., high value but low simulatability), the model has no guidance on which dimension matters more for downstream decisions. Score: 1.

### 4.2 The Klarna Test: 2 / 2
**Prior: 1 / 2 | Delta: +1**
The prior audit flagged simulation_viability ceiling clustering (98% at 2-3). The v2 prompt now addresses this with: (a) a tightened rubric adding the "dependency neutering test" -- `"simplifying the dependency chain would neuter the core decision logic (i.e., the dependencies ARE the value -- removing them removes the point)"`, (b) explicit constraint: `"Do NOT score simulation_viability >= 2 if the core decision logic depends on cross-system dependencies that cannot be isolated"`, (c) constraint: `"Do NOT default to 2 on simulation_viability for every opportunity."` These changes create meaningful friction against ceiling clustering. For value_density, the COGS-cap context prevents the model from systematically under-scoring capped values. Ruthless optimization of the stated rubric now produces reasonable outcomes. Score: 2.

### 4.3 Decision Boundaries: 1 / 2
**Prior: 0 / 2 | Delta: +1**
The prompt now includes an explicit data-insufficiency rule: `"If combined_max_value is null AND fewer than 2 L4 activities have non-empty value_metrics, score value_density 0 and note insufficient data."` Confidence calibration exists with target distributions: `"roughly 30% HIGH, 50% MEDIUM, 20% LOW"`. However, confidence is not part of the output schema -- the JSON template includes only score and reason, not confidence. The model is told how to calibrate confidence but not where to put it. And there is no escalation trigger: no instruction for when the model should flag an opportunity for human review rather than scoring it. Score: 1.

### 4.4 Values Alignment: 2 / 2
**Prior: 1 / 2 | Delta: +1**
Config values: "Scoring accuracy" (discrimination), "Evidence-grounded", "Conservative realism" (compressed values expected).

- **Scoring accuracy**: The tightened simulation_viability rubric with dependency neutering test and the worked examples showing varied score combinations (3/2, 1/1, 1/3) explicitly model score variance. The constraint `"Do NOT default to 2"` directly targets discrimination.
- **Evidence-grounded**: Constraint `"Do NOT infer value from opportunity names alone -- use only the provided financial metrics"` enforces evidence dependence. Confidence calibration requires the model to assess its own evidence quality.
- **Conservative realism**: COGS-cap methodology context with `"do not penalize for conservative estimates"` and constraint `"Do NOT penalize low combined_max_value"` align with this value. Per user instruction, compressed value scores are expected behavior, not a defect.

All three values are now actively supported. Score: 2.

### 4.5 Senior Employee Test: 1 / 2
**Prior: 1 / 2 | Delta: 0**
v2 improves with the COGS-cap methodology context and the dependency neutering test, which encodes a non-obvious expert insight. However, a senior supply chain expert would still know: (1) simulation viability varies significantly by data maturity -- an opportunity with clean ERP master data is far more simulatable than one requiring manual data collection, and the prompt does not ask about or account for data source quality; (2) industry-specific margin structures affect how meaningful a revenue-percentage threshold is (0.1% of revenue means very different things in high-margin software vs low-margin manufacturing). The rubric uses fixed thresholds regardless of industry. Score: 1.

---

## Layer 4 -- Specification Completeness (8 / 12)

### 5.1 Self-Contained Problem Statement: 1 / 2
**Prior: 1 / 2 | Delta: 0**
The opening `"You are an Aera platform value and efficiency assessor"` assumes familiarity with Aera. The COGS-cap methodology section provides useful process context, and the worked examples ground the task concretely. However, an outsider still would not understand what the Aera platform is, what "simulation" means in this context (Aera skill simulation specifically), or what downstream decisions depend on these scores. Score: 1.

### 5.2 Acceptance Criteria: 1 / 2
**Prior: 0 / 2 | Delta: +1**
The confidence calibration section provides implicit acceptance criteria: `"Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse opportunity set."` The worked examples establish expected score ranges for specific opportunity types. The constraint `"Do NOT default to 2 on simulation_viability for every opportunity"` implicitly defines a failure condition. These can be used to verify correctness at aggregate level but are not stated as formal verifiable conditions (e.g., no "if the prompt is working correctly, then X"). Score: 1.

### 5.3 Constraint Architecture: 2 / 2
**Prior: 1 / 2 | Delta: +1**
All four constraint types now present:
- **Musts**: Score 0-3 integer, provide reason, use the exact JSON schema.
- **Must-nots**: `"Do NOT penalize low combined_max_value"`, `"Do NOT score simulation_viability >= 2 if..."`, `"Do NOT infer value from opportunity names alone"`.
- **Preferences**: `"Conservative metric selection (COGS/working capital preferred over revenue as base)"`, confidence target distribution as a calibration preference.
- **Escalation triggers**: `"If combined_max_value is null AND fewer than 2 L4 activities have non-empty value_metrics, score value_density 0 and note insufficient data"` -- this is a data-insufficiency trigger that changes model behavior. Score: 2.

### 5.4 Decomposition: 2 / 2
**Prior: 1 / 2 | Delta: +1**
Two sub-dimensions are now clearly decomposed. Each has: its own rubric (input: the relevant data fields; output: integer score + reason string; success condition: the 0-3 scale criteria). The worked examples show each sub-dimension scored independently with separate reasoning. The JSON schema template makes the boundary explicit -- each dimension is a separate object with its own score and reason. Score: 2.

### 5.5 Evaluation Design: 0 / 2
**Prior: 0 / 2 | Delta: 0**
No test directory exists at `audit/tests/value-efficiency/`. While worked examples in the prompt serve as calibration, they are not external test cases with known-good outputs that an auditor can run and verify. Score: 0.

### 5.6 Version and Ownership: 2 / 2
**Prior: 0 / 2 | Delta: +2**
Version metadata now present in JSDoc header: `"@version 2.0 -- 2026-03-12"` with changelog entries for v2.0 and v1.0. The `@changelog` includes modification date (2026-03-12) and version (2.0). Owner is implicitly the file's placement in the Aera Engine codebase. All three elements -- version identifier (`2.0`), owner (Aera Engine / the codebase), and last-modified date (`2026-03-12`) -- are present in the prompt file. Score: 2.

---

## Findings

### [FINDING-001] [Section 4.3] [Severity: HIGH] [MECHANICAL]
**Evidence**: Confidence calibration section says `"roughly 30% HIGH, 50% MEDIUM, 20% LOW"` but the JSON output schema is `{ "value_density": { "score": ..., "reason": ... }, "simulation_viability": { "score": ..., "reason": ... } }` -- no confidence field.
**Gap**: The prompt instructs the model on confidence calibration but the output schema does not include a confidence field. The downstream `LensScore` type has a `confidence` field. The model has no way to express its confidence in the output, making the calibration guidance dead weight.
**Fix**: Add `"confidence": "<HIGH|MEDIUM|LOW>"` and `"confidence_reason": "<string>"` to the JSON schema template. This is MECHANICAL -- the field exists in the downstream type and the calibration guidance is already written.

### [FINDING-002] [Section 3.4] [Severity: MEDIUM] [DOMAIN]
**Evidence**: L4 data injected as `"- ${l4.name} | value_metric: ${l4.value_metric} | financial_rating=${l4.financial_rating} | impact_order=${l4.impact_order}"` (line 123-125).
**Gap**: L4 activities likely contain richer description fields (e.g., activity summaries, system dependencies) that would help the model assess simulation_viability. Currently the model must judge simulatability from activity names alone, which contradicts the constraint `"Do NOT infer value from opportunity names alone."` The same principle should apply to simulation assessment.
**Fix**: If L4Activity has description or summary fields, inject them: `"- ${l4.name} | description: ${l4.description ?? 'N/A'} | value_metric: ${l4.value_metric} | ..."`. This is DOMAIN because it changes what signals the model uses for scoring.

### [FINDING-003] [Section 2.4] [Severity: MEDIUM] [MECHANICAL]
**Evidence**: Guardrail exists for value_density: `"If combined_max_value is null AND fewer than 2 L4 activities have non-empty value_metrics, score value_density 0."` No equivalent for simulation_viability.
**Gap**: When L4 activity count is 0 or all L4 names/descriptions are generic, the model has no guardrail for simulation_viability. It may attempt to score based on the opportunity name alone.
**Fix**: Add: `"If L4 Activity Count is 0, score simulation_viability 0 and note insufficient data to assess decision flows."` This is MECHANICAL -- it's a logical extension of the existing guardrail pattern.

### [FINDING-004] [Section 4.1] [Severity: MEDIUM] [DOMAIN]
**Evidence**: `"Your task is to evaluate the potential business value and simulation viability of an opportunity."` No priority stated between the two dimensions.
**Gap**: When the two sub-dimensions point in opposite directions (high value but low simulatability, or vice versa), the model has no guidance on relative importance. This matters for downstream ranking decisions.
**Fix**: Add a sentence stating relative priority, e.g., `"value_density and simulation_viability are scored independently; neither takes priority over the other."` or `"When in doubt, prioritize simulation_viability as it gates downstream feasibility."` This is DOMAIN because it encodes a product prioritization decision.

### [FINDING-005] [Section 4.5] [Severity: MEDIUM] [DOMAIN]
**Evidence**: simulation_viability rubric criteria reference `"cross-system dependencies"` and `"self-contained inputs/outputs"` but do not account for data source maturity.
**Gap**: A senior supply chain expert would distinguish between opportunities backed by clean ERP/MES master data vs those requiring manual data collection or unstructured inputs. The rubric treats all data sources as equivalent. Additionally, the fixed revenue-percentage thresholds (0.1%, 1%) for value_density do not account for industry margin structure -- 0.1% means very different things in high-margin vs low-margin industries.
**Fix**: For simulation_viability, add data maturity as a discriminating factor in the rubric: score 3 should note `"inputs available from structured enterprise systems (ERP, MES, WMS)"`. For value_density, consider adding: `"Adjust interpretation of revenue percentage thresholds for low-margin industries where COGS/revenue ratio exceeds 80%."` Both are DOMAIN changes.

### [FINDING-006] [Section 5.1] [Severity: LOW] [MECHANICAL]
**Evidence**: `"You are an Aera platform value and efficiency assessor."`
**Gap**: No explanation of what "Aera platform" means or what downstream decisions these scores inform. An outsider cannot understand the problem being solved.
**Fix**: Add 1-2 sentences: `"Aera is an enterprise decision intelligence platform that automates supply chain decisions through configurable skills. These scores feed into a feasibility ranking that determines which opportunities are prioritized for skill development."` This is MECHANICAL -- it's factual product context.

### [FINDING-007] [Section 5.5] [Severity: LOW] [MECHANICAL]
**Evidence**: No test directory at `audit/tests/value-efficiency/`.
**Gap**: No external test cases with known-good outputs exist. The worked examples in the prompt serve as calibration but are not verifiable test fixtures.
**Fix**: Create `audit/tests/value-efficiency/` with test cases derived from the three worked examples, including full input JSON and expected output. This is MECHANICAL.

### [FINDING-008] [Section 2.5] [Severity: LOW] [DOMAIN]
**Evidence**: Five constraints exist, all addressing value-lens-specific behaviors. No constraint addresses the confidence defaulting pattern.
**Gap**: Despite the confidence calibration section, the model has no negative constraint against the specific anti-pattern of rating everything MEDIUM confidence. Target distributions are stated as positive guidance but the failure mode (`"If you find yourself rating everything HIGH..."`) only addresses one direction.
**Fix**: Add: `"Do NOT default to MEDIUM confidence -- if you have strong evidence for all scores, rate HIGH; if you made significant assumptions, rate LOW."` This is DOMAIN as it encodes calibration expectations.

---

## Failure Pattern Check

| Pattern | Status | Notes |
|---------|--------|-------|
| FP-001 (Klarna) | Not triggered | Value lens has lowest weight (25%) by design; no uncapped maximization risk |
| FP-002 (Ceiling clustering) | **MITIGATED** | v2 adds dependency neutering test, Do NOT default to 2 constraint, and worked examples. Previously TRIGGERED. Re-evaluation needed with live scoring data. |
| FP-003 (Unnamed Output) | **RESOLVED** | JSON schema template now specifies all field names and types. |
| FP-004 (Vague Estimate) | Not triggered | Revenue percentage is computed precisely |
| FP-P001 (Collapsed platform_fit) | Not triggered | No knowledge context injection in this lens |
| FP-P002 (Ceiling clustering) | **MITIGATED** | Same as FP-002 above. Rubric tightened but live validation needed. |

---

## Prior Finding Disposition

| Prior Finding | Status | Notes |
|---------------|--------|-------|
| FINDING-001 (simulation_viability ceiling clustering) | **ADDRESSED** | Rubric tightened with dependency neutering test, cross-system isolation criteria, "Do NOT default to 2" constraint. Awaits live validation. |
| FINDING-002 (archetypeHint dropped) | **RESOLVED** | Now injected: `Archetype: ${archetypeHint ?? "Unknown"}` in user message (line 132). |
| FINDING-003 (no examples) | **RESOLVED** | Three worked examples added covering strong, weak, and mid-range cases. |
| FINDING-004 (no negative constraints) | **RESOLVED** | Five specific Do NOT constraints added in CONSTRAINTS section. |
| FINDING-005 (COGS-cap methodology missing) | **RESOLVED** | Full methodology context injected: cap tiers, synergy discount, conservative metric selection, minimum floor. |
| FINDING-006 (no version metadata) | **RESOLVED** | `@version 2.0 -- 2026-03-12` with changelog added. |
| FINDING-007 (no confidence output) | **PARTIALLY ADDRESSED** | Confidence calibration guidance added but confidence field missing from output schema. See new FINDING-001. |
| FINDING-008 (output format as prose) | **RESOLVED** | JSON schema template with exact structure provided. |
| FINDING-009 (no test cases) | **NOT ADDRESSED** | No test directory created. See new FINDING-007. |

---

## Critical Gap
**[FINDING-001]** -- Confidence field missing from output schema. The prompt contains detailed confidence calibration guidance (target distributions, definitions for HIGH/MEDIUM/LOW) but the JSON output template does not include a confidence field. This means the model cannot express its confidence, the downstream LensScore.confidence field cannot be populated, and the calibration guidance is dead-letter text. This is the single most impactful gap because confidence signals are needed for downstream decision-making about which scores to trust and which opportunities need human review. Fix is MECHANICAL: add `"confidence"` and `"confidence_reason"` to the JSON schema.

---

## Human Input Required
- [ ] **FINDING-002**: Does L4Activity have description/summary fields that should be injected for simulation_viability assessment? Need to verify the type definition.
- [ ] **FINDING-004**: Should value_density and simulation_viability have stated priority, or are they intentionally independent?
- [ ] **FINDING-005**: Should simulation_viability rubric account for data source maturity? Should value_density thresholds adjust for industry margin structure?

---

## New Failure Patterns
**FP-P004 (Dead-Letter Instruction)**: Prompt contains detailed guidance for a behavior (confidence calibration) but the output schema does not include a field for the model to express that behavior. Signal: instruction text references a concept not present in the output format. Fix: ensure every behavioral instruction has a corresponding output field or explicit note that the behavior is internal-only.
