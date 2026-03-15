# Ultimate Guide to Using vLLM on Runpod.ai via API

## Executive summary

Runpod gives you three practical ways to serve vLLM behind an API: (1) a ready-made Serverless vLLM worker that supports both Runpod’s native `/run`/`/runsync` job API and an OpenAI-compatible API surface, (2) a Serverless **load balancing** endpoint where you run your own HTTP server (often FastAPI) and embed vLLM directly for lower latency and “true” streaming-friendly behavior, and (3) a dedicated GPU Pod where you run `vllm serve` yourself and expose ports. citeturn21view0turn23view1turn20view1turn22search2

For most production LLM APIs, start with the official Serverless vLLM worker: it scales automatically, is configured via environment variables (including a large set that map directly to vLLM engine args), and supports OpenAI-style streaming (SSE) when you call the OpenAI-compatible routes. citeturn21view0turn10view1turn22search3turn14view3

If you need custom HTTP routes, custom auth flows, WebSocket relays, or you want to bypass queue semantics entirely, use a **load balancing** endpoint. Runpod explicitly frames load balancing endpoints as “direct-to-worker HTTP server” routing with no queue, which trades execution guarantees for lower latency and protocol flexibility. citeturn23view1turn21view0

A dedicated Pod is the “full control” option. You install and start the vLLM OpenAI-compatible server (`vllm serve ... --api-key ...`), then expose port 8000 (or your chosen port) through Runpod’s port exposure options. citeturn20view1turn22search2turn15view0

## Deployment choices on Runpod

Runpod’s own docs break Serverless into two endpoint architectures: **queue-based** endpoints (fixed `/run` and `/runsync`, built-in queuing) and **load balancing** endpoints (direct to your worker’s HTTP server, custom URL paths and contracts, no queuing). citeturn23view1turn21view0

Separately, Pods are persistent compute instances you manage directly, which you can use to host an always-on vLLM server. citeturn15view0turn24search14

### Deployment option comparison

| Option | What you run | API surface you call from clients | Scaling + backpressure | Best for | Main gotchas |
|---|---|---|---|---|---|
| Serverless vLLM worker (ready-to-deploy) | Runpod’s vLLM worker image + handler | Runpod native: `/v2/{endpoint}/run`, `/runsync`, `/status`, `/stream`; plus OpenAI-compatible base: `/v2/{endpoint}/openai/v1/...` | Queue-based: requests queue; execution is guaranteed; supports job operations like `/retry` and `/purge-queue` | Fastest path to production inference with minimal ops; drop-in OpenAI client compatibility | Queue-based adds latency (queue + worker hop); you must set the right env vars for your model family citeturn18view1turn22search3turn23view1turn17view1turn10view1 |
| Serverless load balancing endpoint (custom HTTP server + vLLM) | Your container (FastAPI/uvicorn, vLLM inside) | Your own URLs: `https://{endpoint}.api.runpod.ai/{path}` | No queue; requests can drop/fail when overloaded; you must handle backpressure + retries | Lowest latency; streaming-first APIs; custom auth, WebSocket relays, multiple routes | No built-in backlog; Runpod notes request timeout behavior (returns `400` if no worker available within a window) and you must implement retries client-side citeturn23view2turn23view1turn23view4 |
| GPU Pod (self-managed) | Your container or template; you run `vllm serve` | Direct HTTP to your exposed Pod port (often via Runpod proxy/TCP exposure) | You scale manually (or build your own strategy) | Maximum control; custom networking; long-lived warm model; experiments | You own uptime, restarts, upgrades, and port exposure security citeturn20view1turn22search2turn15view0 |

### Architecture diagram

```mermaid
flowchart LR
  subgraph Client["Client app / agent"]
    A[HTTP client\ncurl / Python / OpenAI client]
  end

  subgraph Runpod["Runpod"]
    B[Serverless Endpoint\n(queue-based vLLM worker)]
    C[Serverless Endpoint\n(load balancing worker)]
    D[GPU Pod\n(self-hosted vLLM)]
  end

  A -->|OpenAI-compatible\nSSE streaming| B
  A -->|Runpod native jobs\n/run + /status| B
  A -->|Custom HTTP routes\nSSE/WebSocket relay possible| C
  A -->|Direct port exposure\nHTTP proxy or TCP| D
```

## Authentication and API surface mapping

### API keys and where they apply

Runpod’s REST management API (for creating Pods/endpoints/templates and more) requires a Runpod API key in request headers; their API overview explicitly uses `Authorization: Bearer RUNPOD_API_KEY` when fetching the OpenAPI schema from `https://rest.runpod.io/v1/openapi.json`. citeturn15view0

Runpod’s docs also emphasize generating keys with least privilege: newer keys can be “Restricted” with per-API/per-endpoint permissions, and Runpod does not store your API key—treat it like a password and store it securely (for example in a password manager or a CI secret). citeturn15view1

For inference calls to Serverless endpoints (`https://api.runpod.ai/v2/...`), Runpod examples use `Authorization: Bearer` in many places (including vLLM request examples) and also show lowercase `authorization` headers in some examples; standardizing on `Authorization: Bearer $RUNPOD_API_KEY` keeps you consistent with OpenAI client libraries and Runpod’s own examples. citeturn18view1turn17view0turn16view0

### Endpoint URLs you will actually use

You will typically interact with three different URL families:

**Runpod REST management plane**
- `https://rest.runpod.io/v1/...` (Pods, Serverless endpoints, templates, volumes, billing, etc.) citeturn15view0

**Runpod Serverless inference (queue-based endpoints)**
- `https://api.runpod.ai/v2/{ENDPOINT_ID}/run` (async job submit)
- `https://api.runpod.ai/v2/{ENDPOINT_ID}/runsync` (sync job submit)
- `https://api.runpod.ai/v2/{ENDPOINT_ID}/status/{JOB_ID}` (poll)
- `https://api.runpod.ai/v2/{ENDPOINT_ID}/stream/{JOB_ID}` (stream job output lines) citeturn18view1turn17view1turn19view1

**Runpod Serverless vLLM OpenAI-compatible surface**
- Base URL pattern: `https://api.runpod.ai/v2/{ENDPOINT_ID}/openai/v1`
- Routes include at least `/chat/completions`, `/completions`, and `/models`. citeturn22search3turn14view0

### Runpod request lifecycle flowchart

```mermaid
flowchart TD
  A[Client sends request] --> B[Runpod auth checks API key]
  B --> C{Endpoint type?}
  C -->|Queue-based| D[Job enqueued\n/run or /runsync]
  D --> E{Workers available?}
  E -->|No| F[Cold start:\ncontainer + model init]
  E -->|Yes| G[Worker picks up job]
  F --> G
  G --> H[vLLM generates tokens]
  H --> I{Streaming enabled?}
  I -->|Runpod native stream| J[Client reads /stream/{job}\nNDJSON lines]
  I -->|OpenAI-compatible stream| K[Client reads SSE stream\n/chat/completions stream=true]
  I -->|No| L[Client receives full response]
  G --> M[Result stored temporarily\n(status=COMPLETED/FAILED)]
```

Key operational detail: Runpod’s queue-based job results expire. Their docs state async results are available for 30 minutes and sync results for 1 minute (extendable to up to 5 minutes with `?wait=t`), after which a job cannot be retried. citeturn17view1

## vLLM configuration on Runpod

Runpod’s vLLM worker is designed to be configured primarily through environment variables, and Runpod provides an explicit mapping rule: convert vLLM CLI flags to uppercase-with-underscores environment variables (for example `--tokenizer_mode` → `TOKENIZER_MODE`). citeturn9search4

The official vLLM worker environment variable reference lists model selection, tokenizer settings, quantization, context settings, batching controls, GPU memory use, streaming output batching, and OpenAI-compat options like raw SSE output. citeturn10view1

The worker’s own repository also documents “auto-discovery” behavior: it applies any env var whose name matches a valid `AsyncEngineArgs` field (uppercased), which is meant to let you configure vLLM options without waiting for explicit worker support. citeturn6view1

### Model selection: weights, revisions, tokenizer

At minimum, you set a model identifier via `MODEL_NAME`, which can be a Hugging Face repo ID or a local filesystem path. The Runpod env-var reference explicitly frames it that way. citeturn10view1

For gated/private models, you pass a Hugging Face token (`HF_TOKEN`) so the worker can download weights. Runpod’s “deploy vLLM” tutorial calls this out as a requirement for gated models. citeturn7view0turn10view1

Tokenizer and chat template issues are a common source of “it runs but output is wrong” problems. Runpod exposes variables like `TOKENIZER`, `TOKENIZER_MODE`, `CUSTOM_CHAT_TEMPLATE`, and `TRUST_REMOTE_CODE`. citeturn10view1turn7view0

If you self-host the OpenAI-compatible vLLM server (Pod or your own Serverless container), vLLM itself requires a chat template for chat APIs, and the vLLM docs warn that without one “all chat requests will error.” They recommend `--chat-template` to provide one if it’s missing. citeturn20view3

### Context length, memory, and quantization (the “can it fit?” layer)

vLLM’s own engine args docs define `--max-model-len` as “model context length (prompt and output)” and note it can be auto-derived; it also supports `auto`/`-1` to choose the maximum length that fits GPU memory. citeturn12view0

Runpod’s vLLM env-var reference mirrors that with `MAX_MODEL_LEN`, explicitly describing it as the maximum context length the engine allocates KV cache for, and calls out the VRAM trade-off (lower reduces VRAM use; higher needs more VRAM). citeturn10view1

Quantization is set via `QUANTIZATION` in the worker (examples include `awq`, `gptq`, `bitsandbytes`, `squeezellm`). The vLLM docs also define `--quantization` as the method used to quantize weights. citeturn10view1turn12view0

GPU memory utilization is a major “last-mile” setting. vLLM defines `--gpu-memory-utilization` as the fraction of GPU memory to use (0–1), with notes on multi-instance scenarios. Runpod exposes `GPU_MEMORY_UTILIZATION` similarly. citeturn11view0turn10view1

### Concurrency and batching: Runpod-side vs vLLM-side

There are two concurrency “planes” you need to reason about:

Runpod-side concurrency per worker:
- Runpod’s env-var reference defines `MAX_CONCURRENCY` as max concurrent requests per worker instance and explicitly says it is **not** a vLLM engine arg; it controls how Runpod feeds requests into vLLM. citeturn10view1

vLLM engine batching limits:
- Runpod exposes vLLM limits like `MAX_NUM_SEQS` and `MAX_NUM_BATCHED_TOKENS` and notes the trade-offs (throughput vs VRAM vs tail latency). citeturn10view1
- vLLM’s engine docs define knobs like `--tensor-parallel-size` (multi-GPU sharding) and memory controls like `--swap-space`. citeturn11view3turn11view0

Streaming output batching (not internal inference batching):
- Runpod’s vLLM env-var reference includes `DEFAULT_BATCH_SIZE`, `DEFAULT_MIN_BATCH_SIZE`, and `DEFAULT_BATCH_SIZE_GROWTH_FACTOR`, and explicitly states these control token batching in HTTP streaming responses and do **not** affect vLLM’s internal batching. citeturn10view1

### Configuration parameters and trade-offs

| Goal | Primary knobs | What you gain | What you risk |
|---|---|---|---|
| Fit a model in VRAM | `MAX_MODEL_LEN`, `GPU_MEMORY_UTILIZATION`, quantization (`QUANTIZATION`), dtype (`DTYPE`) | Avoid OOM, stabilize runtime | Shorter context; potential quality/accuracy changes with quantization; too-low utilization can waste capacity citeturn10view1turn11view0turn12view0 |
| Improve throughput for many short requests | `MAX_NUM_SEQS`, `MAX_NUM_BATCHED_TOKENS`, Runpod `MAX_CONCURRENCY` | Higher QPS and better GPU utilization | Higher tail latency, more VRAM pressure, queueing under burst citeturn10view1turn11view1turn10view1 |
| Reduce cold starts | Cached models / FlashBoot / keep workers warm (min workers), or bake model into image | Faster first-token, fewer “initializing” delays | Higher idle cost if you keep workers warm; larger images if you bake models citeturn21view0turn2view4turn6view1 |
| Reliable OpenAI-compatible streaming | `RAW_OPENAI_OUTPUT=1` (default), use `/openai/v1/...` routes | OpenAI-style SSE chunks | Chunking can differ; format is “similar but not identical” to OpenAI per Runpod docs citeturn14view3turn10view1 |
| Multi-GPU serving | `TENSOR_PARALLEL_SIZE` / `--tensor-parallel-size` | Serve larger models / higher throughput | More complexity; you must choose GPUs that support it and configure correctly citeturn10view1turn11view3 |

## Request and response formats with streaming

Runpod’s vLLM integration gives you two different client-facing “protocols”:

1) **Runpod native job protocol** (queue-based): JSON input/output, optional job streaming via `/stream/{job}`. citeturn18view1turn19view1turn17view1  
2) **OpenAI-compatible protocol** (HTTP, SSE streaming): largely aligns with OpenAI’s `/v1/chat/completions` and `/v1/completions` patterns when you call `.../openai/v1/...`. citeturn22search3turn14view3turn22search16

### Runpod native vLLM requests (queue-based endpoints)

Runpod’s “Send requests to vLLM workers” doc spells out that vLLM endpoints use the same `/run` and `/runsync` operations as other queue-based endpoints; the key difference is the expected `input` shape (prompt/messages + sampling params). citeturn18view0turn18view1

**Non-streaming (sync) request JSON**

```json
{
  "input": {
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "what is the capital of france?" }
    ],
    "sampling_params": {
      "temperature": 0.2,
      "max_tokens": 128
    }
  }
}
```

The same doc also supports a prompt-only format (for base models) and a `apply_chat_template` flag if you want chat formatting applied to a raw prompt. citeturn18view1

**cURL: synchronous (`/runsync`)**

```bash
export RUNPOD_API_KEY="..."
export ENDPOINT_ID="..."

curl -sS "https://api.runpod.ai/v2/${ENDPOINT_ID}/runsync" \
  -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "Explain quantum computing in simple terms.",
      "sampling_params": { "temperature": 0.7, "max_tokens": 200 }
    }
  }'
```

This format is directly shown in Runpod’s vLLM request guide. citeturn18view1

**Streaming (Runpod-native) behavior**

Runpod’s vLLM request doc shows streaming as a two-step pattern:
- Submit `/run` with `"stream": true`
- Consume incremental output by `GET /stream/{job_id}` and read line-delimited JSON. citeturn19view1turn17view1

```bash
export RUNPOD_API_KEY="..."
export ENDPOINT_ID="..."

# 1) Submit async job with stream enabled
JOB_ID="$(
  curl -sS "https://api.runpod.ai/v2/${ENDPOINT_ID}/run" \
    -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "input": {
        "prompt": "Write a short story about a robot.",
        "sampling_params": { "temperature": 0.8, "max_tokens": 300 },
        "stream": true
      }
    }' | jq -r .id
)"

# 2) Stream job output (newline-delimited JSON)
curl -sS "https://api.runpod.ai/v2/${ENDPOINT_ID}/stream/${JOB_ID}" \
  -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
  -N
```

### OpenAI-compatible requests (recommended for “agent ecosystems”)

Runpod’s OpenAI compatibility guide defines the base URL pattern and lists supported endpoints (`/chat/completions`, `/completions`, `/models`). citeturn22search3

It also states streaming follows OpenAI’s Server-Sent Events (SSE) format and suggests setting `RAW_OPENAI_OUTPUT=1` to enable raw SSE formatting for streaming. citeturn14view3turn10view1turn22search16

#### Python end-to-end via the official OpenAI client

Runpod’s docs show the exact integration pattern: set the OpenAI client `api_key` to your Runpod key and set `base_url` to your Runpod endpoint’s OpenAI-compatible base URL. citeturn14view3turn6view1

```python
import os
from openai import OpenAI

RUNPOD_API_KEY = os.environ["RUNPOD_API_KEY"]
ENDPOINT_ID = os.environ["ENDPOINT_ID"]
MODEL_NAME = os.environ["MODEL_NAME"]  # typically the HF repo id you deployed

client = OpenAI(
    api_key=RUNPOD_API_KEY,
    base_url=f"https://api.runpod.ai/v2/{ENDPOINT_ID}/openai/v1",
)

resp = client.chat.completions.create(
    model=MODEL_NAME,
    messages=[
        {"role": "system", "content": "You are a concise assistant."},
        {"role": "user", "content": "Give me 3 ways to reduce cold starts."},
    ],
    temperature=0.2,
    max_tokens=200,
)

print(resp.choices[0].message.content)
```

#### Streaming chat completions (SSE) in Python

Runpod’s OpenAI-compatibility guide includes a streaming example that iterates chunks and prints incremental deltas. citeturn14view0turn14view3

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["RUNPOD_API_KEY"],
    base_url=f"https://api.runpod.ai/v2/{os.environ['ENDPOINT_ID']}/openai/v1",
)

stream = client.chat.completions.create(
    model=os.environ["MODEL_NAME"],
    messages=[
        {"role": "system", "content": "Write clearly."},
        {"role": "user", "content": "Write a short poem about stars."},
    ],
    max_tokens=200,
    temperature=0.7,
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta
    if delta and delta.content:
        print(delta.content, end="", flush=True)
print()
```

#### cURL: OpenAI-compatible streaming

```bash
export RUNPOD_API_KEY="..."
export ENDPOINT_ID="..."
export MODEL_NAME="mistralai/Mistral-7B-Instruct-v0.2"  # example model id

curl -sS -N "https://api.runpod.ai/v2/${ENDPOINT_ID}/openai/v1/chat/completions" \
  -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"${MODEL_NAME}\",
    \"messages\": [{\"role\":\"user\",\"content\":\"stream me a 5-line haiku\"}],
    \"temperature\": 0.7,
    \"max_tokens\": 120,
    \"stream\": true
  }"
```

This relies on the documented base URL pattern and SSE streaming semantics described by Runpod and OpenAI’s streaming guide. citeturn22search3turn14view3turn22search16

### WebSockets vs SSE on Runpod

For LLM text streaming, you should assume **SSE is the primary supported streaming mechanism** when using OpenAI-compatible APIs. Runpod explicitly describes the streaming format as OpenAI SSE, and the vLLM worker ships with `RAW_OPENAI_OUTPUT` to match that output format. citeturn14view3turn10view1turn22search16

WebSockets are still relevant in two cases:

- If you build your own protocol on a Pod: Runpod’s Pod port exposure docs note that WebSocket apps often work better over TCP exposure for long-lived connections. citeturn22search2  
- If you implement a custom Serverless worker specifically for WebSockets: Runpod provides a “worker-websocket” example repo that describes waking a worker via `/run` and then connecting to the worker’s public IP and TCP port for bidirectional communication. citeturn22search18  
  Runpod also published a WebSocket streaming tutorial for Serverless (focused on streaming output), which is useful if you want a custom worker for non-OpenAI use cases. citeturn22search5  

If you need “WebSocket streaming for chat/completions,” the most robust pattern on Runpod is usually: **SSE from vLLM → your own WebSocket gateway** (load balancing endpoint or Pod) that relays SSE chunks to clients over WS.

## Reliability, security, monitoring, and automation

### Error handling, retries, and common failures

Runpod’s vLLM request guide explicitly recommends handling timeouts, rate limiting, initialization delays, and model loading issues, and provides a retry skeleton using exponential backoff and special-case handling for `429` and `5xx`. citeturn19view1

Load balancing endpoints add a distinct failure mode: Runpod states that if no worker is available to process a request within a window (for example initialization can’t complete fast enough, or the endpoint hit its max worker count), the system returns an HTTP `400` and you should implement retries in your client. citeturn23view2

#### Common error codes and remedies

| Surface | Symptom | Likely cause | Fix |
|---|---|---|---|
| Any Runpod API | `401/403` | Wrong key, missing `Authorization`, or insufficient key permissions | Regenerate a restricted key with the minimum permissions you need; pass `Authorization: Bearer ...` consistently; don’t confuse OpenAI keys with Runpod keys citeturn15view1turn14view3turn16view0 |
| OpenAI-compatible API | “Invalid model” | `model` doesn’t match deployed `MODEL_NAME` or override | Call `/models` to list available IDs; set `OPENAI_SERVED_MODEL_NAME_OVERRIDE` if you want a stable alias citeturn14view0turn14view3turn10view1 |
| Queue-based Serverless | Repeated failures / long waits | Cold starts, not enough workers, VRAM OOM, or queue buildup | Reduce `MAX_MODEL_LEN`, adjust GPU type, tune vLLM memory knobs; consider cached models / FlashBoot / min workers to reduce cold starts citeturn10view1turn21view0turn2view4turn7view0 |
| Load balancing | `400` after waiting | No worker ready within timeout; endpoint overloaded | Client-side retry with jitter; increase `MAX_WORKERS`; reduce cold starts; use queue-based if execution guarantees matter citeturn23view2turn23view1 |
| Queue-based jobs | Job can’t be retried | Results expired | Submit a new job; design client logic to fetch results promptly; don’t rely on retries after expiration citeturn17view1 |

### Performance tuning and cost optimization

Runpod Serverless is billed for compute time with no idle cost when not processing requests, and it can scale from zero to many workers; this is the core cost lever (burst when needed, scale to zero when you can tolerate cold starts). citeturn21view0

Cold starts matter for LLMs because model download + initialization can dominate latency. Runpod’s Serverless overview calls out three main mitigations: cached models, FlashBoot, and keeping active worker counts above zero. citeturn21view0turn2view4

You can also reduce cold start by baking the model into the image. The official vLLM worker repo documents an “Option 2” that builds a Docker image with the model included, and discusses `BASE_PATH` for where model/cache files live. citeturn6view1

On the vLLM side, the engine docs strongly imply that most tuning is about GPU memory headroom and KV cache sizing; `--gpu-memory-utilization` and `--max-model-len` are central. citeturn11view0turn12view0

### Security and rate limits

**Key handling**
- Use Runpod’s Restricted keys and least privilege. Runpod advises generating new restricted keys and selecting the minimum permissions. citeturn15view1  
- Don’t hardcode tokens; use environment variables or secrets. Runpod recommends env vars for configuration without hardcoding credentials. citeturn9search3turn8search6

**Public exposure**
- If you expose Pod ports publicly, Runpod advises implementing authentication, using HTTPS where appropriate, input validation, and rate limiting; public endpoints are targets for malicious traffic. citeturn22search2

**Serverless backpressure**
- Queue-based endpoints buffer; load balancing endpoints can drop/fail when overloaded and have no built-in backlog. This directly functions as a “rate limit by saturation” and you must design your client accordingly. citeturn23view1turn23view2

**Unspecified detail**
- Runpod’s per-account/per-endpoint rate limits and quotas are not fully specified in the cited docs; treat `429` as the canonical signal and implement client-side throttling and backoff. citeturn19view1

### Logging and monitoring

Runpod’s vLLM environment variables include `DISABLE_LOG_STATS` and `DISABLE_LOG_REQUESTS` (they are false by default, meaning logging is enabled unless you disable it). citeturn10view1

Runpod’s Serverless overview explicitly includes “monitor logs” and debugging workers with SSH as part of the normal workflow. citeturn21view0

For load balancing endpoints, worker health routing depends on `/ping` and `PORT_HEALTH`; Runpod marks workers healthy/unhealthy and removes unhealthy workers from routing. citeturn23view1

### CI/CD and automation patterns

#### Pattern: build container → deploy/update endpoint via API

Runpod describes the canonical Serverless workflow as: write handler → build Docker image → push to a registry (or deploy from GitHub) → deploy to an endpoint → monitor logs → adjust endpoint settings → repeat. citeturn21view0

For programmatic management, Runpod provides a REST API and an OpenAPI schema endpoint (`/openapi.json`) intended for generating clients and validating requests. citeturn15view0

A practical CI/CD pipeline therefore looks like:

1. Build and push your image (GHCR/Docker Hub).
2. Call Runpod REST API to create/update:
   - Endpoint container image
   - Environment variables (model id, quantization, etc.)
   - Scaling settings (min/max workers, GPU priority list)
3. Run a smoke test against `/openai/v1/models` or `/runsync`.

Because endpoint creation/update payloads evolve, the most robust “agent-friendly” method is: fetch `https://rest.runpod.io/v1/openapi.json` in CI and generate a typed client (or validate your JSON payloads) before deploying. citeturn15view0

#### Example: GitHub Actions skeleton (image build + endpoint update)

```yaml
name: deploy-runpod-vllm
on:
  push:
    branches: ["main"]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    env:
      RUNPOD_API_KEY: ${{ secrets.RUNPOD_API_KEY }}
      RUNPOD_ENDPOINT_ID: ${{ secrets.RUNPOD_ENDPOINT_ID }}
      IMAGE: ghcr.io/${{ github.repository }}/vllm-worker:${{ github.sha }}

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        run: |
          docker build -t "${IMAGE}" .
          docker push "${IMAGE}"

      - name: Update Runpod endpoint image (example)
        run: |
          # NOTE: payload shape is defined by Runpod's REST OpenAPI schema.
          # Use https://rest.runpod.io/v1/openapi.json to generate a client and validate fields.
          curl -sS -X PATCH "https://rest.runpod.io/v1/endpoints/${RUNPOD_ENDPOINT_ID}" \
            -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "{
              \"imageName\": \"${IMAGE}\"
            }"
```

This uses Runpod’s documented REST authentication scheme and endpoint management concept; you should validate the exact request body fields against the OpenAPI schema in your pipeline. citeturn15view0turn21view0

## End-to-end deployment examples

### Serverless vLLM worker via Runpod console (fastest setup)

Runpod’s “Deploy vLLM on Serverless” tutorial describes the console path: pick a model, deploy the vLLM repo from the Hub, set “Max Model Length,” expand advanced settings, then create the endpoint; it also notes initial provisioning and model download may take minutes. citeturn7view0

### Sample Dockerfile: extend the official Serverless vLLM worker image

The official vLLM worker repo identifies the pre-built image format as `runpod/worker-v1-vllm:<version>` and notes CUDA compatibility requirements (CUDA ≥ 12.1). citeturn6view1

```dockerfile
# Example: extend Runpod's vLLM worker image and add your own files
# Replace <version> with an actual release tag from the worker-vllm repo.
FROM runpod/worker-v1-vllm:<version>

# Optional: add custom templates, health probes, or helper scripts
COPY ./assets/ /opt/assets/

# The worker entrypoint is provided by the base image.
# Configure behavior via environment variables in the Runpod endpoint settings.
```

### Sample Dockerfile: self-host vLLM OpenAI-compatible server (Pod or custom Serverless)

vLLM’s docs show you can start the OpenAI-compatible server with `vllm serve ... --api-key ...` and then call it with the official OpenAI Python client (setting `base_url`). citeturn20view1

```dockerfile
FROM python:3.11-slim

# System deps (git is often needed for some HF installs; keep minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
  && rm -rf /var/lib/apt/lists/*

# Install vLLM (pin versions in real deployments)
RUN pip install --no-cache-dir vllm

# Runtime env
ENV MODEL_NAME="NousResearch/Meta-Llama-3-8B-Instruct"
ENV VLLM_API_KEY="change-me"
ENV PORT="8000"

EXPOSE 8000

# Start the OpenAI-compatible server
# You will likely add args like --dtype, --max-model-len, --tensor-parallel-size, etc.
CMD ["sh", "-lc", "vllm serve ${MODEL_NAME} --dtype auto --api-key ${VLLM_API_KEY} --host 0.0.0.0 --port ${PORT}"]
```

### Kubernetes manifest (generic, adapt to your cluster)

This is a generic example for running the same `vllm serve` container in Kubernetes with an NVIDIA GPU. Runpod itself does not require Kubernetes for its own Pods, so treat this as an optional pattern if you’re deploying elsewhere or mirroring the setup in a k8s environment.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-openai
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vllm-openai
  template:
    metadata:
      labels:
        app: vllm-openai
    spec:
      containers:
        - name: vllm
          image: your-registry/vllm-openai:latest
          ports:
            - containerPort: 8000
          env:
            - name: MODEL_NAME
              value: "NousResearch/Meta-Llama-3-8B-Instruct"
            - name: VLLM_API_KEY
              valueFrom:
                secretKeyRef:
                  name: vllm-secrets
                  key: apiKey
          resources:
            limits:
              nvidia.com/gpu: "1"
---
apiVersion: v1
kind: Service
metadata:
  name: vllm-openai
spec:
  selector:
    app: vllm-openai
  ports:
    - name: http
      port: 80
      targetPort: 8000
  type: ClusterIP
```

## MCP and Claude Code integration

### What MCP is and how it relates to Runpod

Anthropic introduced the Model Context Protocol (MCP) as an open standard for secure, two-way connections between AI tools and external data sources/tools. citeturn24search3turn24search6

Runpod now provides official MCP servers: one for Runpod resource management via the Runpod REST API (requires a Runpod API key) and one for searching Runpod documentation (no auth). citeturn25view0turn25view1

### Using Runpod’s official MCP servers with Claude Code

Runpod’s MCP docs provide a direct command to add the Runpod MCP server to Claude Code via a local stdio server (using `npx -y @runpod/mcp-server@latest`) and an environment variable for `RUNPOD_API_KEY`. citeturn25view1

```bash
# Adds Runpod MCP server at user scope (available across all your projects)
claude mcp add runpod --scope user -e RUNPOD_API_KEY=your_api_key_here -- npx -y @runpod/mcp-server@latest
```

Claude Code’s MCP docs explain the CLI patterns and transports:
- HTTP transport is recommended for remote MCP servers.
- SSE transport exists but is deprecated in Claude Code docs.
- Stdio transport runs a local process, which is exactly what the Runpod MCP install command uses. citeturn25view3turn25view1

Claude Code settings docs also specify where MCP server configs live:
- User scope: `~/.claude.json`
- Project scope: `.mcp.json` citeturn25view5

A minimal project-level `.mcp.json` example (best-effort pattern consistent with Runpod’s Cursor config style and Claude’s scope model) looks like:

```json
{
  "mcpServers": {
    "runpod": {
      "command": "npx",
      "args": ["-y", "@runpod/mcp-server@latest"],
      "env": {
        "RUNPOD_API_KEY": "YOUR_RUNPOD_API_KEY"
      }
    }
  }
}
```

Runpod’s own MCP page shows the same shape for Cursor (`mcpServers` → `command/args/env`). citeturn25view1

### Claude Code plugin integration

Claude Code supports plugins. Its docs state the optional plugin manifest lives at `.claude-plugin/plugin.json`, and the plugins reference describes how plugins package skills, agents, and hooks. citeturn24search2turn25view4

Specific instructions for “a Claude Code plugin that bundles a Runpod MCP server” are not fully spelled out in the Runpod docs. However, Claude Code supports MCP configuration at user/project scope and provides CLI tooling (`claude mcp add ...`) that you can invoke as part of a setup step. citeturn25view5turn25view3turn25view1

A best-effort pattern for a repo that needs Runpod tooling in Claude Code is:

1) Commit a `.mcp.json` in the project root that defines the Runpod MCP server (or document the install command in your README).
2) Add a Claude Code plugin skill that prompts the agent to use the Runpod MCP tools for common workflows (create endpoint, update env vars, scale workers, etc.).
3) In CI, avoid giving the plugin long-lived credentials; use per-developer API keys or short-lived scoped secrets.

## Appendix: “agent-ready” checklists

If you want a coding agent to operate this setup safely, constrain it to:

- **Provisioning** via Runpod REST API (or MCP tools) for create/update/list Pods and endpoints. citeturn15view0turn25view1  
- **Inference** via OpenAI-compatible endpoints (preferred) for standard agent frameworks, with SSE streaming turned on for interactive UX. citeturn22search3turn14view3turn22search16  
- **Tuning** via environment variables that map to vLLM args, using Runpod’s env-var reference as the contract. citeturn10view1turn9search4turn6view1  
- **Safety** via restricted API keys and explicit port exposure security controls. citeturn15view1turn22search2