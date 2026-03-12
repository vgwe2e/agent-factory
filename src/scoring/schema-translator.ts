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

import { zodToJsonSchema } from "zod-to-json-schema";
import {
  TechnicalLensSchema,
  AdoptionLensSchema,
  ValueLensSchema,
} from "./schemas.js";

// -- Types --

export interface VllmResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
}

export type SchemaValidationResult =
  | { valid: true }
  | { valid: false; errors: Array<{ schema: string; reason: string }> };

// -- Unsupported keywords for vLLM xgrammar --

const UNSUPPORTED_KEYWORDS = [
  "patternProperties",
  "if",
  "then",
  "else",
  "oneOf",
  "anyOf",
  "$ref",
];

// -- Internal helpers --

/**
 * Resolve all internal $ref pointers in a JSON schema object.
 * Only handles local references (starting with #/).
 */
function resolveRefs(
  schema: Record<string, unknown>,
  root: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (key === "$ref" && typeof value === "string" && value.startsWith("#/")) {
      // Resolve the reference path
      const refPath = value.slice(2).split("/"); // Remove "#/" prefix
      let resolved: unknown = root;
      for (const segment of refPath) {
        if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
          resolved = (resolved as Record<string, unknown>)[segment];
        } else {
          resolved = undefined;
          break;
        }
      }

      if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
        // Recursively resolve refs in the resolved object too
        const resolvedObj = resolveRefs(
          resolved as Record<string, unknown>,
          root,
        );
        // Merge resolved object into result (replacing the $ref)
        Object.assign(result, resolvedObj);
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = resolveRefs(value as Record<string, unknown>, root);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? resolveRefs(item as Record<string, unknown>, root)
          : item,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Check a schema (recursively) for unsupported JSON Schema keywords.
 */
function findUnsupportedKeywords(
  schema: Record<string, unknown>,
  path: string = "",
): string[] {
  const found: string[] = [];

  for (const [key, value] of Object.entries(schema)) {
    if (UNSUPPORTED_KEYWORDS.includes(key)) {
      found.push(`${path ? path + "." : ""}${key}`);
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      found.push(
        ...findUnsupportedKeywords(value as Record<string, unknown>, path ? `${path}.${key}` : key),
      );
    }
    if (Array.isArray(value)) {
      for (const [i, item] of value.entries()) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          found.push(
            ...findUnsupportedKeywords(
              item as Record<string, unknown>,
              `${path ? path + "." : ""}${key}[${i}]`,
            ),
          );
        }
      }
    }
  }

  return found;
}

// -- Public API --

/**
 * Translate an Ollama-style format (raw JSON schema) to vLLM's
 * OpenAI-compatible response_format structure.
 *
 * Strips $schema, root-level additionalProperties: false, and
 * resolves internal $ref references.
 */
export function translateToResponseFormat(
  ollamaFormat: Record<string, unknown>,
): VllmResponseFormat {
  // Work on a deep copy to avoid mutating input
  const schema = JSON.parse(JSON.stringify(ollamaFormat)) as Record<string, unknown>;

  // Resolve $ref references before any other processing
  const resolved = resolveRefs(schema, schema);

  // Strip $schema key
  delete resolved.$schema;

  // Strip root-level additionalProperties if false
  if (resolved.additionalProperties === false) {
    delete resolved.additionalProperties;
  }

  return {
    type: "json_schema",
    json_schema: {
      name: "response",
      strict: true,
      schema: resolved,
    },
  };
}

/**
 * Pre-flight validation: import the three scoring schemas, translate
 * them for vLLM, and verify structural compatibility.
 *
 * Uses zodToJsonSchema with $refStrategy: "none" to produce schemas
 * without $ref (since vLLM xgrammar does not support $ref).
 */
export function validateScoringSchemas(): SchemaValidationResult {
  const schemas = [
    { name: "technical", zod: TechnicalLensSchema },
    { name: "adoption", zod: AdoptionLensSchema },
    { name: "value", zod: ValueLensSchema },
  ];

  const errors: Array<{ schema: string; reason: string }> = [];

  for (const { name, zod } of schemas) {
    // Generate JSON schema without $ref for vLLM compatibility
    const jsonSchema = zodToJsonSchema(zod as never, {
      $refStrategy: "none",
    }) as Record<string, unknown>;

    // Translate to vLLM format
    const translated = translateToResponseFormat(jsonSchema);
    const schema = translated.json_schema.schema;

    // Structural check: must be type "object"
    if (schema.type !== "object") {
      errors.push({ schema: name, reason: "Schema must have type \"object\"" });
      continue;
    }

    // Structural check: must have properties
    if (
      !schema.properties ||
      typeof schema.properties !== "object" ||
      Object.keys(schema.properties as object).length === 0
    ) {
      errors.push({ schema: name, reason: "Schema must have non-empty properties" });
      continue;
    }

    // Check for unsupported keywords in the translated schema
    const unsupported = findUnsupportedKeywords(schema);
    if (unsupported.length > 0) {
      errors.push({
        schema: name,
        reason: `Unsupported keywords found: ${unsupported.join(", ")}`,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
