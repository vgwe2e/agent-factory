/**
 * Process Builder knowledge query module.
 *
 * Provides typed lookup functions for the 22 Aera Process Builder nodes
 * and 7 common workflow patterns. Data is loaded from bundled JSON at
 * module initialization -- no runtime filesystem access to ~/Documents/area.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  PBNode,
  PBNodeCategory,
  PBNodeIndex,
  PBPatternIndex,
  WorkflowPattern,
} from "../types/process-builder.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data", "process-builder");

const nodeIndex: PBNodeIndex = JSON.parse(
  readFileSync(join(dataDir, "nodes.json"), "utf-8")
);

const patternIndex: PBPatternIndex = JSON.parse(
  readFileSync(join(dataDir, "patterns.json"), "utf-8")
);

/** Case-insensitive node lookup map, keyed by lowercase name. */
const nodeMap = new Map<string, PBNode>(
  nodeIndex.nodes.map((n) => [n.name.toLowerCase(), n])
);

/**
 * Look up a Process Builder node by name (case-insensitive).
 *
 * @param name - Node name, e.g. "Interface", "if", "Data View"
 * @returns The matching PBNode, or undefined if not found
 */
export function getPBNode(name: string): PBNode | undefined {
  return nodeMap.get(name.toLowerCase());
}

/**
 * Return all 22 Process Builder nodes.
 */
export function getAllPBNodes(): PBNode[] {
  return nodeIndex.nodes;
}

/**
 * Return all nodes belonging to a specific category.
 *
 * @param category - One of: core, data, control_flow, transaction,
 *                   parallel, orchestration, communication, integration
 */
export function getPBNodesByCategory(category: PBNodeCategory): PBNode[] {
  return nodeIndex.nodes.filter((n) => n.category === category);
}

/**
 * Return all 7 workflow patterns.
 */
export function getWorkflowPatterns(): WorkflowPattern[] {
  return patternIndex.patterns;
}

/**
 * Look up a workflow pattern by exact name.
 *
 * @param name - Pattern name, e.g. "ETL Pattern"
 * @returns The matching WorkflowPattern, or undefined if not found
 */
export function getWorkflowPattern(name: string): WorkflowPattern | undefined {
  return patternIndex.patterns.find((p) => p.name === name);
}
