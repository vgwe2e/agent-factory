import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getComponent, getAllComponents, getComponentsByCategory, getComponentProperties, getComponentIndex, } from "./components.js";
describe("getComponent", () => {
    it("returns UIComponent for 'button' with correct fields", () => {
        const button = getComponent("button");
        assert.ok(button, "button should exist");
        assert.equal(button.name, "button");
        assert.equal(button.category, "input");
        assert.ok(button.tabs.general, "button should have general tab");
        assert.ok(button.tabs.style, "button should have style tab");
        assert.ok(button.tabs.interaction, "button should have interaction tab");
    });
    it("returns undefined for nonexistent component", () => {
        const result = getComponent("nonexistent");
        assert.equal(result, undefined);
    });
    it("performs case-insensitive lookup", () => {
        const result = getComponent("Button");
        assert.ok(result, "case-insensitive lookup should work");
        assert.equal(result.name, "button");
    });
});
describe("getAllComponents", () => {
    it("returns array of 21 UIComponent objects", () => {
        const all = getAllComponents();
        assert.equal(all.length, 21);
    });
    it("every component from index exists in getAllComponents", () => {
        const index = getComponentIndex();
        const allNames = new Set(getAllComponents().map((c) => c.name));
        for (const cat of Object.values(index.categories)) {
            for (const name of cat.components) {
                assert.ok(allNames.has(name), `Component ${name} should exist`);
            }
        }
    });
});
describe("getComponentsByCategory", () => {
    it("returns 9 components for 'input' category", () => {
        const input = getComponentsByCategory("input");
        assert.equal(input.length, 9);
        const names = input.map((c) => c.name).sort();
        assert.deepEqual(names, [
            "attachment",
            "button",
            "checkbox",
            "dropdown",
            "icon_button",
            "input_field",
            "link",
            "radio_buttons",
            "textarea",
        ]);
    });
    it("returns 2 components for 'layout' category", () => {
        const layout = getComponentsByCategory("layout");
        assert.equal(layout.length, 2);
        const names = layout.map((c) => c.name).sort();
        assert.deepEqual(names, ["popup", "section"]);
    });
});
describe("getComponentProperties", () => {
    it("returns 11 properties for 'button'", () => {
        const props = getComponentProperties("button");
        assert.equal(props.length, 11);
        // Check a known property exists
        const textProp = props.find((p) => p.property === "Text");
        assert.ok(textProp, "Text property should exist");
        assert.equal(textProp.field, "Text");
    });
    it("returns empty array for nonexistent component", () => {
        const props = getComponentProperties("nonexistent");
        assert.deepEqual(props, []);
    });
    it("total properties across all components sums to 208", () => {
        const all = getAllComponents();
        const total = all.reduce((sum, c) => sum + getComponentProperties(c.name).length, 0);
        assert.equal(total, 208);
    });
});
describe("getComponentIndex", () => {
    it("returns index with correct totals", () => {
        const index = getComponentIndex();
        assert.equal(index.version, "1.0");
        assert.equal(index.total_components, 21);
        assert.equal(index.total_properties, 208);
    });
});
