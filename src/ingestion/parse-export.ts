/**
 * Ingestion module for hierarchy JSON exports.
 *
 * Reads a JSON file from disk, validates it against the hierarchy Zod schema,
 * and returns a typed result with structured error messages on failure.
 */

import fs from "node:fs/promises";
import { hierarchyExportSchema } from "../schemas/hierarchy.js";
import type { HierarchyExport } from "../types/hierarchy.js";

export type ParseResult =
  | { success: true; data: HierarchyExport }
  | { success: false; error: string };

/**
 * Parse and validate a hierarchy JSON export file.
 *
 * @param filePath - Absolute or relative path to the JSON export file
 * @returns ParseResult with typed data on success, or descriptive error on failure
 */
export async function parseExport(filePath: string): Promise<ParseResult> {
  // 1. Read file
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return { success: false, error: `File not found: ${filePath}` };
    }
    return {
      success: false,
      error: `Failed to read file: ${filePath}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 2. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    return {
      success: false,
      error: `Invalid JSON in ${filePath}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 3. Validate with Zod schema
  const result = hierarchyExportSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues.slice(0, 3).map((issue) => {
      const path = issue.path.join(".");
      return `${path}: ${issue.message}`;
    });
    return {
      success: false,
      error: `Validation failed:\n${issues.join("\n")}`,
    };
  }

  return { success: true, data: result.data as HierarchyExport };
}
