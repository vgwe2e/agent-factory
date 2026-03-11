/**
 * Tests for mock test generator.
 *
 * Validates that generateMockTest:
 * - Produces validated MockTest from LLM YAML output
 * - Maps decision_articulation as the decision being tested
 * - Strips code fences from LLM output
 * - Retries on YAML parse/validation failure
 * - Fails after 3 unsuccessful attempts
 */
export {};
