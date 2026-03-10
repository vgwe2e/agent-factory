# Agentic Harness

Minimal, self-hosted agentic AI harness with tool use and streaming. No frameworks, no SDKs, no database. Just a hand-written orchestration loop, model-agnostic provider layer, and a clean chat UI.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (app/page.tsx)                                    │
│  Chat UI with streaming, tool call visualization, rounds    │
└─────────────────────┬───────────────────────────────────────┘
                      │ POST /api/chat (SSE stream)
┌─────────────────────▼───────────────────────────────────────┐
│  API Route (app/api/chat/route.ts)                          │
│  Validates input, streams AgentStreamEvents back to client  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Orchestrator (lib/orchestrator.ts)                         │
│  The agentic loop:                                          │
│    1. Send history + tools to LLM                           │
│    2. Stream response (text + tool calls)                   │
│    3. Execute tool calls                                    │
│    4. Append results to history                             │
│    5. Repeat until done or max rounds                       │
│    6. If max rounds hit, final call without tools           │
└────────┬────────────────────────────┬───────────────────────┘
         │                            │
┌────────▼────────────┐  ┌────────────▼──────────────────────────┐
│  Provider Layer     │  │  Tool Registry                        │
│  ├─ base.ts         │  │  ├─ registry.ts (register/lookup)     │
│  ├─ anthropic.ts    │  │  ├─ web-search.ts (DuckDuckGo)       │
│  ├─ openai.ts       │  │  ├─ web-fetch.ts (Readability)       │
│  └─ factory.ts      │  │  ├─ file-write.ts (local files)      │
│  (reads PROVIDER    │  │  ├─ file-read.ts (read files)        │
│   + MODEL from env) │  │  ├─ composio-search.ts (discover)    │
└─────────────────────┘  │  ├─ composio-execute.ts (run tools)  │
                         │  └─ composio-connections.ts (auth)    │
                         └──────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> agentic-harness
cd agentic-harness
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set your PROVIDER, MODEL, and API key

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Supported Providers

| Provider | Env Vars | Example Models |
|---|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6`, `claude-haiku-4-5-20251001` |
| `openai` | `OPENAI_API_KEY` | `gpt-4o`, `gpt-4o-mini` |
| `openrouter` | `OPENROUTER_API_KEY` | `anthropic/claude-sonnet-4-6`, `google/gemini-2.5-flash` |
| `ollama` | `OLLAMA_BASE_URL` (optional) | `llama3`, `mistral`, `qwen2` |

Switch models by changing `PROVIDER` and `MODEL` in `.env`. No code changes needed.

## Adding Custom Tools

1. Create a new file in `lib/tools/`:

```typescript
// lib/tools/my-tool.ts
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'my_tool',
  description: 'What this tool does — the LLM reads this to decide when to use it',
  parameters: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'The input parameter',
      },
    },
    required: ['input'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const input = args.input as string
  // Your tool logic here — always return a string
  return `Result for: ${input}`
}
```

2. Register it in `app/api/chat/route.ts`:

```typescript
import * as myTool from '@/lib/tools/my-tool'

// Inside ensureTools():
registerTool(myTool)
```

That's it. The orchestrator will automatically include it in LLM calls.

## Built-in Tools

| Tool | API Key | Description |
|---|---|---|
| `web_search` | None (DuckDuckGo) | General web search, returns titles + URLs + snippets |
| `web_fetch` | None | Fetch a page and extract readable content via Readability |
| `file_write` | None | Write content to the `./output/` directory |
| `file_read` | None | Read any file from disk by path |
| `composio_search_tools` | `COMPOSIO_API_KEY` | Search 250k+ API tools by description. Returns slugs, schemas, auth requirements |
| `composio_execute_tool` | `COMPOSIO_API_KEY` | Execute any discovered Composio tool by slug with JSON arguments |
| `composio_manage_connections` | `COMPOSIO_API_KEY` | Check active auth connections or initiate new OAuth/API key flows |

All tools return strings (including errors — they never throw).

## Composio Workflow

Instead of hardcoded API integrations, the harness uses 3 Composio meta-tools to access any API dynamically:

1. **Search** — `composio_search_tools("search reddit posts")` → returns matching tool slugs + input schemas
2. **Connect** — `composio_manage_connections(action: "check", toolkit: "reddit")` → verify auth is active
3. **Execute** — `composio_execute_tool("REDDIT_SEARCH_POSTS", '{"query": "..."}')` → run the tool

This replaces individual API keys (Serper, GitHub token, Reddit OAuth) with a single `COMPOSIO_API_KEY` that manages auth for all services.

## Key Design Decisions

- **No framework dependency** — the orchestration loop is hand-written, not LangChain/CrewAI
- **Model-agnostic** — swap models by changing env vars
- **Native fetch** — no SDKs, full control over request/response
- **SSE over POST** — not EventSource (which is GET-only)
- **Tool loop with max rounds** — agent keeps calling tools until done or hits the limit
- **Provider/orchestrator separation** — the loop doesn't know which model it's talking to
- **No database** — fully stateless, in-memory only

## Configuration

Edit `config.ts` to change:

- `maxRounds` — max agentic loop iterations (default: 10)
- `maxToolResultChars` — truncate long tool results (default: 3000)
- `systemPrompt` — the agent's personality and instructions

## File Structure

```
agentic-harness/
├── app/
│   ├── page.tsx              # Chat UI (single page)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind + chat styles
│   └── api/chat/route.ts     # SSE streaming endpoint
├── lib/
│   ├── types.ts              # Shared TypeScript types
│   ├── orchestrator.ts       # Core agentic loop
│   ├── provider-factory.ts   # Reads env, returns provider
│   ├── providers/
│   │   ├── base.ts           # Abstract provider interface
│   │   ├── anthropic.ts      # Anthropic Messages API
│   │   └── openai.ts         # OpenAI-compatible API
│   └── tools/
│       ├── registry.ts       # Tool registration + lookup
│       ├── web-search.ts     # DuckDuckGo search
│       ├── web-fetch.ts      # Page fetch + Readability
│       ├── file-write.ts     # Write to ./output/
│       ├── file-read.ts      # Read files from disk
│       ├── composio-search.ts     # Discover Composio tools
│       ├── composio-execute.ts    # Execute Composio tools
│       └── composio-connections.ts # Manage Composio auth
├── config.ts                 # Agent config
├── output/                   # Tool file output directory
├── .env.example              # Environment template
└── package.json
```

## License

MIT
