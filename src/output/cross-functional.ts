import type { ScoringResult } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";

export function isCrossFunctionalSkillId(skillId?: string): boolean {
  return typeof skillId === "string" && skillId.startsWith("cf-");
}

export function isCrossFunctionalScoringResult(result: ScoringResult): boolean {
  return result.l1Name === "Cross-Functional" || isCrossFunctionalSkillId(result.skillId);
}

export function isCrossFunctionalTriageResult(result: TriageResult): boolean {
  return result.l1Name === "Cross-Functional" || isCrossFunctionalSkillId(result.skillId);
}
