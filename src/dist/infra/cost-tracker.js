/**
 * GPU cost tracker.
 *
 * Accumulates wall-clock GPU time and computes estimated dollar cost
 * based on a configurable hourly rate. Default rate is RunPod H100
 * serverless pricing.
 */
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** RunPod H100 80GB serverless rate ($/hr). */
export const DEFAULT_H100_RATE = 5.58;
// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------
export function createCostTracker(ratePerHour = DEFAULT_H100_RATE) {
    let startTime = null;
    let stopTime = null;
    function start(now) {
        startTime = now ?? new Date();
    }
    function stop(now) {
        stopTime = now ?? new Date();
    }
    function summary(now) {
        if (startTime === null) {
            return {
                gpuSeconds: 0,
                gpuHours: "0h 0m 0s",
                estimatedCost: "$0.00",
                ratePerHour,
            };
        }
        const endTime = stopTime ?? now ?? new Date();
        const gpuSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
        const hours = gpuSeconds / 3600;
        const cost = hours * ratePerHour;
        return {
            gpuSeconds,
            gpuHours: formatDuration(gpuSeconds),
            estimatedCost: formatCost(cost),
            ratePerHour,
        };
    }
    return { start, stop, summary };
}
// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
}
function formatCost(dollars) {
    return `$${dollars.toFixed(2)}`;
}
