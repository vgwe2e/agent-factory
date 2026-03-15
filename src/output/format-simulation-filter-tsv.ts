import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { ScoringResult } from "../types/scoring.js";
import { isCrossFunctionalScoringResult } from "./cross-functional.js";

function buildScoredByName(scored: ScoringResult[]): Map<string, ScoringResult> {
  const scoredByName = new Map<string, ScoringResult>();
  for (const result of scored) {
    scoredByName.set(result.l3Name, result);
    scoredByName.set(result.l4Name, result);
    scoredByName.set(result.skillId, result);
  }
  return scoredByName;
}

export function formatSimulationFilterTsv(
  scored: ScoringResult[],
  simResults: SimulationPipelineResult,
  scoringMode?: "two-pass" | "three-lens",
): string {
  const header = scoringMode === "two-pass"
    ? [
      "skill_id",
      "skill_name",
      "l4_name",
      "verdict",
      "groundedness_score",
      "integration_confidence_score",
      "ambiguity_risk_score",
      "implementation_readiness_score",
      "reasons",
      "is_cross_functional",
    ].join("\t")
    : [
      "l3_name",
      "verdict",
      "groundedness_score",
      "integration_confidence_score",
      "ambiguity_risk_score",
      "implementation_readiness_score",
      "reasons",
      "is_cross_functional",
    ].join("\t");
  const scoredByName = buildScoredByName(scored);

  const rows = [...simResults.results]
    .filter((result) => result.assessment)
    .sort((a, b) => {
      const order = verdictRank(a.assessment!.verdict) - verdictRank(b.assessment!.verdict);
      if (order !== 0) return order;
      return b.assessment!.implementationReadinessScore - a.assessment!.implementationReadinessScore;
    })
    .map((result) => {
      const assessment = result.assessment!;
      const scoredRow = scoredByName.get(result.l3Name);
      if (scoringMode === "two-pass") {
        return [
          scoredRow?.skillId ?? "",
          scoredRow?.skillName ?? "",
          scoredRow?.l4Name ?? result.l3Name,
          assessment.verdict,
          assessment.groundednessScore,
          assessment.integrationConfidenceScore,
          assessment.ambiguityRiskScore,
          assessment.implementationReadinessScore,
          assessment.reasons.join(" | "),
          scoredRow ? (isCrossFunctionalScoringResult(scoredRow) ? "Y" : "N") : "N",
        ].join("\t");
      }

      return [
        result.l3Name,
        assessment.verdict,
        assessment.groundednessScore,
        assessment.integrationConfidenceScore,
        assessment.ambiguityRiskScore,
        assessment.implementationReadinessScore,
        assessment.reasons.join(" | "),
        scoredRow ? (isCrossFunctionalScoringResult(scoredRow) ? "Y" : "N") : "N",
      ].join("\t");
    });

  return `${header}\n${rows.join("\n")}${rows.length > 0 ? "\n" : ""}`;
}

function verdictRank(verdict: "ADVANCE" | "REVIEW" | "HOLD"): number {
  return verdict === "ADVANCE" ? 0 : verdict === "REVIEW" ? 1 : 2;
}
