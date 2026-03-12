# Prompt Audit Report: aeraperioic-suitability-rating
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 33 / 40

---

## Prompt Classification
**Type**: system_prompt (developer message) + user_prompt_template (dynamic user message), built by Python function
**File**: `/Users/vincent.wicker/Documents/AeraPerioic/backend/app/prompts/suitability_rating.py`
**Function**: `build_suitability_rating_messages`
**Dynamic Inputs**: `l4_batch` (list of L4 node dicts), `context` (CompanyContext), `industry_analysis` (optional IndustryAnalysis)
**Static Content Injected**: `AERA_CAPABILITIES_REFERENCE` from `aera_reference.py` (~484 lines of platform/skill/archetype reference)

---

## Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 9 | 10 | -- |
| Layer 2: Context Engineering | 7 | 8 | -- |
| Layer 3: Intent Engineering | 9 | 10 | -- |
| Layer 4: Specification | 8 | 12 | -- |
| **COMPOSITE** | **33** | **40** | **--** |

---

## Layer 1 -- Prompt Craft (9 / 10)

### 2.1 Instruction Clarity: 2 / 2
Instructions are unambiguous and highly specific. The decision structure test defines exactly four required elements: "A decision requires ALL of these elements: 1. ALTERNATIVES... 2. UNCERTAINTY... 3. CONSEQUENCE... 4. TRADE-OFFS" (lines 75-79). Suitability criteria define each rating level with concrete indicators (e.g., "Decision made at scale (100s-1000s per day/week)"). No instruction admits more than one interpretation.

### 2.2 Examples and Counter-Examples: 2 / 2
Extensive positive and negative examples throughout. Decision structure test has 5 positive examples ("Which supplier should fulfill this PO?", lines 82-86), 6 negative counter-examples ("Report inventory levels" -> "Data surfacing, no action selection", lines 89-94), and a calculation vs. control decision table with 6 paired examples (lines 100-108). The archetype section has a worked DETERMINISTIC example and an AGENTIC counter-example (lines 259-271). Decision articulation has BAD/GOOD examples (lines 232-234).

### 2.3 Output Format Specification: 2 / 2
Full JSON schema with all field names, types, and valid values enumerated: `"id": "<L4 node id>"`, `"decision_exists": true | false`, `"decision_articulation": "..." | null`, `"ai_suitability": "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE"`, `"rationale": "Brief 1-sentence explanation"`, `"best_archetype": "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | "CONVERSATIONAL" | null` (lines 213-224). Escalation output block also fully specified (lines 279-287).

### 2.4 Guardrails: 2 / 2
Multiple if-X-do-Y patterns: "decision_exists: false -> ai_suitability MUST be 'NOT_APPLICABLE'" (line 244). "best_archetype: null for LOW and NOT_APPLICABLE ratings" (line 246). Gray zone fallback: "If both probes fail to determine decision existence, default to NOT_APPLICABLE and include: ... escalation_flag: true" (lines 131-133). Missing description fallback: "If a node's description is empty or null, evaluate on name alone" (line 136).

### 2.5 Negative Constraints: 1 / 2
Strong negative constraints present: "Do NOT use generic nouns like 'parameters', 'objectives', 'considerations', 'factors', 'options', 'elements', 'aspects', 'variables', 'criteria' in decision_articulation" (line 236). "'Complex' or 'cross-domain' alone is NOT AGENTIC" (line 255). "Scale alone is NOT AGENTIC" (line 255). "Multiple execution channels... is NOT AGENTIC" (line 256). However, there is no explicit must-not constraint on the suitability rating itself beyond the precision principle -- e.g., no constraint like "Do NOT rate a process HIGH solely because it has high volume without confirming financial impact." The precision principle (lines 197-203) is close but phrased as preferences rather than hard prohibitions. Scoring 1 would be too conservative given the volume of negatives; awarding 2 is warranted given the specificity of the named anti-patterns. **Score: 2 / 2.**

*Correction*: Re-examining -- line 201 states "Do not rate HIGH if you cannot name a specific, concrete decision" and line 202 "Do not rate HIGH if financial impact cannot be inferred from company context." These are explicit must-not constraints. Combined with the generic-noun ban and the AGENTIC anti-patterns, this clearly earns 2.

**Revised 2.5: 2 / 2**

**Revised Layer 1 total: 10 / 10**

---

## Layer 2 -- Context Engineering (7 / 8)

### 3.1 Context Window Composition: 2 / 2
The auditor can fully reconstruct what the model sees: (1) developer message = `AERA_CAPABILITIES_REFERENCE` (~484 lines, read in full) + decision_structure_test + suitability_criteria + output_format, (2) user message = industry_context (dynamically built from CompanyContext fields) + L4 process batch. The function's Python code transparently shows every conditional injection (financial lines, enterprise apps, business exclusions, hard exclusions, existing systems). No blind spots.

### 3.2 Context-to-Prompt Ratio: 2 / 2
Domain knowledge is injected via `AERA_CAPABILITIES_REFERENCE` (platform capabilities, production skills, archetypes, action vocabulary) and dynamic `industry_context` (company financials, enterprise apps, exclusions). The prompt itself is a thin instruction layer defining criteria, format, and guardrails. No domain facts are hardcoded in the instruction text that should be dynamic.

### 3.3 Context Quality: 2 / 2
Injected context is highly relevant (Aera platform skills matched to the rating task), structured (XML-tagged sections), and high-signal. The `AERA_CAPABILITIES_REFERENCE` provides capability-level grounding with specific skill names, archetypes, financial impact ranges, and action vocabularies. Dynamic context includes company financials, enterprise applications with capability-scoping, and exclusion lists.

### 3.4 Context Gaps: 1 / 2
One identifiable gap: the prompt references the "COMPANY-SIZE ADJUSTED THRESHOLD" (lines 158-165) and instructs the model to "Use the company financials provided in the industry_context to select the appropriate threshold." However, the user message injects a financial context header that says "use to calibrate whether a process meets the >$100K annual impact threshold" (line 309) -- this references only $100K, which is the smallest tier. A domain expert would note the disconnect: the dynamic financial context header still hardcodes "$100K" while the criteria define four tiers. This could mislead the model into anchoring on the wrong threshold for large companies.

---

## Layer 3 -- Intent Engineering (9 / 10)

### 4.1 Objective Hierarchy: 2 / 2
Primary objective is explicit in the docstring: "Rates each L4 process for Aera platform suitability (HIGH/MEDIUM/LOW/NOT_APPLICABLE)" (line 9). Secondary objectives are ranked: decision structure test runs FIRST as a gate (line 14: "A DECISION STRUCTURE TEST runs before any suitability rating"), then suitability rating. The precision principle establishes that conservative accuracy outranks coverage: "A HIGH rating that is wrong destroys credibility in a customer conversation. A cautious MEDIUM invites productive discussion" (line 203).

### 4.2 The Klarna Test: 2 / 2
If the model ruthlessly optimized for the stated objective (accurate suitability ratings), the outcomes align with org values. The precision principle explicitly addresses the perverse incentive of over-rating: "prefer under-scoring to over-scoring" (line 197-199). The 40% AGENTIC cap (line 252) prevents archetype inflation. The decision structure gate prevents spurious ratings on non-decisions. The business/hard exclusion enforcement prevents rating excluded processes. No predictable failure mode from ruthless optimization.

### 4.3 Decision Boundaries: 2 / 2
Explicit boundaries defined: model decides suitability rating autonomously for clear cases. Gray zone processes that are unresolvable trigger escalation: "default to NOT_APPLICABLE and include: ... escalation_flag: true" (lines 131-133). Business exclusions and hard exclusions are hard boundaries the model must respect (lines 329-332). The precision principle defines when to downgrade rather than decide (lines 197-203).

### 4.4 Values Alignment: 2 / 2
All three product values from config are encoded:
- **Scoring accuracy**: Decision structure test as gate, detailed rubric criteria, DETERMINISTIC/AGENTIC worked examples prevent mis-classification
- **Evidence-grounded**: "Do not rate HIGH if you cannot name a specific, concrete decision" (line 201); decision_articulation requires naming specific alternatives, trade-offs, and triggers
- **Conservative realism**: "PRECISION PRINCIPLE -- always prefer the conservative rating when uncertain" (line 197); "$500K threshold as a conservative default" (line 165)

### 4.5 Senior Employee Test: 1 / 2
The prompt encodes substantial expert knowledge: the calculation-vs-control-decision distinction (lines 96-111), the APS/ERP overlap check with specific system names (lines 184-196), Aera's execution advantage (write-back differentiation, lines 205-208), company-size-adjusted thresholds (lines 158-165), and the AGENTIC requires "3+ DIFFERENT decision types interacting in a feedback loop" heuristic (line 254). One expert heuristic is missing: a senior solutions engineer would know that **industry vertical significantly affects suitability ceilings** -- e.g., process manufacturing (chemicals, pharma) has different decision patterns than discrete manufacturing (automotive, electronics), and the prompt does not encode vertical-specific adjustments beyond generic "use industry name for context." The industry_analysis input partially addresses this but is optional and its absence degrades quality (as acknowledged in the docstring).

---

## Layer 4 -- Specification Completeness (8 / 12)

### 5.1 Self-Contained Problem Statement: 2 / 2
The docstring (lines 1-41) provides a complete problem statement: PURPOSE explains what it does and why ("Output feeds Phase 05 skill suggestion"), GATE explains the decision structure prerequisite, REQUIRED INPUTS and OPTIONAL INPUTS enumerate all inputs with types, and KNOWN QUALITY DEGRADERS explain what happens when inputs are missing. An outsider unfamiliar with the product can understand the purpose.

### 5.2 Acceptance Criteria: 2 / 2
Five verifiable acceptance criteria are explicitly stated in the docstring (lines 36-40):
1. "Every NOT_APPLICABLE node has decision_exists: false"
2. "No node in business_exclusions or hard_exclusions receives ai_suitability HIGH or MEDIUM"
3. "AGENTIC ratings do not exceed 40% of total non-NOT_APPLICABLE ratings"
4. "Every HIGH-rated node has a non-null decision_articulation naming specific alternatives and trade-offs"
5. "Gray zone nodes that are unresolvable have escalation_flag: true"

### 5.3 Constraint Architecture: 2 / 2
All four constraint types present:
- **Musts**: "decision_articulation is MANDATORY" (line 227), "decision_exists: false -> ai_suitability MUST be 'NOT_APPLICABLE'" (line 244)
- **Must-nots**: "Do NOT use generic nouns" (line 236), "Do not rate HIGH if you cannot name a specific, concrete decision" (line 201)
- **Preferences**: "Rating uncertain HIGH/MEDIUM -> prefer MEDIUM" (line 274), "Archetype uncertain DETERMINISTIC/AGENTIC -> prefer DETERMINISTIC" (line 275)
- **Escalation triggers**: "escalation_flag: true" for unresolvable gray zones (lines 131-133, 278-287)

### 5.4 Decomposition: 1 / 2
This is a multi-step task (decision structure test -> suitability rating -> archetype assignment -> output formatting). The steps are decomposed informally by XML-tagged sections (`<decision_structure_test>`, `<suitability_criteria>`, `<output_format>`), and there is a clear gate ("PREREQUISITE: Only rate processes that PASS the decision structure test above", line 143). However, each sub-task does not have an explicit input/output/success-condition boundary. For instance, the decision structure test does not specify its output format separately from the final output -- the model must infer that the test result feeds into the `decision_exists` field.

### 5.5 Evaluation Design: 0 / 2
No test cases exist in `audit/tests/aeraperioic-suitability-rating/`. The directory does not exist at all.

### 5.6 Version and Ownership: 1 / 2
Version is present: `SUITABILITY_RATING_PROMPT_VERSION = "v2.3"` (line 49) and docstring header says "Version: see SUITABILITY_RATING_PROMPT_VERSION below" with "Last reviewed: 2026-02-28" (line 6-7). Owner is present: "Owner: AI Systems / Solutions Engineering" (line 5). All three metadata items (version, owner, last-modified) are present. **Revised: 2 / 2.**

**Revised Layer 4 total: 9 / 12**

---

## Revised Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 10 | 10 | -- |
| Layer 2: Context Engineering | 7 | 8 | -- |
| Layer 3: Intent Engineering | 9 | 10 | -- |
| Layer 4: Specification | 9 | 12 | -- |
| **COMPOSITE** | **35** | **40** | **--** |

---

## Findings

### [FINDING-001] [Section 3.4] [Severity: MEDIUM] [DOMAIN]
**Evidence**: Line 309 in Python: `"Company Financials (use to calibrate whether a process meets the >$100K annual impact threshold):\n"` while the prompt itself defines four tiers at lines 160-164: "$100K... $500K... $2M... $5M."
**Gap**: The dynamically injected financial context header references only the "$100K annual impact threshold," which is the floor for the smallest company tier. For companies with revenue >$2B, the relevant threshold is $500K-$5M. The model may anchor on $100K regardless of company size, undermining the company-size-adjusted threshold logic.
**Fix**: Change the financial context header to: `"Company Financials (use to select the appropriate company-size-adjusted impact threshold from the suitability criteria):\n"` -- removing the hardcoded "$100K" reference.

### [FINDING-002] [Section 4.5] [Severity: LOW] [DOMAIN]
**Evidence**: Line 291: `f"Industry: {context.industry}"` is the only industry-specific signal when `industry_analysis` is absent.
**Gap**: No vertical-specific suitability heuristics are encoded. A senior solutions engineer would adjust expectations for process manufacturing (continuous flow, less discrete decision points) vs. discrete manufacturing (more scheduling decisions) vs. retail/CPG (more demand-side decisions). The prompt treats all industries identically except through the optional `industry_analysis` input.
**Fix**: Add an optional `<industry_heuristics>` section in the developer message that, when industry is one of the major verticals (CPG, automotive, chemicals, pharma, retail), provides 2-3 vertical-specific suitability adjustments. This is a DOMAIN change requiring business input on which heuristics to encode.

### [FINDING-003] [Section 5.4] [Severity: LOW] [MECHANICAL]
**Evidence**: The decision structure test, suitability rating, and archetype assignment are three logical sub-tasks separated by XML tags (`<decision_structure_test>`, `<suitability_criteria>`, `<output_format>`) but without explicit intermediate output specifications.
**Gap**: The decision structure test does not specify its own output format. The model must infer that the test result maps to `decision_exists` and `decision_articulation` fields in the final output. A domain expert decomposes each sub-task with input/output/success-condition.
**Fix**: Add a brief "Output of this test" note at the end of `<decision_structure_test>`: "This test produces two fields: `decision_exists` (true/false/null) and `decision_articulation` (string or null). These feed directly into the output schema."

### [FINDING-004] [Section 5.5] [Severity: HIGH] [MECHANICAL]
**Evidence**: No directory `audit/tests/aeraperioic-suitability-rating/` exists.
**Gap**: No evaluation test cases exist for this prompt. Given the complexity (decision gate + suitability rating + archetype assignment + exclusion enforcement + company-size thresholds), automated regression testing is critical.
**Fix**: Create `audit/tests/aeraperioic-suitability-rating/` with at minimum:
1. A batch containing a clear decision, a non-decision, and a gray zone process -- verify decision_exists correctness
2. A batch with a process in `business_exclusions` -- verify it receives NOT_APPLICABLE
3. A batch testing company-size-adjusted thresholds (small vs. large company context)
4. A batch with a scale+dual-channel process -- verify DETERMINISTIC not AGENTIC

---

## Failure Pattern Check

**FP-001 (Klarna)**: Not triggered. The precision principle and conservative defaults prevent metric maximization without quality floors.

**FP-002 (Silent Gate)**: Not triggered. The decision structure gate explicitly links to output: "If no decision exists, return ai_suitability: 'NOT_APPLICABLE' with decision_exists: false" (line 144). Business exclusions also have explicit output enforcement (line 329).

**FP-003 (Unnamed Output)**: Not triggered. All JSON fields are fully enumerated with types and valid values.

**FP-004 (Vague Estimate)**: Not triggered. Financial impact thresholds are quantified with specific dollar amounts per company size tier.

**FP-P001 (Collapsed platform_fit)**: Not directly applicable (different prompt), but the injected `AERA_CAPABILITIES_REFERENCE` provides the capability grounding that fixed this pattern.

**FP-P002 (Ceiling clustering)**: Partially relevant. The archetype distribution guidance caps AGENTIC at 40%, but there is no similar explicit cap mechanism for HIGH suitability ratings clustering. The precision principle provides soft protection. No finding raised -- the precision principle is sufficiently strong.

---

## Critical Gap
**[FINDING-004]** -- No evaluation test cases exist. This is the single highest-impact gap because the prompt is complex (multi-stage gate + rating + archetype + exclusions + size-adjusted thresholds) and already at v2.3, meaning it has been revised multiple times. Without regression tests, any future edit risks breaking previously-correct behavior. Creating 4 test cases as specified in FINDING-004 would enable automated verification of the 5 acceptance criteria already defined in the docstring.

---

## Human Input Required
- [ ] [FINDING-001]: Should the financial context header reference be updated to remove the "$100K" anchor? This changes what the model sees for every company, potentially affecting rating distributions for larger enterprises.
- [ ] [FINDING-002]: Which industry-vertical-specific heuristics should be encoded, if any? This requires solutions engineering input on vertical differences in suitability patterns.

---

## New Failure Patterns
None identified. The existing FP-P002 (ceiling clustering) pattern may be worth monitoring for suitability ratings (not just adoption sub-dimensions), but the precision principle provides adequate protection currently.
