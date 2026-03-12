<objective>
Create a professional PowerPoint presentation using the /acnpptx skill that showcases the Aera Skill Feasibility Engine as a capability — what it does, how it scores, what it delivers, and why adoption-first scoring changes the game for enterprise AI implementations.

The audience is management consultants and technology advisors who evaluate enterprise AI opportunities for clients. They are skeptical of hype and want to see a rigorous, defensible methodology for separating opportunities that will succeed from those that won't.

The tone is professional and instructive. This is a methodology briefing, not a tech demo. We are showing consultants a tool they can use — or whose approach they can adopt — to evaluate enterprise AI skill portfolios with confidence.
</objective>

<context>
Before creating slides, read these files to ground every claim in real project artifacts:

<required_reading>
- `.planning/PROJECT.md` — What the engine is and its core value proposition
- `.planning/REQUIREMENTS.md` — Full requirements (scoring lenses, simulation, reporting)
- `.planning/RETROSPECTIVE.md` — Lessons learned, what worked
- `.planning/MILESTONES.md` — What was delivered
- `src/data/` — Browse the bundled knowledge base files (UI components, PB nodes, orchestration patterns)
- `src/scoring/` — Understand the three-lens methodology and sub-dimensions
- `src/triage/` — Red flag detection logic and tier assignment
- `src/simulation/` — What simulation artifacts are generated
- `src/output/` or `src/reports/` — Report generation and final deliverables
- Read 2-3 phase SUMMARY.md files from `.planning/phases/` that cover scoring, simulation, and reporting phases
</required_reading>

<audience_profile>
- Management consultants and technology advisors at top-tier firms
- Evaluate enterprise AI opportunities for Fortune 500 clients
- Familiar with Aera Technology or similar enterprise decision intelligence platforms
- Care about: defensible methodology, adoption risk, ROI prioritization, deliverable quality
- Skeptical of AI hype — want evidence-based scoring, not vibes
- Will ask: "Can I use this approach with my clients?"
</audience_profile>
</context>

<presentation_structure>

Produce a 16-18 slide deck using the /acnpptx skill's "Create from Scratch" workflow. Follow the skill's layout rules exactly (read SKILL.md, slide-patterns.md, color-palette.md, brand-guidelines-extended.md, svg-charts.md from ~/.claude/skills/acnpptx/).

<slide_outline>

**Section 1: The Problem (Slides 1-3)**

1. **Cover Slide** — "Adoption-First Scoring: A New Methodology for Enterprise AI Feasibility" with subtitle "How to Identify the Skills That Will Actually Get Used"

2. **The Adoption Failure Problem** — Most enterprise AI feasibility assessments weight technical capability highest. Result: technically sound features that nobody adopts. Industry data shows 60%+ of enterprise AI features fail at adoption, not technology. The scoring is backwards.

3. **What If We Scored Differently?** — Introduce the concept: what if adoption realism — change readiness, decision density, financial gravity, organizational conviction — was weighted higher than technical feasibility? That's what this engine does. Single CLI command, overnight batch, actionable output an SE team can execute on.

**Section 2: The Methodology — Three-Lens Scoring (Slides 4-8)**

4. **Three Lenses, Adoption-Weighted** — Overview of the scoring model:
   - Technical Feasibility (30%) — can we build it?
   - Adoption Realism (45%) — will anyone use it?
   - Value & Efficiency (25%) — is it worth it?
   Show the weight comparison: traditional (50/30/20) vs. ours (30/45/25). Use an SVG bar chart.

5. **Lens 1: Technical Feasibility (30%)** — Three sub-dimensions scored 0-3:
   - Data Readiness: Are needed data sources available and mappable?
   - Aera Platform Fit: Does the archetype (DETERMINISTIC/AGENTIC/GENERATIVE) map to Process Builder, Agent Teams, or Cortex?
   - Archetype Confidence: How certain is the classification?
   Explain that this lens is necessary but deliberately not dominant.

6. **Lens 2: Adoption Realism (45%)** — The differentiator. Four sub-dimensions scored 0-3:
   - Decision Density: Are there actual, recurring business decisions to automate? (Not academic exercises)
   - Financial Gravity: Does the outcome have measurable financial impact?
   - Impact Proximity: Is the benefit felt immediately by users, or distant/abstract?
   - Confidence Signal: Does the organization have conviction about this opportunity?
   Explain why 45%: prevents technically perfect but operationally dead implementations.

7. **Lens 3: Value & Efficiency (25%)** — Two sub-dimensions scored 0-3:
   - Value Density: Revenue impact as percentage of company annual revenue
   - Simulation Viability: Can the impact be quantified and tested before full rollout?
   Ground in real financials from the client hierarchy export.

8. **Composite Scoring & The 0.60 Gate** — How the three lenses combine into a single composite score. Show the formula. Explain the promotion threshold: only opportunities scoring >= 0.60 advance to simulation. This prevents false positives and focuses expensive simulation effort on genuine candidates. Show a worked example with real numbers.

**Section 3: Automated Triage — Red Flags & Tiers (Slides 9-11)**

9. **Five Red Flags: Catch Problems Before Scoring** — Before any LLM scoring, the engine automatically detects five data-driven red flags:
   - DEAD_ZONE: No actual decisions to automate (decision density = 0)
   - PHANTOM: Opportunity not recognized by the business (opportunity_exists = false)
   - NO_STAKES: No financial impact, no primary business effect
   - CONFIDENCE_GAP: Organization lacks conviction (>50% LOW confidence ratings)
   - ORPHAN: Incomplete opportunity definition (L3 with zero L4 activities)
   Each flag triggers SKIP, DEMOTE, or FLAG actions. Show the action matrix.

10. **Tier Assignment: Priority Binning** — After red flags, opportunities are binned:
    - Tier 1 (Premium): quick_win AND value > $5M — maximum ROI priority
    - Tier 2 (Moderate): >= 50% HIGH ai_suitability — good technical fit
    - Tier 3 (Default): everything else
    Red flags can demote. Tier 1 checked first. Show distribution from a real run.

11. **Archetype Routing** — Each opportunity is classified as DETERMINISTIC, AGENTIC, or GENERATIVE. This determines which Aera platform components are used in simulation:
    - DETERMINISTIC → Process Builder (IF/Rules/Transaction nodes)
    - AGENTIC → Agent Teams + Agent Functions
    - GENERATIVE → Agent Teams with LLM Agents
    Show the routing decision tree and typical distribution (~56% DETERMINISTIC, ~43% AGENTIC, <1% GENERATIVE).

**Section 4: Simulation — What Gets Generated (Slides 12-14)**

12. **Grounded Simulation: No Hallucinations Allowed** — For every opportunity that passes the 0.60 gate, the engine generates four artifacts, all grounded in a bundled knowledge base of 21 real Aera UI components + 22 Process Builder nodes + 7 workflow patterns. Every component reference is validated against the knowledge base. Confidence levels: "confirmed" (exact KB match) or "inferred" (LLM generated, flagged for review).

13. **The Four Simulation Artifacts** — For each qualifying opportunity:
    - **Mermaid Decision Flow**: Visual workflow diagram showing trigger → decision nodes → outcome, labeled with real PB nodes
    - **YAML Component Map**: Which Streams, Cortex models, PB nodes, Agent Teams, and UI components are needed
    - **Mock Decision Test**: Sample scenario with real client financials → expected output → integration points
    - **Integration Surface**: Full data flow topology — source systems → Aera ingestion → processing → UI
    Show a simplified example of each artifact type.

14. **From Score to Spec: The Deliverable** — What an SE team actually receives:
    - Triage summary (TSV): sortable/filterable spreadsheet of all opportunities with flags and tiers
    - Feasibility scorecards: 9-dimension numeric grading for every opportunity
    - Tier 1 report: deep analysis of premium opportunities with LLM-generated reasoning
    - Simulation packages: per-opportunity folders with flows, maps, tests, and integration specs
    - Catalog analysis: meta-reflection on domain strengths, archetype distribution, KB coverage
    Frame this as "the evaluation/ directory an SE team can act on Monday morning."

**Section 5: Resilience & Scale (Slides 15-16)**

15. **Overnight Batch, Zero Babysitting** — The engine runs unattended:
    - Checkpoint recovery: crash → resume from last completed opportunity (no re-scoring)
    - Three-tier retry: LLM failure → retry → fallback prompt → skip-and-log
    - Git auto-commit: artifacts committed after each phase with markers
    - Confidence = MIN(lens confidences): conservative bottleneck model, never overstates certainty
    Show the resilience architecture as a simple flow.

16. **Cloud Acceleration: 17 Hours to 30 Minutes** — Local Ollama path works fully offline for sensitive environments. Optional cloud path (vLLM on H100) enables concurrent scoring of 10-20 opportunities simultaneously. Same scoring logic, same artifacts, same quality — just faster. Cost target: < $10/run for a full 339-opportunity catalog. Use SVG chart comparing local vs cloud timelines.

**Section 6: Implications (Slides 17-18)**

17. **What This Means for Your Practice** — This methodology is transferable:
    - The three-lens framework applies to any enterprise AI portfolio evaluation
    - Adoption-first weighting prevents the most common failure mode
    - Red flag triage catches data quality issues before expensive analysis
    - Grounded simulation prevents hallucinated specs from reaching implementation
    - The tool runs offline — suitable for air-gapped or sensitive client environments
    Frame as: "You don't need this exact tool. You need this approach."

18. **Closing: Score What Matters** — The question isn't "can we build it?" — it's "will they use it?" Adoption realism at 45% forces that question to the front of every evaluation. The engine makes this repeatable, defensible, and overnight-fast. End with: the best enterprise AI skill is the one that gets adopted.

</slide_outline>
</presentation_structure>

<design_requirements>
- Use the /acnpptx skill's brand-compliant layouts and color palette
- Generate SVG charts for:
  - Traditional vs adoption-first weight comparison (slide 4) — grouped bar chart
  - Composite score worked example (slide 8) — stacked horizontal bar
  - Red flag action matrix (slide 9) — simple table/matrix visual
  - Local vs cloud performance comparison (slide 16) — timeline comparison
- Keep text density moderate. Bullet points, not paragraphs. Speaker notes for detailed talking points.
- Use the skill's varied layout patterns — no two consecutive slides with the same pattern
- Include Accenture brand elements per the skill's brand guidelines
</design_requirements>

<constraints>
- Every claim must be traceable to a real artifact in the repository. Read the source files.
- Do not mention lines of code, test counts, phase counts, or development methodology. This is about the CAPABILITY, not the construction.
- Do not mention Claude Code, LLMs used for development, or how the tool was built. Only mention LLMs in the context of how the engine uses them for scoring.
- Professional tone. No buzzwords without substance. Define terms when first introduced.
- The presentation should be self-contained — a consultant should be able to present it without having seen the codebase or knowing how the tool was built.
- Scoring sub-dimensions and weights must exactly match what's in the source code. Read the scoring files to verify.
</constraints>

<output>
1. Create a Python generation script at `./decks/gen_feasibility_capability_deck.py` that uses the /acnpptx skill's helpers and SVG pipeline
2. The script should output `./decks/feasibility-engine-capability-deck.pptx`
3. Include SVG generation for all charts/diagrams inline in the script
4. Run the script to produce the final .pptx file
5. Run `verify_pptx.py` and `brand_check.py` against the output
</output>

<verification>
Before declaring complete:
1. Confirm the .pptx file exists at ./decks/feasibility-engine-capability-deck.pptx
2. Run verify_pptx.py — all checks should pass
3. Run brand_check.py — all slides pass brand compliance
4. Verify slide count is 16-18
5. Verify that NO slide mentions lines of code, test counts, Claude Code, or development methodology
6. Spot-check scoring weights and sub-dimensions against src/scoring/ source files
</verification>

<success_criteria>
- A polished, brand-compliant PowerPoint deck of 16-18 slides
- Focused entirely on methodology and capability — zero development/construction details
- Scoring weights and sub-dimensions verified against actual source code
- SVG charts for key comparisons and data visualizations
- Structural and brand QA passing
- A management consultant could present this cold to a client and sound authoritative
</success_criteria>
