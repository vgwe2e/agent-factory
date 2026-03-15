/**
 * Knowledge context builder for scoring prompts.
 *
 * Serializes bundled Aera UI components, Process Builder nodes, and
 * platform capabilities into context strings that scoring lenses can
 * include in LLM prompts.
 */
import { getAllComponents } from "../knowledge/components.js";
import { getAllPBNodes } from "../knowledge/process-builder.js";
import { getAllCapabilities, getUseCaseMappings, getCapabilityKeywords, getPlatformBoundaries, } from "../knowledge/capabilities.js";
/**
 * Build knowledge context strings from bundled reference data.
 *
 * - Capabilities: Platform capability pillars with best-for/not-for,
 *   use-case mappings, keyword classifications, and platform boundaries
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
    // Build capabilities context
    const capabilityLines = [];
    // Platform capabilities by pillar
    const pillars = getAllCapabilities();
    for (const pillar of pillars) {
        capabilityLines.push(`[${pillar.name}]`);
        for (const cap of pillar.capabilities) {
            let line = `- ${cap.name}: ${cap.description}\n  Best for: ${cap.best_for.join(", ")}`;
            if (cap.not_for && cap.not_for.length > 0) {
                line += `\n  Not for: ${cap.not_for.join(", ")}`;
            }
            capabilityLines.push(line);
        }
    }
    // Platform boundaries
    const boundaries = getPlatformBoundaries();
    if (boundaries) {
        capabilityLines.push("");
        capabilityLines.push("[Platform Boundaries]");
        capabilityLines.push(`Aera IS: ${boundaries.aera_is}`);
        capabilityLines.push(`Aera is NOT a replacement for: ${boundaries.aera_is_not.join(", ")}`);
    }
    // Use case mappings (condensed)
    capabilityLines.push("");
    capabilityLines.push("[Use Case Mappings]");
    const mappings = getUseCaseMappings();
    for (const m of mappings) {
        capabilityLines.push(`- ${m.use_case} (${m.skill_type}): ${m.primary_components.join(" + ")}`);
    }
    // Keyword classifications (condensed)
    capabilityLines.push("");
    capabilityLines.push("[Capability Keywords]");
    const kw = getCapabilityKeywords();
    capabilityLines.push(`AI/ML signals: ${kw.ai_ml.keywords.join(", ")}`);
    capabilityLines.push(`Rule-Based signals: ${kw.rule_based.keywords.join(", ")}`);
    capabilityLines.push(`Hybrid signals: ${kw.hybrid.keywords.join(", ")}`);
    return {
        components: componentLines.join("\n"),
        processBuilder: pbLines.join("\n"),
        capabilities: capabilityLines.join("\n"),
    };
}
