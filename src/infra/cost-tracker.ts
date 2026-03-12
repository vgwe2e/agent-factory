/**
 * GPU cost tracker.
 *
 * Accumulates wall-clock GPU time and computes estimated dollar cost
 * based on a configurable hourly rate. Default rate is RunPod H100
 * serverless pricing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** RunPod H100 80GB serverless rate ($/hr). */
export const DEFAULT_H100_RATE = 5.58;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createCostTracker(ratePerHour: number = DEFAULT_H100_RATE): CostTracker {
  let startTime: Date | null = null;
  let stopTime: Date | null = null;

  function start(now?: Date): void {
    startTime = now ?? new Date();
  }

  function stop(now?: Date): void {
    stopTime = now ?? new Date();
  }

  function summary(now?: Date): CostSummary {
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

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function formatCost(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}
