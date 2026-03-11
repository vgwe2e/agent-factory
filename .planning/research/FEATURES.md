# Feature Landscape

**Domain:** CLI-based catalog evaluation engine with local LLM orchestration
**Researched:** 2026-03-10

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Single-command pipeline execution | Core promise: `aera-evaluate --input export.json` runs everything | Medium | Commander.js entry point dispatches pipeline stages sequentially |
| Hierarchy JSON ingestion with validation | Garbage in = garbage out. Must reject malformed exports early | Medium | Zod schema validates all 2016+ activities before pipeline starts |
| Multi-lens scoring (Technical, Adoption, Value) | The three lenses ARE the product's intellectual framework | High | Each lens requires distinct prompt engineering and scoring rubrics |
| Weighted composite scoring | Adoption Realism at 0.45 is a core design decision | Low | Pure arithmetic after lens scores are computed |
| Red flag detection | Automatic disqualification of dead-zone/phantom/orphan opportunities | Medium | Rule-based + LLM-assisted classification |
| Markdown evaluation reports | Primary human-readable output format | Low | Template string generation, no library needed |
| TSV summary output | Machine-readable ranked list for spreadsheet review | Low | `join('\t')` per row |
| Automatic git commits | Overnight runs must persist progress incrementally | Low | simple-git after each evaluation cycle |
| Graceful error recovery | One failed LLM call must not kill a 6-hour overnight run | High | Retry logic, fallback prompts, skip-and-log for persistent failures |
| Progress logging | Must know where a failed overnight run stopped | Low | Pino structured logs with pipeline stage + opportunity ID |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Mermaid decision flow diagrams | Visual decision trees for qualifying skills, not just text scores | Medium | Generate .mmd source text mapping decision points to Aera components |
| YAML component maps | Structured mapping of opportunities to specific Aera components (Streams, Cortex, PB, Agent Teams) | Medium | Uses bundled knowledge base to constrain mappings to real capabilities |
| Mock decision tests | Sample inputs/outputs using actual client financials from the export | High | Requires LLM to synthesize realistic test scenarios from company context |
| Ratcheting threshold (0.60 minimum) | Prevents grade inflation -- opportunities must clear a real bar for simulation | Low | Simple threshold gate between scoring and simulation phases |
| Meta-reflections | After N evaluations, surface catalog-level patterns (e.g., "this client is 80% deterministic") | Medium | Requires accumulating context across evaluations, then synthesizing |
| Context management (summarize/archive/reset) | Enables processing 362 opportunities without context window overflow | High | Must track what to carry forward vs discard between iterations |
| Two-model strategy (8B triage + 32B reasoning) | Cost/speed optimization: fast model for bulk work, strong model for judgment | Medium | Requires model switching logic and Ollama model lifecycle management |
| Archetype classification (DETERMINISTIC/AGENTIC/GENERATIVE) | Routes opportunities to appropriate Aera component patterns | Medium | Classification drives which knowledge base sections to reference |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Web UI / dashboard | Out of scope for v1, adds massive complexity, CLI artifacts are reviewable with cat/less | Review output files directly; consider UI in future version |
| Interactive prompts during evaluation | Breaks unattended overnight execution | All configuration via CLI flags or config file |
| Cloud model fallback | Violates offline-only constraint, adds cost, network dependency | Fail gracefully with local models only |
| Real-time streaming output | Batch process, not interactive. Streaming adds complexity to output parsing | Write complete results per evaluation, view after run completes |
| Multi-client concurrent execution | Out of scope, adds state management complexity | Process one export at a time, queue manually if needed |
| Model fine-tuning or training | Out of scope, uses off-the-shelf models only | Prompt engineering and structured output parsing instead |
| Database persistence | Files are the database. Adding SQLite/Postgres adds deployment complexity | JSON, YAML, markdown, TSV files in evaluation/ directory |
| Plugin system | One pipeline, one domain (Aera skills). No need for extensibility | Hard-code the pipeline stages; refactor later if needed |

## Feature Dependencies

```
Hierarchy Ingestion --> Triage (requires parsed activities)
Triage --> Scoring (requires tier assignments to prioritize)
Scoring --> Simulation (requires composite scores above threshold)
Simulation --> Spec Writing (requires decision flows and component maps)
Context Management --> All LLM stages (required to avoid overflow)
Model Switching --> Triage vs Scoring (8B for triage, 32B for scoring)
Knowledge Base Bundle --> Component Mapping, Spec Writing (must reference real Aera capabilities)
Git Auto-Commit --> All output stages (commit after each cycle)
Meta-Reflections --> Multiple completed evaluations (needs accumulated results)
```

## MVP Recommendation

Prioritize (Phase 1):
1. Hierarchy JSON ingestion with Zod validation
2. Single-lens scoring (start with Technical Feasibility only)
3. Markdown report output
4. Single CLI command with Commander.js
5. Pino structured logging

Prioritize (Phase 2):
1. Full 3-lens scoring with weighted composite
2. Red flag detection
3. TSV summary output
4. Git auto-commit after each evaluation

Defer:
- Mermaid diagrams: Requires simulation stage to be complete first
- Mock decision tests: Highest complexity feature, needs solid scoring foundation
- Meta-reflections: Requires multiple completed evaluations to be meaningful
- Two-model strategy: Start with 32B only, optimize to 8B triage later when pipeline is proven

## Sources

- [Aera Skill Feasibility Engine PROJECT.md](../.planning/PROJECT.md) - Requirements and constraints
