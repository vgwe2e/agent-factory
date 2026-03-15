/**
 * TypeScript types for the Aera hierarchy JSON export (v3 envelope format).
 *
 * The v3 export wraps project data in an envelope with export_meta, disclaimer,
 * project, and summary. HierarchyExport represents the inner project data that
 * downstream consumers work with. Zod schemas in schemas/hierarchy.ts validate
 * the full envelope at runtime; parseExport unwraps the project data.
 */
export {};
