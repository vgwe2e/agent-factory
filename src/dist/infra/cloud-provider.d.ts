/**
 * RunPod serverless endpoint provisioner.
 *
 * Handles the full lifecycle: create endpoint via RunPod GraphQL API,
 * poll until workers are ready, verify vLLM model loaded, and teardown.
 *
 * The runpod-sdk only supports interacting with *existing* endpoints
 * (run, status, health). Endpoint creation/deletion requires the
 * RunPod GraphQL API at https://api.runpod.io/graphql.
 */
export interface CloudProviderConfig {
    apiKey: string;
    gpuType?: string;
    model?: string;
    templateId?: string;
    maxProvisionTimeoutMs?: number;
    maxHealthTimeoutMs?: number;
    /** RunPod network volume ID for persistent model weight caching. */
    networkVolumeId?: string;
    /** Override poll interval for testing (ms). */
    pollIntervalMs?: number;
}
export interface ProvisionedEndpoint {
    endpointId: string;
    baseUrl: string;
    provisionedAt: Date;
}
export interface CloudProvider {
    provision(): Promise<ProvisionedEndpoint>;
    healthCheck(endpoint: ProvisionedEndpoint): Promise<boolean>;
    teardown(endpoint: ProvisionedEndpoint): Promise<void>;
}
export declare function createCloudProvider(config: CloudProviderConfig): CloudProvider;
