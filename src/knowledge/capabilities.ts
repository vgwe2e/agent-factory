/**
 * Platform capabilities knowledge query module.
 *
 * Provides typed lookup functions for Aera platform capabilities,
 * use-case-to-component mappings, and capability keyword classifications.
 * Data is loaded from bundled JSON at module initialization -- no runtime
 * filesystem access to external repos.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  PlatformCapabilitiesData,
  PlatformCapability,
  PlatformBoundaries,
  CapabilityPillar,
  UseCaseMappingsData,
  UseCaseMapping,
  CapabilityKeywordsData,
  CapabilityClassification,
} from "../types/knowledge.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data", "capabilities");

function loadJson<T>(filename: string): T {
  const content = readFileSync(join(dataDir, filename), "utf-8");
  return JSON.parse(content) as T;
}

// Load all data at module initialization
const capabilitiesData: PlatformCapabilitiesData = loadJson("platform-capabilities.json");
const useCaseData: UseCaseMappingsData = loadJson("use-case-mappings.json");
const keywordsData: CapabilityKeywordsData = loadJson("capability-keywords.json");

/**
 * Return all capability pillars with their capabilities.
 */
export function getAllCapabilities(): CapabilityPillar[] {
  return capabilitiesData.pillars;
}

/**
 * Return a flat array of all platform capabilities across all pillars.
 */
export function getAllCapabilitiesFlat(): PlatformCapability[] {
  return capabilitiesData.pillars.flatMap((p) => p.capabilities);
}

/**
 * Return all use-case-to-component mappings.
 */
export function getUseCaseMappings(): UseCaseMapping[] {
  return useCaseData.mappings;
}

/**
 * Return capability keyword classifications (ai_ml, rule_based, hybrid).
 */
export function getCapabilityKeywords(): CapabilityKeywordsData["classifications"] {
  return keywordsData.classifications;
}

/**
 * Return platform boundaries (what Aera is/is not), if defined.
 */
export function getPlatformBoundaries(): PlatformBoundaries | undefined {
  return capabilitiesData.platform_boundaries;
}
