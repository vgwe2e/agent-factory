# Research Summary: Aera Skill Feasibility Engine

**Domain:** CLI-based catalog evaluation engine with local LLM orchestration
**Researched:** 2026-03-10
**Overall confidence:** HIGH

## Executive Summary

The Aera Skill Feasibility Engine is a batch CLI tool that ingests structured hierarchy exports (2000+ activities, 362 L3 opportunities) and produces ranked feasibility reports with implementation specs for Aera Decision Intelligence skills. It runs overnight on local models via Ollama, fully offline, on Apple Silicon with 36GB RAM.

The stack is deliberately minimal: TypeScript on Node.js 22+, executed via tsx (no build step), with 7 production dependencies. The core pattern is a sequential pipeline with file-based state persistence between isolated stages. Each stage (ingest, triage, score, gate, simulate, spec, reflect, bundle) is an independent async function with Zod-validated inputs and outputs. The LLM integration uses the official `ollama` npm package directly -- no LangChain, no AI SDK, no abstraction layers.

The critical technical challenge is not the pipeline logic (which is straightforward) but the LLM integration quality: prompt engineering for consistent structured output from quantized local models, context window management across 362 evaluations, and memory management on constrained hardware. The 32B Qwen 2.5 model at Q4 quantization uses ~20GB of the 36GB budget, leaving tight margins for the OS and Node.js. Model switching between 8B (triage) and 32B (reasoning) phases requires explicit lifecycle management.

The biggest risk is prompt quality. The scoring lenses (Technical Feasibility, Adoption Realism, Value and Efficiency) require carefully calibrated rubrics with anchor points, few-shot examples, and iterative validation against human-scored ground truth. Building the pipeline infrastructure first and treating prompts as an afterthought is the most common failure mode in this domain.

## Key Findings

**Stack:** TypeScript + Node.js 22 + tsx, Commander.js CLI, ollama client, Zod validation, pino logging, simple-git, p-queue. 7 production deps total.

**Architecture:** Sequential pipeline with stage isolation, file-based crash recovery, Zod-validated LLM responses, two-model strategy (8B triage / 32B reasoning).

**Critical pitfall:** Context window overflow during long runs silently degrades output quality. Must budget under 8K tokens per LLM call and summarize aggressively between batches.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation** - Project scaffolding, CLI entry point, LLM client with Ollama, Zod schemas for hierarchy JSON
   - Addresses: Ingestion, validation, basic LLM connectivity
   - Avoids: Building output before having reliable input

2. **Scoring Core** - Single-lens scoring (Technical Feasibility) with prompt calibration, markdown output
   - Addresses: Core scoring capability, prompt engineering methodology
   - Avoids: Prompt engineering as afterthought (critical pitfall)

3. **Full Pipeline** - All 3 lenses, weighted composite, red flags, triage with 8B model, TSV output, git auto-commit
   - Addresses: Complete scoring framework, two-model strategy
   - Avoids: Memory exhaustion by implementing model switching

4. **Simulation and Specs** - Decision flow diagrams (Mermaid), YAML component maps, implementation specs, knowledge base integration
   - Addresses: Differentiator features that depend on solid scoring
   - Avoids: Building complex output on uncalibrated scoring

5. **Overnight Resilience** - Crash recovery, context management, meta-reflections, batch git commits, thermal monitoring
   - Addresses: Operational reliability for unattended runs
   - Avoids: Discovering crash recovery gaps during real overnight runs

**Phase ordering rationale:**
- Phases 1-2 must come first because prompt quality determines everything downstream. A perfectly engineered pipeline producing garbage scores is worse than a rough pipeline producing calibrated scores.
- Phase 3 before Phase 4 because simulation depends on scoring being reliable.
- Phase 5 last because resilience features are optimization -- the engine should produce correct results before it produces reliable results.

**Research flags for phases:**
- Phase 2: Needs deeper research on prompt engineering patterns for structured evaluation with Qwen 2.5 32B specifically. Calibration methodology needs validation.
- Phase 3: Model switching via Ollama API (load/unload) needs practical testing. Documentation is thin on model lifecycle management.
- Phase 5: Thermal throttling behavior on Apple Silicon during sustained 6-hour inference loads needs empirical testing, not just research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified on npm with current versions. Patterns well-established. |
| Features | HIGH | Requirements are clearly defined in PROJECT.md. Feature landscape maps directly. |
| Architecture | HIGH | Sequential pipeline with file persistence is a proven pattern for batch processing. |
| Pitfalls | MEDIUM | Memory and thermal behavior on 36GB Apple Silicon with 32B models needs empirical validation. Context overflow patterns are well-documented but thresholds are model-specific. |

## Gaps to Address

- Qwen 2.5 32B structured JSON output reliability -- how often does it produce valid JSON vs needing retries? Needs empirical testing in Phase 2.
- Ollama model lifecycle management -- the `delete` API unloads from memory, but exact behavior and timing needs verification.
- Apple Silicon thermal behavior during sustained 6-hour inference -- real-world performance degradation curve is unknown.
- Prompt calibration methodology -- how to efficiently establish ground truth and measure LLM alignment for domain-specific scoring rubrics.
- Aera knowledge base format and bundling strategy -- the knowledge base at ~/Documents/area needs to be audited and structured for embedding in the engine.
