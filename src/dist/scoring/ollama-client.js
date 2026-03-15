/**
 * Ollama scoring client with retry-and-validate.
 *
 * Provides two functions:
 * - ollamaChat: thin wrapper around Ollama /api/chat with format parameter
 * - scoreWithRetry: generic retry wrapper with Zod validation and exponential backoff
 *
 * Follows project conventions: Result type (success/error union), no exceptions,
 * error strings include context.
 */
// -- Constants --
export const OLLAMA_CHAT_API = "http://localhost:11434/api/chat";
export const SCORING_MODEL = "qwen3:30b";
/**
 * Per-call timeout for Ollama chat requests.
 *
 * Rationale: The 30B MoE model (qwen3:30b Q4_K_M) on Apple Silicon 36GB
 * has highly variable inference times:
 * - Simple prompts: 2-5 minutes
 * - Complex multi-system integration prompts: 10-18 minutes
 *
 * 25 minutes provides a safe ceiling that accommodates the slowest prompts
 * without being so large that a genuinely stuck request blocks the pipeline
 * for an unreasonable time. If this timeout fires, the model is likely hung
 * (not just slow), because even the most complex prompts complete within 18 min.
 */
export const SCORING_TIMEOUT_MS = 1_500_000; // 25 minutes per call
export const SCORING_TEMPERATURE = 0;
// -- Functions --
/**
 * Send a chat request to Ollama /api/chat with schema-constrained JSON output.
 *
 * @param messages - Array of system/user message pairs
 * @param format - JSON schema object for Ollama's format parameter
 * @param model - Model name to use (default: SCORING_MODEL). Backward compatible.
 * @param timeoutMs - Per-call timeout in ms (default: SCORING_TIMEOUT_MS). Override for faster models.
 * @returns Result with response content and duration, or error string
 */
export async function ollamaChat(messages, format, model = SCORING_MODEL, timeoutMs = SCORING_TIMEOUT_MS) {
    try {
        const response = await fetch(OLLAMA_CHAT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                format,
                options: { temperature: SCORING_TEMPERATURE },
            }),
            signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) {
            return {
                success: false,
                error: `Ollama returned HTTP ${response.status}: ${response.statusText}`,
            };
        }
        const data = (await response.json());
        const durationMs = data.total_duration
            ? Math.round(data.total_duration / 1_000_000) // nanoseconds to ms
            : 0;
        return { success: true, content: data.message.content, durationMs };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Distinguish connection refused (Ollama down) from timeout (model slow/hung).
        // Connection refused resolves in <1 second; no point waiting 25 minutes.
        const isConnectionRefused = message.includes("ECONNREFUSED") ||
            message.includes("fetch failed") ||
            message.includes("ECONNRESET");
        if (isConnectionRefused) {
            return {
                success: false,
                error: `Ollama connection failed (is it running?): ${message}`,
            };
        }
        return { success: false, error: `Ollama chat failed: ${message}` };
    }
}
/**
 * Generic retry wrapper: calls callFn, JSON.parse the result, validates with
 * Zod schema. Retries with exponential backoff on failure.
 *
 * @param schema - Zod schema to validate parsed JSON
 * @param callFn - Async function that returns raw JSON string from LLM
 * @param maxRetries - Maximum number of attempts (default 3)
 * @param logger - Optional pino logger. Falls back to console.error if not provided.
 * @returns Validated data or error string
 */
export async function scoreWithRetry(schema, callFn, maxRetries = 3, logger) {
    const errors = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const raw = await callFn();
            const parsed = JSON.parse(raw);
            const validated = schema.parse(parsed);
            return { success: true, data: validated };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            errors.push(`Attempt ${attempt + 1}: ${message}`);
            const isTimeout = message.toLowerCase().includes("timeout") ||
                message.toLowerCase().includes("aborted");
            const isConnectionError = message.includes("ECONNREFUSED") ||
                message.includes("connection failed");
            if (logger) {
                logger.error(`[scoreWithRetry] Attempt ${attempt + 1}/${maxRetries} failed: ${message}`);
            }
            else {
                console.error(`[scoreWithRetry] Attempt ${attempt + 1}/${maxRetries} failed: ${message}`);
            }
            // Don't retry timeouts — if the model hung once, it'll hang again.
            // Don't retry connection errors — Ollama is down, retrying won't help.
            if (isTimeout || isConnectionError) {
                break;
            }
            if (attempt < maxRetries - 1) {
                const delayMs = 1000 * Math.pow(2, attempt);
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
    return {
        success: false,
        error: `Failed after ${maxRetries} attempts. Errors: ${errors.join("; ")}`,
    };
}
