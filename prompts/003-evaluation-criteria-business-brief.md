<objective>
Create a polished, consultant-grade business document that defines the complete evaluation criteria framework used by the Aera Skill Feasibility Engine. This document will be presented to enterprise clients (e.g., Ford Motor Company) to explain how their process hierarchy is evaluated, scored, and prioritized for Aera platform implementation.

The document must read as a deliverable a management consulting firm would present — clear rationale for each criterion, business justification for the methodology, and actionable interpretation guidance for stakeholders.
</objective>

<context>
The Aera Skill Feasibility Engine evaluates enterprise process hierarchies through a multi-stage pipeline:

**Stage 1: Triage** — Red flag detection and tier assignment
**Stage 2: Three-Lens Scoring** — Technical Feasibility, Adoption Realism, Value & Efficiency
**Stage 3: Composite Score & Promotion Gate** — Weighted composite with 0.60 threshold
**Stage 4: Simulation** — Component mapping, decision flows, integration surfaces, mock tests

Read these source files to extract the exact evaluation logic:
- `src/triage/red-flags.ts` — 5 red flag types (DEAD_ZONE, PHANTOM, NO_STAKES, CONFIDENCE_GAP, ORPHAN)
- `src/triage/tier-engine.ts` — Tier 1/2/3 assignment criteria and thresholds
- `src/types/triage.ts` — Flag-to-action mappings (skip, demote, flag)
- `src/types/scoring.ts` — Lens weights (Technical 30%, Adoption 45%, Value 25%), max scores, promotion threshold
- `src/scoring/prompts/technical.ts` — Technical lens: data_readiness, aera_platform_fit, archetype_confidence (0-3 each, max 9)
- `src/scoring/prompts/adoption.ts` — Adoption lens: decision_density, financial_gravity, impact_proximity, confidence_signal (0-3 each, max 12)
- `src/scoring/prompts/value.ts` — Value lens: value_density, simulation_viability (0-3 each, max 6)
- `src/scoring/composite.ts` — Weighted composite formula and promotion gate
- `src/scoring/archetype-router.ts` — Archetype classification: DETERMINISTIC, AGENTIC, GENERATIVE
- `src/simulation/prompts/component-map.ts` — Aera component mapping (streams, cortex, PB, agent teams, UI)
- `src/simulation/prompts/decision-flow.ts` — Mermaid decision flow generation
- `src/simulation/prompts/integration-surface.ts` — Integration surface mapping
- `src/simulation/prompts/mock-test.ts` — Mock decision test generation
</context>

<requirements>
1. **Executive Summary** (1 page) — High-level overview of the evaluation framework, its purpose, and what it delivers to the client

2. **Evaluation Pipeline Overview** — Visual-friendly description of the 4 stages with clear flow

3. **Stage 1: Triage & Risk Assessment**
   - Define each of the 5 red flags with business rationale for why each matters
   - Explain the flag-to-action mapping (skip/demote/flag → process) and why certain flags are fatal vs. advisory
   - Define the 3 tiers with their qualification criteria and business interpretation
   - Include the exact thresholds: Tier 1 = quick_win AND >$5M, Tier 2 = >=50% HIGH ai_suitability

4. **Stage 2: Three-Lens Scoring Framework**
   - For EACH of the 9 sub-dimensions across 3 lenses:
     - Name and definition
     - Scoring rubric (0-3 scale with what each level means in business terms)
     - Why this dimension matters for implementation success
   - Explain archetype-specific weighting emphasis (DETERMINISTIC weights platform_fit, AGENTIC weights confidence_signal, GENERATIVE weights data_readiness)
   - Lens weight rationale: why Adoption gets 45% vs Technical 30% vs Value 25%

5. **Stage 3: Composite Scoring & Promotion**
   - The weighted composite formula
   - The 0.60 promotion threshold and its rationale
   - What "promoted to simulation" means in practical terms

6. **Stage 4: Simulation Artifacts**
   - Define each of the 4 simulation outputs: component map, decision flow, integration surface, mock test
   - Business value of each artifact
   - How they connect to actual Aera platform implementation

7. **Interpretation Guide** — How a client stakeholder should read the outputs:
   - What a Tier 1 vs Tier 2 vs Tier 3 result means for their roadmap
   - How to interpret composite scores (0.85+ = strong, 0.70-0.85 = viable, 0.60-0.70 = conditional, <0.60 = deprioritize)
   - What red flags mean for implementation planning

8. **Appendix: Archetype Definitions** — DETERMINISTIC, AGENTIC, GENERATIVE with examples and implementation implications
</requirements>

<constraints>
- Write in professional consulting tone — authoritative but accessible to non-technical executives
- Use tables for rubrics and scoring criteria — these are reference material
- Include business rationale (the "so what") for every criterion, not just the definition
- No code snippets — translate all technical logic into business language
- Use "opportunity" not "L3" when addressing the client; use "activity" not "L4"
- Format as Markdown but structure it so it could easily be converted to a slide deck or PDF
- Target length: 3,000-5,000 words
</constraints>

<output>
Save the document to: `./deliverables/evaluation-criteria-framework.md`

Create the `deliverables/` directory if it doesn't exist.
</output>

<verification>
Before completing, verify:
- All 5 red flags are defined with business rationale
- All 9 sub-dimensions across 3 lenses have scoring rubrics
- The composite formula is explained with the exact weights
- Archetype-specific emphasis is documented
- The document reads as a client-facing deliverable, not internal documentation
- No code or technical jargon that would confuse a VP of Supply Chain
</verification>

<success_criteria>
A VP of Supply Chain Operations at Ford could read this document and:
1. Understand exactly how their processes were evaluated
2. Trust the methodology as rigorous and defensible
3. Know how to interpret any score or tier assignment in the output
4. Understand what actions to take based on the results
</success_criteria>
