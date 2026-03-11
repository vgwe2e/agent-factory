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
import type { ZodSchema } from "zod";
import type { Logger } from "../infra/logger.js";
export declare const OLLAMA_CHAT_API = "http://localhost:11434/api/chat";
export declare const SCORING_MODEL = "qwen2.5:32b";
export declare const SCORING_TIMEOUT_MS = 120000;
export declare const SCORING_TEMPERATURE = 0;
export type ChatResult = {
    success: true;
    content: string;
    durationMs: number;
} | {
    success: false;
    error: string;
};
export type ValidatedResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
/**
 * Send a chat request to Ollama /api/chat with schema-constrained JSON output.
 *
 * @param messages - Array of system/user message pairs
 * @param format - JSON schema object for Ollama's format parameter
 * @param model - Model name to use (default: SCORING_MODEL). Backward compatible.
 * @returns Result with response content and duration, or error string
 */
export declare function ollamaChat(messages: Array<{
    role: string;
    content: string;
}>, format: Record<string, unknown>, model?: string): Promise<ChatResult>;
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
export declare function scoreWithRetry<T>(schema: ZodSchema<T>, callFn: () => Promise<string>, maxRetries?: number, logger?: Logger): Promise<ValidatedResult<T>>;
