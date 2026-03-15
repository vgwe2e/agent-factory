/**
 * Tests for GPU cost tracker.
 *
 * All tests use explicit Date objects for deterministic results.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCostTracker, DEFAULT_H100_RATE, } from "./cost-tracker.js";
describe("CostTracker", () => {
    it("summary before start returns zeros", () => {
        const tracker = createCostTracker();
        const summary = tracker.summary();
        assert.equal(summary.gpuSeconds, 0);
        assert.equal(summary.estimatedCost, "$0.00");
        assert.equal(summary.gpuHours, "0h 0m 0s");
        assert.equal(summary.ratePerHour, DEFAULT_H100_RATE);
    });
    it("30 minutes of GPU time at $5.58/hr = $2.79", () => {
        const tracker = createCostTracker();
        const start = new Date("2026-03-11T10:00:00Z");
        const stop = new Date("2026-03-11T10:30:00Z");
        tracker.start(start);
        tracker.stop(stop);
        const summary = tracker.summary();
        assert.equal(summary.gpuSeconds, 1800);
        assert.equal(summary.estimatedCost, "$2.79");
        assert.equal(summary.ratePerHour, 5.58);
    });
    it("1 hour of GPU time at $5.58/hr = $5.58", () => {
        const tracker = createCostTracker();
        const start = new Date("2026-03-11T10:00:00Z");
        const stop = new Date("2026-03-11T11:00:00Z");
        tracker.start(start);
        tracker.stop(stop);
        const summary = tracker.summary();
        assert.equal(summary.gpuSeconds, 3600);
        assert.equal(summary.estimatedCost, "$5.58");
    });
    it("gpuHours formatted correctly for various durations", () => {
        const tracker = createCostTracker();
        // 1h 25m 30s = 5130 seconds
        const start = new Date("2026-03-11T10:00:00Z");
        const stop = new Date("2026-03-11T11:25:30Z");
        tracker.start(start);
        tracker.stop(stop);
        const summary = tracker.summary();
        assert.equal(summary.gpuHours, "1h 25m 30s");
        assert.equal(summary.gpuSeconds, 5130);
    });
    it("summary without stop uses 'now' parameter", () => {
        const tracker = createCostTracker();
        const start = new Date("2026-03-11T10:00:00Z");
        const now = new Date("2026-03-11T10:15:00Z"); // 15 min
        tracker.start(start);
        const summary = tracker.summary(now);
        assert.equal(summary.gpuSeconds, 900); // 15 min
        assert.equal(summary.gpuHours, "0h 15m 0s");
        // 900/3600 * 5.58 = 1.395 => $1.40 (rounded)
        assert.equal(summary.estimatedCost, "$1.40");
    });
    it("uses custom rate per hour", () => {
        const tracker = createCostTracker(10.0);
        const start = new Date("2026-03-11T10:00:00Z");
        const stop = new Date("2026-03-11T11:00:00Z");
        tracker.start(start);
        tracker.stop(stop);
        const summary = tracker.summary();
        assert.equal(summary.estimatedCost, "$10.00");
        assert.equal(summary.ratePerHour, 10.0);
    });
    it("DEFAULT_H100_RATE is 5.58", () => {
        assert.equal(DEFAULT_H100_RATE, 5.58);
    });
});
