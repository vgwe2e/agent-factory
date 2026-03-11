import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// Resolve data directory relative to this module
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "..", "data", "components");
function loadJson(filename) {
    const content = readFileSync(resolve(dataDir, filename), "utf-8");
    return JSON.parse(content);
}
// Component file names (all 21)
const COMPONENT_FILES = [
    "attachment",
    "button",
    "chart",
    "checkbox",
    "dashboard",
    "discovery",
    "dropdown",
    "filter",
    "icon_button",
    "image",
    "input_field",
    "label",
    "link",
    "paragraph",
    "popup",
    "radio_buttons",
    "report",
    "section",
    "table",
    "tabs",
    "textarea",
];
// Load all data at module initialization
const componentMap = new Map();
for (const name of COMPONENT_FILES) {
    const data = loadJson(`${name}.json`);
    componentMap.set(data.name.toLowerCase(), data);
}
const indexData = loadJson("component-index.json");
/**
 * Look up a component by name (case-insensitive).
 */
export function getComponent(name) {
    return componentMap.get(name.toLowerCase());
}
/**
 * Return all 21 components.
 */
export function getAllComponents() {
    return Array.from(componentMap.values());
}
/**
 * Filter components by category.
 */
export function getComponentsByCategory(category) {
    return getAllComponents().filter((c) => c.category === category);
}
/**
 * Return a flat array of all properties across all tabs for a component.
 * Returns empty array if component not found.
 */
export function getComponentProperties(name) {
    const component = getComponent(name);
    if (!component)
        return [];
    const properties = [];
    for (const tab of Object.values(component.tabs)) {
        if (tab?.properties) {
            properties.push(...tab.properties);
        }
    }
    return properties;
}
/**
 * Return the component index metadata.
 */
export function getComponentIndex() {
    return indexData;
}
