import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractMermaidBlock, extractYamlBlock, slugify, } from "./utils.js";
describe("extractMermaidBlock", () => {
    it("extracts from ```mermaid fence", () => {
        const raw = "Some text\n```mermaid\nflowchart TD\n  A --> B\n```\nMore text";
        assert.equal(extractMermaidBlock(raw), "flowchart TD\n  A --> B");
    });
    it("returns raw content when no fence present", () => {
        const raw = "flowchart TD\n  A --> B";
        assert.equal(extractMermaidBlock(raw), "flowchart TD\n  A --> B");
    });
});
describe("extractYamlBlock", () => {
    it("extracts from ```yaml fence", () => {
        const raw = "Here is yaml:\n```yaml\nkey: value\n```\ndone";
        assert.equal(extractYamlBlock(raw), "key: value");
    });
    it("extracts from ```yml fence", () => {
        const raw = "```yml\nfoo: bar\n```";
        assert.equal(extractYamlBlock(raw), "foo: bar");
    });
    it("returns raw content when no fence present", () => {
        const raw = "key: value\nfoo: bar";
        assert.equal(extractYamlBlock(raw), "key: value\nfoo: bar");
    });
});
describe("slugify", () => {
    it('converts "Supply Chain Optimization" to "supply-chain-optimization"', () => {
        assert.equal(slugify("Supply Chain Optimization"), "supply-chain-optimization");
    });
    it('handles special characters: "R&D / Innovation" to "r-d-innovation"', () => {
        assert.equal(slugify("R&D / Innovation"), "r-d-innovation");
    });
    it("strips leading/trailing hyphens", () => {
        assert.equal(slugify("--hello world--"), "hello-world");
    });
});
