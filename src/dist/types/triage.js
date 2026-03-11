/**
 * Type system for the triage subsystem.
 *
 * Defines red flag tagged unions, flag-to-action mappings,
 * tier assignments, and the complete triage result type.
 */
// -- Flag-to-Action Mapping --
export const FLAG_ACTIONS = {
    DEAD_ZONE: "skip",
    PHANTOM: "skip",
    NO_STAKES: "demote",
    CONFIDENCE_GAP: "flag",
    ORPHAN: "flag",
};
