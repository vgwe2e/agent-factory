# agent-factory

An autonomous agent that researches real problems and builds specialized open-source agents to solve them.

Inspired by [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) — same autonomous loop pattern, different domain. Instead of optimizing neural network training, this agent discovers real-world pain points and ships working agents.

## How It Works

```
┌──────────────────────────────────────────────────────┐
│  program.md (human writes this)                      │
│  Instructions, constraints, research strategy        │
└───────────────────────┬──────────────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │      THE LOOP              │
          │                            │
          │  1. Research — find real    │
          │     problems from Reddit,  │
          │     HN, GitHub, Twitter    │
          │                            │
          │  2. Score — demand × gap   │
          │     × buildable            │
          │                            │
          │  3. Build — fork seed      │
          │     harness, add 2-3       │
          │     specialized tools      │
          │                            │
          │  4. Validate — does it     │
          │     actually work?         │
          │                            │
          │  5. Ship or discard        │
          │                            │
          │  6. Document & reflect     │
          │                            │
          │  7. GOTO 1                 │
          └────────────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │  Output:                   │
          │  - Shipped agent repos     │
          │  - Research log            │
          │  - Build results           │
          │  - Meta-reflections        │
          └────────────────────────────┘
```

## The Karpathy Pattern

| autoresearch | agent-factory |
|---|---|
| GPU | API key ring |
| `train.py` | seed harness + specialized tools |
| `val_bpb` metric | Venture Score (checklist, max 6) |
| git reset on failure | discard build, keep research |
| "NEVER STOP" | "NEVER STOP" |
| Simplicity criterion | 2-3 tools max, self-contained |
| `results.tsv` | `results.tsv` + `research-log.md` |

## Repo Structure

```
agent-factory/
├── program.md              # Agent instructions (human edits)
├── .env.example            # Available API keys template
├── .env                    # Actual keys (gitignored)
├── seed/                   # Base agentic harness (read-only)
│   └── lib/tools/          # 7 built-in tools (see below)
├── research/
│   ├── research-log.md     # All findings, scored and documented
│   ├── build-queue.md      # Prioritized problems to build next
│   └── reflections/        # Meta-reflections every 5 builds
├── builds/                 # Generated agents (before GitHub push)
│   └── <agent-name>/
├── results.tsv             # All build attempts (shipped/failed/crashed)
└── .gitignore
```

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Dominien/agentic-harness agent-factory
cd agent-factory

# 2. Add your seed harness
cp -r /path/to/agentic-harness seed/

# 3. Configure keys
cp .env.example .env
# Fill in whatever API keys you have

# 4. Point your AI agent at program.md and let it run
```

## What Gets Produced

After an overnight session:
- **Research log** with 10-20 scored, documented problems
- **3-5 build attempts** logged in results.tsv
- **1-5 shipped agent repos** ready for GitHub
- **Meta-reflections** on what patterns work and what doesn't

The research compounds. Each session builds on the last.

## Seed Harness Tools

The seed harness ships with 7 tools that cover the full research-and-build workflow:

| Tool | Key Required | Purpose |
|---|---|---|
| `web_search` | — | DuckDuckGo search for general queries |
| `web_fetch` | — | Fetch + extract readable content from any URL |
| `file_write` | — | Save reports and artifacts to disk |
| `file_read` | — | Read files (configs, logs, previous output) |
| `composio_search_tools` | `COMPOSIO_API_KEY` | Discover any of 250k+ API tools by description |
| `composio_execute_tool` | `COMPOSIO_API_KEY` | Execute a discovered tool by slug with JSON arguments |
| `composio_manage_connections` | `COMPOSIO_API_KEY` | Check or initiate auth connections for any service |

A single `COMPOSIO_API_KEY` replaces all individual API keys (Serper, GitHub, Reddit, etc.). Composio manages OAuth and API key auth for all services.

When building agents, you fork the seed and swap in 2-3 specialized tools — but the meta-agent uses all 7 during research and shipping.

## Design Principles

1. **Local-first** — No databases, no hosted state. Files + git.
2. **2-3 tools per agent** — Gather → Process → Output. Never more.
3. **Self-contained** — Each built agent: clone, add .env, `npm run dev`. Done.
4. **Research is a product** — Even failed builds produce documented knowledge.
5. **Simplicity wins** — Borrowed from Karpathy: simpler beats clever at equal performance.

## License

MIT
