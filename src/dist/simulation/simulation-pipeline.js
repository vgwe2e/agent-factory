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
import { generateScenarioSpec as defaultGenerateScenarioSpec } from "./generators/scenario-spec-gen.js";
import { buildKnowledgeIndex as defaultBuildKnowledgeIndex, enforceKnowledgeConfidence, validateComponentMap, } from "./validators/knowledge-validator.js";
import { slugify } from "./utils.js";
import { withTimeout, TimeoutError } from "../infra/timeout.js";
import { renderScenarioArtifacts } from "./renderers.js";
import { ComponentMapSchema, IntegrationSurfaceSchema, MockTestSchema, ScenarioSpecSchema, parseAndValidateYaml, } from "./schemas.js";
import { validateMermaidFlowchart } from "./validators/mermaid-validator.js";
import { assessSimulation } from "./assessment.js";
const DEFAULT_DEPS = {
    generateScenarioSpec: defaultGenerateScenarioSpec,
    buildKnowledgeIndex: defaultBuildKnowledgeIndex,
};
/**
 * Run the simulation pipeline for a set of promoted opportunities.
 *
 * @param inputs - Pre-filtered SimulationInput array (composite >= 0.60)
 * @param outputDir - Root directory for output files (e.g., evaluation/simulations)
 * @param llmTarget - Optional simulation backend config or legacy Ollama URL override
 * @param deps - Optional dependency injection for testing
 * @param options - Optional pipeline options (e.g., timeoutMs)
 */
export async function runSimulationPipeline(inputs, outputDir, llmTarget, deps = DEFAULT_DEPS, options) {
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
    const results = [];
    let totalFailed = 0;
    let totalConfirmed = 0;
    let totalInferred = 0;
    for (let i = 0; i < sorted.length; i++) {
        const input = sorted[i];
        const subjectName = input.l4Activity?.name ?? input.opportunity?.l3_name ?? "unknown";
        const slug = input.l4Activity
            ? slugify(input.l4Activity.name) + "-" + input.l4Activity.id.slice(-6)
            : slugify(subjectName);
        const oppDir = path.join(outputDir, slug);
        const defaultArtifacts = createDefaultArtifacts();
        const existingResult = await loadExistingSimulationResult(oppDir, subjectName, slug, knowledgeIndex);
        if (existingResult) {
            console.log(`Reusing ${i + 1}/${sorted.length}: ${subjectName}`);
            totalConfirmed += existingResult.validationSummary.confirmedCount;
            totalInferred += existingResult.validationSummary.inferredCount;
            results.push(existingResult);
            continue;
        }
        console.log(`Simulating ${i + 1}/${sorted.length}: ${subjectName}`);
        // Create output directory
        fs.mkdirSync(oppDir, { recursive: true });
        try {
            const processOpp = async (signal) => {
                const specResult = await deps.generateScenarioSpec(input, llmTarget, signal);
                if (!specResult.success) {
                    throw new Error(specResult.error);
                }
                const scenarioSpec = specResult.data.scenarioSpec;
                const rendered = renderScenarioArtifacts(input, scenarioSpec, knowledgeIndex);
                const mermaid = rendered.artifacts.decisionFlow;
                const componentMap = rendered.artifacts.componentMap;
                const mockTest = rendered.artifacts.mockTest;
                const integrationSurface = rendered.artifacts.integrationSurface;
                const validation = rendered.validation;
                const mermaidValid = rendered.mermaidValid;
                const assessment = assessSimulation({
                    scenarioSpec,
                    mockTest,
                    integrationSurface,
                    confirmedCount: validation.filter((v) => v.status === "confirmed").length,
                    inferredCount: validation.filter((v) => v.status === "inferred").length,
                    mermaidValid,
                });
                fs.writeFileSync(path.join(oppDir, "scenario-spec.yaml"), yaml.dump(scenarioSpec), "utf-8");
                fs.writeFileSync(path.join(oppDir, "decision-flow.mmd"), mermaid, "utf-8");
                fs.writeFileSync(path.join(oppDir, "component-map.yaml"), yaml.dump(componentMap), "utf-8");
                fs.writeFileSync(path.join(oppDir, "mock-test.yaml"), yaml.dump(mockTest), "utf-8");
                fs.writeFileSync(path.join(oppDir, "integration-surface.yaml"), yaml.dump(integrationSurface), "utf-8");
                fs.writeFileSync(path.join(oppDir, "simulation-assessment.yaml"), yaml.dump(assessment), "utf-8");
                // Count confirmed/inferred from validation results
                const confirmed = validation.filter((v) => v.status === "confirmed").length;
                const inferred = validation.filter((v) => v.status === "inferred").length;
                totalConfirmed += confirmed;
                totalInferred += inferred;
                results.push({
                    l3Name: subjectName,
                    slug,
                    scenarioSpec,
                    assessment,
                    artifacts: {
                        decisionFlow: mermaid,
                        componentMap,
                        mockTest,
                        integrationSurface,
                    },
                    validationSummary: {
                        confirmedCount: confirmed,
                        inferredCount: inferred,
                        mermaidValid,
                    },
                });
            };
            // Apply timeout wrapping if configured
            if (options?.timeoutMs != null) {
                await withTimeout((signal) => processOpp(signal), options.timeoutMs);
            }
            else {
                await processOpp();
            }
        }
        catch (err) {
            // Per-opportunity error isolation: log and continue to next opportunity
            if (err instanceof TimeoutError) {
                console.error(`  Simulation timed out for ${subjectName} after ${err.timeoutMs}ms`);
            }
            else {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`  Simulation failed for ${subjectName}: ${message}`);
            }
            totalFailed++;
            results.push({
                l3Name: subjectName,
                slug,
                scenarioSpec: undefined,
                assessment: {
                    groundednessScore: 0,
                    integrationConfidenceScore: 0,
                    ambiguityRiskScore: 100,
                    implementationReadinessScore: 0,
                    verdict: "HOLD",
                    reasons: ["Simulation generation failed."],
                },
                artifacts: {
                    decisionFlow: "",
                    componentMap: defaultArtifacts.componentMap,
                    mockTest: defaultArtifacts.mockTest,
                    integrationSurface: defaultArtifacts.integrationSurface,
                },
                validationSummary: {
                    confirmedCount: 0,
                    inferredCount: 0,
                    mermaidValid: false,
                },
            });
        }
    }
    return {
        results,
        totalSimulated: sorted.length,
        totalFailed,
        totalConfirmed,
        totalInferred,
    };
}
function createDefaultArtifacts() {
    return {
        componentMap: { streams: [], cortex: [], process_builder: [], agent_teams: [], ui: [] },
        mockTest: {
            decision: "",
            input: { financial_context: {}, trigger: "" },
            expected_output: { action: "", outcome: "" },
            rationale: "",
        },
        integrationSurface: {
            source_systems: [],
            aera_ingestion: [],
            processing: [],
            ui_surface: [],
        },
    };
}
async function loadExistingSimulationResult(oppDir, l3Name, slug, knowledgeIndex) {
    const scenarioSpecPath = path.join(oppDir, "scenario-spec.yaml");
    const decisionFlowPath = path.join(oppDir, "decision-flow.mmd");
    const componentMapPath = path.join(oppDir, "component-map.yaml");
    const mockTestPath = path.join(oppDir, "mock-test.yaml");
    const integrationSurfacePath = path.join(oppDir, "integration-surface.yaml");
    const requiredPaths = [
        scenarioSpecPath,
        decisionFlowPath,
        componentMapPath,
        mockTestPath,
        integrationSurfacePath,
    ];
    if (!requiredPaths.every((filePath) => fs.existsSync(filePath))) {
        return null;
    }
    const scenarioSpecRaw = fs.readFileSync(scenarioSpecPath, "utf-8");
    const decisionFlow = fs.readFileSync(decisionFlowPath, "utf-8");
    const componentMapRaw = fs.readFileSync(componentMapPath, "utf-8");
    const mockTestRaw = fs.readFileSync(mockTestPath, "utf-8");
    const integrationSurfaceRaw = fs.readFileSync(integrationSurfacePath, "utf-8");
    const scenarioSpecResult = await parseAndValidateYaml(scenarioSpecRaw, ScenarioSpecSchema);
    const componentMapResult = await parseAndValidateYaml(componentMapRaw, ComponentMapSchema);
    const mockTestResult = await parseAndValidateYaml(mockTestRaw, MockTestSchema);
    const integrationSurfaceResult = await parseAndValidateYaml(integrationSurfaceRaw, IntegrationSurfaceSchema);
    if (!scenarioSpecResult.success ||
        !componentMapResult.success ||
        !mockTestResult.success ||
        !integrationSurfaceResult.success) {
        return null;
    }
    const componentMap = componentMapResult.data;
    enforceKnowledgeConfidence(componentMap, knowledgeIndex);
    const validation = validateComponentMap(componentMap, knowledgeIndex);
    const confirmedCount = validation.filter((item) => item.status === "confirmed").length;
    const inferredCount = validation.filter((item) => item.status === "inferred").length;
    const mermaidValid = validateMermaidFlowchart(decisionFlow).ok;
    const assessment = assessSimulation({
        scenarioSpec: scenarioSpecResult.data,
        mockTest: mockTestResult.data,
        integrationSurface: integrationSurfaceResult.data,
        confirmedCount,
        inferredCount,
        mermaidValid,
    });
    return {
        l3Name,
        slug,
        scenarioSpec: scenarioSpecResult.data,
        assessment,
        artifacts: {
            decisionFlow,
            componentMap,
            mockTest: mockTestResult.data,
            integrationSurface: integrationSurfaceResult.data,
        },
        validationSummary: {
            confirmedCount,
            inferredCount,
            mermaidValid,
        },
    };
}
