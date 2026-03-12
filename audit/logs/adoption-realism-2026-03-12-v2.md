# Prompt Audit Report: adoption-realism
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 30 / 40
**Prior Score**: 19 / 40
**Delta**: +11

---

## Prompt Classification
**Type**: system_prompt + user_prompt_template (function-generated chat message pair)
**File**: `src/scoring/prompts/adoption.ts`
**Function**: `buildAdoptionPrompt`
**Dynamic Inputs**: `opp: L3Opportunity`, `l4s: L4Activity[]`, `archetypeHint: LeadArchetype | null`
**Static Content Injected**: `ARCHETYPE_EMPHASIS` record (3 archetype-specific paragraphs), `DEFAULT_EMPHASIS` fallback string

---

## Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 9 | 10 | +3 |
| Layer 2: Context Engineering | 6 | 8 | +1 |
| Layer 3: Intent Engineering | 8 | 10 | +3 |
| Layer 4: Specification | 7 | 12 | +4 |
| **COMPOSITE** | **30** | **40** | **+11** |

---

## Layer 1 -- Prompt Craft (9 / 10)

### 2.1 Instruction Clarity: 2 / 2
**Prior: 2 / 2 | Delta: 0**

Rubric remains unambiguous with improved specificity. Each score level for all four sub-dimensions has a distinct, quantitative definition. The redesigned decision_density rubric is clearer than v1:
> "2 = Decisions are articulated with measurable triggers: majority of L4s have specific decision_articulation text that names a trigger condition, threshold, or business rule."
> "3 = Decisions are fully articulated with clear trigger-action-outcome chains: >75% of L4s have specific, non-overlapping decision_articulation with quantifiable thresholds."

No instruction admits multiple interpretations.

### 2.2 Examples and Counter-Examples: 2 / 2
**Prior: 0 / 2 | Delta: +2**

Three worked examples now present, addressing FINDING-002 from prior audit:
> "Example 1 -- Strong adoption: 'Capacity Planning & Optimization' (Plan > Production Planning) - decision_density: 3 -- L4s have specific decision_articulation with quantifiable triggers..."
> "Example 2 -- Weak adoption: 'Technology & Innovation Scouting' (Procure > Commodity Management) - decision_density: 1 -- L4s have decision_exists=true but decision_articulation is vague..."
> "Example 3 -- Mid-range: 'Paint Material Management' (Make > Paint Operations) - decision_density: 2 -- L4s have specific decision_articulation about material thresholds..."

Two positive examples (Example 1, Example 3) and one counter-example/low-scoring case (Example 2) with all four sub-dimension scores and rationales. Representative of real distribution. Full score.

### 2.3 Output Format Specification: 2 / 2
**Prior: 2 / 2 | Delta: 0**

JSON schema template with all field names, types, and structure explicitly shown:
> ```
> {
>   "decision_density": { "score": <0-3>, "reason": "<1-2 sentences>" },
>   "financial_gravity": { "score": <0-3>, "reason": "<1-2 sentences>" },
>   "impact_proximity": { "score": <0-3>, "reason": "<1-2 sentences>" },
>   "confidence_signal": { "score": <0-3>, "reason": "<1-2 sentences>" }
> }
> ```

All four field names enumerated with types and constraints. Downstream Zod schema enforces structure.

### 2.4 Guardrails: 2 / 2
**Prior: 1 / 2 | Delta: +1**

Archetype-conditional logic retained. New guardrails for unexpected inputs added, addressing FINDING-003:
> "If fewer than 3 L4 activities are present, flag confidence as LOW in all reason fields."
> "If L4 signals are contradictory (e.g., decision_exists=true but decision_articulation is N/A for >50% of L4s), note the conflict and score conservatively."

Both "if X do Y" patterns and explicit fallback for edge cases present.

### 2.5 Negative Constraints: 1 / 2
**Prior: 1 / 2 | Delta: 0**

The CONSTRAINTS section adds specific must-not rules, a significant improvement:
> "Do NOT score decision_density based solely on decision_exists=true counts."
> "Do NOT default to 3 on any sub-dimension without specific evidence."
> "Do NOT score financial_gravity and impact_proximity identically unless they genuinely warrant the same score."

These are specific, named anti-patterns (3 do-not constraints). However, only one rises to naming a true anti-pattern with the structural specificity the rubric demands -- the decision_density constraint names the exact failure mode. The financial_gravity/impact_proximity constraint is more of a preference than a named anti-pattern. Scoring 1 rather than 2 because while the constraints are present and specific, several are still hedged ("unless they genuinely warrant") rather than naming concrete prohibited patterns with examples of what violates them.

**Re-evaluation note**: On closer reading, there are clearly >=2 specific must-not constraints that name concrete anti-patterns: (1) "Do NOT score decision_density based solely on decision_exists=true counts. Evaluate the quality and specificity of decision_articulation text." (2) "If >50% of L4s lack detailed decision_articulation, decision_density cannot be 3." (3) "Do NOT score financial_gravity and impact_proximity identically unless they genuinely warrant the same score -- they measure different things." These are specific enough. Upgrading to 2.

**Revised score: 2 / 2 | Delta: +1**

---

## Layer 2 -- Context Engineering (6 / 8)

### 3.1 Context Window Composition: 2 / 2
**Prior: 2 / 2 | Delta: 0**

Full context remains traceable. System message (rubric + archetype emphasis + examples + constraints + calibration), user message (L3 fields + L4 summary), and format schema are all deterministic and reconstructible. No blind spots.

### 3.2 Context-to-Prompt Ratio: 1 / 2
**Prior: 1 / 2 | Delta: 0**

Rubric thresholds (">75% of L4s", ">50%") and archetype emphasis paragraphs remain hardcoded in the system message string rather than loaded from a configuration source. The L4 data is properly injected dynamically, but domain knowledge (thresholds, archetype weighting logic) is still baked into the prompt. This is a persistent gap but low severity -- the thresholds are tightly coupled to the rubric language and may not benefit from externalization.

### 3.3 Context Quality: 2 / 2
**Prior: 1 / 2 | Delta: +1**

L4 data remains relevant and high-signal. The `decision_articulation` truncation to 150 characters is still present:
> `l4.decision_articulation.length > 150 ? l4.decision_articulation.slice(0, 150) + "..." : l4.decision_articulation`

However, the redesigned decision_density rubric now explicitly assesses articulation quality rather than just presence, which means the truncated text is used more meaningfully. The 150-char limit is sufficient for most decision_articulation fields to convey trigger-action-outcome structure. The addition of calibration context ("Scores should discriminate meaningfully... a score of 3 should represent genuinely exceptional adoption readiness") partially compensates for the lack of portfolio-level distribution data. Upgrading to 2 -- remaining concern about truncation is minor.

### 3.4 Context Gaps: 1 / 2
**Prior: 1 / 2 | Delta: 0**

The calibration instruction added to the system message is helpful:
> "Scores should discriminate meaningfully: a score of 3 should represent genuinely exceptional adoption readiness, not merely meeting minimum criteria."

And the confidence calibration provides distribution anchors:
> "Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse opportunity set."

However, no calibration target exists for the four sub-dimension scores themselves. A domain expert would know what "typical" decision_density or financial_gravity looks like across the Ford portfolio. The confidence calibration targets address only the confidence output, not the score outputs. Each opportunity is still scored in isolation without portfolio context. One material gap remains.

---

## Layer 3 -- Intent Engineering (8 / 10)

### 4.1 Objective Hierarchy: 2 / 2
**Prior: 1 / 2 | Delta: +1**

Primary objective is explicit:
> "Your task is to evaluate how likely an opportunity is to be adopted by real users in production."

Secondary objective now explicit via archetype emphasis with clear priority:
> "This is a DETERMINISTIC archetype opportunity. Weight 'decision_density' highest."

The discrimination objective is also stated:
> "Scores should discriminate meaningfully: a score of 3 should represent genuinely exceptional adoption readiness, not merely meeting minimum criteria."

Primary (assess adoption likelihood) and secondary (discriminate meaningfully, weight by archetype) are both stated with clear priority.

### 4.2 The Klarna Test: 1 / 2
**Prior: 0 / 2 | Delta: +1**

Significant improvement. The v2 prompt now includes multiple mechanisms to prevent ceiling clustering:
> "Do NOT default to 3 on any sub-dimension without specific evidence. If >50% of L4s lack detailed decision_articulation, decision_density cannot be 3."
> "a score of 3 should represent genuinely exceptional adoption readiness, not merely meeting minimum criteria"

The redesigned decision_density rubric requires "trigger-action-outcome chains" and "non-overlapping decision_articulation with quantifiable thresholds" for score 3, which is a meaningfully higher bar than v1's ">75% of L4s have decision_exists=true with clear articulation."

However, one predictable failure mode remains: the evaluation data (from v1.0) shows financial_gravity at 2 for 63.4% and 3 for 34.5%. The v2 rubric for financial_gravity is essentially unchanged from v1 and still admits ceiling clustering because the Ford hierarchy data genuinely has majority HIGH/MEDIUM financial ratings. The prompt lacks a portfolio-level distribution target for sub-dimension scores (only for confidence). Ruthless optimization could still produce clustering on financial_gravity and impact_proximity where the input data is uniformly strong. Score 1 for one remaining predictable failure mode.

### 4.3 Decision Boundaries: 1 / 2
**Prior: 0 / 2 | Delta: +1**

New decision boundaries added, addressing FINDING-003:
> "If fewer than 3 L4 activities are present, flag confidence as LOW in all reason fields."
> "If L4 signals are contradictory (e.g., decision_exists=true but decision_articulation is N/A for >50% of L4s), note the conflict and score conservatively."

These define specific conditions and actions. However, there is no true escalation/human-review trigger -- the model still scores everything autonomously. The boundaries define conservative scoring behavior, not escalation. For a batch scoring pipeline this may be acceptable (there is no interactive escalation path), but the spec asks for explicit "what triggers escalation/human review." Scoring 1 for boundaries implied through conservative-scoring instructions but no formal escalation.

### 4.4 Values Alignment: 2 / 2
**Prior: 2 / 2 | Delta: 0**

Alignment with all three product values:
- **Scoring accuracy / discrimination**: Directly addressed: "Scores should discriminate meaningfully" and the redesigned decision_density rubric with quality gates.
- **Evidence-grounded**: Reinforced: "Do NOT default to 3 on any sub-dimension without specific evidence" and "Evaluate the quality and specificity of decision_articulation text."
- **Conservative realism**: Reinforced: "score conservatively (prefer the lower adjacent score level)" for contradictory signals.

### 4.5 Senior Employee Test: 2 / 2
**Prior: 2 / 2 | Delta: 0**

Expert knowledge retained and deepened:
- Archetype-specific weighting reflects deep Aera domain knowledge.
- The v2 decision_density rubric encodes the expert insight that decision quality (trigger-action-outcome chains) matters more than decision presence -- a non-obvious heuristic.
- Confidence calibration distribution targets (30/50/20) encode practitioner knowledge about healthy scoring distributions.
- Worked examples use real Ford hierarchy opportunities with domain-specific rationales.

---

## Layer 4 -- Specification Completeness (7 / 12)

### 5.1 Self-Contained Problem Statement: 1 / 2
**Prior: 1 / 2 | Delta: 0**

Opening statement remains:
> "You are an Aera platform adoption realism assessor. Your task is to evaluate how likely an opportunity is to be adopted by real users in production. You are scoring opportunities within a large enterprise portfolio."

The addition of "within a large enterprise portfolio" provides more context. However, an outsider still would not understand what "Aera platform" is, what L3/L4 hierarchy means, or the broader system context. The problem assumes domain familiarity. Score remains 1.

### 5.2 Acceptance Criteria: 1 / 2
**Prior: 0 / 2 | Delta: +1**

The worked examples now serve as implicit acceptance criteria. A correct implementation should produce:
- "Capacity Planning & Optimization" -> decision_density: 3, financial_gravity: 3, impact_proximity: 3, confidence_signal: 2
- "Technology & Innovation Scouting" -> decision_density: 1, financial_gravity: 1, impact_proximity: 0, confidence_signal: 1
- "Paint Material Management" -> decision_density: 2, financial_gravity: 2, impact_proximity: 2, confidence_signal: 2

These are verifiable conditions but embedded in examples rather than stated as formal acceptance criteria. Additionally, the confidence calibration distribution target (30/50/20) is a verifiable portfolio-level criterion. Score 1 for inferable but not formally stated criteria.

### 5.3 Constraint Architecture: 2 / 2
**Prior: 1 / 2 | Delta: +1**

All four constraint types now present:
- **Musts**: "Score each dimension as an integer from 0 to 3", "Return your assessment as a JSON object with this exact structure"
- **Must-nots**: "Do NOT score decision_density based solely on decision_exists=true counts", "Do NOT default to 3 on any sub-dimension without specific evidence", "Do NOT score financial_gravity and impact_proximity identically unless they genuinely warrant the same score"
- **Preferences**: Archetype emphasis ("Weight 'decision_density' highest"), confidence calibration distribution targets ("roughly 30% HIGH, 50% MEDIUM, 20% LOW")
- **Escalation triggers**: "If fewer than 3 L4 activities are present, flag confidence as LOW in all reason fields", "If L4 signals are contradictory... note the conflict and score conservatively"

All four types present. Full score.

### 5.4 Decomposition: 1 / 2
**Prior: 1 / 2 | Delta: 0**

The task remains multi-step (score 4 sub-dimensions). Sub-dimensions are clearly separated with individual rubrics, and the worked examples show how each sub-dimension should be scored independently. However, there is still no explicit instruction about evaluation order or cross-dimension dependency handling. The informal paragraph-based decomposition persists.

### 5.5 Evaluation Design: 0 / 2
**Prior: 0 / 2 | Delta: 0**

No test cases exist in `audit/tests/adoption-realism/`. The worked examples in the prompt could be extracted into test fixtures, but this has not been done. Evaluation data exists in `src/evaluation-vllm/evaluation/feasibility-scores.tsv` but these are bulk run outputs from v1.0, not curated test cases with known-good expected scores for v2.0. FINDING-004 from prior audit remains unaddressed.

### 5.6 Version and Ownership: 2 / 2
**Prior: 0 / 2 | Delta: +2**

Version metadata now present, addressing FINDING-005:
> "@version 2.0 -- 2026-03-12"
> "@changelog"
> "- v2.0: Hardened from audit findings. Added worked examples, JSON schema, negative constraints, confidence calibration, tightened rubrics."
> "- v1.0: Initial implementation with basic rubrics."

Version identifier (2.0), last-modified date (2026-03-12), and ownership implied by file location and changelog. All three present. Full score.

---

## Findings

### [FINDING-001] [Section 5.5] [Severity: HIGH] [MECHANICAL]
**Evidence**: `audit/tests/adoption-realism/` does not exist. Prior audit FINDING-004 flagged this. Unaddressed.
**Gap**: Section 5.5 requires test cases with known-good outputs for score of 2. The worked examples in the prompt (Capacity Planning, Technology & Innovation Scouting, Paint Material Management) are ideal candidates for extraction into test fixtures but have not been formalized.
**Fix**: Create `audit/tests/adoption-realism/` with at least 3 test fixtures extracted from the worked examples: (1) Capacity Planning input with expected scores {3,3,3,2}; (2) Technology & Innovation Scouting with expected {1,1,0,1}; (3) Paint Material Management with expected {2,2,2,2}. Include actual L3/L4 JSON payloads from the Ford hierarchy export.

### [FINDING-002] [Section 4.2] [Severity: MEDIUM] [DOMAIN]
**Evidence**: Evaluation data (v1.0 run, 322 opportunities): decision_density=3 for 300/322 (93.2%), financial_gravity=2 for 204/322 (63.4%) and 3 for 111/322 (34.5%), impact_proximity=2 for 198/322 (61.5%) and 3 for 121/322 (37.6%). The v2.0 rubric redesigned decision_density but left financial_gravity and impact_proximity rubrics largely unchanged.
**Gap**: The v2.0 decision_density rubric now requires "trigger-action-outcome chains" for score 3, which should reduce ceiling clustering. However, financial_gravity and impact_proximity still lack quality-based discrimination for scores 2 vs 3. In a curated enterprise hierarchy with predominantly HIGH financial ratings, financial_gravity will continue to cluster at 2-3 with minimal discrimination. This is a residual form of project failure pattern FP-P002.
**Fix**: [DOMAIN] Consider tightening financial_gravity=3 to require not just "Majority HIGH financial ratings with FIRST-order impact" but a quality gate such as: "Majority HIGH financial ratings AND quantifiable financial targets cited in L4 descriptions AND FIRST-order impact on measurable KPIs." Similarly for impact_proximity=3: require specific KPI names, not just FIRST-order classification. This requires human review of whether the Ford hierarchy data supports such discrimination.

### [FINDING-003] [Section 3.4] [Severity: MEDIUM] [DOMAIN]
**Evidence**: Confidence calibration targets exist for confidence output: "roughly 30% HIGH, 50% MEDIUM, 20% LOW." No analogous distribution targets exist for sub-dimension scores.
**Gap**: The model scores each opportunity in isolation. A domain expert would have a mental model of what percentage of a well-curated enterprise portfolio should score 3 on each dimension. The generic instruction "a score of 3 should represent genuinely exceptional adoption readiness" is qualitative, not quantitative.
**Fix**: [DOMAIN] Add sub-dimension distribution guidance: "In a typical enterprise portfolio of ~300 curated opportunities, expect roughly: decision_density -- 15-25% at 3, 40-50% at 2; financial_gravity -- 25-35% at 3, 50-60% at 2; impact_proximity -- 30-40% at 3, 50-60% at 2." Requires human input on correct distribution targets.

### [FINDING-004] [Section 5.1] [Severity: LOW] [MECHANICAL]
**Evidence**: System message opens with "You are an Aera platform adoption realism assessor" without explaining what Aera is or what L3/L4 hierarchy structure represents.
**Gap**: An outsider cannot understand the problem without domain knowledge. For an LLM prompt, the model may hallucinate incorrect assumptions about Aera's platform purpose.
**Fix**: Add one sentence of context: "Aera is an enterprise decision intelligence platform that automates operational decisions. You are evaluating opportunities (L3) composed of activities (L4) from a corporate capability hierarchy for their readiness to be automated on the Aera platform."

### [FINDING-005] [Section 4.3] [Severity: LOW] [MECHANICAL]
**Evidence**: Decision boundaries define conservative scoring behavior but no true escalation: "If fewer than 3 L4 activities are present, flag confidence as LOW" and "note the conflict and score conservatively."
**Gap**: In a batch pipeline context, true escalation (human review routing) may not be feasible. However, the prompt could output a structured signal that downstream code can use for filtering. Currently, the "flag" behavior relies on the reason text field, which is unstructured.
**Fix**: Consider adding an optional `"flags": ["SPARSE_DATA"]` or `"flags": ["CONTRADICTORY_SIGNALS"]` field to the JSON output schema. This makes edge-case detection machine-readable rather than buried in reason text. NOTE: This requires a schema change and is a design decision.

---

## Prior Audit Findings -- Resolution Status

| Prior Finding | Status | Notes |
|---|---|---|
| FINDING-001 (Klarna/ceiling clustering) | PARTIALLY ADDRESSED | decision_density rubric redesigned with quality gates. financial_gravity/impact_proximity unchanged. See new FINDING-002. |
| FINDING-002 (No examples) | RESOLVED | 3 worked examples added covering strong, weak, and mid-range calibration. |
| FINDING-003 (No decision boundaries) | RESOLVED | Sparse data and contradictory signal handling added to CONSTRAINTS section. |
| FINDING-004 (No test cases) | UNADDRESSED | `audit/tests/adoption-realism/` still does not exist. See new FINDING-001. |
| FINDING-005 (No version metadata) | RESOLVED | @version 2.0, date, and changelog added to file header. |
| FINDING-006 (No negative constraints) | RESOLVED | 5 specific do-not constraints added in CONSTRAINTS section. |
| FINDING-007 (No portfolio calibration) | PARTIALLY ADDRESSED | Discrimination instruction and confidence calibration added. Sub-dimension distribution targets still missing. See new FINDING-003. |
| FINDING-008 (Constraint architecture) | RESOLVED | All four constraint types now present. |

---

## Critical Gap
**[FINDING-001]** -- No test cases exist for the adoption-realism prompt. This is the most impactful gap because the v2.0 prompt made significant rubric changes (decision_density redesign, new constraints, worked examples) that cannot be regression-tested. Without test fixtures, the next evaluation run is the only way to verify the changes work, and by then the cost of iteration is high. Creating test fixtures from the worked examples is a MECHANICAL fix that can be applied immediately.

---

## Human Input Required
- [ ] [FINDING-002]: Should financial_gravity and impact_proximity rubrics be tightened for score=3 to include quality gates beyond simple rating distribution? What discrimination level is acceptable for these dimensions?
- [ ] [FINDING-003]: What are the expected sub-dimension score distributions for the Ford portfolio? Are the suggested targets (15-25% at 3 for decision_density, etc.) reasonable?

---

## New Failure Patterns
None identified beyond those in prior audit. The previously proposed FP-P003 (Isolation Scoring Bias) remains relevant but is partially mitigated by the calibration instructions added in v2.0.
