import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { L4Activity, Skill, SkillExecution, SkillProblemStatement } from "../../types/hierarchy.js";
import { preScoreAll } from "./pre-scorer.js";

// -- Factory helpers --

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "sk-1",
    name: "Test Skill",
    description: null,
    archetype: "DETERMINISTIC",
    max_value: 100_000,
    slider_percent: null,
    overlap_group: null,
    value_metric: null,
    decision_made: null,
    aera_skill_pattern: null,
    is_actual: false,
    source: null,
    loe: null,
    savings_type: null,
    actions: [],
    constraints: [],
    execution: null,
    problem_statement: null,
    differentiation: null,
    generated_at: null,
    prompt_version: null,
    is_cross_functional: null,
    cross_functional_scope: null,
    operational_flow: [],
    walkthrough_decision: null,
    walkthrough_actions: [],
    walkthrough_narrative: null,
    ...overrides,
  };
}

function makeL4(overrides: Partial<L4Activity> = {}): L4Activity {
  return {
    id: "l4-1",
    name: "Test L4",
    description: "Test description",
    l1: "L1",
    l2: "L2",
    l3: "L3",
    financial_rating: "MEDIUM",
    value_metric: "$1M",
    impact_order: "FIRST",
    rating_confidence: "MEDIUM",
    ai_suitability: "MEDIUM",
    decision_exists: false,
    decision_articulation: null,
    escalation_flag: null,
    skills: [],
    ...overrides,
  };
}

// -- Integration: correct ranking and survivor selection --

describe("preScoreAll", () => {
  it("ranks 5 varied L4s and selects correct survivors", () => {
    const l4s: L4Activity[] = [
      makeL4({
        id: "l4-high",
        name: "High Score",
        financial_rating: "HIGH",
        ai_suitability: "HIGH",
        impact_order: "FIRST",
        rating_confidence: "HIGH",
        decision_exists: true,
        skills: [makeSkill({
          max_value: 500_000,
          actions: Array.from({ length: 10 }, (_, i) => ({ action_type: "t", action_name: `a${i}`, description: null })),
          constraints: Array.from({ length: 10 }, (_, i) => ({ constraint_type: "t", constraint_name: `c${i}`, description: null })),
          aera_skill_pattern: "pattern",
          execution: {
            target_systems: ["SAP"], write_back_actions: [],
            execution_trigger: "daily", execution_frequency: "daily",
            autonomy_level: "full", approval_required: true,
            approval_threshold: null, rollback_strategy: null,
          },
          problem_statement: {
            current_state: "bad", quantified_pain: "$1M", root_cause: "manual",
            falsifiability_check: "check", outcome: "automate",
          },
        })],
      }),
      makeL4({
        id: "l4-med",
        name: "Medium Score",
        financial_rating: "MEDIUM",
        ai_suitability: "MEDIUM",
        impact_order: "FIRST",
        rating_confidence: "MEDIUM",
        skills: [makeSkill({ max_value: 200_000 })],
      }),
      makeL4({
        id: "l4-low",
        name: "Low Score",
        financial_rating: "LOW",
        ai_suitability: "LOW",
        impact_order: "SECOND",
        rating_confidence: "HIGH",
        decision_exists: true, // avoids DEAD_ZONE so NO_STAKES triggers
        skills: [makeSkill({ max_value: 50_000 })],
      }),
      makeL4({
        id: "l4-medium2",
        name: "Medium2 Score",
        financial_rating: "HIGH",
        ai_suitability: "LOW",
        impact_order: "SECOND",
        rating_confidence: "MEDIUM",
        skills: [makeSkill({ max_value: 150_000 })],
      }),
      makeL4({
        id: "l4-empty",
        name: "Empty Skills",
        financial_rating: "MEDIUM",
        ai_suitability: "MEDIUM",
        impact_order: "FIRST",
        rating_confidence: "HIGH",
        skills: [],
      }),
    ];

    const result = preScoreAll(l4s, 3);
    assert.equal(result.survivors.length + result.eliminated.length, 5);
    assert.equal(result.stats.totalCandidates, 5);
    // l4-low has LOW financial + SECOND impact = NO_STAKES -> eliminated
    const eliminated = result.eliminated.find((e) => e.l4Id === "l4-low");
    assert.ok(eliminated, "l4-low should be eliminated");
    assert.equal(eliminated.eliminationReason, "NO_STAKES");
  });

  // -- Red flag integration: DEAD_ZONE --

  it("eliminates L4 with DEAD_ZONE flag", () => {
    const l4s: L4Activity[] = [
      makeL4({ id: "l4-ok", financial_rating: "HIGH", skills: [makeSkill({ max_value: 100_000 })] }),
      makeL4({
        id: "l4-dead",
        name: "Dead Zone L4",
        decision_exists: false,
        skills: [makeSkill({ actions: [], constraints: [] })],
      }),
    ];

    const result = preScoreAll(l4s, 5);
    const dead = result.eliminated.find((e) => e.l4Id === "l4-dead");
    assert.ok(dead, "l4-dead should be in eliminated");
    assert.equal(dead.eliminationReason, "DEAD_ZONE");
    assert.equal(dead.survived, false);
    assert.equal(dead.composite, 0);
  });

  // -- CONFIDENCE_GAP penalty --

  it("applies CONFIDENCE_GAP penalty (0.3x composite) for LOW confidence", () => {
    const l4s: L4Activity[] = [
      makeL4({
        id: "l4-low-conf",
        financial_rating: "HIGH",
        ai_suitability: "HIGH",
        impact_order: "FIRST",
        rating_confidence: "LOW",
        decision_exists: true,
        skills: [makeSkill({
          max_value: 200_000,
          actions: [{ action_type: "t", action_name: "a1", description: null }],
        })],
      }),
    ];

    const result = preScoreAll(l4s, 5);
    const scored = result.survivors[0] ?? result.eliminated[0];
    assert.ok(scored);
    // With LOW rating_confidence, CONFIDENCE_GAP flag is raised
    assert.ok(scored.redFlags.some((f) => f.type === "CONFIDENCE_GAP"));
    // Composite should be reduced by 0.3x
    // Original composite without penalty would be much higher
    assert.ok(scored.composite < 0.5, `Expected penalized composite < 0.5, got ${scored.composite}`);
  });

  // -- Aggregated max_value --

  it("correctly sums aggregatedMaxValue across skills", () => {
    const l4 = makeL4({
      id: "l4-multi",
      skills: [
        makeSkill({ id: "sk-1", max_value: 100_000 }),
        makeSkill({ id: "sk-2", max_value: 250_000 }),
        makeSkill({ id: "sk-3", max_value: 50_000 }),
      ],
    });

    const result = preScoreAll([l4], 5);
    const scored = result.survivors[0] ?? result.eliminated[0];
    assert.ok(scored);
    assert.equal(scored.aggregatedMaxValue, 400_000);
    assert.equal(scored.skillCount, 3);
  });

  // -- Empty skills --

  it("handles L4 with no skills (skillCount=0)", () => {
    const l4 = makeL4({
      id: "l4-empty",
      skills: [],
    });

    const result = preScoreAll([l4], 5);
    const scored = result.survivors[0] ?? result.eliminated[0];
    assert.ok(scored);
    assert.equal(scored.skillCount, 0);
    assert.equal(scored.aggregatedMaxValue, 0);
  });

  // -- Performance test: 826 synthetic L4s --

  it("scores and filters 826 L4s in under 100ms", () => {
    const l4s: L4Activity[] = Array.from({ length: 826 }, (_, i) => {
      const ratings = ["HIGH", "MEDIUM", "LOW"] as const;
      const impacts = ["FIRST", "SECOND"] as const;
      const aiRatings = ["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"] as const;

      return makeL4({
        id: `l4-${String(i).padStart(4, "0")}`,
        name: `Activity ${i}`,
        l1: `L1-${i % 5}`,
        l2: `L2-${i % 10}`,
        l3: `L3-${i % 20}`,
        financial_rating: ratings[i % 3],
        ai_suitability: aiRatings[i % 4],
        impact_order: impacts[i % 2],
        rating_confidence: ratings[i % 3],
        decision_exists: i % 3 !== 0,
        skills: Array.from({ length: 1 + (i % 4) }, (_, j) =>
          makeSkill({
            id: `sk-${i}-${j}`,
            max_value: (i + 1) * 10_000,
            actions: Array.from({ length: j + 1 }, (_, k) => ({
              action_type: "test",
              action_name: `action-${k}`,
              description: null,
            })),
            constraints: Array.from({ length: j }, (_, k) => ({
              constraint_type: "test",
              constraint_name: `constraint-${k}`,
              description: null,
            })),
          }),
        ),
      });
    });

    const start = performance.now();
    const result = preScoreAll(l4s, 100);
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 100, `Expected < 100ms, took ${elapsed.toFixed(2)}ms`);
    assert.equal(result.stats.totalCandidates, 826);
    assert.ok(result.survivors.length > 0, "Should have survivors");
    assert.ok(result.survivors.length <= Math.floor(100 * 1.1), "Should not exceed 1.1x cap");
  });

  // -- Hierarchy name propagation --

  it("propagates l1/l2/l3 names from L4Activity to PreScoreResult", () => {
    const l4 = makeL4({
      id: "l4-names",
      name: "Named L4",
      l1: "Area One",
      l2: "Domain Two",
      l3: "Category Three",
    });

    const result = preScoreAll([l4], 5);
    const scored = result.survivors[0] ?? result.eliminated[0];
    assert.ok(scored);
    assert.equal(scored.l4Id, "l4-names");
    assert.equal(scored.l4Name, "Named L4");
    assert.equal(scored.l1Name, "Area One");
    assert.equal(scored.l2Name, "Domain Two");
    assert.equal(scored.l3Name, "Category Three");
  });
});
