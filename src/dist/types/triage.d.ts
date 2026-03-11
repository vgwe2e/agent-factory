/**
 * Type system for the triage subsystem.
 *
 * Defines red flag tagged unions, flag-to-action mappings,
 * tier assignments, and the complete triage result type.
 */
export type RedFlag = {
    type: "DEAD_ZONE";
    decisionDensity: 0;
} | {
    type: "PHANTOM";
    opportunityExists: false;
} | {
    type: "NO_STAKES";
    highFinancialCount: 0;
    allSecondOrder: true;
} | {
    type: "CONFIDENCE_GAP";
    lowConfidencePct: number;
} | {
    type: "ORPHAN";
    l4Count: number;
};
export type FlagAction = "skip" | "demote" | "flag";
export declare const FLAG_ACTIONS: Record<RedFlag["type"], FlagAction>;
export type Tier = 1 | 2 | 3;
export interface TriageResult {
    l3Name: string;
    l2Name: string;
    l1Name: string;
    tier: Tier;
    redFlags: RedFlag[];
    action: "process" | "skip" | "demote";
    combinedMaxValue: number | null;
    quickWin: boolean;
    leadArchetype: string | null;
    l4Count: number;
    rationale?: string;
}
