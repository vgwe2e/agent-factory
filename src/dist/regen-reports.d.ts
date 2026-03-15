#!/usr/bin/env npx tsx
/**
 * Regenerate evaluation reports from archived checkpoint data.
 *
 * Reads .pipeline/checkpoint-*.json files to reconstruct ScoringResult[],
 * re-runs triage for TriageResult[], then calls writeEvaluation + writeFinalReports.
 */
import "dotenv/config";
