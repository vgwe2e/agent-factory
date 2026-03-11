/**
 * Per-lens algorithmic confidence computation.
 *
 * Confidence is derived from data signals (field presence, distributions),
 * NOT from LLM self-assessment. This keeps confidence reproducible and
 * independent of model behavior.
 */
// -- Confidence level ordering for min computation --
const LEVEL_ORDER = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
};
const ORDER_TO_LEVEL = ["LOW", "MEDIUM", "HIGH"];
/**
 * Technical Feasibility confidence.
 *
 * HIGH: lead_archetype present AND >75% of L4s have ai_suitability not null and not NOT_APPLICABLE
 * LOW: lead_archetype null OR >50% of L4s have null ai_suitability OR empty L4 array
 * MEDIUM: everything else
 */
export function computeTechnicalConfidence(opp, l4s) {
    if (l4s.length === 0)
        return "LOW";
    if (opp.lead_archetype === null)
        return "LOW";
    const nullCount = l4s.filter((l4) => l4.ai_suitability === null).length;
    const nullPct = nullCount / l4s.length;
    if (nullPct > 0.50)
        return "LOW";
    const usableCount = l4s.filter((l4) => l4.ai_suitability !== null && l4.ai_suitability !== "NOT_APPLICABLE").length;
    const usablePct = usableCount / l4s.length;
    if (usablePct > 0.75)
        return "HIGH";
    return "MEDIUM";
}
/**
 * Adoption Realism confidence.
 *
 * HIGH: >60% L4s have decision_exists AND >50% have financial_rating !== "LOW"
 * LOW: <25% L4s have decision_exists OR >75% have rating_confidence = "LOW" OR empty L4 array
 * MEDIUM: everything else
 */
export function computeAdoptionConfidence(l4s) {
    if (l4s.length === 0)
        return "LOW";
    const decisionCount = l4s.filter((l4) => l4.decision_exists).length;
    const decisionPct = decisionCount / l4s.length;
    const lowConfCount = l4s.filter((l4) => l4.rating_confidence === "LOW").length;
    const lowConfPct = lowConfCount / l4s.length;
    // Check LOW conditions first
    if (decisionPct < 0.25)
        return "LOW";
    if (lowConfPct > 0.75)
        return "LOW";
    // Check HIGH conditions
    const nonLowFinancialCount = l4s.filter((l4) => l4.financial_rating !== "LOW").length;
    const nonLowFinancialPct = nonLowFinancialCount / l4s.length;
    if (decisionPct > 0.60 && nonLowFinancialPct > 0.50)
        return "HIGH";
    return "MEDIUM";
}
/**
 * Value & Efficiency confidence.
 *
 * HIGH: combined_max_value not null AND annual_revenue not null
 * LOW: combined_max_value null OR (annual_revenue null AND cogs null)
 * MEDIUM: everything else
 */
export function computeValueConfidence(opp, company) {
    if (opp.combined_max_value === null)
        return "LOW";
    if (company.annual_revenue === null && company.cogs === null)
        return "LOW";
    if (company.annual_revenue !== null)
        return "HIGH";
    return "MEDIUM";
}
/**
 * Overall confidence = lowest of the three lens confidences.
 */
export function computeOverallConfidence(technical, adoption, value) {
    const minOrder = Math.min(LEVEL_ORDER[technical], LEVEL_ORDER[adoption], LEVEL_ORDER[value]);
    return ORDER_TO_LEVEL[minOrder];
}
