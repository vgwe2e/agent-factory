# Prompt Audit Report: technical-feasibility
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 31 / 40
**Prior Score**: 19 / 40
**Delta**: +12

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
| Layer 1: Prompt Craft | 10 | 10 | +4 |
| Layer 2: Context Engineering | 6 | 8 | 0 |
| Layer 3: Intent Engineering | 8 | 10 | +4 |
| Layer 4: Specification | 7 | 12 | +4 |
| **COMPOSITE** | **31** | **40** | **+12** |

---

## Layer 1 -- Prompt Craft (10 / 10)

### 2.1 Instruction Clarity: 2 / 2
**Prior: 2 / 2 -- No change.**
Each scoring dimension has an explicit 0-3 rubric with distinct criteria per level. The v2 rubric for `aera_platform_fit` is even sharper: `"- 2 = Moderate fit; maps to at least 2 specific Aera capabilities or components by name (e.g., forecasting -> Cortex Auto Forecast, exception management -> CWB Lifecycle). You must cite the specific capabilities."` Each score level admits exactly one interpretation.

### 2.2 Examples and Counter-Examples: 2 / 2
**Prior: 1 / 2 -- Delta: +1. Prior FINDING-005 addressed.**
Three worked examples now present spanning the score spectrum:
- Strong fit: `"Example 1 -- Strong fit: 'Warehouse & Inventory Management'... data_readiness: 3... aera_platform_fit: 2... archetype_confidence: 3"`
- Weak fit: `"Example 2 -- Weak fit: 'Technology & Innovation Scouting'... data_readiness: 1... aera_platform_fit: 0"`
- Mid-range: `"Example 3 -- Mid-range: 'Supplier Identification & Pre-Qualification'... aera_platform_fit: 1"`

The weak-fit example serves as a counter-example (looks like it could be supply chain but scores 0 on platform_fit). All three examples include complete scores and reasons across all dimensions.

### 2.3 Output Format Specification: 2 / 2
**Prior: 1 / 2 -- Delta: +1. Prior FINDING-003 addressed.**
JSON schema template now provided with exact structure, field names, types, and constraints: `"Return your assessment as a JSON object with this exact structure: { \"data_readiness\": { \"score\": <0-3>, \"reason\": \"<1-2 sentences>\" }, \"aera_platform_fit\": { \"score\": <0-3>, \"reason\": \"<1-2 sentences citing specific Aera capabilities>\" }, \"archetype_confidence\": { \"score\": <0-3>, \"reason\": \"<1-2 sentences>\" } }"`. All field names, nesting structure, and content expectations are explicit.

### 2.4 Guardrails: 2 / 2
**Prior: 1 / 2 -- Delta: +1. Prior FINDING-008 addressed.**
Explicit guardrails now cover edge cases. The CONSTRAINTS section includes: `"If the opportunity has zero L4 activities, score all dimensions 0 with reason 'No L4 activities to evaluate.'"` The archetype-null case is still handled via `DEFAULT_EMPHASIS`: `"The archetype is unknown. Evaluate all three dimensions equally without bias."` The "if X do Y, if not X do Z" pattern is present in the platform_fit rubric: score >= 2 requires citing specific capabilities, otherwise score lower.

### 2.5 Negative Constraints: 2 / 2
**Prior: 1 / 2 -- Delta: +1.**
The CONSTRAINTS section adds 4 specific must-not rules with named anti-patterns: `"Do NOT score platform_fit >= 2 based on generic keyword overlap alone. Cite specific Aera capabilities."`, `"Do NOT assume all supply chain problems fit Aera. Score 0 for platform_fit if the opportunity requires capabilities outside Aera's scope"`, `"Do NOT give identical scores to all sub-dimensions. If data_readiness is 3, that does not automatically mean platform_fit is also 3."`, `"When uncertain between two score levels, always choose the lower score. It is better to under-estimate feasibility than to over-promise."` Exceeds the threshold of >=2 specific must-not constraints with anti-patterns named.

---

## Layer 2 -- Context Engineering (6 / 8)

### 3.1 Context Window Composition: 2 / 2
**Prior: 2 / 2 -- No change.**
Full model input is reconstructable: system message (rubric + archetype emphasis + knowledge context from `buildKnowledgeContext()`) and user message (opportunity name, summary, archetype, L4 count, L4 activity details). The pipeline code at `scoring-pipeline.ts:62-65` shows exactly how `knowledgeStr` is assembled: `"${capabilitiesSection}UI Components:\n${knowledgeContext.components}\n\nProcess Builder Nodes:\n${knowledgeContext.processBuilder}"`. All dynamic inputs are traceable through the function signature.

### 3.2 Context-to-Prompt Ratio: 2 / 2
**Prior: 2 / 2 -- No change.**
Domain knowledge (platform capabilities with best-for/not-for, use-case mappings, capability keywords, platform boundaries, UI components, PB nodes) lives entirely in injected context via the `knowledgeContext` parameter, built from JSON data files. The prompt itself is a thin instruction layer with rubric definitions and examples. Good separation.

### 3.3 Context Quality: 1 / 2
**Prior: 1 / 2 -- No change. Prior FINDING-006 partially addressed.**
The compact format for >8 L4s now includes truncated descriptions: `"l4.description.length > 80 ? l4.description.slice(0, 80) + '...' : l4.description"` (line 139). This is an improvement over the prior version which dropped descriptions entirely. However, one quality issue remains: 80 characters is quite short for data_readiness scoring where the description is the primary evidence signal. Some information loss still occurs for large opportunity sets.

### 3.4 Context Gaps: 1 / 2
**Prior: 1 / 2 -- No change.**
One material gap persists: the prompt asks the model to evaluate "data readiness" but provides no actual data catalog, schema information, or integration metadata about what data the customer already has connected. A domain expert doing technical feasibility would know the customer's existing data landscape. The model must infer data readiness purely from L4 activity names and descriptions, which is a proxy at best. This gap is inherent to the input data model and may not be fixable at the prompt level.

---

## Layer 3 -- Intent Engineering (8 / 10)

### 4.1 Objective Hierarchy: 2 / 2
**Prior: 1 / 2 -- Delta: +1.**
The primary objective is now explicit with context: `"Your task is to evaluate an opportunity for implementation on the Aera Decision Intelligence platform. An opportunity is a business process improvement candidate identified from enterprise hierarchy analysis. Your scores feed into a composite feasibility score (technical weight: 30%) that determines whether the opportunity advances to simulation."` This establishes clear primary objective (score accurately) and downstream impact (simulation promotion). The archetype emphasis provides ranked secondary guidance per archetype type.

### 4.2 The Klarna Test: 1 / 2
**Prior: 0 / 2 -- Delta: +1. Prior FINDING-001 partially addressed.**
The CONSTRAINTS section directly addresses the keyword inflation risk: `"Do NOT score platform_fit >= 2 based on generic keyword overlap alone. Cite specific Aera capabilities."` and `"Do NOT assume all supply chain problems fit Aera. Score 0 for platform_fit if the opportunity requires capabilities outside Aera's scope."` The conservative-realism value is now encoded: `"When uncertain between two score levels, always choose the lower score."` These constraints reduce the perverse incentive risk significantly. However, one predictable failure mode remains: ruthless optimization for the stated objective ("evaluate for implementation") could still lead the model to search for any possible platform mapping rather than honestly assessing fit. The constraint says "do not score >= 2 based on keyword overlap" but does not define what constitutes sufficient evidence vs. keyword overlap.

### 4.3 Decision Boundaries: 1 / 2
**Prior: 0 / 2 -- Delta: +1. Prior FINDING-004 partially addressed.**
The CONSTRAINTS section now includes: `"If the opportunity has zero L4 activities, score all dimensions 0 with reason 'No L4 activities to evaluate.'"` -- this is an explicit decision boundary. The confidence calibration section defines when the model should rate HIGH/MEDIUM/LOW: `"HIGH: You have clear, specific evidence... No guessing."` / `"LOW: You had to make significant assumptions."` However, the confidence rating is described in the system message but NOT included in the output JSON schema. The model is told about confidence calibration but never asked to output it. No explicit escalation trigger exists for LOW-confidence cases.

### 4.4 Values Alignment: 2 / 2
**Prior: 1 / 2 -- Delta: +1. Prior FINDING-002 addressed.**
All three product values are now encoded:
- "Scoring accuracy -- scores must discriminate": The CONSTRAINTS section states `"Do NOT give identical scores to all sub-dimensions"` and the worked examples demonstrate score variance (Example 1: 3/2/3, Example 2: 1/0/1, Example 3: 2/1/2).
- "Evidence-grounded": The platform_fit rubric requires citing specific capabilities for score >= 2: `"You must cite the specific capabilities"` (score 2) and `"You must cite the pattern"` (score 3).
- "Conservative realism": Explicitly encoded: `"When uncertain between two score levels, always choose the lower score. It is better to under-estimate feasibility than to over-promise."`

### 4.5 Senior Employee Test: 2 / 2
**Prior: 2 / 2 -- No change.**
The prompt encodes non-obvious expert knowledge: archetype-specific weighting via `ARCHETYPE_EMPHASIS`, platform capability pillar taxonomy with best-for/not-for boundaries, use-case-to-component mappings, capability keyword classifications, platform boundaries (`"Aera is NOT a replacement for: MES, WMS, TMS, ERP, CRM"`), and the not-for entries in each capability (e.g., Cortex Auto Forecast is `"not for: real-time predictions, non-time-series problems"`). The worked examples encode domain-specific calibration that a supply chain technology consultant would bring.

---

## Layer 4 -- Specification Completeness (7 / 12)

### 5.1 Self-Contained Problem Statement: 2 / 2
**Prior: 1 / 2 -- Delta: +1. Prior FINDING-010 addressed.**
The system message now opens with full context: `"You are an Aera platform technical feasibility assessor. Your task is to evaluate an opportunity for implementation on the Aera Decision Intelligence platform. An opportunity is a business process improvement candidate identified from enterprise hierarchy analysis. Your scores feed into a composite feasibility score (technical weight: 30%) that determines whether the opportunity advances to simulation."` An outsider can now understand: what an opportunity is, what the scoring does, what the downstream impact is, and what the technical weight means.

### 5.2 Acceptance Criteria: 1 / 2
**Prior: 0 / 2 -- Delta: +1.**
The worked examples implicitly define acceptance criteria -- three calibration anchors showing expected scores for known opportunity types. The confidence calibration section states a target distribution: `"Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse opportunity set."` These are partially verifiable conditions. However, no explicit "this prompt is working correctly when..." statements exist. The acceptance criteria must be inferred from examples and calibration guidance rather than being stated as verifiable conditions.

### 5.3 Constraint Architecture: 2 / 2
**Prior: 1 / 2 -- Delta: +1.**
All four constraint types are now present:
- **Musts**: Scores must be integers 0-3. Platform_fit >= 2 must cite specific capabilities: `"You must cite the specific capabilities"` (score 2), `"You must cite the pattern"` (score 3).
- **Must-nots**: `"Do NOT score platform_fit >= 2 based on generic keyword overlap alone"`, `"Do NOT assume all supply chain problems fit Aera"`, `"Do NOT give identical scores to all sub-dimensions"`.
- **Preferences**: `"When uncertain between two score levels, always choose the lower score."` Archetype emphasis provides preference weighting.
- **Escalation triggers**: `"If the opportunity has zero L4 activities, score all dimensions 0 with reason 'No L4 activities to evaluate.'"` The confidence calibration with `"If you find yourself rating everything HIGH, you are likely not being critical enough"` serves as a self-check trigger.

### 5.4 Decomposition: 1 / 2
**Prior: 1 / 2 -- No change.**
The task is multi-dimensional (three sub-scores), each with its own rubric (informal decomposition by section in the system message). The worked examples show all three dimensions scored independently. However, there are still no explicit boundaries between sub-tasks -- no instruction on evaluation order, no statement that each dimension should be evaluated independently, no explicit input-output per sub-task.

### 5.5 Evaluation Design: 0 / 2
**Prior: 0 / 2 -- No change. Prior FINDING-007 not addressed.**
No test cases exist in `audit/tests/technical-feasibility/`. The worked examples in the prompt could serve as partial test cases but are not formalized as known-good input-output pairs in the test directory. No verification infrastructure exists.

### 5.6 Version and Ownership: 1 / 2
**Prior: 0 / 2 -- Delta: +1. Prior FINDING-009 addressed.**
The file now includes version and date metadata: `"@version 2.0 -- 2026-03-12"` with a changelog noting `"v2.0: Hardened from audit findings."` and `"v1.0: Initial implementation with basic rubrics."` However, no owner (team or individual) is specified. Two of three required metadata fields are present (version, date) but owner is absent.

---

## Prior Findings Status

| Prior Finding | Status | Notes |
|---------------|--------|-------|
| FINDING-001 (Klarna/keyword inflation) | Partially addressed | CONSTRAINTS section added; residual gap in evidence standard definition |
| FINDING-002 (Conservative realism) | Fully addressed | `"always choose the lower score"` constraint added |
| FINDING-003 (JSON schema) | Fully addressed | Explicit JSON template with field structure |
| FINDING-004 (Decision boundaries) | Partially addressed | Zero-L4 boundary added; confidence output gap remains |
| FINDING-005 (Worked examples) | Fully addressed | 3 worked examples spanning score spectrum |
| FINDING-006 (L4 description truncation) | Partially addressed | Descriptions now included but truncated at 80 chars |
| FINDING-007 (Test cases) | Not addressed | No test directory created |
| FINDING-008 (Edge case guardrails) | Fully addressed | Zero-L4 guardrail in CONSTRAINTS |
| FINDING-009 (Version metadata) | Partially addressed | Version + date present, owner missing |
| FINDING-010 (Problem statement) | Fully addressed | Expanded opening with opportunity definition and downstream context |

---

## Findings

### [FINDING-001] [4.3] [Severity: HIGH] [DOMAIN]
**Evidence**: The confidence calibration section describes HIGH/MEDIUM/LOW ratings and target distributions: `"Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW"` but the output JSON schema does not include a confidence field: `"{ \"data_readiness\": { \"score\": <0-3>, \"reason\": \"...\" }, ... }"`. No escalation trigger is defined for LOW-confidence cases.
**Gap**: Decision Boundaries (Section 4.3). The model receives confidence guidance but is never asked to output confidence or act on it. A LOW-confidence score has the same downstream weight as a HIGH-confidence score. No escalation path exists.
**Fix**: Add `"confidence"` field to the output schema: `"confidence": "<HIGH|MEDIUM|LOW>"`. Add escalation instruction: "If confidence is LOW, prepend your reason with '[LOW_CONFIDENCE]' so downstream processing can flag for human review." Alternatively, add confidence as a top-level field in the JSON schema.

### [FINDING-002] [4.2] [Severity: MEDIUM] [DOMAIN]
**Evidence**: CONSTRAINTS state `"Do NOT score platform_fit >= 2 based on generic keyword overlap alone. Cite specific Aera capabilities."` The boundary between "keyword overlap" and "specific capability citation" is not defined.
**Gap**: Klarna Test (Section 4.2). The constraint mitigates keyword inflation but does not define what counts as sufficient evidence for a score of 2. The model could cite a capability name from the knowledge context without demonstrating genuine mapping from L4 activities.
**Fix**: Add explicit evidence standard: "For platform_fit >= 2, your reason must name at least 2 specific Aera capabilities from the knowledge context AND explain HOW the opportunity's L4 activities map to those capabilities. Simply naming a capability is not sufficient."

### [FINDING-003] [5.5] [Severity: MEDIUM] [MECHANICAL]
**Evidence**: No directory exists at `audit/tests/technical-feasibility/`.
**Gap**: Evaluation Design (Section 5.5). No test cases with known-good outputs exist. The worked examples in the prompt (Examples 1-3) could be formalized as test cases but are not in the test infrastructure.
**Fix**: Create `audit/tests/technical-feasibility/` with at least 3 test cases derived from the worked examples. Each test case should include: input opportunity data (name, summary, L4 activities), expected scores per dimension, expected confidence level, and a brief rationale.

### [FINDING-004] [5.6] [Severity: LOW] [MECHANICAL]
**Evidence**: `"@version 2.0 -- 2026-03-12"` and changelog present, but no owner specified.
**Gap**: Version and Ownership (Section 5.6). Owner (team or system) is missing from the prompt file metadata.
**Fix**: Add `@owner scoring-team` (or appropriate owner) to the JSDoc header.

### [FINDING-005] [3.3] [Severity: LOW] [MECHANICAL]
**Evidence**: Compact format truncates descriptions at 80 characters: `"l4.description.length > 80 ? l4.description.slice(0, 80) + '...' : l4.description"` (line 139).
**Gap**: Context Quality (Section 3.3). 80-character truncation may lose key data readiness signals in L4 descriptions for opportunities with >8 activities.
**Fix**: Increase truncation limit to 120 characters: `l4.description.slice(0, 120) + "..."`. This adds roughly 40 chars * 8+ L4s = ~320 tokens of additional context, well within budget.

---

## Critical Gap
**[FINDING-001]** -- The confidence calibration guidance is described in the system message but disconnected from the output schema and downstream processing. Adding the confidence field to the output JSON and defining an escalation path for LOW-confidence scores would close the biggest remaining gap between intent (discriminating scores with known uncertainty) and implementation (all scores treated equally regardless of evidence quality).

---

## Human Input Required
- [ ] [FINDING-001]: Should confidence be a per-dimension field or a single top-level field? Per-dimension is more granular but adds output complexity and requires changes to the `TechnicalLensSchema` Zod validator.
- [ ] [FINDING-002]: What constitutes "sufficient evidence" for platform_fit >= 2 vs. keyword overlap? The proposed fix requires explaining HOW L4s map to capabilities -- is this the right bar for an automated scoring pipeline?

---

## New Failure Patterns
None identified. The prior report's proposed FP-P003 (Keyword Inflation) has been partially mitigated by the CONSTRAINTS section. Monitor evaluation results to confirm whether the mitigation is sufficient before closing.
