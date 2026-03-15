/**
 * GPU cost tracker.
 *
 * Accumulates wall-clock GPU time and computes estimated dollar cost
 * based on a configurable hourly rate. Default rate is RunPod H100
 * serverless pricing.
 */
export interface CostSummary {
    gpuSeconds: number;
    gpuHours: string;
    estimatedCost: string;
    ratePerHour: number;
}
export interface CostTracker {
    start(now?: Date): void;
    stop(now?: Date): void;
    summary(now?: Date): CostSummary;
}
/** RunPod H100 80GB serverless rate ($/hr). */
export declare const DEFAULT_H100_RATE = 5.58;
export declare function createCostTracker(ratePerHour?: number): CostTracker;
