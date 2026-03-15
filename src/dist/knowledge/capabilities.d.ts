/**
 * Platform capabilities knowledge query module.
 *
 * Provides typed lookup functions for Aera platform capabilities,
 * use-case-to-component mappings, and capability keyword classifications.
 * Data is loaded from bundled JSON at module initialization -- no runtime
 * filesystem access to external repos.
 */
import type { PlatformCapability, PlatformBoundaries, CapabilityPillar, UseCaseMapping, CapabilityKeywordsData } from "../types/knowledge.js";
/**
 * Return all capability pillars with their capabilities.
 */
export declare function getAllCapabilities(): CapabilityPillar[];
/**
 * Return a flat array of all platform capabilities across all pillars.
 */
export declare function getAllCapabilitiesFlat(): PlatformCapability[];
/**
 * Return all use-case-to-component mappings.
 */
export declare function getUseCaseMappings(): UseCaseMapping[];
/**
 * Return capability keyword classifications (ai_ml, rule_based, hybrid).
 */
export declare function getCapabilityKeywords(): CapabilityKeywordsData["classifications"];
/**
 * Return platform boundaries (what Aera is/is not), if defined.
 */
export declare function getPlatformBoundaries(): PlatformBoundaries | undefined;
