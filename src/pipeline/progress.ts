/**
 * Progress tracker for concurrent pipeline execution.
 *
 * Tracks in-flight, completed, and errored opportunities with ETA
 * estimation. Logs structured progress lines via the provided logger.
 */

import type { Logger } from "../infra/logger.js";

// -- Types --

export interface ProgressSummary {
  completed: number;
  errors: number;
  totalMs: number;
}

export interface ProgressTracker {
  /** Mark an opportunity as started (in-flight). */
  start(id: string): void;
  /** Mark an opportunity as completed (decrements in-flight, increments completed). */
  complete(id: string): void;
  /** Mark an opportunity as errored (decrements in-flight, increments errors). */
  error(id: string): void;
  /** Log a structured progress line with current counts and ETA. */
  report(): void;
  /** Return final summary with completed count, error count, and total elapsed ms. */
  summary(): ProgressSummary;
}

// -- Factory --

/**
 * Create a progress tracker that reports pipeline scoring progress.
 *
 * @param total - Total number of opportunities to process
 * @param logger - Pino-compatible logger for structured output
 */
export function createProgressTracker(total: number, logger: Logger): ProgressTracker {
  let inFlight = 0;
  let completed = 0;
  let errors = 0;
  const startTime = Date.now();

  function start(_id: string): void {
    inFlight++;
  }

  function complete(_id: string): void {
    inFlight--;
    completed++;
  }

  function error(_id: string): void {
    inFlight--;
    errors++;
  }

  function report(): void {
    const elapsed = Date.now() - startTime;
    const remaining = total - completed - errors;
    const percentDone = Math.round(((completed + errors) / total) * 100);

    const etaSeconds: number | "N/A" =
      completed > 0
        ? Math.round((elapsed / completed) * remaining / 1000)
        : "N/A";

    logger.info(
      { inFlight, completed, errors, total, percentDone, etaSeconds },
      "Pipeline progress",
    );
  }

  function summary(): ProgressSummary {
    return {
      completed,
      errors,
      totalMs: Date.now() - startTime,
    };
  }

  return { start, complete, error, report, summary };
}
