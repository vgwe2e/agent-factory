/**
 * Feasibility scores TSV formatter.
 *
 * Pure function: takes ScoringResult[] and returns a 19-column TSV string.
 * Sorted by composite DESC (highest score first).
 * Produces evaluation/feasibility-scores.tsv content.
 */
import { tsvCell, tsvRow } from "./tsv-utils.js";
const HEADER = [
    "l3_name", "l1_name", "l2_name", "archetype",
    "data_readiness", "platform_fit", "archetype_conf", "tech_total",
    "decision_density", "financial_gravity", "impact_proximity", "confidence_signal", "adoption_total",
    "value_density", "simulation_viability", "value_total",
    "composite", "confidence", "promotes_to_sim",
].join("\t");
/** Look up a sub-dimension score by name within a lens. Returns 0 if not found. */
function subScore(lens, name) {
    return lens.subDimensions.find(s => s.name === name)?.score ?? 0;
}
export function formatScoresTsv(results) {
    const sorted = [...results].sort((a, b) => b.composite - a.composite);
    const rows = sorted.map(r => {
        const tech = r.lenses.technical;
        const adopt = r.lenses.adoption;
        const val = r.lenses.value;
        return tsvRow([
            r.l3Name,
            r.l1Name,
            r.l2Name,
            tsvCell(r.archetype),
            subScore(tech, "data_readiness"),
            subScore(tech, "platform_fit"),
            subScore(tech, "archetype_confidence"),
            tech.total,
            subScore(adopt, "decision_density"),
            subScore(adopt, "financial_gravity"),
            subScore(adopt, "impact_proximity"),
            subScore(adopt, "confidence_signal"),
            adopt.total,
            subScore(val, "value_density"),
            subScore(val, "simulation_viability"),
            val.total,
            r.composite.toFixed(2),
            r.overallConfidence,
            r.promotedToSimulation,
        ]);
    });
    return [HEADER, ...rows].join("\n") + "\n";
}
