export interface OpenAiBatchConfig {
    apiKey: string;
    baseUrl?: string;
    scoringModel?: string;
    simulationModel?: string;
    pollIntervalMs?: number;
    timeoutMs?: number;
}
export interface OpenAiBatchRequest {
    customId: string;
    body: Record<string, unknown>;
}
export interface OpenAiBatchJobOptions {
    jobName: string;
    outputDir: string;
    endpoint: "/v1/chat/completions";
    requests: OpenAiBatchRequest[];
}
export interface OpenAiBatchJobResult {
    batchId: string;
    inputFileId: string;
    outputFileId?: string;
    errorFileId?: string;
    status: string;
    outputLines: unknown[];
    errorLines: unknown[];
    requestPath: string;
    outputPath?: string;
    errorPath?: string;
    manifestPath: string;
}
export declare function runOpenAiBatch(config: OpenAiBatchConfig, options: OpenAiBatchJobOptions): Promise<OpenAiBatchJobResult>;
export declare function extractChatCompletionContent(line: unknown): {
    success: true;
    content: string;
} | {
    success: false;
    error: string;
};
export declare function normalizeOpenAiJsonSchema(schema: Record<string, unknown>): Record<string, unknown>;
export declare function stripNullFields(value: unknown): unknown;
