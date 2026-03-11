/**
 * Adoption risk markdown report formatter.
 *
 * Pure function: takes TriageResult[] and returns markdown string.
 * Groups red-flagged opportunities by flag type with generated
 * reason strings derived from each flag's typed data.
 * Produces evaluation/adoption-risk.md content.
 */

import type { TriageResult, RedFlag } from "../types/triage.js";

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
  l3Name: string;
  domain: string;
  reason: string;
  action: string;
}

export function formatAdoptionRisk(
  opportunities: TriageResult[],
  date?: string,
): string {
  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const totalCount = opportunities.length;
  const flaggedCount = opportunities.filter(o => o.redFlags.length > 0).length;

  // Group flag entries by type
  const grouped = new Map<RedFlag["type"], FlagEntry[]>();
  for (const section of FLAG_SECTIONS) {
    grouped.set(section.type, []);
  }

  for (const opp of opportunities) {
    for (const flag of opp.redFlags) {
      const entries = grouped.get(flag.type)!;
      entries.push({
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
      lines.push("| Opportunity | Domain | Reason |");
      lines.push("|-------------|--------|--------|");
      for (const entry of entries) {
        const name = entry.action === "SKIP"
          ? `~~${entry.l3Name}~~ (${entry.action})`
          : entry.l3Name;
        lines.push(`| ${name} | ${entry.domain} | ${entry.reason} |`);
      }
    }
    lines.push("");
  }

  return lines.join("\n") + "\n";
}
