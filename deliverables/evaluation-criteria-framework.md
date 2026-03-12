# Aera Skill Feasibility Engine: Evaluation Criteria Framework

**Prepared for:** Enterprise Client Leadership
**Date:** March 2026
**Classification:** Client Deliverable

---

## 1. Executive Summary

The Aera Skill Feasibility Engine is a rigorous, multi-stage evaluation framework that transforms a raw enterprise process hierarchy into a prioritized implementation roadmap for the Aera Decision Intelligence platform. It answers the fundamental question every enterprise stakeholder asks before committing resources: *Which processes should we automate first, and why?*

The engine ingests your complete process hierarchy --- every opportunity and its constituent activities --- and subjects each one to a four-stage evaluation pipeline. Stage 1 screens for structural risks that would undermine implementation success. Stage 2 scores every surviving opportunity across three independent lenses: Technical Feasibility, Adoption Realism, and Value & Efficiency. Stage 3 computes a weighted composite score and applies a promotion gate. Stage 4 generates concrete simulation artifacts that bridge the gap between evaluation and implementation planning.

The result is a defensible, data-driven prioritization that balances technical readiness with organizational adoption likelihood and business value. Rather than relying on subjective judgment or vendor enthusiasm, this framework provides transparent scoring criteria that any stakeholder can audit and challenge.

**What the engine delivers:**

- A tiered ranking of every opportunity in your hierarchy (Tier 1, 2, or 3)
- Risk flags identifying structural issues that require resolution before implementation
- A composite feasibility score (0.00--1.00) for each opportunity
- Simulation-ready artifacts for every opportunity that clears the promotion threshold

---

## 2. Evaluation Pipeline Overview

The evaluation pipeline processes each opportunity through four sequential stages. Each stage serves as a quality gate: only opportunities that pass the preceding stage advance to the next.

| Stage | Name | Purpose | Output |
|-------|------|---------|--------|
| **1** | Triage & Risk Assessment | Identify structural risks; assign priority tiers | Red flags, tier assignment, action recommendation |
| **2** | Three-Lens Scoring | Score across Technical, Adoption, and Value dimensions | 9 sub-dimension scores (0--3 each) with rationale |
| **3** | Composite Score & Promotion | Compute weighted composite; apply promotion gate | Composite score (0.00--1.00); promote/hold decision |
| **4** | Simulation | Generate platform implementation artifacts | Component map, decision flow, integration surface, mock test |

**Flow:** Every opportunity enters Stage 1. Opportunities flagged as "skip" are removed from further evaluation. Opportunities flagged as "demote" are downgraded in tier priority but continue through scoring. All remaining opportunities proceed through Stages 2 and 3. Only those exceeding the 0.60 composite threshold advance to Stage 4 simulation.

---

## 3. Stage 1: Triage & Risk Assessment

### 3.1 Red Flag Detection

Before any scoring begins, the engine screens every opportunity for five structural risk indicators. These flags represent conditions that, if present, would compromise the reliability of downstream scoring or the viability of an implementation.

| Red Flag | Condition | Action | Severity |
|----------|-----------|--------|----------|
| **Dead Zone** | Zero decision density --- none of the constituent activities contain an identifiable decision point | Skip | Fatal |
| **Phantom** | The opportunity is marked as non-existent in the source hierarchy | Skip | Fatal |
| **No Stakes** | Zero activities carry a HIGH financial rating, and all activities have only indirect (second-order) business impact | Demote | Serious |
| **Confidence Gap** | More than 50% of activities have LOW rating confidence | Flag (advisory) | Warning |
| **Orphan** | The opportunity has fewer than 3 constituent activities | Flag (advisory) | Warning |

#### Business Rationale for Each Flag

**Dead Zone** --- An opportunity with no decision points has nothing for Aera to automate. The Decision Intelligence platform fundamentally orchestrates decisions; without them, there is no viable skill to build. These opportunities are excluded to prevent wasted evaluation effort.

**Phantom** --- The source hierarchy itself indicates this opportunity does not exist. This typically results from data export artifacts or deprecated process entries. Including phantoms would introduce noise into the prioritization and inflate the apparent pipeline.

**No Stakes** --- When no activity carries high financial significance and all impacts are indirect, the business case for automation is weak. Even if technically feasible, these opportunities lack the financial gravity to justify implementation investment. They are demoted in priority rather than excluded, because future business conditions may elevate their importance.

**Confidence Gap** --- When the majority of activity assessments carry low confidence ratings, downstream scoring becomes unreliable. The opportunity is not excluded --- it may still represent a strong candidate --- but stakeholders should interpret its scores with appropriate caution and may want to invest in re-assessment before committing resources.

**Orphan** --- Opportunities with fewer than three activities may lack sufficient scope to justify a standalone Aera skill. They are flagged for review: they may represent incomplete data capture rather than genuinely narrow opportunities. Stakeholders should validate whether additional activities should be associated with these opportunities before proceeding.

#### Action Resolution

When an opportunity triggers multiple red flags, the most severe action applies:

| Priority | Action | Meaning |
|----------|--------|---------|
| Highest | **Skip** | Opportunity is removed from further evaluation entirely |
| Medium | **Demote** | Opportunity continues but is downgraded in tier priority |
| Lowest | **Flag** | Opportunity continues at its assigned tier with an advisory notation |

### 3.2 Tier Assignment

After red flag screening, every surviving opportunity is assigned to one of three priority tiers. Tier assignment determines evaluation priority and signals implementation readiness.

| Tier | Criteria | Interpretation |
|------|----------|---------------|
| **Tier 1** | Quick-win eligible **AND** combined maximum value exceeds $5 million | Highest-priority candidates. These represent the intersection of rapid implementability and significant business value. They should be the first opportunities evaluated for implementation. |
| **Tier 2** | 50% or more of constituent activities have HIGH AI suitability ratings | Strong automation candidates with demonstrated AI readiness across their activity portfolio. These opportunities have a solid foundation for Aera skill development but may require more complex implementation than Tier 1 quick wins. |
| **Tier 3** | All other opportunities | Default tier. These opportunities are not disqualified --- they simply lack the clear quick-win characteristics or broad AI suitability signals of higher tiers. Many Tier 3 opportunities score well in subsequent stages and advance to simulation. |

Tier 1 is evaluated first. An opportunity that meets both Tier 1 criteria is assigned Tier 1 regardless of its AI suitability profile. Tier 2 is evaluated second. All remaining opportunities default to Tier 3.

---

## 4. Stage 2: Three-Lens Scoring Framework

Every opportunity that survives triage is scored across three independent evaluation lenses. Each lens examines a distinct dimension of implementation feasibility, and together they provide a holistic assessment that no single metric could achieve.

### Why Three Lenses?

A common failure mode in enterprise automation initiatives is over-indexing on a single dimension. A process might be technically straightforward but face insurmountable organizational resistance. Another might have enormous value potential but lack the data infrastructure to support it. The three-lens approach forces balanced evaluation across the dimensions that most strongly predict implementation success.

### Lens Weights

| Lens | Weight | Rationale |
|------|--------|-----------|
| **Technical Feasibility** | 30% | Necessary but insufficient. Strong platform fit matters, but technical challenges can be engineered around with sufficient investment. |
| **Adoption Realism** | 45% | The most heavily weighted lens because adoption failure is the primary risk in enterprise automation. The best-designed skill delivers zero value if users do not trust and use it. Organizational readiness, decision clarity, and financial urgency are the strongest predictors of real-world adoption. |
| **Value & Efficiency** | 25% | Ensures that technically feasible, adoptable opportunities also deliver meaningful business returns. Weighted lowest because value estimates are inherently forward-looking and carry more uncertainty than technical or adoption signals. |

---

### 4.1 Technical Feasibility Lens (Max Score: 9)

This lens evaluates whether the opportunity can be implemented on the Aera platform with available data and components.

#### Sub-Dimension: Data Readiness

*Evaluates whether the underlying activities have sufficient structured data inputs to support automation.*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | None | No structured data signals are present. Activities lack measurable inputs or data references. Implementation would require significant data infrastructure investment before any automation work could begin. |
| 1 | Sparse | Few activities reference structured data or metrics. Data availability is insufficient for reliable automation without substantial data integration work. |
| 2 | Moderate | Multiple activities reference structured data with some decision points. A reasonable data foundation exists, though gaps will need to be addressed during implementation. |
| 3 | Rich | The majority of activities have quantifiable inputs with clear decision points. The data infrastructure is ready to support automation with minimal additional investment. |

**Why it matters:** Data is the fuel for decision automation. An opportunity scoring 0--1 on data readiness will require extensive data engineering before any Aera skill can function reliably, significantly increasing implementation cost and timeline.

#### Sub-Dimension: Platform Fit

*Evaluates how well the opportunity maps to existing Aera platform capabilities --- UI components, Process Builder nodes, and integration patterns.*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | No fit | No Aera components match the opportunity requirements. Implementation would require significant custom development outside standard platform capabilities. |
| 1 | Weak | Only basic display components are applicable. The opportunity cannot leverage the platform's decision orchestration strengths. |
| 2 | Moderate | Several relevant components and process nodes are identified. The opportunity can leverage meaningful platform capabilities with some customization. |
| 3 | Strong | Multiple components align with a clear implementation path. The opportunity maps naturally to existing platform capabilities, enabling rapid development. |

**Why it matters:** Strong platform fit translates directly to faster implementation timelines and lower costs. Opportunities that align with existing Aera components can be built using proven patterns, reducing technical risk.

#### Sub-Dimension: Archetype Confidence

*Evaluates how strongly the activity patterns support the assigned automation archetype (Deterministic, Agentic, or Generative).*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | Unclear | The archetype is unclear or mismatched with actual activity patterns. Implementation approach would need to be rethought before proceeding. |
| 1 | Weak | Few activities align with the assigned archetype pattern. The implementation approach may need adjustment. |
| 2 | Moderate | The majority of activities show patterns consistent with the archetype. The implementation approach is sound with minor refinements expected. |
| 3 | Strong | Clear and consistent alignment between activity patterns and the archetype. The implementation approach is validated by the data. |

**Why it matters:** The archetype determines the entire implementation architecture --- which Aera components are used, how decisions are orchestrated, and what level of human involvement is needed. A mismatched archetype leads to rework and failed implementations.

#### Archetype-Specific Emphasis

The Technical Feasibility lens adjusts its evaluation emphasis based on the opportunity's archetype:

- **Deterministic opportunities:** Platform Fit is weighted most heavily, because deterministic skills depend on clear rule-based decision flows that map directly to Process Builder capabilities.
- **Agentic opportunities:** Archetype Confidence is weighted most heavily, because agentic skills require validated multi-step reasoning patterns with clear human-in-the-loop design.
- **Generative opportunities:** Data Readiness is weighted most heavily, because generative skills depend on rich, structured data sources to fuel content and insight generation.

---

### 4.2 Adoption Realism Lens (Max Score: 12)

This lens evaluates whether the organization is ready and motivated to adopt an automated solution for this opportunity. It carries the highest weight (45%) because adoption failure is the single greatest risk in enterprise automation programs.

#### Sub-Dimension: Decision Density

*Measures the proportion of activities that contain identifiable, automatable decisions.*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | None | No activities contain identifiable decisions. There is nothing for users to adopt because there is nothing for the platform to decide. |
| 1 | Low | Fewer than 25% of activities have identifiable decisions. Automation scope is narrow, limiting the perceived value to end users. |
| 2 | Moderate | 25--75% of activities have identifiable decisions. A meaningful subset of the workflow can be automated, providing tangible user benefit. |
| 3 | High | More than 75% of activities have identifiable decisions with clear articulation. The opportunity is decision-rich, maximizing the value visible to users and driving adoption. |

**Why it matters:** Users adopt tools that visibly improve their work. High decision density means more of the workflow is automated, creating more touchpoints where users experience value. Low decision density means users see limited benefit, undermining adoption.

#### Sub-Dimension: Financial Gravity

*Assesses the financial urgency driving adoption --- whether the opportunity carries enough financial significance to motivate organizational change.*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | None | All activities have LOW financial ratings. There is no financial urgency to change current processes. |
| 1 | Weak | Majority LOW financial ratings with some exceptions. The financial case for change is unconvincing to budget holders. |
| 2 | Reasonable | Majority MEDIUM ratings or a mix of HIGH and MEDIUM. A credible financial case exists that can support a business case for investment. |
| 3 | Strong | Majority HIGH financial ratings with direct (first-order) impact. Financial urgency is clear, compelling, and can drive executive sponsorship. |

**Why it matters:** Automation initiatives compete for organizational attention and resources. Financial gravity determines whether an implementation gets executive sponsorship, adequate funding, and the organizational change management support needed for successful adoption.

#### Sub-Dimension: Impact Proximity

*Evaluates whether the business impact is direct and measurable (first-order) or indirect and diffuse (second-order).*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | Indirect only | All impacts are second-order and indirect. Benefits are hard to measure and hard to attribute to the automation, making ROI demonstration difficult. |
| 1 | Mostly indirect | Predominantly second-order with some first-order signals. Benefits are partially measurable but the connection to automation is tenuous. |
| 2 | Mixed | A blend of first-order and second-order impacts with measurable KPIs. Benefits can be demonstrated to stakeholders with reasonable effort. |
| 3 | Direct | First-order impact on measurable KPIs. Benefits are immediately visible, directly attributable to the automation, and easy to report to leadership. |

**Why it matters:** First-order impact creates a virtuous cycle: users see immediate results, which builds trust, which drives deeper adoption. Second-order impact is real but harder to attribute, making it difficult to maintain organizational momentum through the inevitable challenges of implementation.

#### Sub-Dimension: Confidence Signal

*Measures the certainty level of the underlying activity assessments.*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | Low | Majority of assessments carry LOW confidence. The entire evaluation is built on uncertain foundations. |
| 1 | Mixed | Confidence levels are mixed with many LOW signals. Selective validation of key assumptions is recommended before proceeding. |
| 2 | Reasonable | Majority MEDIUM confidence ratings. Assessments are reasonably certain, supporting planning-grade decisions. |
| 3 | High | Majority HIGH confidence ratings. The assessment data is reliable and can support commitment-grade decisions. |

**Why it matters:** Every score in this evaluation is ultimately derived from the underlying activity data. When that data carries low confidence, all downstream scores inherit that uncertainty. High confidence signals mean stakeholders can act on the results with appropriate conviction.

#### Archetype-Specific Emphasis

- **Deterministic opportunities:** Decision Density is weighted most heavily, because deterministic automation requires clear, frequent decisions to justify the rule-based architecture.
- **Agentic opportunities:** Confidence Signal is weighted most heavily, because agentic skills require organizational trust --- users must believe the AI-assisted recommendations are reliable before they will act on them.
- **Generative opportunities:** Impact Proximity is weighted most heavily, because generative skills must demonstrate visible value quickly to overcome the natural skepticism toward AI-generated content and insights.

---

### 4.3 Value & Efficiency Lens (Max Score: 6)

This lens evaluates the potential business return and the feasibility of modeling the opportunity as a simulation.

#### Sub-Dimension: Value Density

*Assesses the financial value of the opportunity relative to overall company revenue.*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | Negligible | No quantifiable value, or the combined maximum value is negligible relative to company revenue. The opportunity does not move the needle financially. |
| 1 | Low | Combined maximum value represents less than 0.1% of annual revenue, or value metrics are vaguely defined. The financial impact is marginal. |
| 2 | Moderate | Combined maximum value represents 0.1--1% of annual revenue with some clear value metrics. The opportunity delivers meaningful but not transformative financial impact. |
| 3 | High | Combined maximum value exceeds 1% of annual revenue with clear, specific value metrics across activities. The opportunity represents a significant financial improvement that warrants priority investment. |

**Why it matters:** Value density normalizes financial impact against company scale. A $10 million opportunity means very different things to a $500 million company versus a $50 billion company. This dimension ensures prioritization reflects relative significance, not absolute dollar amounts.

#### Sub-Dimension: Simulation Viability

*Evaluates whether the opportunity can be modeled as a concrete simulation with defined inputs, decision logic, and measurable outputs.*

| Score | Level | Business Interpretation |
|-------|-------|----------------------|
| 0 | Not viable | No concrete decision scenarios exist to simulate. There are no clear inputs and outputs for a simulation model. |
| 1 | Weak | Few decision flows are identified, and inputs and outputs are unclear. A simulation would require significant assumptions and invention. |
| 2 | Moderate | Some decision flows exist with measurable inputs, but complex dependencies make modeling challenging. A simulation is possible but will require simplifying assumptions. |
| 3 | Clear | Well-defined decision flows with measurable inputs and outputs. The opportunity can be straightforwardly modeled as a simulation, enabling rapid prototyping. |

**Why it matters:** Simulation is the bridge between evaluation and implementation. Opportunities that can be simulated allow stakeholders to see the Aera skill in action before committing to full implementation, de-risking the investment and accelerating stakeholder buy-in.

---

## 5. Stage 3: Composite Scoring & Promotion

### 5.1 The Composite Formula

Each lens score is first normalized to a 0.0--1.0 scale by dividing the raw total by its maximum possible score. The weighted composite is then computed as:

> **Composite = (Technical / 9) x 0.30 + (Adoption / 12) x 0.45 + (Value / 6) x 0.25**

This produces a single score between 0.00 and 1.00 that represents the overall feasibility of implementing the opportunity on the Aera platform.

### 5.2 The Promotion Threshold

Opportunities scoring **0.60 or above** are promoted to Stage 4 (Simulation). This threshold was calibrated to balance inclusiveness with quality:

- **Below 0.60:** The opportunity has material weaknesses across one or more lenses that would likely result in implementation difficulties. These opportunities are not discarded --- they are retained in the scored output for future re-evaluation as conditions change --- but they do not receive simulation artifacts.
- **At or above 0.60:** The opportunity demonstrates sufficient strength across all three lenses to justify the investment in detailed simulation. It is technically viable, organizationally adoptable, and financially meaningful enough to warrant deeper analysis.

### 5.3 What Promotion Means in Practice

Being promoted to simulation means the engine generates four concrete implementation artifacts for the opportunity (described in Stage 4 below). These artifacts transform an abstract feasibility score into tangible implementation planning inputs. Non-promoted opportunities retain their scores and tier assignments, providing a clear record of why they were deprioritized and what would need to change for them to advance.

---

## 6. Stage 4: Simulation Artifacts

For every opportunity that clears the promotion threshold, the engine generates four implementation artifacts. Together, these artifacts provide a complete initial blueprint for how the opportunity would be realized on the Aera platform.

### 6.1 Component Map

**What it is:** A structured mapping of the opportunity to the five core layers of the Aera platform: Streams (data ingestion), Cortex (analytical models), Process Builder (decision orchestration), Agent Teams (AI-assisted workflows), and UI (user interface components).

**What it contains:** For each platform layer, specific components are identified with their purpose and a confidence indicator (confirmed or inferred). Confirmed components are those that definitively exist in the Aera platform and align with the opportunity. Inferred components are those the implementation would likely require but that need validation during solution design.

**Business value:** The component map answers the question, "What exactly would we build?" It provides solution architects with a starting point for detailed design, program managers with a scope estimate, and business sponsors with a concrete picture of the solution.

### 6.2 Decision Flow

**What it is:** A visual flowchart showing how the Aera platform would orchestrate the decision-making process for the opportunity, from trigger event through decision branches to terminal outcomes.

**What it contains:** A directed flow diagram using Aera platform terminology --- Process Builder nodes, Cortex capabilities, and UI components --- showing the happy path plus two to three decision branches. The flow is scoped from the initiating trigger to the final outcome.

**Business value:** The decision flow makes the automation tangible. Stakeholders can trace the logic and validate that it matches their understanding of the process. It also serves as the foundation for detailed process design during implementation, reducing the requirements-gathering effort.

### 6.3 Integration Surface

**What it is:** A structural mapping of all systems that would need to connect to the Aera platform for this opportunity, including source systems, data ingestion streams, processing components, and user-facing surfaces.

**What it contains:** Four layers of integration: source systems mapped from the client's known enterprise applications (with unknown sources flagged for discovery), Aera ingestion stream definitions, processing component specifications, and UI surface definitions. Each source system is marked as "identified" (matched to a known enterprise application) or "to be determined" (requiring further discovery).

**Business value:** Integration is typically the longest lead-time item in any enterprise automation project. The integration surface provides IT teams with an early view of connection requirements, enabling them to begin access provisioning, API discovery, and data mapping in parallel with functional design.

### 6.4 Mock Decision Test

**What it is:** A single happy-path test case that simulates how the Aera skill would process a real decision, using actual client financial data as inputs.

**What it contains:** Four elements: the decision being tested (derived from actual activity decision articulations), realistic input data (grounded in client financials such as revenue, cost of goods sold, and inventory values), the expected output (action and business outcome), and the rationale connecting input to output.

**Business value:** The mock test is the most powerful artifact for stakeholder alignment. It transforms an abstract score into a concrete example: "Given these real inputs from your business, here is what Aera would recommend and why." This makes the value proposition tangible and testable, enabling stakeholders to validate the approach before committing to implementation.

---

## 7. Interpretation Guide

### 7.1 Reading Tier Assignments

| Tier | What It Means for Your Roadmap |
|------|-------------------------------|
| **Tier 1** | These are your "start here" opportunities. They combine rapid implementability (quick-win characteristics) with significant financial value (>$5M). Plan to include these in your first implementation wave. They are most likely to deliver early wins that build organizational confidence in the platform. |
| **Tier 2** | Strong automation candidates with broad AI suitability across their activities. These should form the core of your second implementation wave. They may require more complex implementation than Tier 1 but have a strong foundation for success. |
| **Tier 3** | These opportunities require more careful evaluation. They may score well in individual lenses but lack the clear readiness signals of higher tiers. Review their composite scores and red flags to determine which warrant inclusion in later implementation waves and which need further assessment. |

### 7.2 Reading Composite Scores

| Score Range | Interpretation | Recommended Action |
|-------------|---------------|-------------------|
| **0.85--1.00** | Strong candidate. The opportunity scores well across all three lenses with no material weaknesses. | Prioritize for near-term implementation. Proceed directly to solution design using the simulation artifacts. |
| **0.70--0.84** | Viable candidate. The opportunity has solid fundamentals with minor gaps in one or more dimensions. | Include in implementation planning. Review the lowest-scoring sub-dimensions to understand and address specific gaps during design. |
| **0.60--0.69** | Conditional candidate. The opportunity clears the promotion threshold but has notable weaknesses. | Proceed with caution. The simulation artifacts are available, but invest in addressing the weakest sub-dimensions before committing to full implementation. These opportunities benefit from a proof-of-concept approach. |
| **Below 0.60** | Deprioritized. The opportunity has material weaknesses that would likely compromise implementation success. | Do not include in the current implementation roadmap. Review the scoring breakdown to understand what would need to change --- improved data availability, stronger financial case, or clearer decision structures --- for the opportunity to become viable in a future evaluation cycle. |

### 7.3 Reading Red Flags

| Flag | What to Do |
|------|-----------|
| **Dead Zone** | This opportunity was excluded because it lacks automatable decisions. If you believe decisions exist but were not captured in the hierarchy export, work with your process team to update the source data and re-evaluate. |
| **Phantom** | This entry does not represent a real opportunity in your current hierarchy. Confirm with your process team whether it should be removed or corrected in the source system. |
| **No Stakes** | The financial case is currently insufficient to justify automation investment. This may change as business conditions evolve. Monitor for increases in financial ratings or shifts to first-order impact. |
| **Confidence Gap** | The underlying assessments carry high uncertainty. Before acting on this opportunity's scores, invest in re-assessing the constituent activities with subject matter experts to improve confidence levels. |
| **Orphan** | This opportunity has very few constituent activities. Verify with your process team whether additional activities should be associated with this opportunity. If it is genuinely narrow in scope, consider whether it can be combined with a related opportunity. |

---

## 8. Appendix: Archetype Definitions

Every opportunity is classified into one of three automation archetypes. The archetype determines the implementation architecture, the orchestration pattern used on the Aera platform, and the evaluation emphasis applied during scoring.

### Deterministic

**Definition:** Opportunities characterized by clear, rule-based decision logic with well-defined inputs and outputs. Decisions follow predictable patterns: if condition A is met, take action B.

**Examples:** Order approval workflows, threshold-based alerts (e.g., inventory drops below safety stock), compliance checks against defined rules, standard cost calculations, automated routing based on business rules.

**Implementation approach:** Primarily leverages Aera Process Builder nodes for rule-based orchestration. Decisions are automated end-to-end with minimal human intervention. High platform fit and high decision density are critical success factors.

**Evaluation emphasis:** Platform Fit (Technical lens) and Decision Density (Adoption lens) are weighted most heavily. Deterministic skills succeed when the platform has the right components and the process has enough decisions to automate.

### Agentic

**Definition:** Opportunities involving multi-step decision support where AI augments human judgment rather than replacing it. These workflows benefit from AI-assisted analysis, recommendation generation, and scenario comparison, but require a human decision-maker in the loop.

**Examples:** Supplier selection with multiple evaluation criteria, demand forecast review and adjustment, exception handling in logistics, capacity planning with trade-off analysis, strategic sourcing decisions.

**Implementation approach:** Leverages Aera Agent Teams for AI-assisted reasoning combined with Process Builder for workflow orchestration. Includes explicit human-in-the-loop checkpoints. User trust is the critical adoption factor.

**Evaluation emphasis:** Archetype Confidence (Technical lens) and Confidence Signal (Adoption lens) are weighted most heavily. Agentic skills succeed when the AI reasoning pattern is clearly validated and users trust the underlying assessments.

### Generative

**Definition:** Opportunities focused on content creation, insight generation, or synthesis from structured data. These workflows transform data into actionable narratives, reports, or recommendations.

**Examples:** Market analysis report generation, RFQ response drafting, risk assessment summaries, performance dashboard narrative generation, supplier scorecards with contextual commentary.

**Implementation approach:** Relies heavily on rich data inputs feeding AI content generation capabilities. Requires strong data infrastructure and clear generation use cases with measurable outputs.

**Evaluation emphasis:** Data Readiness (Technical lens) and Impact Proximity (Adoption lens) are weighted most heavily. Generative skills succeed when abundant structured data is available and the generated outputs deliver immediately visible, first-order business value.

---

*This document describes the evaluation methodology applied by the Aera Skill Feasibility Engine. All scoring criteria, thresholds, and weights are embedded in the evaluation pipeline and applied consistently across every opportunity in your process hierarchy. For questions about specific opportunity scores or tier assignments, refer to the detailed evaluation output accompanying this framework.*
