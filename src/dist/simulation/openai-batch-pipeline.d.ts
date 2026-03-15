import type { SimulationInput } from "../types/simulation.js";
import type { SimulationPipelineResult } from "./simulation-pipeline.js";
import type { OpenAiBatchConfig } from "../infra/openai-batch-client.js";
interface OpenAiBatchSimulationDeps {
    buildKnowledgeIndex: () => Map<string, string>;
}
export declare function runOpenAiBatchSimulation(inputs: SimulationInput[], outputDir: string, batchConfig: OpenAiBatchConfig, deps?: OpenAiBatchSimulationDeps): Promise<SimulationPipelineResult>;
export {};
