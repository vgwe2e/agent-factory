import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  UIComponent,
  ComponentCategory,
  ComponentProperty,
  ComponentIndex,
} from "../types/knowledge.js";

// Resolve data directory relative to this module
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "..", "data", "components");

function loadJson<T>(filename: string): T {
  const content = readFileSync(resolve(dataDir, filename), "utf-8");
  return JSON.parse(content) as T;
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
] as const;

// Load all data at module initialization
const componentMap = new Map<string, UIComponent>();
for (const name of COMPONENT_FILES) {
  const data = loadJson<UIComponent>(`${name}.json`);
  componentMap.set(data.name.toLowerCase(), data);
}

const indexData = loadJson<ComponentIndex>("component-index.json");

/**
 * Look up a component by name (case-insensitive).
 */
export function getComponent(name: string): UIComponent | undefined {
  return componentMap.get(name.toLowerCase());
}

/**
 * Return all 21 components.
 */
export function getAllComponents(): UIComponent[] {
  return Array.from(componentMap.values());
}

/**
 * Filter components by category.
 */
export function getComponentsByCategory(
  category: ComponentCategory,
): UIComponent[] {
  return getAllComponents().filter((c) => c.category === category);
}

/**
 * Return a flat array of all properties across all tabs for a component.
 * Returns empty array if component not found.
 */
export function getComponentProperties(name: string): ComponentProperty[] {
  const component = getComponent(name);
  if (!component) return [];

  const properties: ComponentProperty[] = [];
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
export function getComponentIndex(): ComponentIndex {
  return indexData;
}
