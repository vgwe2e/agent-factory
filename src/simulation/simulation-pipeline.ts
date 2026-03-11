/**
 * Simulation pipeline orchestrator.
 *
 * Wires all four generators (decision flow, component map, mock test,
 * integration surface) into a sequential pipeline that processes
 * promoted opportunities by composite score descending.
 *
 * Writes output files to evaluation/simulations/<slug>/ with:
 *   - decision-flow.mmd (Mermaid diagram)
 *   - component-map.yaml (YAML)
 *   - mock-test.yaml (YAML)
 *   - integration-surface.yaml (YAML)
 *
 * Handles partial failures: if one generator fails, the others
 * still produce output. Knowledge index is built once and reused
 * across all opportunities.
 */

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type {
  SimulationInput,
  SimulationResult,
  SimulationArtifacts,
  ComponentMap,
  MockTest,
  IntegrationSurface,
} from "../types/simulation.js";
import type { ValidationResult } from "./validators/knowledge-validator.js";
import { generateDecisionFlow as defaultGenerateDecisionFlow } from "./generators/decision-flow-gen.js";
import { generateComponentMap as defaultGenerateComponentMap } from "./generators/component-map-gen.js";
import { generateMockTest as defaultGenerateMockTest } from "./generators/mock-test-gen.js";
import { generateIntegrationSurface as defaultGenerateIntegrationSurface } from "./generators/integration-surface-gen.js";
import { buildKnowledgeIndex as defaultBuildKnowledgeIndex } from "./validators/knowledge-validator.js";
import { slugify } from "./utils.js";

// -- Types --

export interface SimulationPipelineResult {
  results: SimulationResult[];
  totalSimulated: number;
  totalFailed: number;
  totalConfirmed: number;
  totalInferred: number;
}

/** Dependency injection interface for testing. */
export interface PipelineDeps {
  generateDecisionFlow: (input: SimulationInput, ollamaUrl?: string) => Promise<
    { success: true; data: { mermaid: string; attempts: number } } | { success: false; error: string }
  >;
  generateComponentMap: (input: SimulationInput, knowledgeIndex: Map<string, string>, ollamaUrl?: string) => Promise<
    { success: true; data: { componentMap: ComponentMap; validation: ValidationResult[]; attempts: number } } | { success: false; error: string }
  >;
  generateMockTest: (input: SimulationInput, ollamaUrl?: string) => Promise<
    { success: true; data: { mockTest: MockTest; attempts: number } } | { success: false; error: string }
  >;
  generateIntegrationSurface: (input: SimulationInput, ollamaUrl?: string) => Promise<
    { success: true; data: { integrationSurface: IntegrationSurface; attempts: number } } | { success: false; error: string }
  >;
  buildKnowledgeIndex: () => Map<string, string>;
}

const DEFAULT_DEPS: PipelineDeps = {
  generateDecisionFlow: defaultGenerateDecisionFlow,
  generateComponentMap: defaultGenerateComponentMap,
  generateMockTest: defaultGenerateMockTest,
  generateIntegrationSurface: defaultGenerateIntegrationSurface,
  buildKnowledgeIndex: defaultBuildKnowledgeIndex,
};

// -- Pipeline --

/**
 * Run the simulation pipeline for a set of promoted opportunities.
 *
 * @param inputs - Pre-filtered SimulationInput array (composite >= 0.60)
 * @param outputDir - Root directory for output files (e.g., evaluation/simulations)
 * @param ollamaUrl - Optional Ollama API URL override
 * @param deps - Optional dependency injection for testing
 */
export async function runSimulationPipeline(
  inputs: SimulationInput[],
  outputDir: string,
  ollamaUrl?: string,
  deps: PipelineDeps = DEFAULT_DEPS,
): Promise<SimulationPipelineResult> {
  if (inputs.length === 0) {
    return {
      results: [],
      totalSimulated: 0,
      totalFailed: 0,
      totalConfirmed: 0,
      totalInferred: 0,
    };
  }

  // Sort by composite descending (highest first)
  const sorted = [...inputs].sort((a, b) => b.composite - a.composite);

  // Build knowledge index once for all opportunities
  const knowledgeIndex = deps.buildKnowledgeIndex();

  const results: SimulationResult[] = [];
  let totalFailed = 0;
  let totalConfirmed = 0;
  let totalInferred = 0;

  for (let i = 0; i < sorted.length; i++) {
    const input = sorted[i];
    const l3Name = input.opportunity.l3_name;
    const slug = slugify(l3Name);
    const oppDir = path.join(outputDir, slug);

    console.log(`Simulating ${i + 1}/${sorted.length}: ${l3Name}`);

    // Create output directory
    fs.mkdirSync(oppDir, { recursive: true });

    // Track artifacts and validation
    let mermaid: string | undefined;
    let componentMap: ComponentMap | undefined;
    let validation: ValidationResult[] = [];
    let mockTest: MockTest | undefined;
    let integrationSurface: IntegrationSurface | undefined;
    let mermaidValid = false;
    let artifactFailures = 0;

    // 1. Decision flow
    const dfResult = await deps.generateDecisionFlow(input, ollamaUrl);
    if (dfResult.success) {
      mermaid = dfResult.data.mermaid;
      mermaidValid = true;
      fs.writeFileSync(path.join(oppDir, "decision-flow.mmd"), mermaid, "utf-8");
    } else {
      console.error(`  Decision flow failed for ${l3Name}: ${dfResult.error}`);
      artifactFailures++;
    }

    // 2. Component map
    const cmResult = await deps.generateComponentMap(input, knowledgeIndex, ollamaUrl);
    if (cmResult.success) {
      componentMap = cmResult.data.componentMap;
      validation = cmResult.data.validation;
      fs.writeFileSync(path.join(oppDir, "component-map.yaml"), yaml.dump(componentMap), "utf-8");
    } else {
      console.error(`  Component map failed for ${l3Name}: ${cmResult.error}`);
      artifactFailures++;
    }

    // 3. Mock test
    const mtResult = await deps.generateMockTest(input, ollamaUrl);
    if (mtResult.success) {
      mockTest = mtResult.data.mockTest;
      fs.writeFileSync(path.join(oppDir, "mock-test.yaml"), yaml.dump(mockTest), "utf-8");
    } else {
      console.error(`  Mock test failed for ${l3Name}: ${mtResult.error}`);
      artifactFailures++;
    }

    // 4. Integration surface
    const isResult = await deps.generateIntegrationSurface(input, ollamaUrl);
    if (isResult.success) {
      integrationSurface = isResult.data.integrationSurface;
      fs.writeFileSync(path.join(oppDir, "integration-surface.yaml"), yaml.dump(integrationSurface), "utf-8");
    } else {
      console.error(`  Integration surface failed for ${l3Name}: ${isResult.error}`);
      artifactFailures++;
    }

    // Count confirmed/inferred from validation results
    const confirmed = validation.filter((v) => v.status === "confirmed").length;
    const inferred = validation.filter((v) => v.status === "inferred").length;
    totalConfirmed += confirmed;
    totalInferred += inferred;

    if (artifactFailures === 4) {
      totalFailed++;
    }

    // Build default empty artifacts for any failures
    const defaultComponentMap: ComponentMap = { streams: [], cortex: [], process_builder: [], agent_teams: [], ui: [] };
    const defaultMockTest: MockTest = {
      decision: "",
      input: { financial_context: {}, trigger: "" },
      expected_output: { action: "", outcome: "" },
      rationale: "",
    };
    const defaultIntegrationSurface: IntegrationSurface = {
      source_systems: [],
      aera_ingestion: [],
      processing: [],
      ui_surface: [],
    };

    results.push({
      l3Name,
      slug,
      artifacts: {
        decisionFlow: mermaid ?? "",
        componentMap: componentMap ?? defaultComponentMap,
        mockTest: mockTest ?? defaultMockTest,
        integrationSurface: integrationSurface ?? defaultIntegrationSurface,
      },
      validationSummary: {
        confirmedCount: confirmed,
        inferredCount: inferred,
        mermaidValid,
      },
    });
  }

  return {
    results,
    totalSimulated: sorted.length,
    totalFailed,
    totalConfirmed,
    totalInferred,
  };
}
