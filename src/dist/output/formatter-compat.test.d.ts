/**
 * VAL-03: Formatter structural parity tests.
 *
 * Verifies all 10+ report formatters produce structurally correct output
 * from v1.3-shaped ScoringResult objects (with sanityVerdict, preScore,
 * and synthesized LensScores). Tests compare structure -- columns, sections,
 * formatting -- against v1.2 evaluation-vllm/ baseline, NOT numeric values.
 *
 * Permanent regression test: runs on every `npm test` invocation.
 */
export {};
