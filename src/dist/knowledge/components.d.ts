import type { UIComponent, ComponentCategory, ComponentProperty, ComponentIndex } from "../types/knowledge.js";
/**
 * Look up a component by name (case-insensitive).
 */
export declare function getComponent(name: string): UIComponent | undefined;
/**
 * Return all 21 components.
 */
export declare function getAllComponents(): UIComponent[];
/**
 * Filter components by category.
 */
export declare function getComponentsByCategory(category: ComponentCategory): UIComponent[];
/**
 * Return a flat array of all properties across all tabs for a component.
 * Returns empty array if component not found.
 */
export declare function getComponentProperties(name: string): ComponentProperty[];
/**
 * Return the component index metadata.
 */
export declare function getComponentIndex(): ComponentIndex;
