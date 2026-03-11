/**
 * Utility functions for simulation artifact processing.
 *
 * Provides helpers for extracting content from LLM markdown code fences
 * and generating URL-safe slugs from opportunity names.
 */
/**
 * Extract Mermaid diagram content from markdown code fence.
 * Returns raw content if no fence is present.
 */
export declare function extractMermaidBlock(raw: string): string;
/**
 * Extract YAML content from markdown code fence (```yaml or ```yml).
 * Returns raw content if no fence is present.
 */
export declare function extractYamlBlock(raw: string): string;
/**
 * Convert an opportunity name to a URL-safe slug.
 * Lowercase, replace non-alphanumeric with hyphens, strip leading/trailing hyphens.
 */
export declare function slugify(name: string): string;
