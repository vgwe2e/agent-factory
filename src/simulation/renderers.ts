import type {
  ComponentMap,
  ComponentMapEntry,
  IntegrationSurface,
  MockTest,
  ScenarioBranch,
  ScenarioFlowStep,
  ScenarioSpec,
  SimulationArtifacts,
  SimulationInput,
} from "../types/simulation.js";
import { getComponent } from "../knowledge/components.js";
import { getPBNode } from "../knowledge/process-builder.js";
import {
  enforceKnowledgeConfidence,
  type ValidationResult,
  validateComponentMap,
} from "./validators/knowledge-validator.js";
import { validateMermaidFlowchart } from "./validators/mermaid-validator.js";

export interface RenderedScenarioArtifacts {
  artifacts: SimulationArtifacts;
  validation: ValidationResult[];
  mermaidValid: boolean;
}

export function renderScenarioArtifacts(
  input: SimulationInput,
  scenarioSpec: ScenarioSpec,
  knowledgeIndex: Map<string, string>,
): RenderedScenarioArtifacts {
  const componentMap = deriveComponentMap(scenarioSpec);
  enforceKnowledgeConfidence(componentMap, knowledgeIndex);
  const validation = validateComponentMap(componentMap, knowledgeIndex);
  const decisionFlow = renderDecisionFlow(scenarioSpec);
  const mockTest = deriveMockTest(input, scenarioSpec, componentMap);
  const integrationSurface = deriveIntegrationSurface(scenarioSpec, componentMap);

  return {
    artifacts: {
      decisionFlow,
      componentMap,
      mockTest,
      integrationSurface,
    },
    validation,
    mermaidValid: validateMermaidFlowchart(decisionFlow).ok,
  };
}

function deriveComponentMap(spec: ScenarioSpec): ComponentMap {
  const map: ComponentMap = {
    streams: [],
    cortex: [],
    process_builder: [],
    agent_teams: [],
    ui: [],
  };

  for (const step of spec.happy_path) {
    const section = classifyStep(step);
    const entry = buildEntry(step, section);

    switch (section) {
      case "streams":
        pushUnique(map.streams, entry, (existing) => existing.name);
        break;
      case "cortex":
        pushUnique(map.cortex, entry, (existing) => existing.name);
        break;
      case "process_builder":
        pushUnique(map.process_builder, entry, (existing) => existing.name);
        break;
      case "agent_teams":
        pushUnique(map.agent_teams, entry, (existing) => existing.name);
        break;
      case "ui":
        pushUnique(map.ui, entry, (existing) => existing.name);
        break;
    }
  }

  if (map.streams.length === 0) {
    for (const input of spec.key_inputs) {
      const streamName = inferGenericStreamName(input.preferred_stream_type, input.name);
      pushUnique(map.streams, {
        name: streamName,
        purpose: input.purpose,
        confidence: "inferred",
        type: normalizeStreamType(input.preferred_stream_type),
      }, (existing) => existing.name);
    }
  }

  if (map.ui.length === 0) {
    pushUnique(map.ui, {
      name: "Dashboard",
      purpose: `Review ${spec.objective.toLowerCase()} and approve the recommended action.`,
      confidence: "inferred",
      component_type: "display",
    }, (existing) => existing.name);
  }

  if (map.process_builder.length === 0) {
    pushUnique(map.process_builder, {
      name: "Action Item",
      purpose: spec.expected_action,
      confidence: "inferred",
      node_type: "transaction",
    }, (existing) => existing.name);
  }

  return map;
}

function deriveMockTest(
  input: SimulationInput,
  spec: ScenarioSpec,
  componentMap: ComponentMap,
): MockTest {
  return {
    decision: spec.decision,
    input: {
      financial_context: extractFinancialContext(input),
      trigger: spec.trigger,
      parameters: {
        objective: spec.objective,
        key_inputs: spec.key_inputs.map((item) => item.name),
        source_systems: spec.source_systems.map((system) => system.name),
      },
    },
    expected_output: {
      action: spec.expected_action,
      outcome: spec.expected_outcome,
      affected_components: collectAffectedComponents(componentMap),
    },
    rationale: spec.rationale,
  };
}

function deriveIntegrationSurface(
  spec: ScenarioSpec,
  componentMap: ComponentMap,
): IntegrationSurface {
  return {
    source_systems: spec.source_systems.map((system) => ({
      name: system.name,
      type: system.type,
      status: system.status,
    })),
    aera_ingestion: spec.key_inputs.map((input) => ({
      stream_name: slugWords(input.name),
      stream_type: normalizeStreamType(input.preferred_stream_type),
      source: input.source,
    })),
    processing: [
      ...componentMap.cortex.map((entry) => ({
        component: entry.name,
        type: "cortex",
        function: entry.purpose ?? spec.objective,
      })),
      ...componentMap.process_builder.map((entry) => ({
        component: entry.name,
        type: "process_builder",
        function: entry.purpose ?? spec.expected_action,
      })),
      ...componentMap.agent_teams.map((entry) => ({
        component: entry.name,
        type: "agent_teams",
        function: entry.purpose ?? spec.expected_action,
      })),
    ],
    ui_surface: componentMap.ui.map((entry) => ({
      component: entry.name,
      screen: "Primary",
      purpose: entry.purpose ?? spec.expected_outcome,
    })),
  };
}

function renderDecisionFlow(spec: ScenarioSpec): string {
  const lines: string[] = ["flowchart TD"];
  let previousId = "A";
  lines.push(`  A[Trigger: ${escapeMermaid(spec.trigger)}]`);

  let decisionId: string | null = null;
  let lastNodeId = previousId;

  for (let index = 0; index < spec.happy_path.length; index++) {
    const step = spec.happy_path[index];
    const nodeId = `N${index + 1}`;
    const node = renderStepNode(nodeId, step);

    if (decisionId && previousId === decisionId) {
      lines.push(`  ${previousId} -->|Primary| ${node}`);
    } else {
      lines.push(`  ${previousId} --> ${node}`);
    }

    previousId = nodeId;
    lastNodeId = nodeId;
    if (step.stage === "decide" && decisionId == null) {
      decisionId = nodeId;
    }
  }

  if (decisionId == null) {
    decisionId = `N${spec.happy_path.length + 1}`;
    lines.push(`  ${previousId} --> ${decisionId}{Decision: ${escapeMermaid(spec.decision)}}`);
    previousId = decisionId;
  }

  const outcomeId = "Z1";
  if (lastNodeId === decisionId) {
    const primaryActionId = "P1";
    lines.push(`  ${decisionId} -->|Primary| ${primaryActionId}[Action: ${escapeMermaid(spec.expected_action)}]`);
    lines.push(`  ${primaryActionId} --> ${outcomeId}[Outcome: ${escapeMermaid(spec.expected_outcome)}]`);
  } else {
    lines.push(`  ${lastNodeId} --> ${outcomeId}[Outcome: ${escapeMermaid(spec.expected_outcome)}]`);
  }

  spec.branches.forEach((branch, index) => {
    const responseId = `B${index + 1}`;
    const branchOutcomeId = `O${index + 1}`;
    lines.push(`  ${decisionId} -->|${escapeMermaid(shortLabel(branch.condition))}| ${responseId}[${escapeMermaid(branch.response)}]`);
    lines.push(`  ${responseId} --> ${branchOutcomeId}[Outcome: ${escapeMermaid(branch.outcome)}]`);
    lines.push(`  ${branchOutcomeId} --> End[End]`);
  });

  lines.push(`  ${outcomeId} --> End[End]`);
  return lines.join("\n");
}

function renderStepNode(nodeId: string, step: ScenarioFlowStep): string {
  const prefix = labelPrefix(step);
  const text = `${prefix}: ${step.component} - ${step.step}`;
  const label = escapeMermaid(text);

  if (step.stage === "decide") {
    return `${nodeId}{${label}}`;
  }

  return `${nodeId}[${label}]`;
}

function labelPrefix(step: ScenarioFlowStep): string {
  switch (classifyStep(step)) {
    case "streams":
      return "Stream";
    case "cortex":
      return "Cortex";
    case "process_builder":
      return "PB";
    case "agent_teams":
      return "Agent";
    case "ui":
      return "UI";
  }
}

function classifyStep(step: ScenarioFlowStep): keyof ComponentMap {
  const componentLower = step.component.toLowerCase();

  if (step.stage === "ingest" || componentLower.includes("stream")) {
    return "streams";
  }

  if (getPBNode(step.component)) {
    return "process_builder";
  }

  if (componentLower.includes("agent")) {
    return "agent_teams";
  }

  if (getComponent(step.component) || step.stage === "surface") {
    return "ui";
  }

  if (step.stage === "notify") {
    return getComponent(step.component) ? "ui" : "process_builder";
  }

  if (step.stage === "decide" || step.stage === "act" || step.stage === "review") {
    return "process_builder";
  }

  return "cortex";
}

function buildEntry(
  step: ScenarioFlowStep,
  section: keyof ComponentMap,
): ComponentMapEntry & Record<string, string | string[] | undefined> {
  const base = {
    name: step.component,
    purpose: step.purpose,
    confidence: "inferred" as const,
  };

  switch (section) {
    case "streams":
      return {
        ...base,
        type: normalizeStreamType(step.component),
      };
    case "cortex":
      return {
        ...base,
        capability: step.purpose,
      };
    case "process_builder":
      return {
        ...base,
        node_type: getPBNode(step.component)?.category ?? step.stage,
      };
    case "agent_teams":
      return {
        ...base,
        role: step.purpose,
      };
    case "ui":
      return {
        ...base,
        component_type: getComponent(step.component)?.category ?? "display",
      };
  }
}

function collectAffectedComponents(componentMap: ComponentMap): string[] {
  return [
    ...componentMap.streams,
    ...componentMap.cortex,
    ...componentMap.process_builder,
    ...componentMap.agent_teams,
    ...componentMap.ui,
  ].map((entry) => entry.name);
}

function extractFinancialContext(input: SimulationInput): Record<string, unknown> {
  const context = input.companyContext;
  const financialContext: Record<string, unknown> = {};
  const pairs: Array<[string, unknown]> = [
    ["annual_revenue", context.annual_revenue],
    ["cogs", context.cogs],
    ["ebitda", context.ebitda],
    ["working_capital", context.working_capital],
    ["inventory_value", context.inventory_value],
  ];

  for (const [key, value] of pairs) {
    if (value != null) {
      financialContext[key] = value;
    }
  }

  return financialContext;
}

function inferGenericStreamName(preferredStreamType: string | undefined, inputName: string): string {
  const normalizedType = normalizeStreamType(preferredStreamType);
  if (normalizedType !== "tbd") {
    return normalizedType;
  }

  const lower = inputName.toLowerCase();
  if (lower.includes("master") || lower.includes("reference")) return "Reference Stream";
  if (lower.includes("transaction") || lower.includes("order") || lower.includes("invoice")) {
    return "Transaction Stream";
  }
  return "Event Stream";
}

function normalizeStreamType(value: string | undefined): string {
  if (!value) return "Event Stream";
  const lower = value.toLowerCase();
  if (lower.includes("reference")) return "Reference Stream";
  if (lower.includes("transaction")) return "Transaction Stream";
  if (lower.includes("event")) return "Event Stream";
  return value;
}

function escapeMermaid(value: string): string {
  return value
    .replace(/[\[\]{}"<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortLabel(value: string): string {
  return value.length <= 40 ? value : `${value.slice(0, 37)}...`;
}

function slugWords(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pushUnique<T extends { name: string }>(
  list: T[],
  candidate: T,
  keyFn: (entry: T) => string,
): void {
  const key = keyFn(candidate).toLowerCase();
  if (list.some((entry) => keyFn(entry).toLowerCase() === key)) {
    return;
  }
  list.push(candidate);
}
