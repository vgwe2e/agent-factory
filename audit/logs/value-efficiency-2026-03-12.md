# Prompt Audit Report: value-efficiency
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 16 / 40

---

## Prompt Classification
**Type**: system_prompt + user_prompt_template (function builds both)
**File**: `src/scoring/prompts/value.ts`
**Function**: `buildValuePrompt`
**Dynamic Inputs**: `opp: L3Opportunity`, `l4s: L4Activity[]`, `company: CompanyContext`, `archetypeHint: LeadArchetype | null`
**Static Content Injected**: None (rubric is hardcoded in prompt string; no external context files injected)

---

## Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 5 | 10 | -- |
| Layer 2: Context Engineering | 4 | 8 | -- |
| Layer 3: Intent Engineering | 4 | 10 | -- |
| Layer 4: Specification | 3 | 12 | -- |
| **COMPOSITE** | **16** | **40** | **--** |

---

## Layer 1 -- Prompt Craft (5 / 10)

### 2.1 Instruction Clarity: 2 / 2
The rubric for each sub-dimension is unambiguous with numeric thresholds. For value_density: `"0 = No quantifiable value; combined_max_value is null or negligible relative to company revenue"`, `"1 = Low value density; combined_max_value <0.1% of annual revenue"`, etc. Each score level has exactly one interpretation. simulation_viability levels are similarly clear. Score: 2.

### 2.2 Examples and Counter-Examples: 0 / 2
No worked examples of any kind. No positive example showing a scored opportunity with expected JSON output. No counter-example showing a tricky case (e.g., high combined_max_value but vague value_metrics, or null combined_max_value with strong qualitative signals). The rubric defines thresholds but never demonstrates application. Score: 0.

### 2.3 Output Format Specification: 1 / 2
The prompt says: `"Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension: value_density, simulation_viability."` This names the two top-level keys and their sub-fields (score, reason) but does not provide an explicit JSON schema with types, required/optional markers, or an example structure. The model must infer nesting. Score: 1.

### 2.4 Guardrails: 1 / 2
The rubric defines behavior for null combined_max_value: `"combined_max_value is null or negligible"` maps to score 0 for value_density. The code also handles null by rendering `"N/A"`. However, there is no explicit fallback for unexpected inputs beyond null (e.g., negative combined_max_value, missing L4 activities, missing company financials beyond what the code handles). No "if you cannot determine X, do Y" pattern. Score: 1.

### 2.5 Negative Constraints: 0 / 2
No must-not or do-not constraints. Nothing prohibiting common failure modes such as: inflating scores based on opportunity name alone, double-counting value across L4s, or scoring simulation_viability based solely on value_density. Score: 0.

---

## Layer 2 -- Context Engineering (4 / 8)

### 3.1 Context Window Composition: 1 / 2
The function signature reveals all dynamic inputs: L3 opportunity fields, L4 activities array, company financials, archetype hint. However, `archetypeHint` is accepted as a parameter but **never used** in the prompt construction -- it is silently dropped. Additionally, the L3 opportunity has fields beyond those rendered (e.g., `opportunity_summary` is included but other L3 fields like `ai_suitability`, `confidence_level` are not shown). An auditor cannot fully determine what the model does NOT see without reading the L3Opportunity type definition. Score: 1.

### 3.2 Context-to-Prompt Ratio: 1 / 2
The rubric thresholds (0.1%, 1% of revenue) are hardcoded in the prompt string rather than being injected from a configuration. The revenue percentage IS computed dynamically and injected, which is good. But the scoring rubric itself is a static string, and the thresholds are not parameterized. Domain knowledge about what constitutes "high" vs "low" value density is baked in. Score: 1.

### 3.3 Context Quality: 1 / 2
The injected L4 data includes `value_metric`, `financial_rating`, and `impact_order` -- relevant signals. However, `value_metric` is a free-text field from the hierarchy export that may contain vague descriptions (e.g., "Cost savings"), and the prompt gives the model no guidance on how to interpret varying quality of this field. The pre-computed `revenuePercentage` is high-signal and accessible. Score: 1.

### 3.4 Context Gaps: 1 / 2
One material gap: the `archetypeHint` parameter is accepted but never injected into the prompt. An expert would want to know whether an opportunity is AGENTIC vs DETERMINISTIC when assessing simulation_viability -- agentic opportunities may have more complex decision flows. Additionally, `opp.combined_max_value` is presented without explaining to the model that this value is intentionally capped at COGS and de-duplicated, which is critical context for correct interpretation. Score: 1.

---

## Layer 3 -- Intent Engineering (4 / 10)

### 4.1 Objective Hierarchy: 1 / 2
The primary objective is stated: `"evaluate the potential business value and simulation viability of an opportunity"`. However, there are two sub-dimensions (value_density, simulation_viability) with no stated priority between them. It is unclear whether the model should weight them equally or whether one is more important. Score: 1.

### 4.2 The Klarna Test: 1 / 2
If the model optimized ruthlessly for the stated rubric, it would mechanically compare `combined_max_value / annual_revenue` to the 0.1% and 1% thresholds for value_density. This would produce correct behavior for that dimension. However, for simulation_viability, ruthless optimization for "clear decision flows with measurable inputs and outputs" would score nearly everything at 2-3 since most supply chain opportunities have some decision flows. The evaluation data confirms this: simulation_viability has 244/322 at score 2 and 71/322 at score 3 (98% at 2 or 3). This ceiling clustering suggests the rubric lacks discriminating power. Score: 1.

### 4.3 Decision Boundaries: 0 / 2
No decision boundaries defined. The prompt does not specify when the model should flag uncertainty, request additional context, or indicate low confidence. Every input gets scored regardless of data quality. The downstream `LensScore` type has a `confidence` field, but the prompt never instructs the model to produce or consider confidence. Score: 0.

### 4.4 Values Alignment: 1 / 2
Config values: "Scoring accuracy", "Evidence-grounded", "Conservative realism". The rubric structure supports evidence-grounded scoring (reasons required). Conservative realism is partially supported -- the rubric thresholds treat capped values appropriately and the low weight (25%) is intentional. However, "scoring accuracy -- scores must discriminate between opportunities with meaningful variance" is undermined by the evaluation data showing value_density clusters heavily at 1 (190/322 = 59%) and simulation_viability at 2 (244/322 = 76%). The prompt does not encode mechanisms to ensure discrimination. Score: 1.

### 4.5 Senior Employee Test: 1 / 2
A supply chain expert would know: (1) that `combined_max_value` being COGS-capped means the revenue-percentage thresholds may systematically undervalue opportunities in low-margin industries -- the prompt does not account for industry-specific margin structures; (2) that simulation viability depends heavily on data maturity and system integration, not just "decision flows" -- an expert would distinguish between opportunities with clean ERP data feeds vs. those requiring manual data collection; (3) that archetype (AGENTIC vs DETERMINISTIC) strongly correlates with simulation complexity. The prompt encodes basic financial ratio logic but misses these expert heuristics. Score: 1.

---

## Layer 4 -- Specification Completeness (3 / 12)

### 5.1 Self-Contained Problem Statement: 1 / 2
The system message says `"Your task is to evaluate the potential business value and simulation viability of an opportunity"` -- an Aera-familiar reader understands this, but an outsider would not know what an "Aera platform" is, why these two dimensions matter, or what downstream decisions depend on these scores. Score: 1.

### 5.2 Acceptance Criteria: 0 / 2
No verifiable acceptance criteria. There is no statement of what "correct" scoring looks like. No assertion such as "a score of 3 on value_density should apply to fewer than 20% of opportunities" or "the mean value_total should be between X and Y." Correctness can only be judged by manual inspection. Score: 0.

### 5.3 Constraint Architecture: 1 / 2
Present: **Musts** (score 0-3 integer, provide reason), **Preferences** (implicit: use revenue percentage for value_density). Missing: **Must-nots** (no prohibited behaviors), **Escalation triggers** (no low-confidence flagging). Two of four types present. Score: 1.

### 5.4 Decomposition: 1 / 2
The task has two sub-dimensions that are scored independently. They are listed in the rubric, but boundaries between them are informal -- the prompt does not specify that value_density should be scored BEFORE simulation_viability or that they are independent. No explicit input/output/success-condition per sub-task. Score: 1.

### 5.5 Evaluation Design: 0 / 2
No test cases exist in `audit/tests/value-efficiency/`. While real evaluation data exists in `src/evaluation-vllm/evaluation/feasibility-scores.tsv`, there are no known-good test cases with expected outputs that an auditor can verify against. Score: 0.

### 5.6 Version and Ownership: 0 / 2
No version identifier, no owner, no last-modified date in the prompt file. The file has a JSDoc comment describing the function but no metadata. Score: 0.

---

## Findings

### [FINDING-001] [Section 4.2 / 4.4] [Severity: HIGH] [DOMAIN]
**Evidence**: simulation_viability evaluation distribution: 0=0, 1=7, 2=244, 3=71 (98% at 2 or 3 out of 322 opportunities)
**Gap**: The simulation_viability rubric lacks discriminating criteria between scores 1, 2, and 3. This matches project failure pattern FP-P002 ("Ceiling clustering on adoption sub-dimensions") applied to the value lens. The rubric's criteria for score 2 ("some decision flows with measurable inputs but complex dependencies") and score 3 ("clear decision flows with measurable inputs and outputs") are too easy to satisfy for supply chain opportunities, which nearly all have identifiable decision flows.
**Fix**: Add discriminating criteria to simulation_viability. For example: score 3 should require "structured input data available in ERP/MES systems with defined KPIs and <3 external dependencies"; score 2 should require "at least one quantifiable input-output pair but requires cross-system data integration"; score 1 should specify "decision flows identifiable but inputs are qualitative or require manual collection." This is a DOMAIN fix -- the threshold definitions encode business logic.

### [FINDING-002] [Section 3.4] [Severity: HIGH] [MECHANICAL]
**Evidence**: Function signature: `archetypeHint: LeadArchetype | null` -- parameter accepted but never referenced in systemMessage or userMessage construction.
**Gap**: The archetype (AGENTIC vs DETERMINISTIC) is passed to the function but silently dropped. This is a context gap: the model never sees the archetype, which is relevant to simulation_viability (agentic opportunities have more complex decision structures).
**Fix**: Add to the user message: `Archetype: ${archetypeHint ?? "Unknown"}`. Note: the scoring interpretation of archetype is DOMAIN, but injecting an already-available field is MECHANICAL.

### [FINDING-003] [Section 2.2] [Severity: HIGH] [DOMAIN]
**Evidence**: No examples exist in the prompt.
**Gap**: Section 2.2 requires >=2 positive examples and >=1 counter-example for full score. Zero examples means the model relies entirely on rubric text, which (per FINDING-001) is insufficient for discrimination.
**Fix**: Add at least 2 worked examples showing scored opportunities with reasoning. Include one counter-example showing a case where high combined_max_value does NOT warrant a high value_density score (e.g., value is concentrated in a single L4 with vague metrics). This is DOMAIN because example selection encodes business judgment.

### [FINDING-004] [Section 2.5] [Severity: MEDIUM] [DOMAIN]
**Evidence**: No negative constraints in prompt.
**Gap**: Common LLM failure modes for this task include: (1) scoring value_density based on opportunity name impressiveness rather than actual financial data; (2) treating all supply chain activities as inherently simulatable (contributing to FINDING-001); (3) ignoring that combined_max_value is capped and de-duplicated. No do-not constraints address these.
**Fix**: Add: "Do NOT infer value from opportunity names alone -- use only the provided financial metrics. Do NOT assume all supply chain activities are simulatable -- require specific evidence of measurable inputs and outputs in the L4 data."

### [FINDING-005] [Section 3.4] [Severity: MEDIUM] [DOMAIN]
**Evidence**: User message shows `Combined Max Value: ${combinedValueStr} (${revenuePercentage} of annual revenue)` but provides no context about the cap methodology.
**Gap**: The model does not know that combined_max_value is intentionally capped at COGS with double-counting removed. Without this context, the model may interpret consistently low revenue percentages as indicating low-value opportunities rather than conservative estimation. This is a product value ("conservative realism") that the prompt should encode.
**Fix**: Add to system message: "Note: combined_max_value is intentionally conservative -- it is capped at COGS and de-duplicated across L4 activities. Low percentages of revenue are expected and should not automatically map to low scores. Evaluate value density relative to the opportunity's scope and specificity, not just the absolute dollar figure."

### [FINDING-006] [Section 5.6] [Severity: MEDIUM] [MECHANICAL]
**Evidence**: File contains only a JSDoc comment with no version, owner, or date.
**Gap**: Section 5.6 requires version identifier, owner, and last-modified date in the prompt file.
**Fix**: Add to the JSDoc header: `@version 1.0.0`, `@owner Aera Engine Team`, `@modified 2026-03-12`.

### [FINDING-007] [Section 4.3] [Severity: MEDIUM] [DOMAIN]
**Evidence**: No decision boundary or escalation logic in prompt.
**Gap**: The downstream `LensScore` type includes a `confidence: ConfidenceLevel` field (HIGH/MEDIUM/LOW), but the prompt never instructs the model to assess or output confidence. The model also has no instruction for when data is insufficient to score (e.g., null combined_max_value AND no L4 value_metrics).
**Fix**: Add to system message: "If combined_max_value is null AND fewer than 2 L4 activities have non-empty value_metrics, flag confidence as LOW and explain what data is missing." Also add a `confidence` field to the expected JSON output.

### [FINDING-008] [Section 2.3] [Severity: LOW] [MECHANICAL]
**Evidence**: `"Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension: value_density, simulation_viability."`
**Gap**: Output format is described in prose but not as a formal JSON schema. Field types and nesting are implied, not specified. Matches universal failure pattern FP-003 (Unnamed Output).
**Fix**: Replace the return instruction with:
```
Return ONLY valid JSON matching this schema:
{
  "value_density": { "score": <int 0-3>, "reason": "<string, 1-2 sentences>" },
  "simulation_viability": { "score": <int 0-3>, "reason": "<string, 1-2 sentences>" }
}
```

### [FINDING-009] [Section 5.5] [Severity: LOW] [MECHANICAL]
**Evidence**: No test directory exists at `audit/tests/value-efficiency/`.
**Gap**: Section 5.5 requires test cases with known-good outputs.
**Fix**: Create `audit/tests/value-efficiency/` with at least 3 test cases: (1) high-value opportunity with clear metrics (expected: value_density=2-3, simulation_viability=2-3), (2) null combined_max_value with vague L4s (expected: value_density=0, simulation_viability=0-1), (3) moderate value with complex dependencies (expected: value_density=1-2, simulation_viability=1-2). Include full input JSON and expected output ranges.

---

## Failure Pattern Check

| Pattern | Status | Notes |
|---------|--------|-------|
| FP-001 (Klarna) | Not triggered | Value lens has lowest weight (25%) by design; no uncapped maximization risk |
| FP-002 (Ceiling clustering) | **TRIGGERED** | simulation_viability: 98% at score 2-3. See FINDING-001. |
| FP-003 (Unnamed Output) | **TRIGGERED** | JSON fields described in prose, not schema. See FINDING-008. |
| FP-004 (Vague Estimate) | Not triggered | Revenue percentage is computed precisely |
| FP-P001 (Collapsed platform_fit) | Not triggered | No knowledge context injection in this lens |
| FP-P002 (Ceiling clustering) | **TRIGGERED** | Applies to simulation_viability. See FINDING-001. |

---

## Critical Gap
**[FINDING-001]** -- simulation_viability ceiling clustering. 98% of 322 opportunities score 2 or 3, meaning this sub-dimension provides almost zero discriminating signal. Fixing the rubric thresholds to require specific evidence of data availability and system integration would be the single highest-impact improvement to real-world output quality. This is compounded by the lack of worked examples (FINDING-003) that could demonstrate what "score 1" actually looks like for simulation viability.

---

## Human Input Required
- [ ] **FINDING-001**: What specific criteria should distinguish simulation_viability score 1 from 2 from 3? Current thresholds produce near-uniform scores. Need domain input on what makes an opportunity genuinely hard vs easy to simulate on the Aera platform.
- [ ] **FINDING-005**: Should the prompt explicitly mention the COGS cap and de-duplication methodology? This encodes a product design decision about how much the model should "know" about upstream data processing.
- [ ] **FINDING-003**: Which real opportunities should be used as worked examples? Example selection directly encodes scoring expectations.

---

## New Failure Patterns
**FP-P003 (Dropped Parameter)**: A function accepts a parameter that is never used in prompt construction, creating a silent context gap. Signal: function parameter not referenced in any template string. Fix: audit all prompt builder functions for unused parameters.
