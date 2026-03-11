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
export declare function tsvCell(value: string | number | boolean | null | undefined): string;
/**
 * Join an array of cell values into a tab-separated row string.
 */
export declare function tsvRow(cells: (string | number | boolean | null | undefined)[]): string;
