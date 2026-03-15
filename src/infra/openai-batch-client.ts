import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_POLL_INTERVAL_MS = 10_000;
const DEFAULT_BATCH_TIMEOUT_MS = 25 * 60 * 60 * 1000;
const DEFAULT_HTTP_TIMEOUT_MS = 60_000;

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

interface OpenAiFileUploadResponse {
  id: string;
}

interface OpenAiBatchResponse {
  id: string;
  status: string;
  output_file_id?: string | null;
  error_file_id?: string | null;
}

interface BatchOutputLine {
  custom_id?: string;
  response?: {
    status_code?: number;
    body?: {
      choices?: Array<{
        message?: {
          content?: string | Array<{ type?: string; text?: string }>;
        };
      }>;
      error?: {
        message?: string;
      };
    };
  };
  error?: {
    message?: string;
  };
}

export async function runOpenAiBatch(
  config: OpenAiBatchConfig,
  options: OpenAiBatchJobOptions,
): Promise<OpenAiBatchJobResult> {
  const baseUrl = (config.baseUrl ?? DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, "");
  const pollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = config.timeoutMs ?? DEFAULT_BATCH_TIMEOUT_MS;
  const jobDir = path.join(options.outputDir, "batch");
  const safeJobName = slugify(options.jobName);
  const requestPath = path.join(jobDir, `${safeJobName}-requests.jsonl`);
  const outputPath = path.join(jobDir, `${safeJobName}-output.jsonl`);
  const errorPath = path.join(jobDir, `${safeJobName}-errors.jsonl`);
  const manifestPath = path.join(jobDir, `${safeJobName}-manifest.json`);

  await fs.mkdir(jobDir, { recursive: true });

  const requestJsonl = options.requests
    .map((request) => JSON.stringify({
      custom_id: request.customId,
      method: "POST",
      url: options.endpoint,
      body: request.body,
    }))
    .join("\n") + "\n";
  await fs.writeFile(requestPath, requestJsonl, "utf-8");

  const inputFileId = await uploadBatchInputFile(baseUrl, config.apiKey, requestJsonl, path.basename(requestPath));
  const batch = await createBatchJob(baseUrl, config.apiKey, inputFileId, options.endpoint, options.jobName);

  await writeManifest(manifestPath, {
    batchId: batch.id,
    status: batch.status,
    inputFileId,
    submittedAt: new Date().toISOString(),
    requestCount: options.requests.length,
  });

  const completedBatch = await pollBatchToCompletion(
    baseUrl,
    config.apiKey,
    batch.id,
    pollIntervalMs,
    timeoutMs,
  );

  const outputLines = completedBatch.output_file_id
    ? await downloadJsonlFile(baseUrl, config.apiKey, completedBatch.output_file_id, outputPath)
    : [];
  const errorLines = completedBatch.error_file_id
    ? await downloadJsonlFile(baseUrl, config.apiKey, completedBatch.error_file_id, errorPath)
    : [];

  await writeManifest(manifestPath, {
    batchId: batch.id,
    status: completedBatch.status,
    inputFileId,
    outputFileId: completedBatch.output_file_id ?? undefined,
    errorFileId: completedBatch.error_file_id ?? undefined,
    submittedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    requestCount: options.requests.length,
  });

  return {
    batchId: batch.id,
    inputFileId,
    outputFileId: completedBatch.output_file_id ?? undefined,
    errorFileId: completedBatch.error_file_id ?? undefined,
    status: completedBatch.status,
    outputLines,
    errorLines,
    requestPath,
    outputPath: completedBatch.output_file_id ? outputPath : undefined,
    errorPath: completedBatch.error_file_id ? errorPath : undefined,
    manifestPath,
  };
}

export function extractChatCompletionContent(line: unknown): { success: true; content: string } | { success: false; error: string } {
  const parsed = line as BatchOutputLine;
  if (parsed?.error?.message) {
    return { success: false, error: parsed.error.message };
  }

  const statusCode = parsed?.response?.status_code ?? 0;
  if (statusCode >= 400) {
    const message = parsed?.response?.body?.error?.message ?? `OpenAI batch request failed with status ${statusCode}`;
    return { success: false, error: message };
  }

  const content = parsed?.response?.body?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return { success: true, content };
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => typeof part?.text === "string" ? part.text : "")
      .join("")
      .trim();
    if (text.length > 0) {
      return { success: true, content: text };
    }
  }

  return { success: false, error: "Batch response did not include chat completion content" };
}

export function normalizeOpenAiJsonSchema(schema: Record<string, unknown>): Record<string, unknown> {
  return normalizeForOpenAiStrict(stripSchemaMetadata(schema)) as Record<string, unknown>;
}

export function stripNullFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripNullFields);
  }

  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (child === null) continue;
      next[key] = stripNullFields(child);
    }
    return next;
  }

  return value;
}

async function uploadBatchInputFile(
  baseUrl: string,
  apiKey: string,
  jsonlContent: string,
  filename: string,
): Promise<string> {
  const form = new FormData();
  form.set("purpose", "batch");
  form.set(
    "file",
    new Blob([jsonlContent], { type: "application/jsonl" }),
    filename,
  );

  const response = await openAiFetch<OpenAiFileUploadResponse>(
    `${baseUrl}/files`,
    apiKey,
    {
      method: "POST",
      body: form,
    },
  );

  return response.id;
}

async function createBatchJob(
  baseUrl: string,
  apiKey: string,
  inputFileId: string,
  endpoint: string,
  jobName: string,
): Promise<OpenAiBatchResponse> {
  return openAiFetch<OpenAiBatchResponse>(
    `${baseUrl}/batches`,
    apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_file_id: inputFileId,
        endpoint,
        completion_window: "24h",
        metadata: { job_name: jobName },
      }),
    },
  );
}

async function pollBatchToCompletion(
  baseUrl: string,
  apiKey: string,
  batchId: string,
  pollIntervalMs: number,
  timeoutMs: number,
): Promise<OpenAiBatchResponse> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const batch = await openAiFetch<OpenAiBatchResponse>(
      `${baseUrl}/batches/${batchId}`,
      apiKey,
      { method: "GET" },
    );

    if (batch.status === "completed") {
      return batch;
    }

    if (TERMINAL_FAILURE_STATUSES.has(batch.status)) {
      throw new Error(`OpenAI batch ${batchId} ended with status ${batch.status}`);
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(`OpenAI batch ${batchId} did not complete within ${timeoutMs}ms`);
}

async function downloadJsonlFile(
  baseUrl: string,
  apiKey: string,
  fileId: string,
  destinationPath: string,
): Promise<unknown[]> {
  const response = await fetch(`${baseUrl}/files/${fileId}/content`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(DEFAULT_HTTP_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`OpenAI file download failed with HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  await fs.writeFile(destinationPath, text, "utf-8");

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as unknown);
}

async function openAiFetch<T>(
  url: string,
  apiKey: string,
  init: RequestInit,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);

  const response = await fetch(url, {
    ...init,
    headers,
    signal: AbortSignal.timeout(DEFAULT_HTTP_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API request failed with HTTP ${response.status}: ${body || response.statusText}`);
  }

  return await response.json() as T;
}

async function writeManifest(
  manifestPath: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await fs.writeFile(manifestPath, JSON.stringify(payload, null, 2), "utf-8");
}

function stripSchemaMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripSchemaMetadata);
  }

  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === "$schema") continue;
      next[key] = stripSchemaMetadata(child);
    }
    return next;
  }

  return value;
}

function normalizeForOpenAiStrict(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForOpenAiStrict);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = normalizeForOpenAiStrict(child);
  }

  const properties = next.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return next;
  }

  const normalizedProperties = properties as Record<string, unknown>;
  const originalRequired = new Set(
    Array.isArray(next.required)
      ? next.required.filter((entry): entry is string => typeof entry === "string")
      : [],
  );

  const required = Object.keys(normalizedProperties);
  for (const key of required) {
    if (!originalRequired.has(key)) {
      normalizedProperties[key] = makeSchemaNullable(normalizedProperties[key]);
    }
  }

  next.required = required;
  if (next.additionalProperties === undefined) {
    next.additionalProperties = false;
  }
  return next;
}

function makeSchemaNullable(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const next = { ...(value as Record<string, unknown>) };
  const type = next.type;

  if (typeof type === "string") {
    if (type === "null") {
      return next;
    }
    next.type = [type, "null"];
    return next;
  }

  if (Array.isArray(type)) {
    if (!type.includes("null")) {
      next.type = [...type, "null"];
    }
    return next;
  }

  const anyOf = next.anyOf;
  if (Array.isArray(anyOf)) {
    if (!anyOf.some(isNullSchema)) {
      next.anyOf = [...anyOf, { type: "null" }];
    }
    return next;
  }

  const oneOf = next.oneOf;
  if (Array.isArray(oneOf)) {
    if (!oneOf.some(isNullSchema)) {
      next.oneOf = [...oneOf, { type: "null" }];
    }
    return next;
  }

  return {
    anyOf: [next, { type: "null" }],
  };
}

function isNullSchema(value: unknown): boolean {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).type === "null",
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TERMINAL_FAILURE_STATUSES = new Set([
  "failed",
  "expired",
  "cancelled",
]);
