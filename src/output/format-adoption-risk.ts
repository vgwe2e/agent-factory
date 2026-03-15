/**
 * Adoption risk markdown report formatter.
 *
 * Pure function: takes TriageResult[] and returns markdown string.
 * Groups red-flagged opportunities by flag type with generated
 * reason strings derived from each flag's typed data.
 * Produces evaluation/adoption-risk.md content.
 */

import type { TriageResult, RedFlag } from "../types/triage.js";
import type { ScoringResult } from "../types/scoring.js";

/** Ordered flag type sections matching FLAG-01 through FLAG-05. */
const FLAG_SECTIONS: {
  type: RedFlag["type"];
  title: string;
  description: string;
}[] = [
  {
    type: "DEAD_ZONE",
    title: "Dead Zones (FLAG-01)",
    description: "Opportunities with 0% decision density across all L4 activities.",
  },
  {
    type: "NO_STAKES",
    title: "No Stakes (FLAG-02)",
    description: "Opportunities with zero HIGH financial ratings and SECOND-order impact only.",
  },
  {
    type: "CONFIDENCE_GAP",
    title: "Confidence Gaps (FLAG-03)",
    description: "Opportunities where a majority of L4 activities have LOW confidence ratings.",
  },
  {
    type: "PHANTOM",
    title: "Phantoms (FLAG-04)",
    description: "Opportunities flagged where opportunity_exists is false.",
  },
  {
    type: "ORPHAN",
    title: "Orphan/Thin Opportunities (FLAG-05)",
    description: "Opportunities with very few L4 activities, limiting scoring reliability.",
  },
];

/** Generate a human-readable reason from a typed RedFlag. */
function flagReason(flag: RedFlag): string {
  switch (flag.type) {
    case "DEAD_ZONE":
      return "Zero decision density across all L4 activities";
    case "NO_STAKES":
      return "No HIGH financial ratings; all impacts are second-order";
    case "CONFIDENCE_GAP":
      return `${(flag.lowConfidencePct * 100).toFixed(0)}% of L4 activities have LOW confidence`;
    case "PHANTOM":
      return "Opportunity does not exist in hierarchy (opportunity_exists=false)";
    case "ORPHAN":
      return `Only ${flag.l4Count} L4 activit${flag.l4Count === 1 ? "y" : "ies"} -- insufficient for reliable scoring`;
  }
}

interface FlagEntry {
  opportunityName: string;
  l4Name: string;
  l3Name: string;
  domain: string;
  reason: string;
  action: string;
}

interface FormatAdoptionRiskOptions {
  date?: string;
  scored?: ScoringResult[];
}

function normalizeOptions(
  optionsOrDate?: string | FormatAdoptionRiskOptions,
): FormatAdoptionRiskOptions {
  if (typeof optionsOrDate === "string") {
    return { date: optionsOrDate };
  }
  return optionsOrDate ?? {};
}

function getL4Name(
  opportunity: TriageResult,
  scoredBySkillId: Map<string, ScoringResult>,
): string {
  if (opportunity.l4Name) {
    return opportunity.l4Name;
  }
  if (opportunity.skillId) {
    return scoredBySkillId.get(opportunity.skillId)?.l4Name ?? "-";
  }
  return "-";
}

export function formatAdoptionRisk(
  opportunities: TriageResult[],
  optionsOrDate?: string | FormatAdoptionRiskOptions,
): string {
  const { date, scored = [] } = normalizeOptions(optionsOrDate);
  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const totalCount = opportunities.length;
  const flaggedCount = opportunities.filter(o => o.redFlags.length > 0).length;
  const scoredBySkillId = new Map(
    scored
      .filter((result) => typeof result.skillId === "string" && result.skillId.length > 0)
      .map((result) => [result.skillId, result] as const),
  );

  // Group flag entries by type
  const grouped = new Map<RedFlag["type"], FlagEntry[]>();
  for (const section of FLAG_SECTIONS) {
    grouped.set(section.type, []);
  }

  for (const opp of opportunities) {
    for (const flag of opp.redFlags) {
      const entries = grouped.get(flag.type)!;
      entries.push({
        opportunityName: opp.skillName ?? opp.l3Name,
        l4Name: getL4Name(opp, scoredBySkillId),
        l3Name: opp.l3Name,
        domain: `${opp.l1Name} > ${opp.l2Name}`,
        reason: flagReason(flag),
        action: opp.action.toUpperCase(),
      });
    }
  }

  // Build markdown
  const lines: string[] = [];

  lines.push("# Adoption Risk Assessment");
  lines.push("");
  lines.push(`**Generated:** ${dateStr}`);
  lines.push(`**Total opportunities evaluated:** ${totalCount}`);
  lines.push(`**Red-flagged opportunities:** ${flaggedCount}`);
  lines.push("");

  for (const section of FLAG_SECTIONS) {
    lines.push(`## ${section.title}`);
    lines.push(section.description);
    lines.push("");

    const entries = grouped.get(section.type)!;
    if (entries.length === 0) {
      lines.push("None identified.");
    } else {
      lines.push("| Opportunity | L4 | L3 | Domain | Reason |");
      lines.push("|-------------|----|----|--------|--------|");
      for (const entry of entries) {
        const opportunityName = entry.action === "SKIP"
          ? `~~${entry.opportunityName}~~ (${entry.action})`
          : entry.opportunityName;
        lines.push(`| ${opportunityName} | ${entry.l4Name} | ${entry.l3Name} | ${entry.domain} | ${entry.reason} |`);
      }
    }
    lines.push("");
  }

  return lines.join("\n") + "\n";
}
