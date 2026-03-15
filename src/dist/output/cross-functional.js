export function isCrossFunctionalSkillId(skillId) {
    return typeof skillId === "string" && skillId.startsWith("cf-");
}
export function isCrossFunctionalScoringResult(result) {
    return result.l1Name === "Cross-Functional" || isCrossFunctionalSkillId(result.skillId);
}
export function isCrossFunctionalTriageResult(result) {
    return result.l1Name === "Cross-Functional" || isCrossFunctionalSkillId(result.skillId);
}
