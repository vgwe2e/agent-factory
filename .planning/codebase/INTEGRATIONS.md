# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**LLM Provider (Choice of):**
- Anthropic Claude API - Via native Messages API (`lib/providers/anthropic.ts`)
  - Supported models: claude-sonnet-4-6 (default), other Claude models
  - Auth: `ANTHROPIC_API_KEY` environment variable
  - Protocol: REST API with streaming support via Server-Sent Events
  - Endpoint: `https://api.anthropic.com/v1/messages`

- OpenAI-compatible APIs - Via OpenAI provider class (`lib/providers/openai.ts`)
  - OpenAI Chat Completions API
    - Auth: `OPENAI_API_KEY`
    - Endpoint: `https://api.openai.com/v1/chat/completions`
  - OpenRouter (multi-model gateway)
    - Auth: `OPENROUTER_API_KEY`
    - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
    - Allows access to 100+ models through single API
  - Ollama (local LLM)
    - Auth: No key required (local)
    - Endpoint: `http://localhost:11434/v1` (configurable via `OLLAMA_BASE_URL`)

**Web Integration:**
- DuckDuckGo Search - No SDK, direct HTML scraping via `web_search` tool (`lib/tools/web-search.ts`)
  - Endpoint: `https://html.duckduckgo.com/html/`
  - Auth: None (public API, no key required)
  - Returns: Search results with titles, URLs, snippets (up to 8 results)

**Composio - Unified API Gateway:**
- Manages 250k+ API tool integrations (GitHub, Reddit, Google, Slack, Twitter, etc.)
- Auth: `COMPOSIO_API_KEY` environment variable
- Provides three tools:
  1. `composio_search_tools` - Discover tools by natural language query
     - Endpoint: `https://backend.composio.dev/api/v3/tools`
     - Returns: Tool slugs and JSON schemas
  2. `composio_execute_tool` - Execute discovered tools
     - Endpoint: `https://backend.composio.dev/api/v3/tools/execute/{tool_slug}`
     - Supports: Optional connected_account_id for authenticated tools
  3. `composio_manage_connections` - Manage OAuth/API key connections
     - Endpoint: `https://backend.composio.dev/api/v3/connected_accounts`
     - Actions: "check" (list active connections), "initiate" (start new OAuth flow)

## Data Storage

**Databases:**
- None - Stateless application
- All data stored in browser session or external APIs

**File Storage:**
- Local filesystem only (`file_write` and `file_read` tools)
- No cloud storage integration (S3, GCS, etc.)

**Caching:**
- None persistent - All responses generated fresh per request

## Authentication & Identity

**Auth Provider:**
- Multiple provider support - No single identity provider
- LLM providers use individual API keys
- Composio handles OAuth for 250k+ tools via `composio_manage_connections` tool
- No user authentication/authorization system (all requests treated as single user)

## Monitoring & Observability

**Error Tracking:**
- None - Errors returned as tool results or HTTP error responses

**Logs:**
- Console logging only (via browser console for client, server logs for API)
- No external log aggregation (Sentry, Datadog, etc.)

## CI/CD & Deployment

**Hosting:**
- Recommended: Vercel (Next.js native platform)
- Alternative: Any Node.js 20+ hosting (AWS, GCP, Azure, self-hosted)
- Environment: Server-side Node.js runtime for API routes

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or other CI/CD configured

## Environment Configuration

**Required env vars:**
- `COMPOSIO_API_KEY` - For accessing 250k+ Composio tools (get at https://composio.dev)
- `OPENROUTER_API_KEY` - **Default provider** (get at https://openrouter.ai/keys)
- One of: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL` - For LLM provider

**Optional env vars:**
- `PROVIDER` - LLM provider (anthropic, openai, openrouter, ollama) - Default: "openrouter"
- `MODEL` - Model identifier - Default: "anthropic/claude-sonnet-4-6"
- `MAX_TOKENS` - Max completion tokens (integer) - Default: 16384

**Secrets location:**
- `.env` file (Git-ignored, not committed)
- Template: `.env.example` shows required structure

## Webhooks & Callbacks

**Incoming:**
- `/api/chat` - POST endpoint for chat messages
  - Accepts: `{ messages: ChatMessage[] }`
  - Returns: Server-Sent Events stream with agent responses
  - No authentication on endpoint (assumes deployment behind auth layer if needed)

**Outgoing:**
- Composio OAuth callbacks - Users authorize third-party services via `composio_manage_connections`
  - Returns redirect URL to user for OAuth flow completion
  - Connected account IDs returned for use with `composio_execute_tool`

## API Rate Limits & Quotas

**Per-Provider:**
- Anthropic: Depends on plan (pay-per-token)
- OpenAI: Tier-based rate limits and token limits
- OpenRouter: Depends on model and plan
- Ollama: No rate limits (local)
- Composio: Depends on subscription tier
- DuckDuckGo: Undocumented, but no API key required means reasonable limits assumed

**Application:**
- `maxRounds: 10` - Max agentic loop iterations per request (prevents runaway loops)
- `maxToolResultChars: 3000` - Max characters per tool result (prevents context explosion)

## Content Extraction

**Web Content Processing:**
- `@mozilla/readability` - Converts any HTML page to article format
- `linkedom` - Server-side DOM implementation for parsing
- Fallback: Plain text extraction if Readability fails
- Max extraction: 8000 characters per page
- Uses Mozilla's battle-tested article extraction algorithm

---

*Integration audit: 2026-03-10*
