import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeDeterministicComposite } from "./composite.js";
function makeScores(overrides = {}) {
    return {
        financial_signal: 0,
        ai_suitability: 0,
        decision_density: 0,
        impact_order: 0,
        rating_confidence: 0,
        archetype_completeness: 0,
        ...overrides,
    };
}
describe("computeDeterministicComposite", () => {
    it("returns 1.0 for all-max dimensions", () => {
        const scores = makeScores({
            financial_signal: 1.0,
            ai_suitability: 1.0,
            decision_density: 1.0,
            impact_order: 1.0,
            rating_confidence: 1.0,
            archetype_completeness: 1.0,
        });
        assert.equal(computeDeterministicComposite(scores), 1.0);
    });
    it("returns 0.0 for all-min dimensions", () => {
        assert.equal(computeDeterministicComposite(makeScores()), 0.0);
    });
    it("returns correct weighted sum for mixed scores", () => {
        const scores = makeScores({
            financial_signal: 1.0, // 1.0 * 0.25 = 0.25
            ai_suitability: 0.5, // 0.5 * 0.15 = 0.075
            decision_density: 0.0, // 0.0 * 0.20 = 0.0
            impact_order: 1.0, // 1.0 * 0.10 = 0.1
            rating_confidence: 0.6, // 0.6 * 0.10 = 0.06
            archetype_completeness: 0.0, // 0.0 * 0.20 = 0.0
        });
        // Expected: 0.25 + 0.075 + 0.0 + 0.1 + 0.06 + 0.0 = 0.485
        assert.equal(computeDeterministicComposite(scores), 0.485);
    });
    it("rounds to 4 decimal places", () => {
        const scores = makeScores({
            financial_signal: 0.333,
            ai_suitability: 0.333,
            decision_density: 0.333,
            impact_order: 0.333,
            rating_confidence: 0.333,
            archetype_completeness: 0.333,
        });
        // 0.333 * (0.25+0.15+0.20+0.10+0.10+0.20) = 0.333 * 1.0 = 0.333
        assert.equal(computeDeterministicComposite(scores), 0.333);
    });
    it("handles floating point precision", () => {
        const scores = makeScores({
            financial_signal: 0.1,
            ai_suitability: 0.2,
            decision_density: 0.3,
            impact_order: 0.4,
            rating_confidence: 0.5,
            archetype_completeness: 0.6,
        });
        // 0.1*0.25 + 0.2*0.15 + 0.3*0.20 + 0.4*0.10 + 0.5*0.10 + 0.6*0.20
        // = 0.025 + 0.03 + 0.06 + 0.04 + 0.05 + 0.12 = 0.325
        const result = computeDeterministicComposite(scores);
        assert.equal(result, 0.325);
        // Verify it's actually rounded to at most 4 decimals
        const decimalLen = result.toString().split(".")[1]?.length ?? 0;
        assert.ok(decimalLen <= 4, `Expected at most 4 decimal places, got ${decimalLen}`);
    });
});
