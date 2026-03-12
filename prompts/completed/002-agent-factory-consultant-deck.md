<objective>
Create a professional, instructive PowerPoint presentation using the /acnpptx skill that showcases what we've built in the agent-factory repository. The audience is consultants interested in AI, autonomous agents, and novel enterprise applications. The presentation should demonstrate the innovation behind our approach, how we used Claude Code as the primary development environment, and the multi-agent patterns that enabled a solo developer to ship 213K lines of production TypeScript in ~93 minutes of automated execution across 31 atomic plans.

The tone must be professional, instructive, and grounded in real metrics — not hype. Frame this as a case study in what's possible today with agentic development workflows.
</objective>

<context>
You are generating a PowerPoint deck from the agent-factory repository. Before creating slides, thoroughly read these files to ground every claim in real project artifacts:

<required_reading>
- `.planning/PROJECT.md` — Project charter, key decisions, constraints
- `.planning/ROADMAP.md` — 11-phase roadmap with requirements traceability
- `.planning/REQUIREMENTS.md` — 44 requirements across 8 categories
- `.planning/STATE.md` — Current progress tracking
- `.planning/RETROSPECTIVE.md` — Lessons learned from v1.0 completion
- `.planning/MILESTONES.md` — Milestone archive and tech debt tracking
- `.planning/research/SUMMARY.md` — v1.1 cloud acceleration research
- `.planning/research/ARCHITECTURE.md` — Detailed vLLM integration design
- `CLAUDE.md` — Codebase conventions, testing patterns, build commands
- `run.sh` — Session loop automation script
- `src/cli.ts` — CLI entry point
- `src/evaluation/.checkpoint.json` — Checkpoint/resume state example
- `seed/lib/orchestrator.ts` — Hand-written agentic loop (key innovation)
</required_reading>

Also read 2-3 phase SUMMARY.md files from `.planning/phases/` to show concrete examples of what each planning cycle produced.

<audience_profile>
- Management consultants and technology advisors at top-tier firms
- Familiar with AI concepts but not necessarily hands-on with coding agents
- Care about: ROI, speed-to-delivery, quality assurance, enterprise applicability
- Skeptical of AI hype — want evidence and real metrics
- Interested in: how to replicate this approach for client engagements
</audience_profile>
</context>

<presentation_structure>

Produce a 16-20 slide deck. Use the /acnpptx skill's "Create from Scratch" workflow. Each slide should follow the skill's layout rules (title + subtitle + body, proper font sizing, footer placement).

<slide_outline>

**Section 1: The Problem (Slides 1-3)**

1. **Cover Slide** — "Agentic Development: A Case Study in Autonomous Software Delivery" with subtitle "How Claude Code + Fine-Grained Planning Shipped 213K LOC in 93 Minutes"
2. **The Enterprise AI Gap** — 60%+ of enterprise AI features fail at adoption, not technology. Frame the problem: technical feasibility scoring alone produces features nobody uses.
3. **What We Set Out to Build** — An offline-first CLI engine that evaluates Aera enterprise opportunities across three weighted lenses, with adoption realism weighted highest (0.45). Show the pipeline: Ingestion → Triage → Scoring → Simulation → Reports.

**Section 2: Architecture & Innovation (Slides 4-8)**

4. **System Architecture Overview** — Two systems: Aera Skill Feasibility Engine (src/) + Agent Harness (seed/). Show how they complement each other. Include a clean architecture diagram as SVG.
5. **Three-Lens Scoring: The Adoption-First Differentiator** — Technical Feasibility (0.30), Adoption Realism (0.45), Value & Efficiency (0.25). Explain WHY adoption realism is weighted highest. Compare to traditional tech-first weighting (0.50/0.30/0.20).
6. **Five Red Flags: Automated Triage** — DEAD_ZONE, PHANTOM, NO_STAKES, CONFIDENCE_GAP, ORPHAN. Show how bad opportunities are filtered before expensive LLM scoring.
7. **Simulation Pipeline: Grounded in Real Components** — 21 UI components + 22 Process Builder nodes + orchestration patterns. Every generated spec maps to real Aera artifacts — no hallucinations. Show example outputs: Mermaid flows, YAML component maps, mock integration tests.
8. **The ChatFn Pattern: Zero-Change Backend Swapping** — Dependency injection seam that lets the same scoring logic run on local Ollama (8B/32B) or cloud vLLM (H100). Show the type signature and explain why this matters for testing and deployment flexibility.

**Section 3: How We Built It — Claude Code as Development Environment (Slides 9-13)**

9. **The Agentic Development Model** — Claude Code as the primary builder. Not a copilot suggesting snippets — an autonomous agent executing 31 atomic plans with TDD, git commits, and checkpoint recovery. Frame the paradigm shift.
10. **Fine-Grained Planning: 31 Atomic Plans** — Each plan: 3-5 minute execution window, clear spec (PLAN.md), verified output (SUMMARY.md + VERIFICATION.md), git commit. Show the .planning/ directory structure and how it enables resumable sessions.
11. **The Session Loop: run.sh** — Infinite loop: launch Claude Code → execute plan → commit → context limit → restart → read STATE.md → pick up where you left off. Show how this overcomes context window limitations.
12. **TDD at Scale: 412 Tests, Zero External Dependencies** — Node.js built-in test runner, pure functions in core logic, factory helpers (makeL3(), makeL4()). Tests run without Ollama — deterministic by design. Show test count progression across phases.
13. **No Frameworks, No Problem** — Hand-written orchestrator.ts is ~150 LOC of async generators. No LangChain, CrewAI, Autogen. Proves that robust agentic patterns work with stdlib + minimal deps. Compare LOC: 150 vs 10,000+.

**Section 4: Results & Cloud Acceleration (Slides 14-16)**

14. **v1.0 Metrics Dashboard** — Table/chart showing: 213K LOC, 412 tests, 44/44 requirements, 11 phases, 31 plans, ~93 min total execution, 3 min avg per plan. Frame these as evidence, not vanity metrics.
15. **v1.1: Cloud-Accelerated Scoring** — 17 hours local → < 30 minutes cloud. vLLM on RunPod H100, concurrent pipeline (10-20 simultaneous opportunities), cost target < $10/run. Show the schema translator and pre-flight validation pattern.
16. **Overnight Resilience** — Checkpoint recovery (crash → resume from last completed opportunity), three-tier retry (retry → fallback prompt → skip-and-log), git auto-commit after each phase. Show how this enables unattended multi-hour runs.

**Section 5: Implications & Takeaways (Slides 17-20)**

17. **What This Means for Consulting** — Agentic development is not future-state. A solo developer with Claude Code shipped production-grade software faster than traditional teams. Frame the implications for staffing, delivery timelines, and client engagements.
18. **Replicating This Approach** — Key ingredients: fine-grained planning, TDD discipline, checkpoint/resume pattern, offline-first architecture. These patterns are transferable to any enterprise project.
19. **The Custom Skills Ecosystem** — Show how /acnpptx (this very deck), /gsd (planning), /build-e2e-skill, and other Claude Code skills create a composable toolkit. Each skill is a reusable capability that compounds across projects.
20. **Closing: The Agent-Augmented Consultant** — The future of consulting isn't AI replacing consultants — it's consultants armed with autonomous agents that handle implementation while humans focus on strategy, client relationships, and adoption. End with a call to action.

</slide_outline>
</presentation_structure>

<design_requirements>
- Use the /acnpptx skill's brand-compliant layouts and color palette
- Generate SVG charts for: architecture diagram (slide 4), three-lens weights comparison (slide 5), v1.0 metrics dashboard (slide 14), local vs cloud performance comparison (slide 15)
- Keep text density moderate — this is a presentation, not a document. Use speaker notes for detailed talking points.
- Use consistent iconography for recurring concepts (agent, plan, test, checkpoint)
- Include the Accenture brand elements per the skill's brand guidelines
</design_requirements>

<constraints>
- Every claim must be traceable to a real artifact in the repository. Do not invent metrics or capabilities.
- Do not oversell. Frame innovation honestly — this is impressive work, but acknowledge intentional tech debt and constraints (36GB Apple Silicon limit, offline Ollama latency).
- Professional tone throughout. No buzzwords without substance. If you say "agentic," explain what that means in concrete terms.
- The presentation should be self-contained — a consultant should be able to present it without having seen the codebase.
</constraints>

<output>
1. Create a Python generation script at `./decks/gen_consultant_deck.py` that uses the /acnpptx skill's helpers and SVG pipeline
2. The script should output `./decks/agent-factory-consultant-deck.pptx`
3. Include SVG generation for all charts/diagrams inline in the script
4. Run the script to produce the final .pptx file
5. Run `verify_pptx.py` against the output to confirm structural quality
</output>

<verification>
Before declaring complete:
1. Confirm the .pptx file exists and opens without errors
2. Run verify_pptx.py — all checks should pass (font sizes, overflow, density)
3. Verify slide count is 16-20
4. Confirm all SVG charts render correctly (architecture, scoring weights, metrics, performance)
5. Spot-check 3 slides to ensure claims match actual repository artifacts
</verification>

<success_criteria>
- A polished, brand-compliant PowerPoint deck of 16-20 slides
- Every metric and architecture claim grounded in real project files
- Professional tone suitable for senior consulting audience
- SVG charts for key data visualizations
- Structural QA passing via verify_pptx.py
- A consultant could pick this up and present it cold with confidence
</success_criteria>
