/**
 * Ingestion module for hierarchy JSON exports.
 *
 * Reads a JSON file from disk, validates it against the hierarchy Zod schema,
 * and returns a typed result with structured error messages on failure.
 */
import fs from "node:fs/promises";
import { hierarchyExportSchema } from "../schemas/hierarchy.js";
/**
 * Parse and validate a hierarchy JSON export file.
 *
 * @param filePath - Absolute or relative path to the JSON export file
 * @returns ParseResult with typed data on success, or descriptive error on failure
 */
export async function parseExport(filePath) {
    // 1. Read file
    let raw;
    try {
        raw = await fs.readFile(filePath, "utf-8");
    }
    catch (err) {
        if (err instanceof Error && "code" in err && err.code === "ENOENT") {
            return { success: false, error: `File not found: ${filePath}` };
        }
        return {
            success: false,
            error: `Failed to read file: ${filePath}: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
    // 2. Parse JSON
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (err) {
        return {
            success: false,
            error: `Invalid JSON in ${filePath}: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
    // 3. Validate with Zod schema (v3 envelope)
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
    // Unwrap the project data from the v3 envelope
    return { success: true, data: result.data.project };
}
