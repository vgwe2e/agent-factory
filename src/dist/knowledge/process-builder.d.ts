/**
 * Process Builder knowledge query module.
 *
 * Provides typed lookup functions for the 22 Aera Process Builder nodes
 * and 7 common workflow patterns. Data is loaded from bundled JSON at
 * module initialization -- no runtime filesystem access to ~/Documents/area.
 */
import type { PBNode, PBNodeCategory, WorkflowPattern } from "../types/process-builder.js";
/**
 * Look up a Process Builder node by name (case-insensitive).
 *
 * @param name - Node name, e.g. "Interface", "if", "Data View"
 * @returns The matching PBNode, or undefined if not found
 */
export declare function getPBNode(name: string): PBNode | undefined;
/**
 * Return all 22 Process Builder nodes.
 */
export declare function getAllPBNodes(): PBNode[];
/**
 * Return all nodes belonging to a specific category.
 *
 * @param category - One of: core, data, control_flow, transaction,
 *                   parallel, orchestration, communication, integration
 */
export declare function getPBNodesByCategory(category: PBNodeCategory): PBNode[];
/**
 * Return all 7 workflow patterns.
 */
export declare function getWorkflowPatterns(): WorkflowPattern[];
/**
 * Look up a workflow pattern by exact name.
 *
 * @param name - Pattern name, e.g. "ETL Pattern"
 * @returns The matching WorkflowPattern, or undefined if not found
 */
export declare function getWorkflowPattern(name: string): WorkflowPattern | undefined;
