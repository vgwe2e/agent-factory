/**
 * Ingestion module for hierarchy JSON exports.
 *
 * Reads a JSON file from disk, validates it against the hierarchy Zod schema,
 * and returns a typed result with structured error messages on failure.
 */
import type { HierarchyExport } from "../types/hierarchy.js";
export type ParseResult = {
    success: true;
    data: HierarchyExport;
} | {
    success: false;
    error: string;
};
/**
 * Parse and validate a hierarchy JSON export file.
 *
 * @param filePath - Absolute or relative path to the JSON export file
 * @returns ParseResult with typed data on success, or descriptive error on failure
 */
export declare function parseExport(filePath: string): Promise<ParseResult>;
