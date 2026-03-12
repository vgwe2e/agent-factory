/**
 * Meta-reflection markdown report formatter.
 *
 * Pure function: takes triage results, scoring results, and simulation
 * pipeline results. Computes catalog-level statistics and produces a
 * markdown report with archetype distribution, red flag frequency,
 * tier distribution, domain performance, knowledge coverage, and
 * key patterns.
 *
 * No LLM calls -- all analysis is pure computation on structured data.
 */

import type { ScoringResult } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";

interface CatalogStats {
  archetypeDistribution: Map<string, number>;
  tierDistribution: Map<number, number>;
  redFlagFrequency: Map<string, number>;
  domainScores: Map<string, { total: number; count: number }>;
  knowledgeCoverage: { confirmed: number; inferred: number };
  simulationSuccessRate: number | null;
}

function computeCatalogStats(
  triaged: TriageResult[],
  scored: ScoringResult[],
  simResults: SimulationPipelineResult,
): CatalogStats {
  // Archetype distribution
  const archetypeDistribution = new Map<string, number>();
  for (const s of scored) {
    archetypeDistribution.set(s.archetype, (archetypeDistribution.get(s.archetype) ?? 0) + 1);
  }

  // Tier distribution
  const tierDistribution = new Map<number, number>();
  for (const t of triaged) {
    tierDistribution.set(t.tier, (tierDistribution.get(t.tier) ?? 0) + 1);
  }

  // Red flag frequency
  const redFlagFrequency = new Map<string, number>();
  for (const t of triaged) {
    for (const flag of t.redFlags) {
      redFlagFrequency.set(flag.type, (redFlagFrequency.get(flag.type) ?? 0) + 1);
    }
  }

  // Domain scores
  const domainScores = new Map<string, { total: number; count: number }>();
  for (const s of scored) {
    const existing = domainScores.get(s.l1Name);
    if (existing) {
      existing.total += s.composite;
      existing.count += 1;
    } else {
      domainScores.set(s.l1Name, { total: s.composite, count: 1 });
    }
  }

  // Knowledge coverage
  const knowledgeCoverage = {
    confirmed: simResults.totalConfirmed,
    inferred: simResults.totalInferred,
  };

  // Simulation success rate
  const totalAttempted = simResults.totalSimulated + simResults.totalFailed;
  const simulationSuccessRate =
    totalAttempted > 0 ? simResults.totalSimulated / totalAttempted : null;

  return {
    archetypeDistribution,
    tierDistribution,
    redFlagFrequency,
    domainScores,
    knowledgeCoverage,
    simulationSuccessRate,
  };
}

export function formatMetaReflection(
  triaged: TriageResult[],
  scored: ScoringResult[],
  simResults: SimulationPipelineResult,
  date?: string,
  simSkipped?: boolean,
): string {
  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const stats = computeCatalogStats(triaged, scored, simResults);
  const lines: string[] = [];

  // Header
  lines.push("# Meta-Reflection: Catalog-Level Analysis");
  lines.push("");
  lines.push(`**Generated:** ${dateStr}`);
  lines.push("");

  // Overview
  lines.push("## Overview");
  lines.push("");
  lines.push(`- **Total Opportunities Triaged:** ${triaged.length}`);
  lines.push(`- **Total Scored:** ${scored.length}`);
  if (simSkipped) {
    lines.push(`- **Simulation: skipped (--skip-sim)**`);
    lines.push(`- **Simulation Success Rate:** N/A`);
  } else {
    lines.push(`- **Total Simulated:** ${simResults.totalSimulated}`);
    const rateStr =
      stats.simulationSuccessRate !== null
        ? `${(stats.simulationSuccessRate * 100).toFixed(1)}%`
        : "N/A";
    lines.push(`- **Simulation Success Rate:** ${rateStr}`);
  }
  lines.push("");

  // Archetype Distribution
  lines.push("## Archetype Distribution");
  lines.push("");
  if (stats.archetypeDistribution.size === 0) {
    lines.push("No scored opportunities.");
  } else {
    lines.push("| Archetype | Count | Percentage |");
    lines.push("|-----------|-------|------------|");
    const sortedArchetypes = [...stats.archetypeDistribution.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    for (const [archetype, count] of sortedArchetypes) {
      const pct = ((count / scored.length) * 100).toFixed(1);
      lines.push(`| ${archetype} | ${count} | ${pct}% |`);
    }
  }
  lines.push("");

  // Red Flag Frequency
  lines.push("## Red Flag Frequency");
  lines.push("");
  if (stats.redFlagFrequency.size === 0) {
    lines.push("No red flags detected across triaged opportunities.");
  } else {
    lines.push("| Flag Type | Count | % of Triaged |");
    lines.push("|-----------|-------|--------------|");
    const sortedFlags = [...stats.redFlagFrequency.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    for (const [flagType, count] of sortedFlags) {
      const pct = triaged.length > 0 ? ((count / triaged.length) * 100).toFixed(1) : "0.0";
      lines.push(`| ${flagType} | ${count} | ${pct}% |`);
    }
  }
  lines.push("");

  // Tier Distribution
  lines.push("## Tier Distribution");
  lines.push("");
  if (triaged.length === 0) {
    lines.push("No triaged opportunities.");
  } else {
    lines.push("| Tier | Count | Percentage |");
    lines.push("|------|-------|------------|");
    for (const tier of [1, 2, 3]) {
      const count = stats.tierDistribution.get(tier) ?? 0;
      const pct = ((count / triaged.length) * 100).toFixed(1);
      lines.push(`| Tier ${tier} | ${count} | ${pct}% |`);
    }
  }
  lines.push("");

  // Domain Performance
  lines.push("## Domain Performance");
  lines.push("");
  if (stats.domainScores.size === 0) {
    lines.push("No scored opportunities to analyze by domain.");
  } else {
    lines.push("| L1 Domain | Avg Composite | Count |");
    lines.push("|-----------|---------------|-------|");
    const domainEntries = [...stats.domainScores.entries()]
      .map(([domain, { total, count }]) => ({
        domain,
        avg: total / count,
        count,
      }))
      .sort((a, b) => b.avg - a.avg);

    for (const { domain, avg, count } of domainEntries) {
      lines.push(`| ${domain} | ${avg.toFixed(2)} | ${count} |`);
    }
  }
  lines.push("");

  // Knowledge Base Coverage
  lines.push("## Knowledge Base Coverage");
  lines.push("");
  if (simSkipped) {
    lines.push("Simulation was skipped -- no knowledge coverage data.");
  } else {
    const totalComponents = stats.knowledgeCoverage.confirmed + stats.knowledgeCoverage.inferred;
    lines.push(`- **Confirmed Components:** ${stats.knowledgeCoverage.confirmed}`);
    lines.push(`- **Inferred Components:** ${stats.knowledgeCoverage.inferred}`);
    lines.push(`- **Total Components Referenced:** ${totalComponents}`);
    if (totalComponents > 0) {
      const confirmedPct = ((stats.knowledgeCoverage.confirmed / totalComponents) * 100).toFixed(1);
      lines.push(`- **Knowledge Coverage:** ${confirmedPct}% confirmed`);
    }
  }
  lines.push("");

  // Key Patterns
  lines.push("## Key Patterns");
  lines.push("");

  if (stats.domainScores.size > 0) {
    const domainAvgs = [...stats.domainScores.entries()]
      .map(([domain, { total, count }]) => ({ domain, avg: total / count }))
      .sort((a, b) => b.avg - a.avg);

    const topDomains = domainAvgs.slice(0, 3);
    const bottomDomains = [...domainAvgs].reverse().slice(0, 3);

    lines.push("**Strongest Domains (by avg composite):**");
    for (const d of topDomains) {
      lines.push(`- ${d.domain} (${d.avg.toFixed(2)})`);
    }
    lines.push("");

    lines.push("**Weakest Domains (by avg composite):**");
    for (const d of bottomDomains) {
      lines.push(`- ${d.domain} (${d.avg.toFixed(2)})`);
    }
    lines.push("");
  }

  if (stats.archetypeDistribution.size > 0) {
    const topArchetype = [...stats.archetypeDistribution.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    lines.push(`**Most Common Archetype:** ${topArchetype[0]} (${topArchetype[1]} occurrences)`);
    lines.push("");
  }

  if (stats.redFlagFrequency.size > 0) {
    const topFlag = [...stats.redFlagFrequency.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    lines.push(`**Most Common Red Flag:** ${topFlag[0]} (${topFlag[1]} occurrences)`);
    lines.push("");
  }

  if (
    stats.domainScores.size === 0 &&
    stats.archetypeDistribution.size === 0 &&
    stats.redFlagFrequency.size === 0
  ) {
    lines.push("No data available for pattern analysis.");
    lines.push("");
  }

  return lines.join("\n") + "\n";
}
