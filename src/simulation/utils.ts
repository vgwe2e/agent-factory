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
export function extractMermaidBlock(raw: string): string {
  const fenceMatch = raw.match(/```(?:mermaid)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return raw.trim();
}

/**
 * Extract YAML content from markdown code fence (```yaml or ```yml).
 * Returns raw content if no fence is present.
 */
export function extractYamlBlock(raw: string): string {
  const fenceMatch = raw.match(/```(?:ya?ml)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return raw.trim();
}

/**
 * Convert an opportunity name to a URL-safe slug.
 * Lowercase, replace non-alphanumeric with hyphens, strip leading/trailing hyphens.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
