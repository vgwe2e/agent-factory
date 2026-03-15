# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This repo contains two distinct systems:

1. **agent-factory** (root + `seed/`) — Autonomous agent discovery and builder loop. Finds problems from Reddit/HN/GitHub, scores them, builds specialized agents on a shared Next.js harness.
2. **Aera Skill Feasibility Engine** (`src/`) — CLI tool that evaluates Aera hierarchy exports (L3 opportunities, L4 activities), scores them across three lenses, and produces ranked feasibility reports. v1.2 shipped with cloud pipeline hardening (retry, teardown, cost tracking).

## Build & Test Commands

### Aera Engine (src/)

```bash
cd src
npm test                                      # Run all tests (Node.js built-in test runner)
npx tsx --test triage/tier-engine.test.ts      # Run a single test file
npm run build                                  # TypeScript compile to dist/
npm run dev -- --input ../path/to/export.json  # Run CLI in dev mode
npx tsx regen-reports.ts --input-dir ./evaluation-vllm  # Regenerate reports from checkpoints
```

### Agent Harness (seed/)

```bash
cd seed
npm install
npm run dev    # Start Next.js dev server at localhost:3000
npm run build  # Production build
```

### Agent Factory Loop

```bash
./run.sh  # Infinite loop: launches Claude Code, auto-restarts on context limits
```

## Architecture: Aera Engine (src/)

**Pipeline flow:** Ingestion → Triage → Scoring → Simulation → Reports

### Core modules

- **CLI entry:** `cli.ts` — commander-based, supports `--backend`, `--concurrency`, `--retry`, `--teardown`, `--skip-sim`, `--max-tier`
- **Ingestion:** `ingestion/parse-export.ts` — Zod-validates v3 hierarchy JSON against `schemas/hierarchy.ts`
- **Triage:** `triage/` — Red flag detection → tier assignment → sorting
  - 5 red flags: DEAD_ZONE, PHANTOM, NO_STAKES, CONFIDENCE_GAP, ORPHAN
  - 3 tiers: Tier 1 (quick_win + >$5M), Tier 2 (≥50% HIGH ai_suitability), Tier 3 (default)
- **Scoring:** `scoring/` — Three-lens scoring (technical, adoption, value) with archetype routing, confidence calibration, and composite scoring
  - `ollama-client.ts` — local Ollama adapter; `vllm-client.ts` — vLLM OpenAI-compatible adapter
  - `schema-translator.ts` — converts Ollama JSON schemas to vLLM `response_format`
- **Simulation:** `simulation/` — Component map, decision flow, integration surface, and mock test generation via LLM
- **Output:** `output/` — Report formatters (TSV, summary, adoption risk, dead zones, meta-reflection, tier-1 report) and file writers
- **Pipeline:** `pipeline/` — `pipeline-runner.ts` orchestrates the full flow; `context-tracker.ts` manages memory; `progress.ts` tracks completion; `scoring-to-simulation.ts` bridges phases

### Knowledge base

- **Data:** `data/` — Bundled Aera reference data (21 UI components, 22 PB nodes, orchestration patterns, platform capabilities)
- **Knowledge:** `knowledge/` — Typed lookup modules (capabilities, components, orchestration, process-builder) over `data/`

### Infrastructure

- `infra/backend-factory.ts` — Creates ChatFn + config for ollama or vllm backends
- `infra/cloud-provider.ts` — RunPod pod lifecycle management (create, wait-ready, terminate)
- `infra/pod-provider.ts` — RunPod pod provisioning with model caching via network volumes
- `infra/cost-tracker.ts` — GPU time and cost estimation for cloud runs
- `infra/checkpoint.ts` — Per-opportunity checkpoint persistence and error clearing for retry
- `infra/semaphore.ts` — Concurrency limiter for parallel scoring
- `infra/timeout.ts` — Per-request timeout wrapper
- `infra/retry-policy.ts` — Resilient retry with backoff for LLM calls
- `infra/model-manager.ts` — Ollama model pull/switch
- `infra/logger.ts` — Pino-based structured logger
- `infra/git-commit.ts` — Auto-commits evaluation results after pipeline runs

### Types

- Zod schemas in `schemas/`, TypeScript types inferred from them in `types/`
- Type files: `hierarchy.ts`, `knowledge.ts`, `orchestration.ts`, `process-builder.ts`, `scoring.ts`, `simulation.ts`, `triage.ts`

### Key design decisions

- Default: fully offline via Ollama. Optional cloud: vLLM on RunPod H100/A100 via `--backend vllm`.
- Target models: Qwen 2.5 32B for scoring/reasoning.
- Hardware constraint: 36GB Apple Silicon — max ~32B quantized models locally.
- Pure functions with no I/O side effects in core logic (triage, scoring).
- Result type pattern: `{ success: true; data: T } | { success: false; error: string }`

### Cloud backend

- `--backend vllm --vllm-url URL --concurrency N` for user-managed vLLM servers
- `--backend vllm` with `RUNPOD_API_KEY` in `.env` auto-provisions RunPod pod (not serverless)
- RunPod API domain is `api.runpod.ai` (NOT `api.runpod.io`)
- The `.env` file is at repo root; `dotenv/config` is imported in `cli.ts`
- `--teardown` flag terminates cloud resources after completion; SIGINT/SIGTERM also trigger cleanup
- `--retry N` re-runs errored opportunities at concurrency 1; checkpoint system tracks completion
- `--network-volume <id>` for RunPod model weight caching across pod restarts

## Architecture: Agent Harness (seed/)

- **Orchestrator:** `lib/orchestrator.ts` — Hand-written agentic loop (no LangChain/CrewAI), async generator yielding SSE events
- **Providers:** `lib/providers/` — Abstract base (`base.ts`) with Anthropic and OpenAI implementations
- **Tools:** `lib/tools/registry.ts` — Singleton tool registry (web search, fetch, file I/O, Composio)
- **API:** `app/api/chat/route.ts` — SSE streaming over POST
- **Config:** `config.ts` — Per-agent settings (maxRounds, systemPrompt)

## Conventions

- **Testing:** Node.js built-in `node:test` module with `assert/strict`. Co-located test files (`*.test.ts`). TDD approach — tests first.
- **Test fixtures:** `makeL3()`, `makeL4()` helper factories for minimal test objects (defined locally in test files that need them).
- **TypeScript:** Strict mode, ES2022 target, NodeNext module resolution, ES module imports.
- **Naming:** camelCase functions/vars, PascalCase types, UPPERCASE constants (e.g., `TIER1_VALUE_THRESHOLD`).
- **Git commits:** `<type>(<scope>): <message>` — e.g., `feat(03-02): implement triage pipeline with TDD`
- **Error handling:** Never-throw pattern in LLM clients — all errors channeled through ChatResult union type.

## Planning System

The `.planning/` directory tracks project planning:
- `PROJECT.md` — Project charter and key decisions
- `ROADMAP.md` — 20-phase roadmap across 3 milestones (v1.0, v1.1, v1.2)
- `MILESTONES.md` — Shipped milestone records with stats
- `STATE.md` — Current progress tracking
- `RETROSPECTIVE.md` — Post-milestone retrospectives
- `milestones/` — Archived roadmaps, requirements, phases per shipped version
- `phases/` — Active phase plans, summaries, and verification docs
- `config.json` — Pipeline configuration (export paths, backend defaults)
