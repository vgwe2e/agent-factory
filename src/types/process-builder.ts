/**
 * Type definitions for Aera Process Builder node reference data.
 *
 * These types describe the structured JSON representation of the 22
 * Process Builder nodes and 7 common workflow patterns bundled in
 * src/data/process-builder/.
 */

export type PBNodeCategory =
  | "core"
  | "data"
  | "control_flow"
  | "transaction"
  | "parallel"
  | "orchestration"
  | "communication"
  | "integration";

export interface PBNode {
  name: string;
  purpose: string;
  documentation_file: string;
  documentation_section: string;
  category: PBNodeCategory;
}

export interface PBNodeIndex {
  version: string;
  total_nodes: number;
  nodes: PBNode[];
}

export interface WorkflowPattern {
  name: string;
  description: string;
  node_sequence: string[];
  use_case: string;
  references: string[];
}

export interface PBPatternIndex {
  version: string;
  patterns: WorkflowPattern[];
}
