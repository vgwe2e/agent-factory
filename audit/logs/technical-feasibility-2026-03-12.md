# Prompt Audit Report: technical-feasibility
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 19 / 40

---

## Prompt Classification
**Type**: system_prompt + user_prompt_template (function returns ChatMessage[])
**File**: `src/scoring/prompts/technical.ts`
**Function**: `buildTechnicalPrompt`
**Dynamic Inputs**: `opp: L3Opportunity`, `l4s: L4Activity[]`, `knowledgeContext: string`, `archetypeHint: LeadArchetype | null`
**Static Content Injected**: `ARCHETYPE_EMPHASIS` record (per-archetype weighting instructions), `DEFAULT_EMPHASIS` (fallback), knowledge context assembled from `platform-capabilities.json`, `use-case-mappings.json`, `capability-keywords.json`, UI component summaries, PB node summaries

---

## Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 6 | 10 | -- |
| Layer 2: Context Engineering | 6 | 8 | -- |
| Layer 3: Intent Engineering | 4 | 10 | -- |
| Layer 4: Specification | 3 | 12 | -- |
| **COMPOSITE** | **19** | **40** | **--** |

---

## Layer 1 -- Prompt Craft (6 / 10)

### 2.1 Instruction Clarity: 2 / 2
Each scoring dimension has an explicit 0-3 rubric with distinct criteria per level. Example: `"- 2 = Moderate fit; maps to specific capabilities with identified components (e.g., forecasting -> Cortex Auto Forecast, exception management -> CWB Lifecycle)"`. Instructions are unambiguous -- each score level has a single interpretation.

### 2.2 Examples and Counter-Examples: 1 / 2
The rubric includes inline examples for aera_platform_fit scores 2 and 3: `"(e.g., forecasting -> Cortex Auto Forecast, exception management -> CWB Lifecycle)"` and `"(e.g., demand forecasting -> Cortex Auto Forecast + STREAMS + Subject Areas)"`. These are positive examples only. No counter-examples or edge cases are provided (e.g., what an opportunity that looks like a 2 but should be a 1 looks like). No worked input-to-output examples showing a complete JSON response for a sample opportunity.

### 2.3 Output Format Specification: 1 / 2
The prompt says: `"Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension: data_readiness, aera_platform_fit, archetype_confidence."` Field names are listed but no JSON schema with types, required/optional markers, or structural template is provided. The model must infer the nesting structure (flat object? nested objects?).

### 2.4 Guardrails: 1 / 2
The archetype handling has a conditional guardrail: if `archetypeHint` is null, `DEFAULT_EMPHASIS` fires: `"The archetype is unknown. Evaluate all three dimensions equally without bias toward any particular pattern."` However, there is no explicit fallback for missing/unexpected inputs in the user message -- e.g., what to do when `opportunity_summary` is "N/A" or when L4 activities list is empty (0 activities).

### 2.5 Negative Constraints: 1 / 2
The prompt has some implicit negative framing: `"No matching capabilities or components"` (score 0 definition) and `"Archetype unclear or mismatched"` (score 0 definition). However, these are rubric definitions, not explicit must-not constraints. There are no statements like "Do not assign score 3 unless X" or "Do not infer data sources not mentioned in the L4 activities." The model could hallucinate platform fit based on opportunity name alone rather than L4 evidence.

---

## Layer 2 -- Context Engineering (6 / 8)

### 3.1 Context Window Composition: 2 / 2
The full model input is reconstructable: system message (rubric + archetype emphasis + knowledge context) and user message (opportunity name, summary, archetype, L4 count, L4 activity details). The `scoring-pipeline.ts` line 65 shows exactly how knowledgeStr is assembled: `"${capabilitiesSection}UI Components:\n${knowledgeContext.components}\n\nProcess Builder Nodes:\n${knowledgeContext.processBuilder}"`. All dynamic inputs are traceable through the function signature and upstream pipeline.

### 3.2 Context-to-Prompt Ratio: 2 / 2
Domain knowledge (platform capabilities, use-case mappings, capability keywords, UI components, PB nodes) lives entirely in injected context via the `knowledgeContext` parameter, built from JSON data files. The prompt itself is a thin instruction layer with rubric definitions. Good separation.

### 3.3 Context Quality: 1 / 2
The knowledge context is relevant and well-structured with pillar organization, capability descriptions, and use-case mappings. However, one quality issue: the L4 compact format (>8 activities) drops descriptions entirely, leaving only metadata fields: `"${l4.name} | financial_rating=${l4.financial_rating} | decision_exists=${l4.decision_exists} | ai_suitability=${l4.ai_suitability ?? 'N/A'} | rating_confidence=${l4.rating_confidence}"`. For data_readiness scoring, the L4 description is the primary signal for "structured data signals" -- dropping it for large opportunity sets (which are common) degrades scoring signal quality.

### 3.4 Context Gaps: 1 / 2
One material gap: the prompt asks the model to evaluate "data readiness" but provides no actual data catalog, schema information, or integration metadata about what data the customer already has connected. A domain expert doing technical feasibility would know the customer's existing data landscape. The model must infer data readiness purely from L4 activity names and descriptions, which is a proxy at best.

---

## Layer 3 -- Intent Engineering (4 / 10)

### 4.1 Objective Hierarchy: 1 / 2
The primary objective is stated: `"evaluate an opportunity for implementation on the Aera Decision Intelligence platform"`. The archetype emphasis introduces secondary weighting objectives (e.g., `"Weight 'aera_platform_fit' toward Process Builder capabilities"` for DETERMINISTIC), but the priority between accuracy of individual scores vs. overall discrimination between opportunities is not stated. Should the model optimize for precision per-opportunity or for rank-ordering across the batch?

### 4.2 The Klarna Test: 0 / 2
If the model ruthlessly optimizes for matching opportunity descriptions to platform capabilities (the stated objective), it would over-score aera_platform_fit by pattern-matching keywords from the capability keywords list against L4 names -- producing high scores for any opportunity that happens to use common supply chain terminology. The keyword list includes generic terms like "data", "quality", "process", "optimization" which appear in virtually every supply chain opportunity. This is the inverse of FP-P001 (collapsed to 0) -- with the enriched knowledge, the risk shifts to ceiling clustering. No quality floor or discrimination constraint prevents this.

### 4.3 Decision Boundaries: 0 / 2
No decision boundaries are defined. The model decides everything autonomously -- all three scores and all three reasons. There is no instruction for when to flag uncertainty, when to escalate ambiguous cases, or what confidence level the model should express. The `confidence` field exists in `LensScore` type but is not requested in the prompt output format.

### 4.4 Values Alignment: 1 / 2
Product value "Scoring accuracy -- scores must discriminate between opportunities with meaningful variance" is partially supported by the 4-level rubric, but the rubric levels for data_readiness use vague qualifiers ("Sparse", "Moderate", "Rich") without quantitative thresholds (e.g., what fraction of L4s must reference data?). Product value "Evidence-grounded -- every score must be justified by data signals present in the input" is supported by the `reason` field requirement but not enforced -- no instruction says "cite specific L4 activities in your reason." Product value "Conservative realism -- prefer under-scoring to over-scoring" is not encoded anywhere in the prompt.

### 4.5 Senior Employee Test: 2 / 2
The prompt encodes non-obvious expert knowledge: archetype-specific weighting (`ARCHETYPE_EMPHASIS`), platform capability pillar taxonomy, use-case-to-component mappings with skill type classifications, and capability keyword signals for AI/ML vs. rule-based vs. hybrid classification. The enriched knowledge context (platform-capabilities.json, use-case-mappings.json) reflects Aera-specific domain expertise that a supply chain technology consultant would bring.

---

## Layer 4 -- Specification Completeness (3 / 12)

### 5.1 Self-Contained Problem Statement: 1 / 2
The system message opens with `"You are an Aera platform technical feasibility assessor. Your task is to evaluate an opportunity for implementation on the Aera Decision Intelligence platform."` This tells a familiar reader what to do, but an outsider would not understand what an "opportunity" is (it's an L3 in Aera's hierarchy), why this scoring matters (feeds into composite score for simulation promotion), or what downstream decisions depend on these scores.

### 5.2 Acceptance Criteria: 0 / 2
No verifiable acceptance criteria. There is no statement of what "correct" scoring looks like -- no baseline distribution expectations, no calibration anchors (e.g., "a pure data integration opportunity with no AI component should score data_readiness >= 2 but archetype_confidence <= 1"), no regression tests referenced.

### 5.3 Constraint Architecture: 1 / 2
**Musts**: Scores must be integers 0-3 with reasons (implicit from format instruction). **Must-nots**: Absent -- no prohibited behaviors stated. **Preferences**: Archetype emphasis provides some preference logic. **Escalation triggers**: Absent -- no condition triggers human review or flags uncertainty. Two of four types present.

### 5.4 Decomposition: 1 / 2
The task is multi-dimensional (three sub-scores), and each has its own rubric (informal decomposition by section in the system message). However, there are no explicit boundaries between sub-tasks -- no instruction on evaluation order, no statement that each dimension should be evaluated independently, no explicit input-output per sub-task.

### 5.5 Evaluation Design: 0 / 2
No test cases exist in `audit/tests/technical-feasibility/`. No known-good input-output pairs for verification.

### 5.6 Version and Ownership: 0 / 2
The prompt file contains no version identifier, no owner, and no last-modified date. The only metadata is the JSDoc comment: `"Technical Feasibility lens prompt builder."`.

---

## Findings

### [FINDING-001] [4.2] [Severity: HIGH] [DOMAIN]
**Evidence**: Capability keywords include generic terms: `"AI/ML signals: forecast, demand, prediction, time-series, sales"`, `"Rule-Based signals: ETL, data, transformation, ingestion, pipeline"`. The word "data" alone appears in virtually every supply chain L4 activity.
**Gap**: Klarna Test failure (Section 4.2). Ruthless keyword matching against the enriched knowledge context risks ceiling clustering on aera_platform_fit -- the inverse of FP-P001. No discrimination constraint or quality floor prevents inflated scores.
**Fix**: Add explicit negative constraint: "Do not assign aera_platform_fit >= 2 based solely on keyword overlap. A score of 2 requires mapping to a SPECIFIC named capability AND component. A score of 3 requires identifying a concrete implementation pattern with primary + supporting components from the Use Case Mappings." Consider adding: "When in doubt between two adjacent scores, choose the lower score."

### [FINDING-002] [4.4] [Severity: HIGH] [DOMAIN]
**Evidence**: Product value states "Conservative realism -- prefer under-scoring to over-scoring." The prompt contains no instruction encoding this preference.
**Gap**: Values Alignment (Section 4.4). The conservative-realism product value is not reflected in the prompt, which creates risk of over-scoring, especially with the enriched knowledge context providing more matching surface area.
**Fix**: Add to system message: "When uncertain between two score levels, always choose the lower score. It is better to under-estimate feasibility than to over-promise."

### [FINDING-003] [2.3] [Severity: HIGH] [MECHANICAL]
**Evidence**: `"Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension: data_readiness, aera_platform_fit, archetype_confidence."`
**Gap**: Output format (Section 2.3, FP-003). Field names are listed but no JSON schema template is provided. Model must guess nesting structure. Risk of inconsistent output format across calls.
**Fix**: Replace the return instruction with an explicit schema:
```
Return ONLY valid JSON matching this exact schema:
{
  "data_readiness": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "aera_platform_fit": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "archetype_confidence": { "score": <0-3>, "reason": "<1-2 sentences>" }
}
```

### [FINDING-004] [4.3] [Severity: HIGH] [DOMAIN]
**Evidence**: No decision boundary language exists anywhere in the prompt. The model autonomously assigns all scores with no escalation path.
**Gap**: Decision Boundaries (Section 4.3). No condition triggers escalation or flags low-confidence scoring. The `confidence` field exists in the downstream `LensScore` type but is never requested by the prompt.
**Fix**: Add to system message: "If you cannot determine a score with reasonable confidence (e.g., opportunity description is too vague, L4 activities are generic), set the score to 0 and state 'INSUFFICIENT_SIGNAL' in the reason. Do not guess."

### [FINDING-005] [2.2] [Severity: MEDIUM] [DOMAIN]
**Evidence**: Inline examples exist only for aera_platform_fit scores 2 and 3: `"(e.g., forecasting -> Cortex Auto Forecast, exception management -> CWB Lifecycle)"`. No counter-examples. No worked end-to-end example showing input opportunity mapped to output JSON.
**Gap**: Examples and Counter-Examples (Section 2.2). Without a worked example, the model has no calibration anchor for what a "correct" response looks like. Without counter-examples, boundary cases between score levels are ambiguous.
**Fix**: Add one worked positive example (a real or realistic opportunity with expected scores and reasons) and one counter-example (an opportunity that looks like a 2 on platform_fit but should be scored 1, with explanation of why).

### [FINDING-006] [3.3] [Severity: MEDIUM] [MECHANICAL]
**Evidence**: `l4Summary = l4s.map((l4) => \`- ${l4.name} | financial_rating=${l4.financial_rating} | decision_exists=${l4.decision_exists} | ai_suitability=${l4.ai_suitability ?? "N/A"} | rating_confidence=${l4.rating_confidence}\`)`
**Gap**: Context Quality (Section 3.3). For opportunities with >8 L4 activities, descriptions are dropped. L4 descriptions are the primary evidence for data_readiness scoring ("structured data signals", "measurable inputs or data references"). Dropping them for large L4 sets degrades exactly the signal the rubric requires.
**Fix**: For compact format, include a truncated description (first 80 chars) rather than dropping it entirely: `"- ${l4.name}: ${l4.description.slice(0, 80)}... | ai_suitability=${l4.ai_suitability ?? 'N/A'} | decision_exists=${l4.decision_exists}"`

### [FINDING-007] [5.2] [Severity: MEDIUM] [DOMAIN]
**Evidence**: No acceptance criteria anywhere in the prompt or test directory.
**Gap**: Acceptance Criteria (Section 5.2). Without calibration anchors, there is no way to verify scoring correctness or detect drift. This contributed to FP-P001 going undetected until full batch evaluation.
**Fix**: Create `audit/tests/technical-feasibility/` with at least 3 test cases: (1) a high-fit DETERMINISTIC opportunity with clear PB mapping, (2) a low-fit opportunity with no platform alignment, (3) an ambiguous AGENTIC opportunity at the 1-2 boundary. Each should specify expected scores and reasons.

### [FINDING-008] [2.4] [Severity: MEDIUM] [MECHANICAL]
**Evidence**: User message includes `"Summary: ${opp.opportunity_summary ?? "N/A"}"` and `"L4 Activity Count: ${l4s.length}"` but no guardrail for edge cases.
**Gap**: Guardrails (Section 2.4). No instruction for handling degenerate inputs: empty L4 list (l4s.length === 0), all L4s with ai_suitability "N/A", or opportunity_summary being "N/A".
**Fix**: Add to system message: "If the opportunity has zero L4 activities, score all dimensions 0 with reason 'No L4 activities to evaluate.' If opportunity_summary is missing, rely solely on L4 activity signals for scoring."

### [FINDING-009] [5.6] [Severity: LOW] [MECHANICAL]
**Evidence**: File header is `"Technical Feasibility lens prompt builder."` with no version, owner, or date.
**Gap**: Version and Ownership (Section 5.6). No metadata for tracking prompt evolution.
**Fix**: Add to file header:
```
 * @version 2.0
 * @owner scoring-team
 * @last-modified 2026-03-12
```

### [FINDING-010] [5.1] [Severity: LOW] [MECHANICAL]
**Evidence**: `"You are an Aera platform technical feasibility assessor."`
**Gap**: Self-Contained Problem Statement (Section 5.1). No context on what an "opportunity" is, what downstream decisions depend on these scores (composite score, simulation promotion at >= 0.60 threshold), or what the scoring weights are (technical = 0.30 of composite).
**Fix**: Add 1-2 sentences to system message opening: "An opportunity is a business process improvement candidate identified from enterprise hierarchy analysis. Your scores feed into a composite feasibility score (technical weight: 30%) that determines whether the opportunity advances to simulation."

---

## Critical Gap
**[FINDING-001]** -- The enriched knowledge context, while fixing FP-P001 (collapsed platform_fit), introduces the inverse risk: keyword-level matches against generic supply chain terms could inflate aera_platform_fit scores across the board. Without an explicit discrimination constraint ("Do not assign >= 2 based on keyword overlap alone; require specific component mapping"), the prompt is vulnerable to ceiling clustering (FP-P002 pattern). Adding this constraint combined with the conservative-realism value encoding (FINDING-002) would have the highest real-world impact on score quality.

---

## Human Input Required
- [ ] [FINDING-001]: The discrimination threshold for aera_platform_fit score 2 vs. 1 needs domain validation. Proposed fix requires "SPECIFIC named capability AND component" for score 2 -- is this the right bar, or should it be lower given early-stage feasibility assessment?
- [ ] [FINDING-005]: A worked example requires selecting a representative opportunity from the Ford hierarchy export. Which opportunity would best serve as a calibration anchor?
- [ ] [FINDING-007]: Test case design requires defining expected scores for specific opportunities. This encodes business judgment about what "correct" scoring looks like.

---

## New Failure Patterns
**FP-P003 (Keyword Inflation)**: Enriched knowledge context with broad keyword lists (including generic domain terms like "data", "quality", "process") enables keyword-level matching that inflates scores. Signal: >60% of opportunities score >= 2 on a sub-dimension after knowledge enrichment. Fix: Add explicit discrimination constraints requiring component-level (not keyword-level) evidence for scores >= 2.
