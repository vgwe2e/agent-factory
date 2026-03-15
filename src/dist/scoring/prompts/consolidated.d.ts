/**
 * Consolidated LLM scorer prompt builder (v1.3).
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Combines platform fit assessment (0-3 with Aera component citations)
 * with deterministic pre-score sanity checking (AGREE/DISAGREE/PARTIAL).
 *
 * Follows 4-layer /audit-prompt structure:
 *   Layer 1: Context/Role
 *   Layer 2: Rubric + Worked Examples
 *   Layer 3: Negative Constraints
 *   Layer 4: Confidence Calibration
 */
import type { SkillWithContext } from "../../types/hierarchy.js";
import type { PreScoreResult } from "../../types/scoring.js";
interface ChatMessage {
    role: string;
    content: string;
}
/**
 * Build the consolidated LLM scorer prompt.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param knowledgeContext - Pre-formatted string of Aera component summaries and PB node summaries
 * @param preScore - Deterministic pre-score result from Phase 21
 */
export declare function buildConsolidatedPrompt(skill: SkillWithContext, knowledgeContext: string, preScore: PreScoreResult): ChatMessage[];
export {};
