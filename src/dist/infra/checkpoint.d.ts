import { z } from 'zod';
export declare const CheckpointEntrySchema: z.ZodObject<{
    l3Name: z.ZodString;
    completedAt: z.ZodString;
    status: z.ZodEnum<["scored", "skipped", "error"]>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "scored" | "skipped";
    l3Name: string;
    completedAt: string;
}, {
    status: "error" | "scored" | "skipped";
    l3Name: string;
    completedAt: string;
}>;
export declare const CheckpointSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    inputFile: z.ZodString;
    startedAt: z.ZodString;
    entries: z.ZodArray<z.ZodObject<{
        l3Name: z.ZodString;
        completedAt: z.ZodString;
        status: z.ZodEnum<["scored", "skipped", "error"]>;
    }, "strip", z.ZodTypeAny, {
        status: "error" | "scored" | "skipped";
        l3Name: string;
        completedAt: string;
    }, {
        status: "error" | "scored" | "skipped";
        l3Name: string;
        completedAt: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entries: {
        status: "error" | "scored" | "skipped";
        l3Name: string;
        completedAt: string;
    }[];
    version: 1;
    inputFile: string;
    startedAt: string;
}, {
    entries: {
        status: "error" | "scored" | "skipped";
        l3Name: string;
        completedAt: string;
    }[];
    version: 1;
    inputFile: string;
    startedAt: string;
}>;
export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type CheckpointEntry = z.infer<typeof CheckpointEntrySchema>;
export declare const CHECKPOINT_FILENAME = ".checkpoint.json";
export declare function checkpointPath(outputDir: string): string;
export declare function loadCheckpoint(outputDir: string): Checkpoint | null;
export declare function saveCheckpoint(outputDir: string, checkpoint: Checkpoint): void;
export declare function getCompletedNames(checkpoint: Checkpoint | null): Set<string>;
