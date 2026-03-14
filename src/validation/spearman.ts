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
export function fractionalRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    const avgRank = (i + j + 1) / 2; // 1-based average of tied positions
    for (let k = i; k < j; k++) ranks[indexed[k].i] = avgRank;
    i = j;
  }
  return ranks;
}

/**
 * Compute Spearman rank correlation coefficient between two arrays.
 *
 * @throws Error if arrays have different lengths or fewer than 2 elements.
 * @returns rho in [-1, 1]. 1 = perfect positive, -1 = perfect inverse.
 */
export function spearmanRho(x: number[], y: number[]): number {
  if (x.length !== y.length) throw new Error("Arrays must have equal length");
  if (x.length < 2) throw new Error("Need at least 2 paired observations");
  const n = x.length;
  const rankX = fractionalRanks(x);
  const rankY = fractionalRanks(y);
  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = rankX[i] - rankY[i];
    sumD2 += d * d;
  }
  return 1 - (6 * sumD2) / (n * (n * n - 1));
}
