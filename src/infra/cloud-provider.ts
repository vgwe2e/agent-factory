/**
 * RunPod serverless endpoint provisioner.
 *
 * Handles the full lifecycle: create endpoint via RunPod GraphQL API,
 * poll until workers are ready, verify vLLM model loaded, and teardown.
 *
 * The runpod-sdk only supports interacting with *existing* endpoints
 * (run, status, health). Endpoint creation/deletion requires the
 * RunPod GraphQL API at https://api.runpod.ai/graphql.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CloudProviderConfig {
  apiKey: string;
  gpuType?: string;
  model?: string;
  templateId?: string;
  maxProvisionTimeoutMs?: number;
  maxHealthTimeoutMs?: number;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RUNPOD_GRAPHQL_URL = "https://api.runpod.io/graphql";
const RUNPOD_SERVERLESS_BASE = "https://api.runpod.io/v2";

const DEFAULT_GPU_TYPE = "NVIDIA H100 80GB HBM3";
const DEFAULT_MODEL = "Qwen/Qwen2.5-32B-Instruct";
// RunPod vLLM Serverless Quick Deploy template
const DEFAULT_TEMPLATE_ID = "xkhgg72fuo";
const DEFAULT_PROVISION_TIMEOUT_MS = 300_000; // 5 min
const DEFAULT_HEALTH_TIMEOUT_MS = 180_000; // 3 min
const DEFAULT_POLL_INTERVAL_MS = 5_000;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createCloudProvider(config: CloudProviderConfig): CloudProvider {
  const {
    apiKey,
    gpuType = DEFAULT_GPU_TYPE,
    model = DEFAULT_MODEL,
    templateId = DEFAULT_TEMPLATE_ID,
    maxProvisionTimeoutMs = DEFAULT_PROVISION_TIMEOUT_MS,
    maxHealthTimeoutMs = DEFAULT_HEALTH_TIMEOUT_MS,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  } = config;

  // ---- GraphQL helper ---------------------------------------------------

  async function graphql(query: string, variables: Record<string, unknown> = {}): Promise<unknown> {
    const resp = await fetch(RUNPOD_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!resp.ok) {
      throw new Error(`RunPod API error: ${resp.status} ${resp.statusText}`);
    }

    return resp.json();
  }

  // ---- Health poll (RunPod SDK-style health endpoint) --------------------

  async function pollEndpointHealth(endpointId: string): Promise<boolean> {
    try {
      const url = `${RUNPOD_SERVERLESS_BASE}/${endpointId}/health`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      });

      if (!resp.ok) return false;

      const data = (await resp.json()) as {
        workers?: { ready?: number };
      };

      return (data?.workers?.ready ?? 0) > 0;
    } catch {
      return false;
    }
  }

  // ---- Provider methods -------------------------------------------------

  async function provision(): Promise<ProvisionedEndpoint> {
    if (!apiKey) {
      throw new Error(
        "RUNPOD_API_KEY is required. Set it in CloudProviderConfig.apiKey or the RUNPOD_API_KEY environment variable.",
      );
    }

    // 1. Create serverless endpoint via GraphQL mutation
    const name = `aera-eval-${Date.now()}`;
    const createMutation = `
      mutation {
        saveEndpoint(input: {
          name: "${name}"
          templateId: "${templateId}"
          gpuIds: "${gpuType}"
          idleTimeout: 60
          workersMax: 1
          workersMin: 0
          env: [
            { key: "MODEL_NAME", value: "${model}" }
          ]
        }) {
          id
          name
        }
      }
    `;

    const createResult = (await graphql(createMutation)) as {
      data?: { saveEndpoint?: { id: string; name: string } };
      errors?: Array<{ message: string }>;
    };

    if (createResult.errors?.length) {
      throw new Error(
        `Failed to create RunPod endpoint: ${createResult.errors.map((e) => e.message).join(", ")}`,
      );
    }

    const endpointId = createResult.data?.saveEndpoint?.id;
    if (!endpointId) {
      throw new Error("RunPod endpoint creation returned no endpoint ID");
    }

    // 2. Poll endpoint health until workers ready (exponential backoff)
    const provisionStart = Date.now();
    let interval = pollIntervalMs;

    while (Date.now() - provisionStart < maxProvisionTimeoutMs) {
      const ready = await pollEndpointHealth(endpointId);
      if (ready) break;

      if (Date.now() - provisionStart + interval >= maxProvisionTimeoutMs) {
        throw new Error(
          `RunPod endpoint ${endpointId} provision timed out after ${maxProvisionTimeoutMs}ms`,
        );
      }

      await sleep(interval);
      // Exponential backoff: 5s, 5s, 10s, 10s, 15s... capped at 15s
      interval = Math.min(interval + pollIntervalMs, 15_000);
    }

    // Final timeout check after loop exits without break
    const readyAfterLoop = await pollEndpointHealth(endpointId);
    if (!readyAfterLoop) {
      // Only throw if last check is also not ready (handles edge case where
      // we exit loop due to time check but the endpoint just became ready)
      const lastCheck = await pollEndpointHealth(endpointId);
      if (!lastCheck) {
        throw new Error(
          `RunPod endpoint ${endpointId} provision timed out after ${maxProvisionTimeoutMs}ms`,
        );
      }
    }

    // 3. Construct OpenAI-compatible proxy URL
    const baseUrl = `${RUNPOD_SERVERLESS_BASE}/${endpointId}/openai/v1`;

    // 4. Poll vLLM health (GET /v1/models) until model loaded
    const healthStart = Date.now();
    let healthInterval = pollIntervalMs;

    while (Date.now() - healthStart < maxHealthTimeoutMs) {
      const ep: ProvisionedEndpoint = {
        endpointId,
        baseUrl,
        provisionedAt: new Date(),
      };
      const modelReady = await healthCheck(ep);
      if (modelReady) {
        return { endpointId, baseUrl, provisionedAt: new Date() };
      }

      await sleep(healthInterval);
      healthInterval = Math.min(healthInterval + pollIntervalMs, 15_000);
    }

    // Health poll timed out — vLLM model may not be loaded. Throw so the caller
    // does not attempt to score against a non-responsive endpoint.
    throw new Error(
      `vLLM health check timed out after ${maxHealthTimeoutMs / 1000}s — model may not be loaded on endpoint ${endpointId}`,
    );
  }

  async function healthCheck(endpoint: ProvisionedEndpoint): Promise<boolean> {
    try {
      const url = `${endpoint.baseUrl}/models`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async function teardown(endpoint: ProvisionedEndpoint): Promise<void> {
    try {
      const deleteMutation = `
        mutation {
          deleteEndpoint(id: "${endpoint.endpointId}")
        }
      `;
      await graphql(deleteMutation);
    } catch {
      // Idempotent -- swallow errors (endpoint may already be gone)
    }
  }

  return { provision, healthCheck, teardown };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
