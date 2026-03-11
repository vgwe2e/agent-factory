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
import type { ZodSchema } from "zod";
import { type ValidatedResult } from "../scoring/ollama-client.js";
export interface RetryPolicyOptions<T> {
    /** Primary LLM call function returning raw JSON string */
    primaryCall: () => Promise<string>;
    /** Optional fallback LLM call function (different prompt/model) */
    fallbackCall?: () => Promise<string>;
    /** Zod schema for response validation */
    schema: ZodSchema<T>;
    /** Maximum retry attempts per tier (default 3) */
    maxRetries?: number;
    /** Label for logging context */
    label: string;
}
export interface ResilientResult<T> {
    /** Validated result from whichever tier succeeded, or failure */
    result: ValidatedResult<T>;
    /** Which tier resolved the call */
    resolvedVia: "primary" | "fallback" | "skipped";
    /** Reason for skip (populated when resolvedVia is "skipped") */
    skipReason?: string;
}
/**
 * Execute an LLM call with three-tier resilience:
 * primary retry -> fallback retry -> skip-and-log.
 */
export declare function callWithResilience<T>(options: RetryPolicyOptions<T>): Promise<ResilientResult<T>>;
