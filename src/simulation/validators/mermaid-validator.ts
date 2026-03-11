/**
 * Regex-based Mermaid flowchart structural validator.
 *
 * Validates LLM-generated Mermaid diagrams for common structural issues:
 * missing flowchart declaration, missing edges, too few lines, and
 * lowercase "end" (a Mermaid parser gotcha).
 *
 * Does NOT use the full mermaid npm package (2MB+, browser dependencies).
 */

export interface MermaidValidation {
  ok: boolean;
  error?: string;
}

/**
 * Validate that a string contains a structurally valid Mermaid flowchart.
 *
 * Checks:
 * 1. Starts with flowchart direction declaration (TD, TB, BT, RL, LR)
 * 2. Has at least 3 lines (declaration + 2 edges/nodes minimum)
 * 3. Contains at least one --> edge
 * 4. No lowercase "end" as node name (excluding subgraph context)
 */
export function validateMermaidFlowchart(content: string): MermaidValidation {
  const lines = content.trim().split("\n");

  // Must start with flowchart direction declaration
  const firstLine = lines[0]?.trim() ?? "";
  if (!/^flowchart\s+(TD|TB|BT|RL|LR)$/i.test(firstLine)) {
    return {
      ok: false,
      error: `First line must be flowchart direction (e.g., "flowchart TD"), got: "${firstLine}"`,
    };
  }

  // Must have at least 3 lines (declaration + 2 nodes/edges minimum)
  if (lines.length < 3) {
    return {
      ok: false,
      error: `Flowchart too short (${lines.length} lines). Need at least a declaration and 2 edges.`,
    };
  }

  // Check for at least one edge (-->)
  const hasEdge = lines.some((l) => /-->/.test(l));
  if (!hasEdge) {
    return {
      ok: false,
      error: "No edges found. Flowchart must contain at least one --> connection.",
    };
  }

  // Check for lowercase "end" used as node name (Mermaid gotcha).
  // Exclude lines that are part of subgraph blocks (where "end" closes a subgraph).
  let inSubgraph = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^subgraph\b/i.test(trimmed)) {
      inSubgraph = true;
      continue;
    }
    if (inSubgraph && trimmed === "end") {
      inSubgraph = false;
      continue;
    }
    // Check for standalone "end" as node reference (not subgraph close)
    if (/\bend\b/.test(trimmed) && !/\bEnd\b/.test(trimmed) && !/^subgraph\b/i.test(trimmed)) {
      return {
        ok: false,
        error: 'Lowercase "end" found. Capitalize to "End" to avoid Mermaid parser issues.',
      };
    }
  }

  return { ok: true };
}
