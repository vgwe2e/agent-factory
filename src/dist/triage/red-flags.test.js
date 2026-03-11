import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectRedFlags, groupL4sByL3, resolveAction } from "./red-flags.js";
// -- Test Helpers --
function makeL3(overrides = {}) {
    return {
        l3_name: "Test L3",
        l2_name: "Test L2",
        l1_name: "Test L1",
        opportunity_exists: true,
        opportunity_name: "Test Opportunity",
        opportunity_summary: "Summary",
        lead_archetype: "DETERMINISTIC",
        supporting_archetypes: [],
        combined_max_value: 1_000_000,
        implementation_complexity: "MEDIUM",
        quick_win: false,
        competitive_positioning: null,
        aera_differentiators: [],
        l4_count: 5,
        high_value_l4_count: 2,
        rationale: "Test rationale",
        ...overrides,
    };
}
function makeL4(overrides = {}) {
    return {
        id: "l4-001",
        name: "Test L4",
        description: "Description",
        l1: "Test L1",
        l2: "Test L2",
        l3: "Test L3",
        financial_rating: "MEDIUM",
        value_metric: "metric",
        impact_order: "FIRST",
        rating_confidence: "MEDIUM",
        ai_suitability: "MEDIUM",
        decision_exists: true,
        decision_articulation: null,
        escalation_flag: null,
        skills: [],
        ...overrides,
    };
}
// -- groupL4sByL3 --
describe("groupL4sByL3", () => {
    it("groups L4 activities by their l3 field", () => {
        const l4s = [
            makeL4({ id: "a", l3: "Alpha" }),
            makeL4({ id: "b", l3: "Beta" }),
            makeL4({ id: "c", l3: "Alpha" }),
        ];
        const map = groupL4sByL3(l4s);
        assert.equal(map.size, 2);
        assert.equal(map.get("Alpha").length, 2);
        assert.equal(map.get("Beta").length, 1);
    });
    it("returns empty map for empty array", () => {
        const map = groupL4sByL3([]);
        assert.equal(map.size, 0);
    });
});
// -- FLAG-04: Phantom --
describe("FLAG-04: Phantom", () => {
    it("detects phantom when opportunity_exists is false", () => {
        const opp = makeL3({ opportunity_exists: false });
        const flags = detectRedFlags(opp, []);
        const phantom = flags.find((f) => f.type === "PHANTOM");
        assert.ok(phantom, "should detect PHANTOM flag");
        assert.equal(phantom.type, "PHANTOM");
    });
    it("does not flag when opportunity_exists is true", () => {
        const opp = makeL3({ opportunity_exists: true });
        const flags = detectRedFlags(opp, [makeL4()]);
        const phantom = flags.find((f) => f.type === "PHANTOM");
        assert.equal(phantom, undefined);
    });
});
// -- FLAG-05: Orphan --
describe("FLAG-05: Orphan", () => {
    it("detects orphan when l4_count < 3", () => {
        const opp = makeL3({ l4_count: 2 });
        const flags = detectRedFlags(opp, [makeL4(), makeL4()]);
        const orphan = flags.find((f) => f.type === "ORPHAN");
        assert.ok(orphan, "should detect ORPHAN flag");
        assert.equal(orphan.type, "ORPHAN");
    });
    it("does not flag when l4_count >= 3", () => {
        const opp = makeL3({ l4_count: 3 });
        const l4s = [makeL4(), makeL4(), makeL4()];
        const flags = detectRedFlags(opp, l4s);
        const orphan = flags.find((f) => f.type === "ORPHAN");
        assert.equal(orphan, undefined);
    });
});
// -- FLAG-01: Dead Zone --
describe("FLAG-01: Dead Zone", () => {
    it("detects dead zone when all L4s have decision_exists=false", () => {
        const opp = makeL3();
        const l4s = [
            makeL4({ decision_exists: false }),
            makeL4({ decision_exists: false }),
            makeL4({ decision_exists: false }),
        ];
        const flags = detectRedFlags(opp, l4s);
        const dz = flags.find((f) => f.type === "DEAD_ZONE");
        assert.ok(dz, "should detect DEAD_ZONE flag");
    });
    it("does not flag when at least one L4 has decision_exists=true", () => {
        const opp = makeL3();
        const l4s = [
            makeL4({ decision_exists: false }),
            makeL4({ decision_exists: true }),
        ];
        const flags = detectRedFlags(opp, l4s);
        const dz = flags.find((f) => f.type === "DEAD_ZONE");
        assert.equal(dz, undefined);
    });
    it("does not flag when no matching L4s (empty array)", () => {
        const opp = makeL3();
        const flags = detectRedFlags(opp, []);
        const dz = flags.find((f) => f.type === "DEAD_ZONE");
        assert.equal(dz, undefined);
    });
});
// -- FLAG-02: No Stakes --
describe("FLAG-02: No Stakes", () => {
    it("detects no-stakes when zero HIGH financial and all SECOND order", () => {
        const opp = makeL3();
        const l4s = [
            makeL4({ financial_rating: "LOW", impact_order: "SECOND" }),
            makeL4({ financial_rating: "MEDIUM", impact_order: "SECOND" }),
        ];
        const flags = detectRedFlags(opp, l4s);
        const ns = flags.find((f) => f.type === "NO_STAKES");
        assert.ok(ns, "should detect NO_STAKES flag");
    });
    it("does not flag when at least one HIGH financial rating", () => {
        const opp = makeL3();
        const l4s = [
            makeL4({ financial_rating: "HIGH", impact_order: "SECOND" }),
            makeL4({ financial_rating: "LOW", impact_order: "SECOND" }),
        ];
        const flags = detectRedFlags(opp, l4s);
        const ns = flags.find((f) => f.type === "NO_STAKES");
        assert.equal(ns, undefined);
    });
    it("does not flag when impact_order includes FIRST", () => {
        const opp = makeL3();
        const l4s = [
            makeL4({ financial_rating: "LOW", impact_order: "FIRST" }),
            makeL4({ financial_rating: "LOW", impact_order: "SECOND" }),
        ];
        const flags = detectRedFlags(opp, l4s);
        const ns = flags.find((f) => f.type === "NO_STAKES");
        assert.equal(ns, undefined);
    });
});
// -- FLAG-03: Confidence Gap --
describe("FLAG-03: Confidence Gap", () => {
    it("detects confidence gap when >50% of L4s have LOW confidence", () => {
        const opp = makeL3();
        const l4s = [
            makeL4({ rating_confidence: "LOW" }),
            makeL4({ rating_confidence: "LOW" }),
            makeL4({ rating_confidence: "HIGH" }),
        ];
        const flags = detectRedFlags(opp, l4s);
        const cg = flags.find((f) => f.type === "CONFIDENCE_GAP");
        assert.ok(cg, "should detect CONFIDENCE_GAP flag");
    });
    it("does not flag when exactly 50% LOW (not strictly >50%)", () => {
        const opp = makeL3();
        const l4s = [
            makeL4({ rating_confidence: "LOW" }),
            makeL4({ rating_confidence: "HIGH" }),
        ];
        const flags = detectRedFlags(opp, l4s);
        const cg = flags.find((f) => f.type === "CONFIDENCE_GAP");
        assert.equal(cg, undefined, "50% is not >50%, should not flag");
    });
    it("does not flag when <=50% LOW confidence", () => {
        const opp = makeL3();
        const l4s = [
            makeL4({ rating_confidence: "LOW" }),
            makeL4({ rating_confidence: "MEDIUM" }),
            makeL4({ rating_confidence: "HIGH" }),
        ];
        const flags = detectRedFlags(opp, l4s);
        const cg = flags.find((f) => f.type === "CONFIDENCE_GAP");
        assert.equal(cg, undefined);
    });
});
// -- resolveAction --
describe("resolveAction", () => {
    it("returns 'process' when no flags", () => {
        assert.equal(resolveAction([]), "process");
    });
    it("returns 'skip' for DEAD_ZONE flag", () => {
        const action = resolveAction([{ type: "DEAD_ZONE", decisionDensity: 0 }]);
        assert.equal(action, "skip");
    });
    it("returns 'skip' for PHANTOM flag", () => {
        const action = resolveAction([
            { type: "PHANTOM", opportunityExists: false },
        ]);
        assert.equal(action, "skip");
    });
    it("returns 'demote' for NO_STAKES flag", () => {
        const action = resolveAction([
            { type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true },
        ]);
        assert.equal(action, "demote");
    });
    it("returns 'process' for flag-only types (CONFIDENCE_GAP, ORPHAN)", () => {
        const action = resolveAction([
            { type: "CONFIDENCE_GAP", lowConfidencePct: 0.75 },
            { type: "ORPHAN", l4Count: 2 },
        ]);
        assert.equal(action, "process");
    });
    it("returns worst action: skip > demote > flag", () => {
        const action = resolveAction([
            { type: "PHANTOM", opportunityExists: false },
            { type: "ORPHAN", l4Count: 1 },
        ]);
        assert.equal(action, "skip");
    });
    it("returns demote when demote + flag present", () => {
        const action = resolveAction([
            { type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true },
            { type: "CONFIDENCE_GAP", lowConfidencePct: 0.6 },
        ]);
        assert.equal(action, "demote");
    });
});
// -- Multiple flags --
describe("Multiple flags on same opportunity", () => {
    it("detects both PHANTOM and ORPHAN, action resolves to skip", () => {
        const opp = makeL3({ opportunity_exists: false, l4_count: 1 });
        const flags = detectRedFlags(opp, []);
        const types = flags.map((f) => f.type);
        assert.ok(types.includes("PHANTOM"), "should have PHANTOM");
        assert.ok(types.includes("ORPHAN"), "should have ORPHAN");
        assert.equal(resolveAction(flags), "skip");
    });
});
