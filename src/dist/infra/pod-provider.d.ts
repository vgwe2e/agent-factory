/**
 * RunPod dedicated pod provisioner for vLLM.
 *
 * Handles the full lifecycle: create a pod via the RunPod REST API,
 * wait for the OpenAI-compatible vLLM server to become healthy, and
 * tear the pod down when the run completes.
 */
export interface PodProviderConfig {
    apiKey: string;
    gpuType?: string;
    imageName?: string;
    model?: string;
    templateId?: string;
    maxProvisionTimeoutMs?: number;
    maxHealthTimeoutMs?: number;
    pollIntervalMs?: number;
    networkVolumeId?: string;
    hfToken?: string;
}
export interface ProvisionedPod {
    podId: string;
    baseUrl: string;
    vllmApiKey: string;
    provisionedAt: Date;
}
export interface PodProvider {
    provision(): Promise<ProvisionedPod>;
    healthCheck(pod: ProvisionedPod): Promise<boolean>;
    teardown(pod: ProvisionedPod): Promise<void>;
}
export declare function createPodProvider(config: PodProviderConfig): PodProvider;
