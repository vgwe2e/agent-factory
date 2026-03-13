# Phase 20: Network Volume & Model Caching - Research

**Researched:** 2026-03-12
**Domain:** RunPod Network Volumes, vLLM model caching, serverless endpoint configuration
**Confidence:** HIGH

## Summary

This phase adds network volume support to the existing RunPod serverless provisioning flow so that model weights persist across pod launches. The core change is small: add a `networkVolumeId` field to the `saveEndpoint` GraphQL mutation (already used in Phase 18), and provide a CLI flag to pass it through. RunPod's vLLM worker template already handles model caching automatically when a network volume is attached -- models are stored at `/runpod-volume/huggingface-cache/hub/` and reused on subsequent launches with no additional `--download-dir` configuration needed.

The implementation requires two integration points: (1) creating/listing network volumes via the RunPod REST API (`rest.runpod.io/v1/networkvolumes`), and (2) passing the volume ID into the existing `saveEndpoint` GraphQL mutation. The REST API is simpler and better documented than the GraphQL equivalent for volume management.

**Primary recommendation:** Accept a `--network-volume <id>` CLI flag that passes a user-provided volume ID into the `saveEndpoint` mutation. Do NOT auto-create volumes -- volume creation requires a `dataCenterId` which introduces region-locking complexity outside this phase's scope.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CACHE-01 | `/setup-runpod-vllm` skill supports creating and attaching a network volume for model weights | `saveEndpoint` GraphQL mutation accepts `networkVolumeId` field; REST API available for volume creation at `POST /v1/networkvolumes` |
| CACHE-02 | Subsequent pod launches reuse cached model weights from network volume, skipping HuggingFace download | RunPod vLLM worker template automatically caches models to `/runpod-volume/huggingface-cache/hub/` when volume attached; subsequent workers skip download |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| RunPod GraphQL API | current | `saveEndpoint` with `networkVolumeId` | Already used in Phase 18 for endpoint creation |
| RunPod REST API | v1 | `POST/GET /v1/networkvolumes` for volume lifecycle | Better documented than GraphQL for volume ops |
| node:test + assert/strict | built-in | Testing with mocked fetch | Project convention from all prior phases |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| commander | existing | `--network-volume` CLI flag | Thread volume ID from CLI to provider |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| REST API for volumes | GraphQL `createNetworkVolume` | REST is better documented, GraphQL mutation fields are not fully specified in public docs |
| User-provided volume ID | Auto-create volumes | Auto-create needs `dataCenterId`, region-locks endpoint, adds complexity; user-provided is simpler |

## Architecture Patterns

### Recommended Change Surface
```
src/
├── infra/
│   ├── cloud-provider.ts      # Add networkVolumeId to config + saveEndpoint mutation
│   └── cloud-provider.test.ts # Test volume ID appears in GraphQL mutation
├── infra/
│   ├── backend-factory.ts     # Thread networkVolumeId from VllmBackendOptions to provider
│   └── backend-factory.test.ts
└── cli.ts                     # Add --network-volume <id> flag, pass to createBackend
```

### Pattern 1: Thread Volume ID Through Existing Config Chain
**What:** Add `networkVolumeId?: string` to `CloudProviderConfig`, `VllmBackendOptions`, and CLI options. The value flows: CLI flag -> action handler -> `createBackend()` -> `createCloudProvider()` -> `saveEndpoint` mutation.
**When to use:** Always -- this matches the exact pattern used for all existing config (gpuType, model, templateId).
**Example:**
```typescript
// cloud-provider.ts -- CloudProviderConfig addition
export interface CloudProviderConfig {
  apiKey: string;
  gpuType?: string;
  model?: string;
  templateId?: string;
  networkVolumeId?: string;  // NEW
  maxProvisionTimeoutMs?: number;
  maxHealthTimeoutMs?: number;
  pollIntervalMs?: number;
}

// saveEndpoint mutation -- add networkVolumeId field
const createMutation = `
  mutation {
    saveEndpoint(input: {
      name: "${name}"
      templateId: "${templateId}"
      gpuIds: "${gpuType}"
      networkVolumeId: "${networkVolumeId}"
      idleTimeout: 60
      workersMax: 1
      workersMin: 0
      dockerArgs: "--model ${model} --max-model-len 16384 --dtype auto"
    }) {
      id
      name
      networkVolumeId
    }
  }
`;
```

### Pattern 2: Conditional Volume ID in Mutation
**What:** Only include `networkVolumeId` in the GraphQL mutation when it is provided. Omit it entirely when not set to avoid sending empty string (which RunPod may reject).
**When to use:** Always -- the `saveEndpoint` mutation should work without a volume ID (current behavior) and with one (new behavior).
**Example:**
```typescript
const volumeField = networkVolumeId
  ? `networkVolumeId: "${networkVolumeId}"`
  : "";

const createMutation = `
  mutation {
    saveEndpoint(input: {
      name: "${name}"
      templateId: "${templateId}"
      gpuIds: "${gpuType}"
      ${volumeField}
      idleTimeout: 60
      workersMax: 1
      workersMin: 0
      dockerArgs: "--model ${model} --max-model-len 16384 --dtype auto"
    }) {
      id
      name
    }
  }
`;
```

### Anti-Patterns to Avoid
- **Sending `networkVolumeId: ""`**: The RunPod API may interpret empty string differently from omitted field. Only include the field when a real ID is provided.
- **Adding `--download-dir` to dockerArgs**: Not needed. RunPod's vLLM worker template (`xkhgg72fuo`) already sets `BASE_PATH=/runpod-volume` which routes HuggingFace cache to the network volume automatically.
- **Auto-creating volumes without user consent**: Volumes cost $0.07/GB/month and persist after teardown. Creating them silently would surprise users with ongoing charges.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Model caching on volume | Custom download scripts or `--download-dir` flags | RunPod's built-in caching at `/runpod-volume/huggingface-cache/hub/` | The vLLM worker template handles this automatically when a volume is attached |
| Volume creation | GraphQL `createNetworkVolume` mutation | REST API `POST /v1/networkvolumes` | REST is better documented with clear request/response schemas |
| Cache validation | Custom file-existence checks on volume | Timing comparison + `/v1/models` responsiveness | First launch downloads model (minutes); cached launch loads in seconds. The health check already validates model is loaded. |

**Key insight:** RunPod's vLLM worker template automatically detects network volumes at `/runpod-volume` and uses them for HuggingFace cache. No vLLM CLI flags or environment variables need to be added to `dockerArgs`. The only change needed is passing the volume ID in the `saveEndpoint` mutation.

## Common Pitfalls

### Pitfall 1: Sending Empty networkVolumeId
**What goes wrong:** The GraphQL mutation may fail or behave unexpectedly with `networkVolumeId: ""` instead of omitting the field entirely.
**Why it happens:** Template string interpolation produces empty string when config value is undefined.
**How to avoid:** Conditionally include the field only when a non-empty value is provided.
**Warning signs:** GraphQL error responses mentioning `networkVolumeId` validation.

### Pitfall 2: Region Mismatch Between Volume and GPU
**What goes wrong:** Network volumes are pinned to a specific data center. If the GPU type requested is not available in that data center, provisioning fails.
**Why it happens:** Network volumes constrain deployments to the volume's data center.
**How to avoid:** Document that users must create their volume in a data center where their desired GPU type (H100) is available. This is a user responsibility since we accept user-provided volume IDs.
**Warning signs:** RunPod provisioning timeout with no workers starting.

### Pitfall 3: Expecting Instant Speedup on First Launch
**What goes wrong:** First launch WITH a new (empty) volume still downloads the full model from HuggingFace.
**Why it happens:** The volume is empty on first use. The speedup only occurs on subsequent launches.
**How to avoid:** Document that the first launch populates the cache; subsequent launches benefit from it.
**Warning signs:** User reports "volume didn't help" after only one launch.

### Pitfall 4: Volume Teardown With --teardown Flag
**What goes wrong:** If `--teardown` deletes the endpoint, the network volume persists (correct behavior) but users may expect it to also delete the volume.
**Why it happens:** Endpoint teardown and volume deletion are separate operations.
**How to avoid:** `--teardown` should ONLY tear down the endpoint (existing behavior). Volumes persist by design -- they are the cache. Document this clearly.
**Warning signs:** Users confused about ongoing volume charges.

## Code Examples

### Adding networkVolumeId to CloudProviderConfig
```typescript
// Source: existing pattern in cloud-provider.ts
export interface CloudProviderConfig {
  apiKey: string;
  gpuType?: string;
  model?: string;
  templateId?: string;
  networkVolumeId?: string;
  maxProvisionTimeoutMs?: number;
  maxHealthTimeoutMs?: number;
  pollIntervalMs?: number;
}
```

### Conditional GraphQL Field Injection
```typescript
// Source: pattern derived from RunPod saveEndpoint docs
const volumeField = networkVolumeId
  ? `networkVolumeId: "${networkVolumeId}"`
  : "";

const createMutation = `
  mutation {
    saveEndpoint(input: {
      name: "${name}"
      templateId: "${templateId}"
      gpuIds: "${gpuType}"
      ${volumeField}
      idleTimeout: 60
      workersMax: 1
      workersMin: 0
      dockerArgs: "--model ${model} --max-model-len 16384 --dtype auto"
    }) {
      id
      name
    }
  }
`;
```

### CLI Flag Addition
```typescript
// Source: existing CLI pattern in cli.ts
.option(
  "--network-volume <id>",
  "RunPod network volume ID for model weight caching",
)
```

### VllmBackendOptions Extension
```typescript
// Source: existing pattern in backend-factory.ts
export interface VllmBackendOptions {
  vllmUrl?: string;
  vllmModel?: string;
  runpodApiKey?: string;
  networkVolumeId?: string;  // NEW
}
```

### Test: Volume ID Appears in GraphQL Mutation
```typescript
// Source: existing test pattern in cloud-provider.test.ts
it("provision() includes networkVolumeId in saveEndpoint mutation when provided", async () => {
  let capturedBody = "";
  const mockFetch: MockFetchFn = async (url, init) => {
    const u = String(url);
    if (u.includes("graphql")) {
      capturedBody = typeof init?.body === "string" ? init.body : "";
      return jsonResponse({
        data: { saveEndpoint: { id: "ep-vol-test", name: "test" } },
      });
    }
    if (u.includes("/health")) {
      return jsonResponse({ workers: { ready: 1 } });
    }
    if (u.includes("/v1/models")) {
      return jsonResponse({ data: [{ id: "Qwen/Qwen2.5-32B-Instruct" }] });
    }
    return new Response("Not found", { status: 404 });
  };

  globalThis.fetch = mockFetch as typeof globalThis.fetch;

  const provider = createCloudProvider({
    apiKey: "test-key",
    networkVolumeId: "vol_abc123",
  });
  await provider.provision();

  assert.ok(capturedBody.includes("vol_abc123"));
  assert.ok(capturedBody.includes("networkVolumeId"));
});

it("provision() omits networkVolumeId from mutation when not provided", async () => {
  let capturedBody = "";
  // ... similar mock setup ...
  const provider = createCloudProvider({ apiKey: "test-key" });
  await provider.provision();

  assert.ok(!capturedBody.includes("networkVolumeId"));
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `--download-dir` vLLM flag for cache | RunPod built-in model caching via network volume mount | RunPod worker-vllm template | No need to modify dockerArgs; volume attachment is sufficient |
| GraphQL for all RunPod ops | REST API (`rest.runpod.io/v1`) for CRUD, GraphQL for endpoints | RunPod REST API launch 2024 | Volume management is easier via REST; endpoint creation stays GraphQL |
| `MODEL_NAME` env var | `dockerArgs` with `--model` flag | Phase 18 | Already done; no change needed for this phase |

## Open Questions

1. **Empty string vs omitted field in GraphQL**
   - What we know: The `saveEndpoint` docs show `networkVolumeId: ""` in examples, suggesting empty string means "no volume"
   - What's unclear: Whether empty string causes errors vs being silently ignored
   - Recommendation: Omit the field entirely when not provided (safer approach)

2. **Volume size for Qwen 32B model**
   - What we know: Qwen2.5-32B-Instruct is ~18GB in safetensors format
   - What's unclear: Exact disk usage with HuggingFace cache overhead (config files, tokenizer, etc.)
   - Recommendation: Document that users should create a 50GB+ volume (provides headroom for model + cache metadata)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | none -- `npm test` in `src/` runs all `*.test.ts` |
| Quick run command | `cd src && npx tsx --test infra/cloud-provider.test.ts` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CACHE-01 | networkVolumeId included in saveEndpoint mutation when provided | unit | `cd src && npx tsx --test infra/cloud-provider.test.ts` | Exists (extend) |
| CACHE-01 | networkVolumeId omitted from mutation when not provided | unit | `cd src && npx tsx --test infra/cloud-provider.test.ts` | Exists (extend) |
| CACHE-01 | VllmBackendOptions threads networkVolumeId to provider | unit | `cd src && npx tsx --test infra/backend-factory.test.ts` | Exists (extend) |
| CACHE-02 | Subsequent launches reuse cached weights (faster /v1/models) | manual-only | N/A -- requires real RunPod infrastructure | N/A |

### Sampling Rate
- **Per task commit:** `cd src && npx tsx --test infra/cloud-provider.test.ts`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Tests for CACHE-01 extend existing test files. CACHE-02 is validated manually via real RunPod deployment (timing-based: cached launch should skip HuggingFace download, observable via faster `/v1/models` readiness).

## Sources

### Primary (HIGH confidence)
- [RunPod Manage Endpoints GraphQL docs](https://docs.runpod.io/sdks/graphql/manage-endpoints) - `saveEndpoint` mutation with `networkVolumeId` field
- [RunPod Network Volumes docs](https://docs.runpod.io/storage/network-volumes) - Volume creation, mount paths, pricing
- [RunPod REST API - Create Network Volume](https://docs.runpod.io/api-reference/network-volumes/POST/networkvolumes) - REST endpoint, parameters (name, size, dataCenterId)
- [RunPod REST API - List Network Volumes](https://docs.runpod.io/api-reference/network-volumes/GET/networkvolumes) - Response format with id, name, size, dataCenterId
- [RunPod Model Caching docs](https://docs.runpod.io/serverless/endpoints/model-caching) - Automatic caching at `/runpod-volume/huggingface-cache/hub/`
- [RunPod GraphQL API Spec](https://graphql-spec.runpod.io/) - Endpoint type includes networkVolumeId field

### Secondary (MEDIUM confidence)
- [RunPod worker-vllm GitHub](https://github.com/runpod-workers/worker-vllm) - BASE_PATH defaults to `/runpod-volume`, auto-uses network volume for HF cache
- [RunPod blog - vLLM serverless](https://www.runpod.io/blog/run-vllm-on-runpod-serverless) - Network volume recommended for model caching
- [vLLM GitHub discussions](https://github.com/vllm-project/vllm/discussions/4308) - `--download-dir` flag behavior and HF_HOME alternatives

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing GraphQL mutation with a documented field addition
- Architecture: HIGH - Direct extension of Phase 18 patterns, minimal surface area
- Pitfalls: HIGH - Well-documented RunPod constraints (region-locking, first-launch behavior)

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- RunPod API is versioned, patterns unlikely to change)
