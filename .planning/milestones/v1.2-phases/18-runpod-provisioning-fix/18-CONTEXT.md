# Phase 18: RunPod Provisioning Fix - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

RunPod pod provisioning works correctly on first attempt using the GraphQL API with proper model validation. Fix the GraphQL mutation to use `dockerArgs` instead of env vars, validate the loaded model matches the request, enforce a 15-minute timeout with actionable errors, and provide `--vllm-url` as the documented manual fallback (no runpodctl dependency). Requirements: PROV-01, PROV-02, PROV-03, PROV-04.

</domain>

<decisions>
## Implementation Decisions

### Model validation (PROV-02)
- Parse the full `/v1/models` response body (OpenAI format: `{ data: [{ id: "model-name" }] }`)
- Case-insensitive contains match: check if any model ID in the response contains the requested model name (handles org prefix stripping and casing variations)
- `/v1/models` check is sufficient — no test completion needed
- If models are returned but none match: fail with error listing loaded model IDs (e.g., "Expected Qwen/Qwen2.5-32B-Instruct but loaded: [meta-llama/Llama-3-8B]")

### Error messaging (PROV-03)
- Timeout errors include: endpoint/pod ID, last known status, and suggested recovery actions
- Recovery suggestions: (1) check RunPod console for pod ID, (2) verify GPU availability, (3) retry with `--vllm-url` pointing at a manually created pod
- Model mismatch errors show model IDs only (not full response body)
- Auto-teardown the endpoint on any provisioning failure (timeout, model mismatch) — prevents orphaned pods accumulating charges. Error message still includes the pod ID for reference.

### runpodctl fallback (PROV-04 reinterpretation)
- No runpodctl fallback — GraphQL path handles everything
- PROV-04 satisfied by documenting `--vllm-url` as the manual fallback in error messages
- If auto-provisioning fails, error suggests: "Use --vllm-url <url> to connect to a manually created pod"

### GraphQL mutation fix (PROV-01)
- Switch from `env: [{ key: "MODEL_NAME" }]` to `dockerArgs` in the `saveEndpoint` mutation
- `dockerArgs` includes `--model`, `--max-model-len`, and `--dtype` flags for reliable model loading
- Hardcoded sensible defaults in `cloud-provider.ts` (no new CLI flags) — advanced users use `--vllm-url` with their own pod

### Claude's Discretion
- Exact `dockerArgs` values for max-model-len and dtype (based on Qwen 32B on H100 requirements)
- Timeout budget split between provisioning and health check phases (combined must total ~15min per PROV-03)
- Poll interval and backoff strategy (current exponential backoff pattern is reasonable)
- Whether to log progress during provisioning poll (e.g., "Waiting for endpoint... 2/15 min")

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createCloudProvider` (`src/infra/cloud-provider.ts`): Main target — already has GraphQL mutation, health polling, and teardown. Needs mutation fix, model validation enhancement, timeout increase, and error improvement.
- `createBackend` (`src/infra/backend-factory.ts`): Calls `createCloudProvider` — no changes needed unless config interface changes.
- `CloudProviderConfig` interface: Already has `maxProvisionTimeoutMs`, `maxHealthTimeoutMs`, `model` fields — increase defaults.

### Established Patterns
- GraphQL helper function in cloud-provider.ts for RunPod API calls
- Exponential backoff polling with configurable interval
- `ProvisionedEndpoint` type: `{ endpointId, baseUrl, provisionedAt }`
- Test mocking pattern: override `fetch` in cloud-provider.test.ts to mock GraphQL and health endpoints

### Integration Points
- `cloud-provider.ts:121-138` — GraphQL `saveEndpoint` mutation needs `dockerArgs` instead of `env`
- `cloud-provider.ts:217-228` — `healthCheck` needs to parse response body and validate model name
- `cloud-provider.ts:50-51` — Default timeouts need increase to sum to ~15 min
- `cloud-provider.ts:112-215` — `provision()` needs auto-teardown on failure (try/catch wrapping)
- `cloud-provider.test.ts` — Tests need updating for new model validation and error behavior

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The success criteria from the roadmap are clear and testable.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-runpod-provisioning-fix*
*Context gathered: 2026-03-12*
