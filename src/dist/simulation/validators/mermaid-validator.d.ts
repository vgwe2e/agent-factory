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
export declare function validateMermaidFlowchart(content: string): MermaidValidation;
