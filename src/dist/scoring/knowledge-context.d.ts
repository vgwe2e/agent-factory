/**
 * Knowledge context builder for scoring prompts.
 *
 * Serializes bundled Aera UI components, Process Builder nodes, and
 * platform capabilities into context strings that scoring lenses can
 * include in LLM prompts.
 */
export interface KnowledgeContext {
    components: string;
    processBuilder: string;
    capabilities: string;
}
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
export declare function buildKnowledgeContext(): KnowledgeContext;
