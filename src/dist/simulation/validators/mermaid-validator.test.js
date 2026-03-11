import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateMermaidFlowchart } from "./mermaid-validator.js";
describe("validateMermaidFlowchart", () => {
    it("valid flowchart TD with nodes and edges returns ok: true", () => {
        const content = `flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Approve]
  B -->|No| D[Reject]`;
        const result = validateMermaidFlowchart(content);
        assert.equal(result.ok, true);
    });
    it("missing flowchart declaration returns ok: false with descriptive error", () => {
        const content = `A[Start] --> B{Decision}
  B -->|Yes| C[Approve]`;
        const result = validateMermaidFlowchart(content);
        assert.equal(result.ok, false);
        assert.ok(result.error);
        assert.ok(result.error.includes("flowchart"));
    });
    it("flowchart with no edges (no -->) returns ok: false", () => {
        const content = `flowchart TD
  A[Start]
  B[End Node]
  C[Other]`;
        const result = validateMermaidFlowchart(content);
        assert.equal(result.ok, false);
        assert.ok(result.error.includes("edge"));
    });
    it("flowchart with fewer than 3 lines returns ok: false", () => {
        const content = `flowchart TD
  A --> B`;
        const result = validateMermaidFlowchart(content);
        assert.equal(result.ok, false);
        assert.ok(result.error.includes("short"));
    });
    it('lowercase "end" as node name detected and returns ok: false', () => {
        const content = `flowchart TD
  A[Start] --> B{Check}
  B --> end
  B --> C[Other]`;
        const result = validateMermaidFlowchart(content);
        assert.equal(result.ok, false);
        assert.ok(result.error.includes("end"));
    });
    it("flowchart LR direction accepted", () => {
        const content = `flowchart LR
  A[Input] --> B[Process]
  B --> C[Output]`;
        const result = validateMermaidFlowchart(content);
        assert.equal(result.ok, true);
    });
    it("lines with subgraph/end are not flagged as lowercase end issue", () => {
        const content = `flowchart TD
  subgraph Approval
    A[Start] --> B[Check]
  end
  B --> C[Done]`;
        const result = validateMermaidFlowchart(content);
        assert.equal(result.ok, true);
    });
});
