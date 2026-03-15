import type { ScoringResult } from "../types/scoring.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { SimulationFilterVerdict } from "../types/simulation.js";
import { isCrossFunctionalScoringResult } from "./cross-functional.js";

function header(scoringMode?: "two-pass" | "three-lens"): string {
  return scoringMode === "two-pass"
    ? [
      "skill_id",
      "skill_name",
      "l4_name",
      "l1_name",
      "l2_name",
      "composite",
      "archetype",
      "confidence",
      "verdict",
      "implementation_readiness_score",
      "groundedness_score",
      "integration_confidence_score",
      "ambiguity_risk_score",
      "reasons",
      "is_cross_functional",
    ].join("\t")
    : [
      "l3_name",
      "l1_name",
      "l2_name",
      "composite",
      "archetype",
      "confidence",
      "verdict",
      "implementation_readiness_score",
      "groundedness_score",
      "integration_confidence_score",
      "ambiguity_risk_score",
      "reasons",
      "is_cross_functional",
    ].join("\t");
}

export function formatImplementationShortlistTsv(
  scored: ScoringResult[],
  simResults: SimulationPipelineResult,
  verdicts: SimulationFilterVerdict[],
  scoringMode?: "two-pass" | "three-lens",
): string {
  const allowed = new Set<SimulationFilterVerdict>(verdicts);
  const scoredByName = new Map<string, ScoringResult>();
  for (const result of scored) {
    scoredByName.set(result.l3Name, result);
    scoredByName.set(result.l4Name, result);
  }

  const rows = simResults.results
    .filter((result) => result.assessment && allowed.has(result.assessment.verdict))
    .sort((a, b) => {
      const readinessDelta =
        (b.assessment?.implementationReadinessScore ?? 0) -
        (a.assessment?.implementationReadinessScore ?? 0);
      if (readinessDelta !== 0) return readinessDelta;

      const scoredA = scoredByName.get(a.l3Name)?.composite ?? 0;
      const scoredB = scoredByName.get(b.l3Name)?.composite ?? 0;
      return scoredB - scoredA;
    })
    .map((result) => {
      const scoredRow = scoredByName.get(result.l3Name);
      const assessment = result.assessment!;
      if (scoringMode === "two-pass") {
        return [
          scoredRow?.skillId ?? "",
          scoredRow?.skillName ?? "",
          scoredRow?.l4Name ?? result.l3Name,
          scoredRow?.l1Name ?? "",
          scoredRow?.l2Name ?? "",
          scoredRow ? scoredRow.composite.toFixed(2) : "",
          scoredRow?.archetype ?? "",
          scoredRow?.overallConfidence ?? "",
          assessment.verdict,
          assessment.implementationReadinessScore,
          assessment.groundednessScore,
          assessment.integrationConfidenceScore,
          assessment.ambiguityRiskScore,
          assessment.reasons.join(" | "),
          scoredRow ? (isCrossFunctionalScoringResult(scoredRow) ? "Y" : "N") : "N",
        ].join("\t");
      }

      return [
        result.l3Name,
        scoredRow?.l1Name ?? "",
        scoredRow?.l2Name ?? "",
        scoredRow ? scoredRow.composite.toFixed(2) : "",
        scoredRow?.archetype ?? "",
        scoredRow?.overallConfidence ?? "",
        assessment.verdict,
        assessment.implementationReadinessScore,
        assessment.groundednessScore,
        assessment.integrationConfidenceScore,
        assessment.ambiguityRiskScore,
        assessment.reasons.join(" | "),
        scoredRow ? (isCrossFunctionalScoringResult(scoredRow) ? "Y" : "N") : "N",
      ].join("\t");
    });

  return `${header(scoringMode)}\n${rows.join("\n")}${rows.length > 0 ? "\n" : ""}`;
}
