/**
 * Scoring pipeline orchestrator.
 *
 * Wires together: archetype classification, lens scoring,
 * composite computation, confidence aggregation, and threshold gating.
 *
 * Scores individual SKILLS (not L3 rollups) for accurate assessment.
 * Uses dependency injection (chatFn) for testability.
 */
import { scoreTechnical, scoreAdoption, scoreValue } from "./lens-scorers.js";
import { computeComposite } from "./composite.js";
import { computeOverallConfidence } from "./confidence.js";
import { ollamaChat } from "./ollama-client.js";
// -- Public API --
/**
 * Score a single skill across all three lenses.
 *
 * @returns Complete ScoringResult or error with skillId/skillName for logging
 */
export async function scoreOneSkill(skill, company, knowledgeContext, chatFn = ollamaChat) {
    const startMs = Date.now();
    // Skill carries its own archetype -- no inference needed
    const archetypeHint = skill.archetype;
    // Build knowledge context string for technical prompt
    const capabilitiesSection = knowledgeContext.capabilities
        ? `Platform Capabilities:\n${knowledgeContext.capabilities}\n\n`
        : "";
    const knowledgeStr = `${capabilitiesSection}UI Components:\n${knowledgeContext.components}\n\nProcess Builder Nodes:\n${knowledgeContext.processBuilder}`;
    // Score all three lenses
    const [techResult, adoptResult, valueResult] = await Promise.all([
        scoreTechnical(skill, knowledgeStr, archetypeHint, chatFn),
        scoreAdoption(skill, archetypeHint, chatFn),
        scoreValue(skill, company, archetypeHint, chatFn),
    ]);
    // Check for failures
    if (!techResult.success) {
        return { error: `Technical lens failed: ${techResult.error}`, skillId: skill.id, skillName: skill.name };
    }
    if (!adoptResult.success) {
        return { error: `Adoption lens failed: ${adoptResult.error}`, skillId: skill.id, skillName: skill.name };
    }
    if (!valueResult.success) {
        return { error: `Value lens failed: ${valueResult.error}`, skillId: skill.id, skillName: skill.name };
    }
    // Compute composite
    const compositeResult = computeComposite(techResult.score.total, adoptResult.score.total, valueResult.score.total);
    // Compute overall confidence
    const overallConfidence = computeOverallConfidence(techResult.score.confidence, adoptResult.score.confidence, valueResult.score.confidence);
    const durationMs = Date.now() - startMs;
    return {
        skillId: skill.id,
        skillName: skill.name,
        l4Name: skill.l4Name,
        l3Name: skill.l3Name,
        l2Name: skill.l2Name,
        l1Name: skill.l1Name,
        archetype: skill.archetype,
        lenses: {
            technical: techResult.score,
            adoption: adoptResult.score,
            value: valueResult.score,
        },
        composite: compositeResult.composite,
        overallConfidence,
        promotedToSimulation: compositeResult.promotedToSimulation,
        scoringDurationMs: durationMs,
    };
}
/**
 * Score all skills (async generator for incremental consumption).
 *
 * Sorts by parent L3 name for progress tracking continuity.
 */
export async function* scoreSkills(input) {
    const { skills, company, knowledgeContext, chatFn = ollamaChat } = input;
    // Sort by L3 name for grouped progress tracking
    const sorted = [...skills].sort((a, b) => a.l3Name.localeCompare(b.l3Name));
    for (const skill of sorted) {
        const result = await scoreOneSkill(skill, company, knowledgeContext, chatFn);
        yield result;
    }
}
