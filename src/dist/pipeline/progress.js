/**
 * Progress tracker for concurrent pipeline execution.
 *
 * Tracks in-flight, completed, and errored opportunities with ETA
 * estimation. Logs structured progress lines via the provided logger.
 *
 * Key improvement: tracks per-opportunity start times and names so the
 * operator can distinguish "working on a slow opportunity" from "stalled"
 * during 15+ minute scoring calls on the 30B MoE model.
 */
// -- Helpers --
function formatDuration(ms) {
    const totalSeconds = Math.round(ms / 1000);
    if (totalSeconds < 60)
        return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60)
        return `${minutes}m${seconds.toString().padStart(2, "0")}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes.toString().padStart(2, "0")}m`;
}
// -- Factory --
/**
 * Create a progress tracker that reports pipeline scoring progress.
 *
 * @param total - Total number of opportunities to process
 * @param logger - Pino-compatible logger for structured output
 */
export function createProgressTracker(total, logger) {
    let inFlight = 0;
    let completed = 0;
    let errors = 0;
    const startTime = Date.now();
    // Track in-flight opportunity names and start times for progress visibility
    const inFlightMap = new Map(); // id -> startTime
    // Track per-opportunity durations for accurate ETA
    const completedDurations = [];
    function start(id) {
        inFlight++;
        inFlightMap.set(id, Date.now());
    }
    function complete(id) {
        inFlight--;
        completed++;
        const startedAt = inFlightMap.get(id);
        if (startedAt !== undefined) {
            completedDurations.push(Date.now() - startedAt);
            inFlightMap.delete(id);
        }
    }
    function error(id) {
        inFlight--;
        errors++;
        inFlightMap.delete(id);
    }
    function report() {
        const elapsed = Date.now() - startTime;
        const remaining = total - completed - errors;
        const percentDone = Math.round(((completed + errors) / total) * 100);
        // ETA based on median of completed durations (more robust than mean
        // for the bimodal distribution of simple vs complex prompts)
        let etaSeconds = "N/A";
        if (completedDurations.length > 0) {
            const sorted = [...completedDurations].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            etaSeconds = Math.round((median * remaining) / 1000);
        }
        // Build in-flight details string showing what's being worked on
        const inFlightDetails = [];
        for (const [id, startedAt] of inFlightMap) {
            const runningMs = Date.now() - startedAt;
            const shortId = id.length > 40 ? id.slice(0, 37) + "..." : id;
            inFlightDetails.push(`${shortId} (${formatDuration(runningMs)})`);
        }
        const etaFormatted = typeof etaSeconds === "number" ? formatDuration(etaSeconds * 1000) : "N/A";
        logger.info({
            inFlight,
            completed,
            errors,
            total,
            percentDone,
            etaSeconds,
            etaFormatted,
            elapsed: formatDuration(elapsed),
            scoring: inFlightDetails.length > 0 ? inFlightDetails : undefined,
        }, `Pipeline progress: ${percentDone}% (${completed}/${total}) | ETA: ${etaFormatted} | Elapsed: ${formatDuration(elapsed)}` +
            (inFlightDetails.length > 0 ? ` | Scoring: ${inFlightDetails.join(", ")}` : ""));
    }
    function summary() {
        return {
            completed,
            errors,
            totalMs: Date.now() - startTime,
        };
    }
    return { start, complete, error, report, summary };
}
