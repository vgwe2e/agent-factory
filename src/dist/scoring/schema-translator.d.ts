/**
 * Schema translator: Ollama format to vLLM response_format.
 *
 * Translates the raw JSON schema objects used by the Ollama client
 * into vLLM's OpenAI-compatible response_format structure, and provides
 * pre-flight validation to catch schema incompatibilities before a run.
 *
 * Key transformations:
 * - Wraps schema in { type: "json_schema", json_schema: { name, strict, schema } }
 * - Strips $schema key (zodToJsonSchema adds it; vLLM rejects it)
 * - Strips root-level additionalProperties: false (vLLM xgrammar may choke)
 * - Resolves internal $ref references (zodToJsonSchema produces these for repeated shapes)
 */
export interface VllmResponseFormat {
    type: "json_schema";
    json_schema: {
        name: string;
        strict: true;
        schema: Record<string, unknown>;
    };
}
export type SchemaValidationResult = {
    valid: true;
} | {
    valid: false;
    errors: Array<{
        schema: string;
        reason: string;
    }>;
};
/**
 * Translate an Ollama-style format (raw JSON schema) to vLLM's
 * OpenAI-compatible response_format structure.
 *
 * Strips $schema, root-level additionalProperties: false, and
 * resolves internal $ref references.
 */
export declare function translateToResponseFormat(ollamaFormat: Record<string, unknown>): VllmResponseFormat;
/**
 * Pre-flight validation: import the three scoring schemas, translate
 * them for vLLM, and verify structural compatibility.
 *
 * Uses zodToJsonSchema with $refStrategy: "none" to produce schemas
 * without $ref (since vLLM xgrammar does not support $ref).
 */
export declare function validateScoringSchemas(): SchemaValidationResult;
