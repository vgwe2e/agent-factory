import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeOpenAiJsonSchema, stripNullFields, } from "./openai-batch-client.js";
describe("normalizeOpenAiJsonSchema", () => {
    it("requires all object properties and makes original optionals nullable", () => {
        const input = {
            type: "object",
            properties: {
                required_name: { type: "string" },
                optional_tags: {
                    type: "array",
                    items: { type: "string" },
                },
                nested: {
                    type: "object",
                    properties: {
                        optional_note: { type: "string" },
                    },
                    required: [],
                },
            },
            required: ["required_name", "nested"],
        };
        const normalized = normalizeOpenAiJsonSchema(input);
        const required = normalized.required;
        const props = normalized.properties;
        const optionalTags = props.optional_tags;
        const nested = props.nested;
        const nestedProps = nested.properties;
        const nestedOptional = nestedProps.optional_note;
        assert.deepEqual(required, ["required_name", "optional_tags", "nested"]);
        assert.deepEqual(optionalTags.type, ["array", "null"]);
        assert.deepEqual(nested.required, ["optional_note"]);
        assert.deepEqual(nestedOptional.type, ["string", "null"]);
    });
});
describe("stripNullFields", () => {
    it("removes null object fields recursively and leaves arrays intact", () => {
        const input = {
            objective: "test",
            optional_note: null,
            nested: {
                label: "x",
                kind: null,
            },
            items: [
                { name: "a", note: null },
                { name: "b", note: "kept" },
            ],
        };
        const result = stripNullFields(input);
        const nested = result.nested;
        const items = result.items;
        assert.equal("optional_note" in result, false);
        assert.equal("kind" in nested, false);
        assert.equal("note" in items[0], false);
        assert.equal(items[1].note, "kept");
    });
});
