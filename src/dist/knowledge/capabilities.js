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
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data", "capabilities");
function loadJson(filename) {
    const content = readFileSync(join(dataDir, filename), "utf-8");
    return JSON.parse(content);
}
// Load all data at module initialization
const capabilitiesData = loadJson("platform-capabilities.json");
const useCaseData = loadJson("use-case-mappings.json");
const keywordsData = loadJson("capability-keywords.json");
/**
 * Return all capability pillars with their capabilities.
 */
export function getAllCapabilities() {
    return capabilitiesData.pillars;
}
/**
 * Return a flat array of all platform capabilities across all pillars.
 */
export function getAllCapabilitiesFlat() {
    return capabilitiesData.pillars.flatMap((p) => p.capabilities);
}
/**
 * Return all use-case-to-component mappings.
 */
export function getUseCaseMappings() {
    return useCaseData.mappings;
}
/**
 * Return capability keyword classifications (ai_ml, rule_based, hybrid).
 */
export function getCapabilityKeywords() {
    return keywordsData.classifications;
}
/**
 * Return platform boundaries (what Aera is/is not), if defined.
 */
export function getPlatformBoundaries() {
    return capabilitiesData.platform_boundaries;
}
