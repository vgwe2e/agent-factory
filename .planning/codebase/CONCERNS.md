# Codebase Concerns

**Analysis Date:** 2026-03-10

## Security Concerns

**Unrestricted File Read Access:**
- Issue: `file_read` tool allows reading any file from disk without path validation
- Files: `seed/lib/tools/file-read.ts`
- Risk: Agent can read sensitive files like `.env`, credentials, private keys, or system files
- Current mitigation: None — no sandboxing or allowlist
- Recommendation: Implement path allowlist (whitelist specific directories) or forbid patterns like `..`, `.env*`, `*.pem`, `*.key`

**Unrestricted File Write Access:**
- Issue: `file_write` sanitizes filenames but does not prevent writing to parent directories or system locations
- Files: `seed/lib/tools/file-write.ts` (line 33)
- Risk: While filename is sanitized (`/[^a-zA-Z0-9._-]/g`), the directory traversal check is weak — only prevents `..` patterns in filename, not full paths
- Current mitigation: Filename character restriction
- Recommendation: Reject paths containing `/`, validate output directory is writable only, use `path.resolve()` and confirm result is under output/ dir

**Unsafe JSON Parsing Without Validation:**
- Issue: Multiple locations parse JSON from untrusted sources (LLM streams, API responses) without catching all error types
- Files:
  - `seed/app/page.tsx` (line 167)
  - `seed/lib/orchestrator.ts` (line 64)
  - `seed/lib/providers/anthropic.ts` (line 159)
  - `seed/lib/providers/openai.ts` (lines 105, 180)
  - `seed/lib/tools/composio-execute.ts` (line 43)
- Risk: Malformed JSON from APIs could cause silent failures, incomplete parsing, or type mismatches
- Recommendation: Add schema validation after JSON.parse (e.g., Zod, Ajv) to ensure structure before use

**External Fetch Requests Without Timeout Protection:**
- Issue: Multiple fetch calls in tools lack timeout or abort signal configuration
- Files:
  - `seed/lib/tools/web-search.ts` (line 27) — no timeout
  - `seed/lib/tools/composio-search.ts` (line 49) — no timeout
  - `seed/lib/tools/composio-execute.ts` (line 59) — no timeout
  - `seed/lib/tools/composio-connections.ts` (lines 53, 87) — no timeout
  - `seed/lib/providers/anthropic.ts` (lines 83, 129) — no timeout
  - `seed/lib/providers/openai.ts` (lines 86, 141) — no timeout
- Risk: Hanging requests, resource exhaustion, DoS
- Recommendation: Set global fetch timeout (e.g., 30s), use `AbortSignal.timeout()` on all fetch calls

**Composio API Key Exposure:**
- Issue: `COMPOSIO_API_KEY` is checked but not rate-limited; agent can make unlimited API calls
- Files:
  - `seed/lib/tools/composio-*.ts`
- Risk: Accidental API quota exhaustion, cost overruns
- Recommendation: Implement request counter and daily/hourly limits before calling Composio

**DuckDuckGo Web Search Parsing:**
- Issue: Regex-based HTML parsing in `web_search` is fragile and can break with DDG layout changes
- Files: `seed/lib/tools/web-search.ts` (line 41)
- Risk: Silently returns 0 results or malformed data if DDG changes HTML structure
- Recommendation: Use official DDG API if available, or add error tracking for parsing failures

---

## Architectural Concerns

**Monolithic Frontend Component:**
- Issue: `app/page.tsx` is 419 lines — handles chat UI, streaming, state management, all event parsing in one file
- Files: `seed/app/page.tsx`
- Impact: Hard to test, maintain, or add features. State management is scattered across multiple useState calls.
- Recommendation: Split into smaller components:
  - `ChatMessages` — renders message list
  - `ChatInput` — handles input and submission
  - `StreamingMessage` — handles active streaming state
  - Custom hook `useAgent()` — encapsulates chat logic and streaming logic
  - Custom hook `useStreamParser()` — encapsulates event parsing

**Tool Result Truncation Strategy Is Fixed:**
- Issue: Tool results truncated to `maxToolResultChars: 3000` globally, but context needs vary by tool
- Files: `seed/lib/orchestrator.ts` (lines 149-155), `seed/config.ts` (line 6)
- Impact: Web fetch results (8000 char limit in tool) may still be truncated to 3000 in history, losing information
- Recommendation: Make truncation configurable per tool or remove hard cap — let LLM decide via system prompt

**No Message History Compression:**
- Issue: Message history grows unbounded — no summarization or pruning when context gets large
- Files: `seed/lib/orchestrator.ts` (line 90-96, 157-163)
- Impact: Long conversations will hit token limits and cause failures
- Recommendation: Implement sliding window (keep last N messages) or summarize old exchanges

**Single Provider Instance Recreated Per Round:**
- Issue: `createProvider()` is called in `runAgent()` on each round (line 20) and again on final summary (line 171)
- Files: `seed/lib/orchestrator.ts`
- Impact: Inefficient — provider is created twice when one would suffice
- Recommendation: Create provider once in function, pass to helper

**Weak Provider Factory Error Handling:**
- Issue: If `process.env.PROVIDER` is invalid or missing, error only thrown at runtime
- Files: `seed/lib/provider-factory.ts` (line 16)
- Impact: Deployment errors discovered late; no early validation
- Recommendation: Validate PROVIDER at app startup (e.g., in `app/layout.tsx` or server.js)

---

## Error Handling Gaps

**Tool Execution Doesn't Distinguish Error Types:**
- Issue: All tool errors (bad args, network, auth) return as plain strings without severity or retry hint
- Files: `seed/lib/orchestrator.ts` (lines 126-145)
- Impact: LLM can't decide whether to retry, ask user for input, or give up
- Recommendation: Return structured error with `{ type, isRetryable, suggestion }`

**Stream Parsing Silently Skips Malformed Events:**
- Issue: Malformed JSON events are caught but silently ignored (try/catch with no logging)
- Files:
  - `seed/app/page.tsx` (line 196-198)
  - `seed/lib/providers/anthropic.ts` (line 160-161)
  - `seed/lib/providers/openai.ts` (line 180-182)
- Impact: Data loss; debugging stream issues is impossible
- Recommendation: Log malformed events (to console in dev, to error tracker in prod)

**Incomplete Tool Results Never Surface as Errors:**
- Issue: If tool execution is cut short or silently fails, the tool still adds truncated result to history
- Files: `seed/lib/orchestrator.ts`
- Impact: LLM sees partial/wrong output but continues as if tool succeeded
- Recommendation: Validate result is non-empty and complete before adding to history

**API Errors From Composio Return Full Response Text:**
- Issue: On Composio API error, response text is sliced to 1000 chars but not sanitized
- Files: `seed/lib/tools/composio-execute.ts` (line 73)
- Risk: Could leak sensitive API details or credentials in error messages
- Recommendation: Parse error response, extract user-facing message only, sanitize before returning

---

## Performance Bottlenecks

**Web Fetch Content Extraction Loads All HTML to Memory:**
- Issue: Full HTML page is fetched and parsed without streaming; large pages (>10MB) could OOM
- Files: `seed/lib/tools/web-fetch.ts` (line 36)
- Impact: Blocks agent on large pages; no timeout on parsing
- Recommendation: Add size check (reject >5MB), use streaming parser if available

**Readability Parse Has No Timeout:**
- Issue: `linkedom` + `Readability` parsing on complex pages could hang indefinitely
- Files: `seed/lib/tools/web-fetch.ts` (lines 42-44)
- Impact: Agent blocked on malformed/adversarial HTML
- Recommendation: Wrap parse in `Promise.race()` with timeout

**No Streaming Backpressure Handling:**
- Issue: Client-side `setStreamContent()` updates on every text chunk without debouncing
- Files: `seed/app/page.tsx` (lines 171-172)
- Impact: High-frequency state updates could cause jank or memory pressure
- Recommendation: Debounce updates or batch them (update every 100ms instead of every chunk)

**DuckDuckGo HTML Regex on Large Pages:**
- Issue: Regex runs on full HTML without size limit
- Files: `seed/lib/tools/web-search.ts` (line 41)
- Impact: Catastrophic backtracking on complex HTML
- Recommendation: Add size check, limit HTML to first 50KB

---

## Dependency and Compatibility Risks

**No Dependency Version Pinning:**
- Issue: `package.json` uses `^` semver for most deps (allows minor/patch updates)
- Files: `seed/package.json`
- Risk: Breaking changes in minor versions (e.g., `react-markdown` format change) could break UI
- Recommendation: Use exact versions (`"react": "19.2.3"` not `"react": "^19"`) or lock with npm-shrinkwrap

**Next.js Version Not Pinned:**
- Issue: `"next": "16.1.6"` is latest, but no lockfile in repo
- Files: `seed/package.json`
- Risk: CI builds could get different dependencies than local
- Recommendation: Commit `package-lock.json` or `pnpm-lock.yaml`

**Readability Library Fork Risk:**
- Issue: Using `@mozilla/readability` but it's unmaintained (last update 2021)
- Files: `seed/lib/tools/web-fetch.ts` (line 39)
- Risk: Won't support new HTML/CSS patterns, DOM changes could cause failures
- Recommendation: Monitor for fork / replacement (e.g., readability.py), or wrap in feature detection

---

## Data Validation and Type Safety

**ChatMessage Role Validation Missing:**
- Issue: Type definition allows role = 'user' | 'assistant' | 'tool', but no runtime validation when parsing messages
- Files: `seed/lib/types.ts` (line 5), `seed/app/api/chat/route.ts` (line 40-45)
- Impact: Invalid role could be sent by client, causing LLM format errors
- Recommendation: Add Zod schema for incoming messages, validate role in POST handler

**Tool Arguments Stored as Record<string, unknown>:**
- Issue: No schema validation when tool arguments arrive from LLM
- Files: `seed/lib/types.ts` (line 15), `seed/lib/orchestrator.ts` (line 64)
- Impact: Tool could receive wrong argument types, missing required args — errors caught at execution time, not parse time
- Recommendation: Generate schemas from tool definitions, validate args before execution

**Anthropic Response Data Parsing Assumes Structure:**
- Issue: Code extracts `data.content` and `data.usage` without checking shape
- Files: `seed/lib/providers/anthropic.ts` (lines 98-110)
- Risk: If Anthropic API response changes, code will silently return undefined/empty values
- Recommendation: Add type guard / schema validation, log if unexpected response shape

---

## Monitoring and Observability

**No Error Logging or Metrics:**
- Issue: All errors are caught and returned as strings to frontend, no backend logging
- Files: Throughout `seed/lib/`
- Impact: Production errors are invisible — can't debug failed requests, API quota overruns, or pattern of failures
- Recommendation: Add logger (e.g., winston, pino) that captures:
  - Tool execution errors with args + result
  - API error responses (status, message, timestamp)
  - Stream parsing failures
  - Provider creation failures

**No Request Duration Tracking:**
- Issue: No metrics on how long API calls take
- Impact: Can't identify slow endpoints, API degradation, or queue buildup
- Recommendation: Wrap fetch calls with timing, log duration > threshold

**Composio API Status Checks:**
- Issue: Code doesn't check Composio backend status before making requests
- Files: `seed/lib/tools/composio-*.ts`
- Risk: Cascading failures if Composio is down
- Recommendation: Add health check, surface status to user before making tool request

---

## Testing and Quality Gaps

**No Unit Tests:**
- Issue: Zero test files in repository
- Impact: Any refactoring is risky; edge cases (malformed JSON, large files, network errors) untested
- Priority: High
- Recommendation:
  - Add `__tests__/` directory with Jest config
  - Test tool execution (mocked fetch)
  - Test streaming parser
  - Test provider factories

**No Integration Tests:**
- Issue: No end-to-end tests of chat flow
- Impact: Regressions in orchestration loop only caught in production
- Recommendation: Add Playwright tests for chat UI, mock API responses

**No Error Scenario Testing:**
- Issue: No tests for timeout, 500 errors, truncated responses, malformed JSON
- Impact: These edge cases only discovered when they happen in production
- Recommendation: Create test fixtures for common failure modes

---

## Operational Concerns

**No Environment Validation:**
- Issue: Missing API keys only discovered when that tool is used
- Files: Each tool checks `process.env.*` individually
- Impact: User gets error mid-conversation when they could have known upfront
- Recommendation: Validate all required env vars at server startup, return error on /api/health before accepting requests

**Composio SDK Complexity:**
- Issue: Three separate Composio tools (search, execute, manage_connections) with different response formats
- Files: `seed/lib/tools/composio-*.ts`
- Impact: Hard to document, easy to use incorrectly, response parsing is fragile (assumes different key names)
- Recommendation: Wrap all Composio calls in facade with consistent error/response shape

**Default Model Hardcoded:**
- Issue: Default model is `claude-sonnet-4-6` in code
- Files: `seed/lib/provider-factory.ts` (line 17)
- Impact: Deployer must read source code to change model, can't use env var alone
- Recommendation: `MODEL` env var with fallback, document the fallback

---

## Known Limitations

**Web Search Unreliable:**
- Issue: DuckDuckGo HTML parsing is fragile; depends on page layout stability
- Files: `seed/lib/tools/web-search.ts`
- Current workaround: Agent can retry with different query
- Long-term: Integrate proper search API (SerpAPI, Google Custom Search)

**Composio Tool Slugs Must Be Discovered at Runtime:**
- Issue: Agent must search for tool slugs before using them; no static catalog or IDE hints
- Files: `seed/lib/tools/composio-search.ts`
- Impact: Extra LLM calls required; tool discovery can be slow
- Workaround: Cache discovered tools in conversation context
- Better: Host static Composio catalog or use Composio SDK instead of raw API

**No Browser Automation:**
- Issue: `web_fetch` can only read static HTML, can't interact with JavaScript-rendered content
- Files: `seed/lib/tools/web-fetch.ts`
- Limitation: Blocks use cases that require click/fill/scroll (Airbnb, job boards, etc.)
- Recommendation: Optional Playwright integration if needed by specific agents

**File Operations Limited to Output Directory:**
- Issue: Can't read arbitrary files on user's machine, only write to `output/`
- Files: `seed/lib/tools/file-*.ts`
- Implication: Agents can't analyze user's own files unless uploaded first
- Recommendation: Document input/ directory for user-provided files, add `file_list` tool

---

## Context Management Risks

**Unbounded Message History:**
- Issue: No mechanism to prune or compress old messages
- Files: `seed/lib/orchestrator.ts`
- Risk: Context window fills up; at some point LLM starts failing with "context too large"
- When it breaks: After ~10-20 messages (rough estimate for 16k token model with tool definitions)
- Fix approach: Implement one of:
  1. Sliding window (keep last 5 messages + full first message)
  2. Summarization (LLM summarizes old exchanges into 1-2 bullet points)
  3. User-initiated clear (button to start new conversation)

**Tool Result Truncation Is Silent:**
- Issue: If tool returns 10MB of data, it's silently truncated to 3000 chars with no indication
- Files: `seed/lib/orchestrator.ts` (line 152-154)
- Impact: LLM thinks it has the full result; may make wrong decisions based on incomplete data
- Recommendation: Add explicit marker in result: `"... [truncated, 15000 chars hidden]"` to signal to LLM

---

## UI/UX Concerns

**No Error Recovery UI:**
- Issue: If stream aborts or error occurs, user sees message but no "retry" button
- Files: `seed/app/page.tsx`
- Impact: User must manually re-type query
- Recommendation: Add retry button on error messages

**Tool Call Display Shows No Status:**
- Issue: Active tool indicator shows name, but not args or progress
- Files: `seed/app/page.tsx` (lines 332-351)
- Impact: User can't see what arguments the agent is using, can't spot mistakes
- Recommendation: Expand tool call display to show arguments in collapsible section

**No Token Cost Visibility:**
- Issue: Token usage shown at bottom, but no cost calculation or model-specific rates
- Files: `seed/app/page.tsx` (lines 408-413)
- Impact: User doesn't know if conversation will be expensive
- Recommendation: Add cost estimate (lookup model pricing from config, display in header)

---

## Git and Build Configuration

**No Build Output Directory in .gitignore:**
- Issue: `next build` output goes to `.next/`, not listed in `.gitignore`
- Files: `seed/.gitignore`
- Risk: `.next/` could be committed accidentally
- Recommendation: Add `.next/` to .gitignore

**No Lockfile in Repository:**
- Issue: `package.json` present but no `package-lock.json` or `yarn.lock`
- Impact: Reproducible builds impossible
- Recommendation: Run `npm install --package-lock-only` and commit package-lock.json

---

## Summary by Priority

**Critical (blocks production use):**
- Unrestricted file read/write access
- Composio API key rate-limiting missing
- No environment validation at startup
- Unbounded message history

**High (causes visible failures):**
- Stream parsing silently skips errors
- Fetch calls lack timeouts
- Web fetch parsing has no timeout
- JSON parsing lacks validation

**Medium (degraded experience):**
- No error recovery UI
- Tool arguments not validated
- Readability library unmaintained
- Single-component frontend

**Low (technical debt):**
- No tests
- No logging
- No TypeScript strict mode enforcement
- Default model hardcoded

---

*Concerns audit: 2026-03-10*
