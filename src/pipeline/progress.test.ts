/**
 * Tests for progress tracker module.
 *
 * Verifies: start/complete/error counting, report() log output shape,
 * ETA calculation, and summary() return values.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createProgressTracker } from "./progress.js";
import type { ProgressTracker } from "./progress.js";

/** Mock logger that captures info calls. */
function makeMockLogger() {
  const infoCalls: Array<{ data: unknown; msg?: string }> = [];
  return {
    info: (data: unknown, msg?: string) => {
      infoCalls.push({ data, msg });
    },
    warn: () => {},
    error: () => {},
    debug: () => {},
    child: () => makeMockLogger(),
    infoCalls,
  };
}

describe("progress tracker", () => {
  it("start/complete updates counts correctly", () => {
    const logger = makeMockLogger();
    const tracker = createProgressTracker(5, logger as any);

    tracker.start("opp-1");
    tracker.start("opp-2");
    tracker.complete("opp-1");

    // After: 1 in-flight (opp-2), 1 completed
    tracker.report();

    assert.equal(logger.infoCalls.length, 1, "report called logger.info once");
    const data = logger.infoCalls[0].data as Record<string, unknown>;
    assert.equal(data.inFlight, 1);
    assert.equal(data.completed, 1);
    assert.equal(data.errors, 0);
    assert.equal(data.total, 5);
  });

  it("error decrements inFlight and increments error count", () => {
    const logger = makeMockLogger();
    const tracker = createProgressTracker(3, logger as any);

    tracker.start("opp-1");
    tracker.start("opp-2");
    tracker.error("opp-1");

    tracker.report();

    const data = logger.infoCalls[0].data as Record<string, unknown>;
    assert.equal(data.inFlight, 1);
    assert.equal(data.completed, 0);
    assert.equal(data.errors, 1);
  });

  it("report() includes percentDone and etaSeconds", () => {
    const logger = makeMockLogger();
    const tracker = createProgressTracker(10, logger as any);

    tracker.start("opp-1");
    tracker.complete("opp-1");
    tracker.report();

    const data = logger.infoCalls[0].data as Record<string, unknown>;
    assert.equal(typeof data.percentDone, "number");
    // With 1 completed out of 10, eta should be a number (not "N/A")
    assert.equal(typeof data.etaSeconds, "number");
  });

  it("ETA is N/A when no opportunities completed yet", () => {
    const logger = makeMockLogger();
    const tracker = createProgressTracker(5, logger as any);

    tracker.start("opp-1");
    tracker.report();

    const data = logger.infoCalls[0].data as Record<string, unknown>;
    assert.equal(data.etaSeconds, "N/A");
  });

  it("summary() returns correct totals", () => {
    const logger = makeMockLogger();
    const tracker = createProgressTracker(4, logger as any);

    tracker.start("opp-1");
    tracker.complete("opp-1");
    tracker.start("opp-2");
    tracker.error("opp-2");
    tracker.start("opp-3");
    tracker.complete("opp-3");

    const summary = tracker.summary();
    assert.equal(summary.completed, 2);
    assert.equal(summary.errors, 1);
    assert.equal(typeof summary.totalMs, "number");
    assert.ok(summary.totalMs >= 0);
  });

  it("report() logs with 'Pipeline progress' message prefix", () => {
    const logger = makeMockLogger();
    const tracker = createProgressTracker(2, logger as any);

    tracker.start("opp-1");
    tracker.complete("opp-1");
    tracker.report();

    assert.ok(
      (logger.infoCalls[0].msg as string).startsWith("Pipeline progress:"),
      `Expected message to start with 'Pipeline progress:', got: ${logger.infoCalls[0].msg}`,
    );
  });

  it("report() includes in-flight opportunity name and elapsed time", () => {
    const logger = makeMockLogger();
    const tracker = createProgressTracker(3, logger as any);

    tracker.start("My Long Running Opportunity");
    tracker.report();

    const msg = logger.infoCalls[0].msg as string;
    assert.ok(msg.includes("My Long Running Opportunity"), "Message should include in-flight opportunity name");
    assert.ok(msg.includes("Scoring:"), "Message should indicate scoring is active");
  });

  it("report() includes etaFormatted in structured data", () => {
    const logger = makeMockLogger();
    const tracker = createProgressTracker(4, logger as any);

    tracker.start("opp-1");
    tracker.complete("opp-1");
    tracker.report();

    const data = logger.infoCalls[0].data as Record<string, unknown>;
    assert.ok("etaFormatted" in data, "Should include etaFormatted");
    assert.ok("elapsed" in data, "Should include elapsed");
  });
});
