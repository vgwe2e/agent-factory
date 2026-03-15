/**
 * Feasibility scores TSV formatter.
 *
 * Pure function: takes ScoringResult[] and returns a TSV string.
 * Sorted by composite DESC (highest score first).
 * Each row is one skill -- the unit of scoring.
 * Produces evaluation/feasibility-scores.tsv content.
 */

import type { ScoringResult, LensScore } from "../types/scoring.js";
import { isCrossFunctionalScoringResult } from "./cross-functional.js";
import { tsvCell, tsvRow } from "./tsv-utils.js";

const THREE_LENS_HEADER = [
  "skill_id", "skill_name", "l4_name", "l3_name", "l2_name", "l1_name", "archetype",
  "data_readiness", "platform_fit", "archetype_conf", "tech_total",
  "decision_density", "financial_gravity", "impact_proximity", "confidence_signal", "adoption_total",
  "value_density", "simulation_viability", "value_total",
  "composite", "confidence", "promotes_to_sim", "is_cross_functional",
].join("\t");

const TWO_PASS_HEADER = [
  "skill_id", "skill_name", "l4_name", "l3_name", "l2_name", "l1_name", "archetype",
  "platform_fit", "tech_total",
  "decision_density", "financial_gravity", "impact_proximity", "confidence_signal", "adoption_total",
  "value_density", "simulation_viability", "value_total",
  "composite", "confidence", "promotes_to_sim", "is_cross_functional",
].join("\t");

/** Look up a sub-dimension score by name within a lens. Returns 0 if not found. */
function subScore(lens: LensScore, ...names: string[]): number {
  for (const name of names) {
    const match = lens.subDimensions.find((subDimension) => subDimension.name === name);
    if (match) return match.score;
  }
  return 0;
}

export function formatScoresTsv(
  results: ScoringResult[],
  scoringMode?: "two-pass" | "three-lens",
): string {
  const sorted = [...results].sort((a, b) => b.composite - a.composite);
  const header = scoringMode === "two-pass" ? TWO_PASS_HEADER : THREE_LENS_HEADER;

  const rows = sorted.map(r => {
    const tech = r.lenses.technical;
    const adopt = r.lenses.adoption;
    const val = r.lenses.value;

    const baseCells = [
      r.skillId,
      tsvCell(r.skillName),
      tsvCell(r.l4Name),
      r.l3Name,
      r.l2Name,
      r.l1Name,
      tsvCell(r.archetype),
    ];

    const technicalCells = scoringMode === "two-pass"
      ? [
        subScore(tech, "aera_platform_fit", "platform_fit"),
        tech.total,
      ]
      : [
        subScore(tech, "data_readiness"),
        subScore(tech, "aera_platform_fit", "platform_fit"),
        subScore(tech, "archetype_confidence"),
        tech.total,
      ];

    return tsvRow([
      ...baseCells,
      ...technicalCells,
      subScore(adopt, "decision_density"),
      subScore(adopt, "financial_gravity", "financial_signal"),
      subScore(adopt, "impact_proximity", "impact_order"),
      subScore(adopt, "confidence_signal", "rating_confidence"),
      adopt.total,
      subScore(val, "value_density"),
      subScore(val, "simulation_viability"),
      val.total,
      r.composite.toFixed(2),
      r.overallConfidence,
      r.promotedToSimulation,
      isCrossFunctionalScoringResult(r),
    ]);
  });

  return [header, ...rows].join("\n") + "\n";
}
