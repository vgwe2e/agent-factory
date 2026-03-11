/**
 * Three-tier resilient LLM call wrapper.
 *
 * Wraps scoreWithRetry with fallback prompt and skip-and-log tiers:
 *   1. Primary call with retry (scoreWithRetry)
 *   2. Fallback call with retry (if provided)
 *   3. Skip and log (returns structured failure)
 *
 * Follows project conventions: Result type pattern, camelCase, no thrown exceptions.
 */
import { scoreWithRetry } from "../scoring/ollama-client.js";
// -- Functions --
/**
 * Execute an LLM call with three-tier resilience:
 * primary retry -> fallback retry -> skip-and-log.
 */
export async function callWithResilience(options) {
    const { primaryCall, fallbackCall, schema, maxRetries = 3, label } = options;
    // Tier 1: Primary call with retry
    const primaryResult = await scoreWithRetry(schema, primaryCall, maxRetries);
    if (primaryResult.success) {
        return { result: primaryResult, resolvedVia: "primary" };
    }
    const primaryError = primaryResult.error;
    // Tier 2: Fallback call with retry (if provided)
    if (fallbackCall) {
        const fallbackResult = await scoreWithRetry(schema, fallbackCall, maxRetries);
        if (fallbackResult.success) {
            return { result: fallbackResult, resolvedVia: "fallback" };
        }
    }
    // Tier 3: Skip and log
    return {
        result: { success: false, error: primaryError },
        resolvedVia: "skipped",
        skipReason: primaryError,
    };
}
