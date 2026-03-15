import { z } from 'zod';
export declare const CheckpointEntrySchema: z.ZodEffects<z.ZodObject<{
    /** Skill ID (or l3Name for backward compat with older checkpoints). */
    skillId: z.ZodOptional<z.ZodString>;
    l3Name: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodString;
    status: z.ZodEnum<["scored", "skipped", "error"]>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "scored" | "skipped";
    completedAt: string;
    l3Name?: string | undefined;
    skillId?: string | undefined;
}, {
    status: "error" | "scored" | "skipped";
    completedAt: string;
    l3Name?: string | undefined;
    skillId?: string | undefined;
}>, {
    status: "error" | "scored" | "skipped";
    completedAt: string;
    l3Name?: string | undefined;
    skillId?: string | undefined;
}, {
    status: "error" | "scored" | "skipped";
    completedAt: string;
    l3Name?: string | undefined;
    skillId?: string | undefined;
}>;
export declare const CheckpointSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    inputFile: z.ZodString;
    startedAt: z.ZodString;
    entries: z.ZodArray<z.ZodEffects<z.ZodObject<{
        /** Skill ID (or l3Name for backward compat with older checkpoints). */
        skillId: z.ZodOptional<z.ZodString>;
        l3Name: z.ZodOptional<z.ZodString>;
        completedAt: z.ZodString;
        status: z.ZodEnum<["scored", "skipped", "error"]>;
    }, "strip", z.ZodTypeAny, {
        status: "error" | "scored" | "skipped";
        completedAt: string;
        l3Name?: string | undefined;
        skillId?: string | undefined;
    }, {
        status: "error" | "scored" | "skipped";
        completedAt: string;
        l3Name?: string | undefined;
        skillId?: string | undefined;
    }>, {
        status: "error" | "scored" | "skipped";
        completedAt: string;
        l3Name?: string | undefined;
        skillId?: string | undefined;
    }, {
        status: "error" | "scored" | "skipped";
        completedAt: string;
        l3Name?: string | undefined;
        skillId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entries: {
        status: "error" | "scored" | "skipped";
        completedAt: string;
        l3Name?: string | undefined;
        skillId?: string | undefined;
    }[];
    version: 1;
    inputFile: string;
    startedAt: string;
}, {
    entries: {
        status: "error" | "scored" | "skipped";
        completedAt: string;
        l3Name?: string | undefined;
        skillId?: string | undefined;
    }[];
    version: 1;
    inputFile: string;
    startedAt: string;
}>;
export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type CheckpointEntry = z.infer<typeof CheckpointEntrySchema>;
export declare const CheckpointV2EntrySchema: z.ZodObject<{
    l4Id: z.ZodString;
    completedAt: z.ZodString;
    status: z.ZodEnum<["scored", "error"]>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "scored";
    l4Id: string;
    completedAt: string;
}, {
    status: "error" | "scored";
    l4Id: string;
    completedAt: string;
}>;
export declare const CheckpointV2Schema: z.ZodObject<{
    version: z.ZodLiteral<2>;
    scoringMode: z.ZodLiteral<"two-pass">;
    inputFile: z.ZodString;
    startedAt: z.ZodString;
    entries: z.ZodArray<z.ZodObject<{
        l4Id: z.ZodString;
        completedAt: z.ZodString;
        status: z.ZodEnum<["scored", "error"]>;
    }, "strip", z.ZodTypeAny, {
        status: "error" | "scored";
        l4Id: string;
        completedAt: string;
    }, {
        status: "error" | "scored";
        l4Id: string;
        completedAt: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entries: {
        status: "error" | "scored";
        l4Id: string;
        completedAt: string;
    }[];
    version: 2;
    inputFile: string;
    startedAt: string;
    scoringMode: "two-pass";
}, {
    entries: {
        status: "error" | "scored";
        l4Id: string;
        completedAt: string;
    }[];
    version: 2;
    inputFile: string;
    startedAt: string;
    scoringMode: "two-pass";
}>;
export type CheckpointV2 = z.infer<typeof CheckpointV2Schema>;
export type CheckpointV2Entry = z.infer<typeof CheckpointV2EntrySchema>;
export declare const CHECKPOINT_FILENAME = ".checkpoint.json";
export declare function checkpointPath(outputDir: string): string;
/**
 * Load a checkpoint from disk with validation. Tries the primary file first,
 * then falls back to the backup copy if the primary is missing or corrupt.
 */
export declare function loadCheckpoint(outputDir: string): Checkpoint | null;
export declare function saveCheckpoint(outputDir: string, checkpoint: Checkpoint): void;
export declare function getCompletedNames(checkpoint: Checkpoint | null): Set<string>;
/**
 * Remove all error entries from the checkpoint file on disk.
 * Returns the number of entries cleared (0 if no checkpoint or no errors).
 */
export declare function clearCheckpointErrors(outputDir: string): number;
export interface CheckpointForModeResult {
    checkpoint: Checkpoint | CheckpointV2 | null;
    backedUp: boolean;
}
/**
 * Load a checkpoint from disk with mode awareness.
 *
 * When switching from three-lens (V1) to two-pass (V2), the old checkpoint
 * is backed up to `.checkpoint.v12.bak` so it can be restored later.
 * Mode-incompatible checkpoints are discarded (start fresh).
 */
export declare function loadCheckpointForMode(outputDir: string, scoringMode: 'two-pass' | 'three-lens'): CheckpointForModeResult;
/**
 * Get completed L4 IDs from a V2 checkpoint (excludes error entries).
 */
export declare function getCompletedL4Ids(checkpoint: CheckpointV2 | null): Set<string>;
/**
 * Create a durable checkpoint writer for V2 (two-pass) checkpoints.
 * Same atomic write pattern as V1 writer, but accepts CheckpointV2Entry objects.
 */
export declare function createCheckpointV2Writer(outputDir: string, checkpoint: CheckpointV2): CheckpointWriter<CheckpointV2Entry, CheckpointV2>;
export interface CheckpointWriter<TEntry = CheckpointEntry, TCheckpoint = Checkpoint> {
    /** Add an entry and immediately persist to disk. */
    enqueue: (entry: TEntry) => void;
    /** Force an immediate write (call at pipeline end or signal handler). */
    flush: () => void;
    /** Live checkpoint reference — mutations from enqueue are visible here. */
    checkpoint: TCheckpoint;
    /** Install SIGINT/SIGTERM handlers that flush before exit. Returns cleanup fn. */
    installSignalHandlers: () => () => void;
}
/**
 * Create a durable checkpoint writer.
 *
 * Design rationale: scored results are precious (each takes 3-15 minutes on
 * Apple Silicon with 30B MoE) and infrequent. We write to disk on every
 * enqueue rather than debouncing, because losing even one scored result to
 * a crash is unacceptable. The cost of a synchronous write every few minutes
 * is negligible compared to the scoring time.
 *
 * Writes use atomic rename (write .tmp then rename) with a backup copy of the
 * previous state, so a crash during write cannot corrupt the checkpoint.
 * The output directory path is resolved to absolute at construction time to
 * prevent ENOENT errors from relative path resolution changing.
 */
export declare function createCheckpointWriter(outputDir: string, checkpoint: Checkpoint): CheckpointWriter<CheckpointEntry, Checkpoint>;
