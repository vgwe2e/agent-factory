/**
 * Skill extraction utility.
 *
 * Builds the scoring candidate hierarchy and flattens it into scorable
 * SkillWithContext objects by enriching each skill with parent L4 activity
 * context. Cross-functional skills are converted into synthetic L4 rows so
 * they can move through the same triage/scoring/simulation path as embedded
 * L4 skills.
 *
 * Pure function: no I/O, no side effects.
 */
import type { HierarchyExport, L4Activity, SkillWithContext } from "../types/hierarchy.js";
export declare function buildScoringHierarchy(data: HierarchyExport): L4Activity[];
/**
 * Extract all skills from the hierarchy with parent L4 context attached.
 *
 * @param hierarchy - Array of L4 activities from the hierarchy export
 * @returns Flat array of SkillWithContext objects ready for scoring
 */
export declare function extractScoringSkills(hierarchy: L4Activity[]): SkillWithContext[];
