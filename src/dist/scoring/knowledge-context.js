/**
 * Knowledge context builder for scoring prompts.
 *
 * Serializes bundled Aera UI components and Process Builder nodes
 * into context strings that scoring lenses can include in LLM prompts.
 */
import { getAllComponents } from "../knowledge/components.js";
import { getAllPBNodes } from "../knowledge/process-builder.js";
/**
 * Build knowledge context strings from bundled reference data.
 *
 * - Components: "- {name}: {description}" per line
 * - PB Nodes: "- {name} ({category}): {purpose}" per line
 *
 * @returns Object matching ScoringPipelineInput.knowledgeContext shape
 */
export function buildKnowledgeContext() {
    const components = getAllComponents();
    const componentLines = components.map((c) => `- ${c.name}: ${c.description}`);
    const pbNodes = getAllPBNodes();
    const pbLines = pbNodes.map((n) => `- ${n.name} (${n.category}): ${n.purpose}`);
    return {
        components: componentLines.join("\n"),
        processBuilder: pbLines.join("\n"),
    };
}
