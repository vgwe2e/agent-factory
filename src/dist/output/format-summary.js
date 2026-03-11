/**
 * Executive summary markdown report formatter.
 *
 * Pure function: takes scored results, triage results, and simulation
 * pipeline results. Produces an executive summary with top 10 table,
 * tier distribution, and archetype breakdown.
 */
export function formatSummary(scored, triaged, simResults, companyName, date) {
    const dateStr = date ?? new Date().toISOString().slice(0, 10);
    const lines = [];
    // Header
    lines.push(`# Executive Summary: ${companyName}`);
    lines.push("");
    lines.push(`**Generated:** ${dateStr}`);
    const promotedCount = scored.filter(s => s.promotedToSimulation).length;
    lines.push(`**Total Evaluated:** ${scored.length}`);
    lines.push(`**Promoted to Simulation:** ${promotedCount}`);
    lines.push(`**Simulations Completed:** ${simResults.totalSimulated}`);
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
    lines.push("| Rank | Name | Composite | Archetype | Confidence | Simulated |");
    lines.push("|------|------|-----------|-----------|------------|-----------|");
    const simulatedNames = new Set(simResults.results.map(r => r.l3Name));
    for (let i = 0; i < top.length; i++) {
        const s = top[i];
        const simulated = simulatedNames.has(s.l3Name) ? "Yes" : "No";
        lines.push(`| ${i + 1} | ${s.l3Name} | ${s.composite.toFixed(2)} | ${s.archetype} | ${s.overallConfidence} | ${simulated} |`);
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
