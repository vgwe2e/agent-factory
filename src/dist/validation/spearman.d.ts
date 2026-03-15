/**
 * Spearman rank correlation utility.
 *
 * Pure function implementation with fractional ranking for ties.
 * No external dependencies -- the formula is standard statistics:
 *   rho = 1 - (6 * sum(d_i^2)) / (n * (n^2 - 1))
 */
/**
 * Compute fractional (average) ranks for a list of values.
 * Ties receive the mean of their ordinal positions (1-based).
 *
 * @example fractionalRanks([10, 30, 20]) // [1, 3, 2]
 * @example fractionalRanks([5, 5, 5])    // [2, 2, 2]
 */
export declare function fractionalRanks(values: number[]): number[];
/**
 * Compute Spearman rank correlation coefficient between two arrays.
 *
 * @throws Error if arrays have different lengths or fewer than 2 elements.
 * @returns rho in [-1, 1]. 1 = perfect positive, -1 = perfect inverse.
 */
export declare function spearmanRho(x: number[], y: number[]): number;
