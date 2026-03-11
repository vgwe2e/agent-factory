/**
 * Dead zones report markdown formatter.
 *
 * Pure function: takes triage results and scored results, filters
 * to opportunities with DEAD_ZONE, PHANTOM, or NO_STAKES flags,
 * groups by L1 domain, and produces a markdown report.
 */
/** Human-readable description for a red flag. */
function describeFlag(flag) {
    switch (flag.type) {
        case "DEAD_ZONE":
            return "Dead Zone -- zero decision density";
        case "PHANTOM":
            return "Phantom -- opportunity does not exist in data";
        case "NO_STAKES":
            return "No Stakes -- no high financial impact, all second-order";
        case "CONFIDENCE_GAP":
            return `Confidence Gap -- ${flag.lowConfidencePct.toFixed(0)}% low confidence`;
        case "ORPHAN":
            return `Orphan -- only ${flag.l4Count} L4 activities`;
    }
}
/** Group an array of TriageResult by l1Name. */
function groupByL1(items) {
    const groups = new Map();
    for (const item of items) {
        const existing = groups.get(item.l1Name);
        if (existing) {
            existing.push(item);
        }
        else {
            groups.set(item.l1Name, [item]);
        }
    }
    return groups;
}
export function formatDeadZones(triaged, _scored, date) {
    const dateStr = date ?? new Date().toISOString().slice(0, 10);
    const lines = [];
    lines.push("# Dead Zones Report");
    lines.push("");
    lines.push(`**Generated:** ${dateStr}`);
    lines.push("");
    // Filter by flag type
    const deadZones = triaged.filter(t => t.redFlags.some(f => f.type === "DEAD_ZONE"));
    const phantoms = triaged.filter(t => t.redFlags.some(f => f.type === "PHANTOM"));
    const noStakes = triaged.filter(t => t.redFlags.some(f => f.type === "NO_STAKES"));
    const skipItems = triaged.filter(t => t.redFlags.some(f => f.type === "DEAD_ZONE" || f.type === "PHANTOM"));
    const demoteItems = triaged.filter(t => t.redFlags.some(f => f.type === "NO_STAKES"));
    // No flags at all
    if (skipItems.length === 0 && demoteItems.length === 0) {
        lines.push("No dead zones detected. All opportunities passed flag screening.");
        lines.push("");
        return lines.join("\n") + "\n";
    }
    // Count summary
    lines.push("## Summary");
    lines.push("");
    lines.push(`- **Dead Zones:** ${deadZones.length}`);
    lines.push(`- **Phantoms:** ${phantoms.length}`);
    lines.push(`- **No Stakes:** ${noStakes.length}`);
    lines.push("");
    // Do Not Pursue section
    if (skipItems.length > 0) {
        lines.push("## Do Not Pursue");
        lines.push("");
        lines.push("These opportunities have critical flags and should be skipped.");
        lines.push("");
        const grouped = groupByL1(skipItems);
        for (const [domain, items] of grouped) {
            lines.push(`### ${domain}`);
            lines.push("");
            for (const item of items) {
                const flagDescs = item.redFlags
                    .filter(f => f.type === "DEAD_ZONE" || f.type === "PHANTOM")
                    .map(describeFlag);
                lines.push(`- **${item.l3Name}:** ${flagDescs.join("; ")}`);
            }
            lines.push("");
        }
    }
    // Low Priority / Demoted section
    if (demoteItems.length > 0) {
        lines.push("## Low Priority / Demoted");
        lines.push("");
        lines.push("These opportunities lack financial stakes and are deprioritized.");
        lines.push("");
        const grouped = groupByL1(demoteItems);
        for (const [domain, items] of grouped) {
            lines.push(`### ${domain}`);
            lines.push("");
            for (const item of items) {
                const flagDescs = item.redFlags
                    .filter(f => f.type === "NO_STAKES")
                    .map(describeFlag);
                lines.push(`- **${item.l3Name}:** ${flagDescs.join("; ")}`);
            }
            lines.push("");
        }
    }
    return lines.join("\n") + "\n";
}
