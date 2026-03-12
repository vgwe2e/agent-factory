# Phase 20: Network Volume & Model Caching - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Model weights are cached on a RunPod network volume so subsequent pod launches skip the HuggingFace download. Users can provision a pod with `--network-volume` and the pod mounts the volume for model weight storage. On second launch with the same volume, model loading completes significantly faster. Requirements: CACHE-01, CACHE-02.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User trusts Claude on all implementation decisions for this phase. The following areas are open for research and planning to determine the best approach:

- **Volume lifecycle** — Whether volumes are auto-created or user-provided, what happens on teardown (volume persists, pod dies), and whether to support volume deletion via a separate flag
- **CLI flag design** — How `--network-volume` flag works (accept volume ID, auto-create, or both), interaction with `--teardown` from Phase 17
- **Mount path & vLLM config** — Container mount path (RunPod default `/runpod-volume`), vLLM `--download-dir` flag to point at cached weights, integration with `dockerArgs` from Phase 18
- **Cache validation** — How to confirm cached weights are used (timing-based, log inspection, or trust faster `/v1/models` response)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The success criteria from the roadmap are clear and testable.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createCloudProvider` (`src/infra/cloud-provider.ts`): Main target — GraphQL mutations for endpoint creation/deletion already exist; needs network volume support in `saveEndpoint` mutation
- `CloudProviderConfig` interface: Add optional `networkVolumeId` field
- `createBackend` (`src/infra/backend-factory.ts`): Passes config to `createCloudProvider` — thread `networkVolumeId` through
- Phase 18 `dockerArgs` pattern: vLLM flags (`--model`, `--max-model-len`, `--dtype`) already in mutation — add `--download-dir` for volume path

### Established Patterns
- GraphQL helper function in cloud-provider.ts for RunPod API calls
- CLI flags flow through Commander → action handler → `PipelineOptions` → `createBackend` → `createCloudProvider`
- Phase 18 auto-teardown pattern: teardown pod on failure, preserve on success unless `--teardown` passed

### Integration Points
- `cloud-provider.ts:121-138` — `saveEndpoint` GraphQL mutation needs `networkVolumeId` field and `--download-dir` in `dockerArgs`
- `backend-factory.ts:84-85` — `createCloudProvider` call needs `networkVolumeId` from options
- `cli.ts` — New `--network-volume <id>` flag, threaded to `VllmBackendOptions`
- RunPod GraphQL API — `createNetworkVolume` mutation available if auto-creation desired

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-network-volume-model-caching*
*Context gathered: 2026-03-12*
