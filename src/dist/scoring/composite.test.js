import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeComposite } from "./composite.js";
import { PROMOTION_THRESHOLD } from "../types/scoring.js";
describe("computeComposite", () => {
    it("produces composite = 1.0 for perfect scores", () => {
        const result = computeComposite(9, 12, 6);
        assert.equal(result.technical.total, 9);
        assert.equal(result.technical.normalized, 1.0);
        assert.equal(result.adoption.total, 12);
        assert.equal(result.adoption.normalized, 1.0);
        assert.equal(result.value.total, 6);
        assert.equal(result.value.normalized, 1.0);
        assert.equal(result.composite, 1.0);
        assert.equal(result.promotedToSimulation, true);
    });
    it("produces composite = 0.0 for zero scores", () => {
        const result = computeComposite(0, 0, 0);
        assert.equal(result.technical.normalized, 0.0);
        assert.equal(result.adoption.normalized, 0.0);
        assert.equal(result.value.normalized, 0.0);
        assert.equal(result.composite, 0.0);
        assert.equal(result.promotedToSimulation, false);
    });
    it("promotes at exactly 0.60 threshold", () => {
        // Find inputs that produce exactly 0.60
        // composite = tech/9 * 0.30 + adopt/12 * 0.45 + val/6 * 0.25
        // With tech=9, adopt=4, val=6: 1.0*0.30 + (4/12)*0.45 + 1.0*0.25 = 0.30 + 0.15 + 0.25 = 0.70
        // With tech=0, adopt=12, val=2: 0 + 1.0*0.45 + (2/6)*0.25 = 0.45 + 0.0833 = 0.533 (no)
        // With tech=9, adopt=0, val=6: 0.30 + 0 + 0.25 = 0.55 (no)
        // With tech=6, adopt=8, val=0: (6/9)*0.30 + (8/12)*0.45 + 0 = 0.20 + 0.30 = 0.50 (no)
        // Use floating-point-safe approach: just verify the threshold logic
        const atThreshold = computeComposite(9, 8, 0);
        // 1.0*0.30 + (8/12)*0.45 + 0 = 0.30 + 0.30 = 0.60
        assert.equal(atThreshold.promotedToSimulation, true);
        assert.ok(Math.abs(atThreshold.composite - 0.60) < 1e-10);
    });
    it("does not promote below 0.60", () => {
        const belowThreshold = computeComposite(9, 7, 0);
        // 1.0*0.30 + (7/12)*0.45 + 0 = 0.30 + 0.2625 = 0.5625
        assert.equal(belowThreshold.promotedToSimulation, false);
        assert.ok(belowThreshold.composite < PROMOTION_THRESHOLD);
    });
    it("computes correct weighted blend with adoption dominance", () => {
        const result = computeComposite(9, 3, 6);
        // tech: 9/9 = 1.0, adopt: 3/12 = 0.25, value: 6/6 = 1.0
        // composite: 1.0*0.30 + 0.25*0.45 + 1.0*0.25 = 0.30 + 0.1125 + 0.25 = 0.6625
        assert.equal(result.technical.normalized, 1.0);
        assert.equal(result.adoption.normalized, 0.25);
        assert.equal(result.value.normalized, 1.0);
        assert.ok(Math.abs(result.composite - 0.6625) < 1e-10);
        assert.equal(result.promotedToSimulation, true);
    });
    it("normalizes values correctly", () => {
        const result = computeComposite(3, 6, 3);
        // tech: 3/9 = 0.333..., adopt: 6/12 = 0.5, value: 3/6 = 0.5
        assert.ok(Math.abs(result.technical.normalized - 1 / 3) < 1e-10);
        assert.equal(result.adoption.normalized, 0.5);
        assert.equal(result.value.normalized, 0.5);
    });
});
