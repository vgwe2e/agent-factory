/**
 * Executive summary markdown report formatter.
 *
 * Pure function: takes scored results, triage results, and simulation
 * pipeline results. Produces an executive summary with top 10 table,
 * tier distribution, and archetype breakdown.
 */
import { countAssessmentVerdicts } from "../simulation/assessment.js";
export function formatSummary(scored, triaged, simResults, companyName, date, simSkipped, scoringMode) {
    const dateStr = date ?? new Date().toISOString().slice(0, 10);
    const lines = [];
    // Header
    lines.push(`# Executive Summary: ${companyName}`);
    lines.push("");
    lines.push(`**Generated:** ${dateStr}`);
    const promotedCount = scored.filter(s => s.promotedToSimulation).length;
    lines.push(`**Total Evaluated:** ${scored.length}`);
    lines.push(`**Promoted to Simulation:** ${promotedCount}`);
    if (simSkipped) {
        lines.push(`**Simulation: skipped (--skip-sim)**`);
    }
    else {
        lines.push(`**Simulations Completed:** ${simResults.totalSimulated}`);
        const verdictCounts = countAssessmentVerdicts(simResults.results.map((result) => result.assessment));
        const totalAssessed = verdictCounts.ADVANCE + verdictCounts.REVIEW + verdictCounts.HOLD;
        if (totalAssessed > 0) {
            lines.push(`**Simulation Filter:** ${verdictCounts.ADVANCE} advance / ${verdictCounts.REVIEW} review / ${verdictCounts.HOLD} hold`);
            lines.push(`**Default Shortlist (ADVANCE):** ${verdictCounts.ADVANCE}`);
            lines.push(`**Manual Review Queue:** ${verdictCounts.REVIEW + verdictCounts.HOLD}`);
        }
    }
    lines.push("");
    if (scored.length === 0) {
        lines.push("No opportunities were scored in this evaluation.");
        lines.push("");
        return lines.join("\n") + "\n";
    }
    // Top 10 table sorted by composite DESC
    const sorted = [...scored].sort((a, b) => b.composite - a.composite);
    const top = sorted.slice(0, 10);
    lines.push("## Top Opportunities");
    lines.push("");
    if (scoringMode === "two-pass") {
        lines.push("| Rank | Opportunity | L4 | L3 | Composite | Archetype | Confidence | Simulated | Verdict |");
        lines.push("|------|-------------|----|----|-----------|-----------|------------|-----------|---------|");
    }
    else {
        lines.push("| Rank | Name | Composite | Archetype | Confidence | Simulated | Verdict |");
        lines.push("|------|------|-----------|-----------|------------|-----------|---------|");
    }
    const simulatedIds = new Set(simResults.results.map(r => r.l3Name));
    const verdicts = new Map(simResults.results
        .filter((result) => result.assessment)
        .map((result) => [result.l3Name, result.assessment.verdict]));
    for (let i = 0; i < top.length; i++) {
        const s = top[i];
        const displayName = s.skillName ?? s.l3Name;
        const simulationKeys = [s.l4Name, s.l3Name, s.skillId].filter((key) => typeof key === "string" && key.length > 0);
        const simulated = simulationKeys.some((key) => simulatedIds.has(key)) ? "Yes" : "No";
        const verdict = simulationKeys
            .map((key) => verdicts.get(key))
            .find((value) => value !== undefined) ?? "-";
        if (scoringMode === "two-pass") {
            lines.push(`| ${i + 1} | ${displayName} | ${s.l4Name} | ${s.l3Name} | ${s.composite.toFixed(2)} | ${s.archetype} | ${s.overallConfidence} | ${simulated} | ${verdict} |`);
        }
        else {
            lines.push(`| ${i + 1} | ${displayName} | ${s.composite.toFixed(2)} | ${s.archetype} | ${s.overallConfidence} | ${simulated} | ${verdict} |`);
        }
    }
    lines.push("");
    // Tier distribution
    const tierCounts = new Map();
    for (const t of triaged) {
        tierCounts.set(t.tier, (tierCounts.get(t.tier) ?? 0) + 1);
    }
    lines.push("## Tier Distribution");
    lines.push("");
    lines.push("| Tier | Count | Percentage |");
    lines.push("|------|-------|------------|");
    for (const tier of [1, 2, 3]) {
        const count = tierCounts.get(tier) ?? 0;
        const pct = triaged.length > 0 ? ((count / triaged.length) * 100).toFixed(1) : "0.0";
        lines.push(`| Tier ${tier} | ${count} | ${pct}% |`);
    }
    lines.push("");
    // Archetype breakdown
    const archetypeCounts = new Map();
    for (const s of scored) {
        archetypeCounts.set(s.archetype, (archetypeCounts.get(s.archetype) ?? 0) + 1);
    }
    lines.push("## Archetype Breakdown");
    lines.push("");
    lines.push("| Archetype | Count | Percentage |");
    lines.push("|-----------|-------|------------|");
    const sortedArchetypes = [...archetypeCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [archetype, count] of sortedArchetypes) {
        const pct = ((count / scored.length) * 100).toFixed(1);
        lines.push(`| ${archetype} | ${count} | ${pct}% |`);
    }
    lines.push("");
    return lines.join("\n") + "\n";
}
