/**
 * Tier 1 deep analysis markdown report formatter.
 *
 * Pure function: takes ScoringResult[] with a set of Tier 1 l3_names,
 * filters and sorts by composite DESC, and returns a narrative markdown
 * report with per-dimension reason strings as analysis paragraphs.
 * Produces evaluation/tier1-report.md content.
 */

import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";

/** Human-readable names for sub-dimensions. */
const SUB_DIMENSION_LABELS: Record<string, string> = {
  data_readiness: "Data Readiness",
  aera_platform_fit: "Platform Fit",
  archetype_confidence: "Archetype Confidence",
  decision_density: "Decision Density",
  financial_gravity: "Financial Gravity",
  impact_proximity: "Impact Proximity",
  confidence_signal: "Confidence Signal",
  value_density: "Value Density",
  simulation_viability: "Simulation Viability",
};

/** Look up a sub-dimension by name within a lens. */
function findSub(lens: LensScore, name: string): SubDimensionScore | undefined {
  return lens.subDimensions.find(s => s.name === name);
}

/** Format a sub-dimension line: "- **Label (score/3):** reason" */
function formatSubLine(lens: LensScore, name: string): string {
  const sub = findSub(lens, name);
  const score = sub?.score ?? 0;
  const reason = sub?.reason ?? "No data available";
  const label = SUB_DIMENSION_LABELS[name] ?? name;
  return `- **${label} (${score}/3):** ${reason}`;
}

/** Determine which lens has the highest normalized score. */
function strongestLens(r: ScoringResult): string {
  const entries: [string, number][] = [
    ["Technical Feasibility", r.lenses.technical.normalized],
    ["Adoption Realism", r.lenses.adoption.normalized],
    ["Value & Efficiency", r.lenses.value.normalized],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/** Determine which lens has the lowest normalized score. */
function weakestLens(r: ScoringResult): string {
  const entries: [string, number][] = [
    ["Technical Feasibility", r.lenses.technical.normalized],
    ["Adoption Realism", r.lenses.adoption.normalized],
    ["Value & Efficiency", r.lenses.value.normalized],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

/** Generate an assessment narrative from scoring data. */
function formatAssessment(r: ScoringResult): string {
  const strength = strongestLens(r);
  const risk = weakestLens(r);
  const lines: string[] = [];

  if (strength === risk) {
    lines.push(`This opportunity scores evenly across all dimensions with a composite of ${r.composite.toFixed(2)}.`);
  } else {
    lines.push(`Strongest dimension is **${strength}**, while **${risk}** represents the primary risk area.`);
  }

  if (r.promotedToSimulation) {
    lines.push(`With a composite score of ${r.composite.toFixed(2)} and **${r.overallConfidence}** overall confidence, this opportunity qualifies for simulation modeling.`);
  } else {
    lines.push(`Composite score of ${r.composite.toFixed(2)} with **${r.overallConfidence}** overall confidence. Does not meet the threshold for simulation promotion.`);
  }

  return lines.join(" ");
}

/** Format a single skill section. */
function formatOpportunitySection(r: ScoringResult, rank: number): string {
  const tech = r.lenses.technical;
  const adopt = r.lenses.adoption;
  const val = r.lenses.value;

  const lines: string[] = [];

  const displayName = r.skillName ?? r.l3Name;
  lines.push(`## ${rank}. ${displayName}`);
  lines.push("");
  lines.push(`**${r.l1Name} > ${r.l2Name} > ${r.l3Name} > ${r.l4Name ?? ""}**`);
  lines.push(`**Archetype:** ${r.archetype} | **Composite:** ${r.composite.toFixed(2)} | **Confidence:** ${r.overallConfidence}`);
  lines.push("");

  // Technical Feasibility
  lines.push(`### Technical Feasibility (${tech.total}/${tech.maxPossible})`);
  lines.push(formatSubLine(tech, "data_readiness"));
  lines.push(formatSubLine(tech, "aera_platform_fit"));
  lines.push(formatSubLine(tech, "archetype_confidence"));
  lines.push("");

  // Adoption Realism
  lines.push(`### Adoption Realism (${adopt.total}/${adopt.maxPossible})`);
  lines.push(formatSubLine(adopt, "decision_density"));
  lines.push(formatSubLine(adopt, "financial_gravity"));
  lines.push(formatSubLine(adopt, "impact_proximity"));
  lines.push(formatSubLine(adopt, "confidence_signal"));
  lines.push("");

  // Value & Efficiency
  lines.push(`### Value & Efficiency (${val.total}/${val.maxPossible})`);
  lines.push(formatSubLine(val, "value_density"));
  lines.push(formatSubLine(val, "simulation_viability"));
  lines.push("");

  // Assessment
  lines.push("### Assessment");
  lines.push(formatAssessment(r));

  return lines.join("\n");
}

export function formatTier1Report(
  scored: ScoringResult[],
  tier1Names: Set<string>,
  companyName: string,
  date?: string,
): string {
  const dateStr = date ?? new Date().toISOString().slice(0, 10);

  // Filter to tier 1 only (match on skillId or l3Name for backward compat), sort by composite DESC
  const tier1 = scored
    .filter(r => tier1Names.has(r.skillId ?? r.l3Name) || tier1Names.has(r.l3Name))
    .sort((a, b) => b.composite - a.composite);

  const lines: string[] = [];

  // Header
  lines.push(`# Tier 1 Deep Analysis: ${companyName}`);
  lines.push("");
  lines.push(`**Generated:** ${dateStr}`);
  lines.push(`**Tier 1 criteria:** quick_win = true AND combined_max_value > $5M`);
  lines.push(`**Opportunities in Tier 1:** ${tier1.length}`);
  lines.push("");

  if (tier1.length === 0) {
    lines.push("No opportunities qualified for Tier 1 analysis.");
    lines.push("");
    return lines.join("\n") + "\n";
  }

  // Opportunity sections separated by horizontal rules
  const sections = tier1.map((r, i) => formatOpportunitySection(r, i + 1));
  lines.push(sections.join("\n\n---\n\n"));
  lines.push("");

  return lines.join("\n") + "\n";
}
