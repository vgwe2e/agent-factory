# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This repo contains two distinct systems:

1. **agent-factory** (root + `seed/`) — Autonomous agent discovery and builder loop. Finds problems from Reddit/HN/GitHub, scores them, builds specialized agents on a shared Next.js harness, ships to `builds/`.
2. **Aera Skill Feasibility Engine** (`src/`) — CLI tool that evaluates Aera hierarchy exports (L3 opportunities, L4 activities), scores them across three lenses, and produces ranked feasibility reports. v1.1 shipped with cloud-accelerated scoring via vLLM on RunPod GPUs.

## Build & Test Commands

### Aera Engine (src/)

```bash
# All commands run from src/ directory
cd src

npm test                              # Run all tests (Node.js built-in test runner)
npx tsx --test triage/tier-engine.test.ts  # Run a single test file
npm run build                         # TypeScript compile to dist/
npm run dev -- --input ../ford_hierarchy_v2_export.json  # Run CLI in dev mode
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

- **CLI entry:** `cli.ts` (commander)
- **Ingestion:** `ingestion/parse-export.ts` — Zod-validates hierarchy JSON against `schemas/hierarchy.ts`
- **Triage:** `triage/` — Red flag detection → tier assignment → sorting → TSV output
  - 5 red flags: DEAD_ZONE, PHANTOM, NO_STAKES, CONFIDENCE_GAP, ORPHAN
  - 3 tiers: Tier 1 (quick_win + >$5M), Tier 2 (≥50% HIGH ai_suitability), Tier 3 (default)
- **Knowledge base:** `data/` — Bundled Aera reference data (21 UI components, 22 PB nodes, orchestration patterns)
- **Types:** Zod schemas in `schemas/`, TypeScript types inferred from them in `types/`

**Key design decisions:**
- Default: fully offline via Ollama. Optional cloud: vLLM on RunPod H100/A100 via `--backend vllm`.
- Target models: Qwen 2.5 8B for triage, 32B for reasoning.
- Hardware constraint: 36GB Apple Silicon — max ~32B quantized models locally.
- Pure functions with no I/O side effects in core logic (triage, scoring).
- Result type pattern: `{ success: true; data: T } | { success: false; error: string }`

**Cloud backend (v1.1):**
- `--backend vllm --vllm-url URL --concurrency N` for user-managed vLLM servers
- `--backend vllm` with `RUNPOD_API_KEY` in `.env` auto-provisions RunPod serverless endpoint
- RunPod API domain is `api.runpod.ai` (NOT `api.runpod.io` — common mistake)
- RunPod Serverless requires separate permissions from Pods; API key needs "All" or "Serverless" scope
- The `.env` file is at repo root; `dotenv/config` is imported in `cli.ts`

## Architecture: Agent Harness (seed/)

- **Orchestrator:** `lib/orchestrator.ts` — Hand-written agentic loop (no LangChain/CrewAI), async generator yielding SSE events
- **Providers:** `lib/providers/` — Abstract base with Anthropic and OpenAI implementations
- **Tools:** `lib/tools/registry.ts` — Singleton tool registry (web search, fetch, file I/O, Composio)
- **API:** `app/api/chat/route.ts` — SSE streaming over POST
- **Config:** `config.ts` — Per-agent settings (maxRounds, systemPrompt)

## Conventions

- **Testing:** Node.js built-in `node:test` module with `assert/strict`. Co-located test files (`*.test.ts`). TDD approach — tests first.
- **Test fixtures:** `makeL3()`, `makeL4()` helper factories for minimal test objects.
- **TypeScript:** Strict mode, ES2022 target, NodeNext module resolution, ES module imports.
- **Naming:** camelCase functions/vars, PascalCase types, UPPERCASE constants (e.g., `TIER1_VALUE_THRESHOLD`).
- **Git commits:** `<type>(<scope>): <message>` — e.g., `feat(03-02): implement triage pipeline with TDD`
- **Planning:** `.planning/` directory tracks phases, requirements, and roadmap. Each phase has PLAN.md and SUMMARY.md.

## Planning System

The `.planning/` directory is managed by the GSD workflow system:
- `PROJECT.md` — Project charter and key decisions
- `ROADMAP.md` — 14-phase roadmap across 2 milestones (v1.0 + v1.1)
- `MILESTONES.md` — Shipped milestone records with stats and accomplishments
- `STATE.md` — Current progress tracking
- `milestones/` — Archived roadmaps, requirements, phases per shipped version
- `phases/` — Active phase plans, summaries, and verification docs
