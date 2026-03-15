/**
 * RunPod dedicated pod provisioner for vLLM.
 *
 * Handles the full lifecycle: create a pod via the RunPod REST API,
 * wait for the OpenAI-compatible vLLM server to become healthy, and
 * tear the pod down when the run completes.
 */
import { randomUUID } from "node:crypto";
const RUNPOD_REST_BASE = "https://rest.runpod.io/v1";
const DEFAULT_GPU_TYPE = "NVIDIA H100 NVL";
const DEFAULT_IMAGE_NAME = "vllm/vllm-openai:latest";
const DEFAULT_MODEL = "Qwen/Qwen2.5-32B-Instruct";
const DEFAULT_PROVISION_TIMEOUT_MS = 600_000; // 10 min
const DEFAULT_HEALTH_TIMEOUT_MS = 900_000; // 15 min
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_CONTAINER_DISK_GB = 20;
const DEFAULT_VOLUME_GB = 80;
const DEFAULT_VOLUME_MOUNT_PATH = "/workspace";
const DEFAULT_PORT = 8000;
const GPU_TYPE_ALIASES = {
    "H100 SXM": "NVIDIA H100 80GB HBM3",
    "NVIDIA H100 SXM": "NVIDIA H100 80GB HBM3",
};
export function createPodProvider(config) {
    const { apiKey, gpuType = DEFAULT_GPU_TYPE, imageName = DEFAULT_IMAGE_NAME, model = DEFAULT_MODEL, templateId, networkVolumeId, hfToken, maxProvisionTimeoutMs = DEFAULT_PROVISION_TIMEOUT_MS, maxHealthTimeoutMs = DEFAULT_HEALTH_TIMEOUT_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS, } = config;
    const normalizedGpuType = normalizeGpuType(gpuType);
    async function rest(path, init = {}) {
        const resp = await fetch(`${RUNPOD_REST_BASE}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                ...(init.headers ?? {}),
            },
        });
        if (!resp.ok) {
            const body = await resp.text().catch(() => "");
            throw new Error(`RunPod API error: ${resp.status} ${resp.statusText}${body ? ` — ${body}` : ""}`);
        }
        if (resp.status === 204) {
            return {};
        }
        return resp.json();
    }
    async function getPod(podId) {
        return rest(`/pods/${podId}`, {
            method: "GET",
        });
    }
    function buildBaseUrl(podId) {
        return `https://${podId}-${DEFAULT_PORT}.proxy.runpod.net/v1`;
    }
    async function healthCheck(pod) {
        try {
            const resp = await fetch(`${pod.baseUrl}/models`, {
                headers: {
                    Authorization: `Bearer ${pod.vllmApiKey}`,
                },
                signal: AbortSignal.timeout(10_000),
            });
            if (!resp.ok)
                return false;
            const data = (await resp.json());
            const modelIds = (data?.data ?? []).map((entry) => entry.id);
            if (modelIds.length === 0)
                return false;
            return modelIds.some((id) => id.toLowerCase().includes(model.toLowerCase()));
        }
        catch {
            return false;
        }
    }
    async function teardown(pod) {
        try {
            await rest(`/pods/${pod.podId}/stop`, { method: "POST" });
        }
        catch {
            // Some pods cannot be stopped cleanly (for example attached network volumes).
        }
        try {
            await rest(`/pods/${pod.podId}`, { method: "DELETE" });
        }
        catch {
            // Idempotent best effort.
        }
    }
    async function provision() {
        if (!apiKey) {
            throw new Error("RUNPOD_API_KEY is required. Set it in PodProviderConfig.apiKey or the RUNPOD_API_KEY environment variable.");
        }
        const vllmApiKey = `vllm-${randomUUID()}`;
        let podId;
        try {
            const env = {
                HF_HOME: "/workspace/hf_home",
                MAX_MODEL_LEN: "16384",
                VLLM_API_KEY: vllmApiKey,
            };
            if (hfToken) {
                env.HF_TOKEN = hfToken;
            }
            const body = {
                name: `aera-vllm-${Date.now()}`,
                computeType: "GPU",
                gpuTypeIds: [normalizedGpuType],
                gpuCount: 1,
                cloudType: "SECURE",
                ports: [`${DEFAULT_PORT}/http`],
                containerDiskInGb: DEFAULT_CONTAINER_DISK_GB,
                volumeInGb: DEFAULT_VOLUME_GB,
                volumeMountPath: DEFAULT_VOLUME_MOUNT_PATH,
                env,
                // Pass the model in the actual start command so template defaults cannot override it.
                dockerStartCmd: [
                    "--model",
                    model,
                    "--max-model-len",
                    "16384",
                    "--dtype",
                    "auto",
                    "--api-key",
                    vllmApiKey,
                    "--host",
                    "0.0.0.0",
                    "--port",
                    String(DEFAULT_PORT),
                ],
            };
            if (templateId) {
                body.templateId = templateId;
            }
            else {
                body.imageName = imageName;
            }
            if (networkVolumeId) {
                body.networkVolumeId = networkVolumeId;
            }
            const created = await rest("/pods", {
                method: "POST",
                body: JSON.stringify(body),
            });
            podId = created.id;
            if (!podId) {
                throw new Error("RunPod pod creation returned no pod ID");
            }
            const pod = {
                podId,
                baseUrl: buildBaseUrl(podId),
                vllmApiKey,
                provisionedAt: new Date(),
            };
            const provisionStart = Date.now();
            while (Date.now() - provisionStart < maxProvisionTimeoutMs) {
                const current = await getPod(podId);
                if ((current.uptimeSeconds ?? 0) > 0 ||
                    current.machineId != null ||
                    current.publicIp != null) {
                    break;
                }
                await sleep(pollIntervalMs);
            }
            const podState = await getPod(podId);
            if ((podState.uptimeSeconds ?? 0) === 0 &&
                podState.machineId == null &&
                podState.publicIp == null) {
                throw new Error(`RunPod pod ${podId} did not finish container startup after ${maxProvisionTimeoutMs}ms. ` +
                    `Check pod logs and verify the pod start command. Use --vllm-url <url> to connect to a manually created pod.`);
            }
            const healthStart = Date.now();
            while (Date.now() - healthStart < maxHealthTimeoutMs) {
                const ready = await healthCheck(pod);
                if (ready) {
                    return pod;
                }
                await sleep(pollIntervalMs);
            }
            throw new Error(`vLLM health check timed out after ${maxHealthTimeoutMs / 1000}s on pod ${podId}. ` +
                `Check pod logs and verify model download/startup. Use --vllm-url <url> to connect to a manually created pod.`);
        }
        catch (err) {
            if (podId) {
                const pod = {
                    podId,
                    baseUrl: buildBaseUrl(podId),
                    vllmApiKey,
                    provisionedAt: new Date(),
                };
                await teardown(pod);
            }
            throw err;
        }
    }
    return { provision, healthCheck, teardown };
}
function normalizeGpuType(gpuType) {
    return GPU_TYPE_ALIASES[gpuType] ?? gpuType;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
