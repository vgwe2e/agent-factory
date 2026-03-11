/**
 * TSV formatting utilities.
 *
 * Pure helper functions for converting typed values to TSV-safe strings.
 * Used by all TSV formatter modules in the output pipeline.
 */

/**
 * Convert a single value to a TSV-safe cell string.
 * - null/undefined -> ""
 * - boolean -> "Y"/"N"
 * - number/string -> String(value)
 */
export function tsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Y" : "N";
  return String(value);
}

/**
 * Join an array of cell values into a tab-separated row string.
 */
export function tsvRow(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(tsvCell).join("\t");
}
