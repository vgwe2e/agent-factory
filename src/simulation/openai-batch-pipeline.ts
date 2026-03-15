import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

import type {
  ComponentMap,
  IntegrationSurface,
  MockTest,
  ScenarioSpec,
  SimulationInput,
  SimulationResult,
} from "../types/simulation.js";
import { getAllPBNodes } from "../knowledge/process-builder.js";
import { getAllComponents } from "../knowledge/components.js";
import { getIntegrationPatterns } from "../knowledge/orchestration.js";
import { buildKnowledgeContext } from "../scoring/knowledge-context.js";
import { buildScenarioSpecPrompt } from "./prompts/scenario-spec.js";
import { ScenarioSpecSchema, scenarioSpecJsonSchema } from "./schemas.js";
import { renderScenarioArtifacts } from "./renderers.js";
import { assessSimulation } from "./assessment.js";
import {
  buildKnowledgeIndex as defaultBuildKnowledgeIndex,
} from "./validators/knowledge-validator.js";
import { slugify } from "./utils.js";
import type { SimulationPipelineResult } from "./simulation-pipeline.js";
import type { OpenAiBatchConfig } from "../infra/openai-batch-client.js";
import {
  extractChatCompletionContent,
  normalizeOpenAiJsonSchema,
  runOpenAiBatch,
  stripNullFields,
} from "../infra/openai-batch-client.js";

interface OpenAiBatchSimulationDeps {
  buildKnowledgeIndex: () => Map<string, string>;
}

const DEFAULT_DEPS: OpenAiBatchSimulationDeps = {
  buildKnowledgeIndex: defaultBuildKnowledgeIndex,
};

export async function runOpenAiBatchSimulation(
  inputs: SimulationInput[],
  outputDir: string,
  batchConfig: OpenAiBatchConfig,
  deps: OpenAiBatchSimulationDeps = DEFAULT_DEPS,
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

  const sorted = [...inputs].sort((a, b) => b.composite - a.composite);
  const knowledgeIndex = deps.buildKnowledgeIndex();
  const pbNodeNames = getAllPBNodes().map((node) => node.name);
  const uiComponentNames = getAllComponents().map((component) => component.name);
  const integrationPatternNames = getIntegrationPatterns().map((pattern) => pattern.name);
  const knowledgeContext = buildKnowledgeContext();

  const requests = sorted.map((input) => {
    const customId = getSimulationId(input);
    const messages = buildScenarioSpecPrompt(
      input,
      pbNodeNames,
      uiComponentNames,
      integrationPatternNames,
      knowledgeContext.capabilities,
      "json",
    );
    return {
      customId,
      body: {
        model: batchConfig.simulationModel ?? "gpt-5-mini",
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "scenario_spec",
            strict: true,
            schema: normalizeOpenAiJsonSchema(scenarioSpecJsonSchema),
          },
        },
      },
    };
  });

  const batchResult = await runOpenAiBatch(batchConfig, {
    jobName: "simulation-scenario-spec",
    endpoint: "/v1/chat/completions",
    outputDir: path.dirname(outputDir),
    requests,
  });

  const outputById = new Map<string, unknown>();
  for (const line of batchResult.outputLines) {
    const parsed = line as { custom_id?: string };
    if (parsed.custom_id) {
      outputById.set(parsed.custom_id, line);
    }
  }

  const results: SimulationResult[] = [];
  let totalFailed = 0;
  let totalConfirmed = 0;
  let totalInferred = 0;

  for (const input of sorted) {
    const subjectName = input.l4Activity?.name ?? input.opportunity?.l3_name ?? "unknown";
    const slug = input.l4Activity
      ? slugify(input.l4Activity.name) + "-" + input.l4Activity.id.slice(-6)
      : slugify(subjectName);
    const oppDir = path.join(outputDir, slug);
    fs.mkdirSync(oppDir, { recursive: true });

    const rawLine = outputById.get(getSimulationId(input));
    if (!rawLine) {
      totalFailed++;
      results.push(buildFailedResult(subjectName, slug, "No batch output returned for simulation request."));
      continue;
    }

    const contentResult = extractChatCompletionContent(rawLine);
    if (!contentResult.success) {
      totalFailed++;
      results.push(buildFailedResult(subjectName, slug, contentResult.error));
      continue;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(contentResult.content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      totalFailed++;
      results.push(buildFailedResult(subjectName, slug, `Invalid JSON output (${message})`));
      continue;
    }

    const parsedSpec = ScenarioSpecSchema.safeParse(stripNullFields(parsedJson));
    if (!parsedSpec.success) {
      totalFailed++;
      results.push(buildFailedResult(subjectName, slug, parsedSpec.error.message));
      continue;
    }

    const scenarioSpec = parsedSpec.data;
    const rendered = renderScenarioArtifacts(input, scenarioSpec, knowledgeIndex);
    const assessment = assessSimulation({
      scenarioSpec,
      mockTest: rendered.artifacts.mockTest,
      integrationSurface: rendered.artifacts.integrationSurface,
      confirmedCount: rendered.validation.filter((item) => item.status === "confirmed").length,
      inferredCount: rendered.validation.filter((item) => item.status === "inferred").length,
      mermaidValid: rendered.mermaidValid,
    });

    const confirmed = rendered.validation.filter((item) => item.status === "confirmed").length;
    const inferred = rendered.validation.filter((item) => item.status === "inferred").length;
    totalConfirmed += confirmed;
    totalInferred += inferred;

    fs.writeFileSync(path.join(oppDir, "scenario-spec.yaml"), yaml.dump(scenarioSpec), "utf-8");
    fs.writeFileSync(path.join(oppDir, "decision-flow.mmd"), rendered.artifacts.decisionFlow, "utf-8");
    fs.writeFileSync(path.join(oppDir, "component-map.yaml"), yaml.dump(rendered.artifacts.componentMap), "utf-8");
    fs.writeFileSync(path.join(oppDir, "mock-test.yaml"), yaml.dump(rendered.artifacts.mockTest), "utf-8");
    fs.writeFileSync(path.join(oppDir, "integration-surface.yaml"), yaml.dump(rendered.artifacts.integrationSurface), "utf-8");
    fs.writeFileSync(path.join(oppDir, "simulation-assessment.yaml"), yaml.dump(assessment), "utf-8");

    results.push({
      l3Name: subjectName,
      slug,
      scenarioSpec,
      assessment,
      artifacts: rendered.artifacts,
      validationSummary: {
        confirmedCount: confirmed,
        inferredCount: inferred,
        mermaidValid: rendered.mermaidValid,
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

function getSimulationId(input: SimulationInput): string {
  return input.l4Activity?.id ?? input.opportunity?.l3_name ?? "unknown";
}

function buildFailedResult(
  subjectName: string,
  slug: string,
  reason: string,
): SimulationResult {
  return {
    l3Name: subjectName,
    slug,
    assessment: {
      groundednessScore: 0,
      integrationConfidenceScore: 0,
      ambiguityRiskScore: 100,
      implementationReadinessScore: 0,
      verdict: "HOLD",
      reasons: [reason],
    },
    artifacts: {
      decisionFlow: "",
      componentMap: emptyComponentMap(),
      mockTest: emptyMockTest(),
      integrationSurface: emptyIntegrationSurface(),
    },
    validationSummary: {
      confirmedCount: 0,
      inferredCount: 0,
      mermaidValid: false,
    },
  };
}

function emptyComponentMap(): ComponentMap {
  return {
    streams: [],
    cortex: [],
    process_builder: [],
    agent_teams: [],
    ui: [],
  };
}

function emptyMockTest(): MockTest {
  return {
    decision: "",
    input: {
      financial_context: {},
      trigger: "",
    },
    expected_output: {
      action: "",
      outcome: "",
    },
    rationale: "",
  };
}

function emptyIntegrationSurface(): IntegrationSurface {
  return {
    source_systems: [],
    aera_ingestion: [],
    processing: [],
    ui_surface: [],
  };
}
