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
export const SCORING_MODEL = "qwen2.5:32b";
export const SCORING_TIMEOUT_MS = 120_000; // 2 minutes per call
export const SCORING_TEMPERATURE = 0;
// -- Functions --
/**
 * Send a chat request to Ollama /api/chat with schema-constrained JSON output.
 *
 * @param messages - Array of system/user message pairs
 * @param format - JSON schema object for Ollama's format parameter
 * @param model - Model name to use (default: SCORING_MODEL). Backward compatible.
 * @returns Result with response content and duration, or error string
 */
export async function ollamaChat(messages, format, model = SCORING_MODEL) {
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
            signal: AbortSignal.timeout(SCORING_TIMEOUT_MS),
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
            if (logger) {
                logger.error(`[scoreWithRetry] Attempt ${attempt + 1}/${maxRetries} failed: ${message}`);
            }
            else {
                console.error(`[scoreWithRetry] Attempt ${attempt + 1}/${maxRetries} failed: ${message}`);
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
