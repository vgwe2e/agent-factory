# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Agent Loop with Tool Registry and Provider Abstraction

**Key Characteristics:**
- Streaming-first architecture for real-time LLM responses
- Multi-provider LLM support (Anthropic, OpenAI, OpenRouter, Ollama)
- Pluggable tool system via centralized registry
- Server-side orchestration with client-side visualization

## Layers

**API/Routing Layer:**
- Purpose: Handle HTTP requests and stream LLM responses to clients
- Location: `app/api/chat/route.ts`
- Contains: POST endpoint for chat messages, streaming setup
- Depends on: Orchestrator, tool registry
- Used by: Client frontend

**Orchestration Layer:**
- Purpose: Core agent loop that manages LLM calls, tool execution, and context history
- Location: `lib/orchestrator.ts`
- Contains: `runAgent()` generator function that yields stream events
- Depends on: Provider factory, tool registry, types
- Used by: API route, client for streaming

**Provider Layer:**
- Purpose: Abstract LLM API differences behind a common interface
- Location: `lib/providers/base.ts` (abstract), `lib/providers/anthropic.ts`, `lib/providers/openai.ts`
- Contains: Provider implementations that handle model streaming
- Depends on: Types
- Used by: Provider factory, orchestrator

**Tool System Layer:**
- Purpose: Register and execute tools available to the agent
- Location: `lib/tools/registry.ts` (registry), `lib/tools/*.ts` (implementations)
- Contains: Tool definitions and execution logic for: web_search, web_fetch, file_write, file_read, composio_search_tools, composio_execute_tool, composio_manage_connections
- Depends on: Types
- Used by: Orchestrator, API route (registration)

**Configuration Layer:**
- Purpose: Agent behavior settings
- Location: `config.ts`
- Contains: maxRounds, maxToolResultChars, systemPrompt
- Depends on: None
- Used by: Orchestrator

**UI/Client Layer:**
- Purpose: Chat interface for user interaction and response visualization
- Location: `app/page.tsx`, `app/layout.tsx`
- Contains: React component with message history, streaming status, tool result cards
- Depends on: Types (ChatMessage, AgentStreamEvent, etc.)
- Used by: Browser

## Data Flow

**Agent Loop (Main Flow):**

1. User sends message via `/api/chat` POST with message history
2. API route ensures tools are registered and calls `runAgent()`
3. Orchestrator streams LLM response through provider
4. As chunks arrive, orchestrator yields `StreamChunk` events (text, tool_call_start, tool_call_delta, tool_call_end, done)
5. Orchestrator parses completed tool calls and yields `AgentStreamEvent` with type 'tool_calls'
6. For each tool call, orchestrator retrieves tool from registry and executes it
7. Tool results are yielded as `AgentStreamEvent` with type 'tool_result'
8. Results are appended to history and loop continues (LLM sees results)
9. Loop exits when LLM stops calling tools or maxRounds is reached
10. Final `AgentStreamEvent` with type 'done' sent with token usage

**Streaming Path:**

1. API creates ReadableStream with AsyncGenerator source
2. Each event is JSON stringified and sent as `data: <json>\n\n` (Server-Sent Events format)
3. Client's `fetch()` with response.body.getReader() consumes stream
4. Client parses events and updates local state (messages, streamContent, toolCalls, tokenUsage)
5. UI re-renders based on stream events

**State Management:**

- Conversation history: Passed to orchestrator, returned to client as messages array
- Tool registry: Singleton Map in memory, populated on first request
- Streaming state: Temporary local state in client (streamContent, streamToolCalls, streamToolResults) - persisted to messages array after stream completes
- Session state: All per-request (stateless API)

## Key Abstractions

**BaseProvider:**
- Purpose: Abstract interface for LLM APIs
- Examples: `lib/providers/base.ts`, `lib/providers/anthropic.ts`, `lib/providers/openai.ts`
- Pattern: Abstract class with protected methods for message/tool formatting, abstract methods for chat() and stream()

**RegisteredTool:**
- Purpose: Wrapper for a tool with definition and execution logic
- Examples: `lib/tools/web-search.ts` exports definition and execute function
- Pattern: Each tool exports `definition: ToolDefinition` and `execute(args): Promise<string>`

**StreamChunk:**
- Purpose: Internal streaming event from provider (text delta, tool call delta, done signal)
- Examples: `{ type: 'text'; content: string }`, `{ type: 'tool_call_start'; toolCall: { id, name } }`
- Pattern: Discriminated union type used within orchestrator to accumulate incomplete tool calls

**AgentStreamEvent:**
- Purpose: Public streaming event sent to client
- Examples: `{ type: 'text'; content }`, `{ type: 'tool_calls'; toolCalls }`, `{ type: 'done'; usage }`
- Pattern: Discriminated union type, richer than StreamChunk (e.g., complete tool_calls, not deltas)

## Entry Points

**Web UI:**
- Location: `app/page.tsx`
- Triggers: Browser visits `/`
- Responsibilities: User input, message display, tool result visualization, streaming status

**Chat API:**
- Location: `app/api/chat/route.ts`
- Triggers: POST request to `/api/chat` with `{ messages: ChatMessage[] }`
- Responsibilities: Tool registration, orchestrator invocation, Server-Sent Events streaming

**Build Entry:**
- Location: Next.js auto-detects `app/` directory, `next.config.ts` for customization

## Error Handling

**Strategy:** Try-catch at multiple levels with graceful degradation and error streaming

**Patterns:**
- **Provider errors**: Caught in orchestrator, yielded as `AgentStreamEvent` with type 'error'
- **Tool execution errors**: Caught per-tool in orchestrator, result marked with `isError: true`, yielded as 'tool_error' event
- **API request validation**: Input validation in route, returns 400 with error JSON if invalid
- **Stream errors**: Controller.enqueue(error event) in finally block of stream setup
- **Parse errors**: Invalid JSON args in tool calls silently use empty object
- **Missing tools**: Returns ToolResult with isError flag and "Unknown tool" message

## Cross-Cutting Concerns

**Logging:** None — relies on client console and browser network tab for debugging

**Validation:**
- ChatMessage array required and non-empty in API route
- Tool arguments parsed leniently (invalid JSON → empty object)
- File paths sanitized in file_write tool (removes non-alphanumeric except `.` `-` `_`)

**Authentication:**
- API keys via environment variables (ANTHROPIC_API_KEY, OPENAI_API_KEY, COMPOSIO_API_KEY, etc.)
- No user auth — assumes trusted environment

**Token counting:** Tracked across rounds, accumulated in totalPromptTokens and totalCompletionTokens, yielded at each usage event and final done event

**Context limits:** maxToolResultChars truncates results before appending to history to prevent context explosion

---

*Architecture analysis: 2026-03-10*
