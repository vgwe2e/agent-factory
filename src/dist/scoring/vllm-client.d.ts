/**
 * vLLM client adapter: ChatFn-compatible wrapper for vLLM's
 * OpenAI-compatible /v1/chat/completions endpoint.
 *
 * Drop-in replacement for ollamaChat -- same ChatResult return type,
 * same message/format parameters. Translates Ollama-style JSON schema
 * format to vLLM's response_format via schema-translator.
 *
 * Never throws -- all errors channeled through ChatResult union.
 */
import type { ChatResult } from "./ollama-client.js";
export declare const VLLM_TIMEOUT_MS = 300000;
export declare const VLLM_TEMPERATURE = 0;
/** ChatFn signature used throughout the scoring pipeline. */
type ChatFn = (messages: Array<{
    role: string;
    content: string;
}>, format: Record<string, unknown>) => Promise<ChatResult>;
/**
 * Create a ChatFn that calls a vLLM server's OpenAI-compatible API.
 *
 * @param baseUrl - vLLM server base URL (e.g., "http://localhost:8000")
 * @param model - Model name/path loaded in vLLM
 * @returns ChatFn-compatible async function
 */
export declare function createVllmChatFn(baseUrl: string, model: string, apiKey?: string): ChatFn;
export {};
