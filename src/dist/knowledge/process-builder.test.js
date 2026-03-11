/**
 * Tests for Process Builder knowledge query module.
 *
 * Verifies node lookups, category filtering, pattern retrieval,
 * and referential integrity between patterns and nodes.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPBNode, getAllPBNodes, getPBNodesByCategory, getWorkflowPatterns, getWorkflowPattern, } from "./process-builder.js";
describe("getPBNode", () => {
    it("returns a node by exact name", () => {
        const node = getPBNode("Interface");
        assert.ok(node, "Interface node should exist");
        assert.equal(node.purpose, "Database/API integration");
        assert.equal(node.category, "data");
    });
    it("returns undefined for nonexistent node", () => {
        const node = getPBNode("nonexistent");
        assert.equal(node, undefined);
    });
    it("performs case-insensitive lookup", () => {
        const node = getPBNode("if");
        assert.ok(node, "IF node should be found via lowercase 'if'");
        assert.equal(node.name, "IF");
        assert.equal(node.category, "control_flow");
    });
    it("handles multi-word names case-insensitively", () => {
        const node = getPBNode("rollback transaction");
        assert.ok(node, "Rollback Transaction should be found lowercase");
        assert.equal(node.name, "Rollback Transaction");
    });
});
describe("getAllPBNodes", () => {
    it("returns all 22 nodes", () => {
        const nodes = getAllPBNodes();
        assert.equal(nodes.length, 22);
    });
    it("returns typed PBNode objects", () => {
        const nodes = getAllPBNodes();
        for (const node of nodes) {
            assert.ok(typeof node.name === "string");
            assert.ok(typeof node.purpose === "string");
            assert.ok(typeof node.documentation_file === "string");
            assert.ok(typeof node.documentation_section === "string");
            assert.ok(typeof node.category === "string");
        }
    });
});
describe("getPBNodesByCategory", () => {
    it("returns 5 control_flow nodes", () => {
        const nodes = getPBNodesByCategory("control_flow");
        assert.equal(nodes.length, 5);
        const names = nodes.map((n) => n.name).sort();
        assert.deepEqual(names, ["Do While", "IF", "Rules", "Script", "While"]);
    });
    it("returns 2 transaction nodes", () => {
        const nodes = getPBNodesByCategory("transaction");
        assert.equal(nodes.length, 2);
        const names = nodes.map((n) => n.name).sort();
        assert.deepEqual(names, ["Rollback Transaction", "Transaction"]);
    });
    it("returns empty array for invalid category", () => {
        // Cast to bypass type checking for this test
        const nodes = getPBNodesByCategory("nonexistent");
        assert.equal(nodes.length, 0);
    });
});
describe("getWorkflowPatterns", () => {
    it("returns all 7 patterns", () => {
        const patterns = getWorkflowPatterns();
        assert.equal(patterns.length, 7);
    });
});
describe("getWorkflowPattern", () => {
    it("returns ETL Pattern with correct node_sequence", () => {
        const pattern = getWorkflowPattern("ETL Pattern");
        assert.ok(pattern, "ETL Pattern should exist");
        assert.ok(pattern.node_sequence.includes("Data View"), "ETL Pattern should include Data View");
    });
    it("returns undefined for nonexistent pattern", () => {
        const pattern = getWorkflowPattern("Nonexistent Pattern");
        assert.equal(pattern, undefined);
    });
});
describe("referential integrity", () => {
    it("every node in every pattern exists in getAllPBNodes", () => {
        const allNodeNames = new Set(getAllPBNodes().map((n) => n.name.toLowerCase()));
        const patterns = getWorkflowPatterns();
        for (const pattern of patterns) {
            for (const nodeName of pattern.node_sequence) {
                assert.ok(allNodeNames.has(nodeName.toLowerCase()), `Pattern "${pattern.name}" references node "${nodeName}" which does not exist in getAllPBNodes()`);
            }
        }
    });
});
