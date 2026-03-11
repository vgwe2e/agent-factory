/**
 * Knowledge context builder for scoring prompts.
 *
 * Serializes bundled Aera UI components and Process Builder nodes
 * into context strings that scoring lenses can include in LLM prompts.
 */
export interface KnowledgeContext {
    components: string;
    processBuilder: string;
}
/**
 * Build knowledge context strings from bundled reference data.
 *
 * - Components: "- {name}: {description}" per line
 * - PB Nodes: "- {name} ({category}): {purpose}" per line
 *
 * @returns Object matching ScoringPipelineInput.knowledgeContext shape
 */
export declare function buildKnowledgeContext(): KnowledgeContext;
