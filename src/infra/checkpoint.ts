import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const CheckpointEntrySchema = z.object({
  l3Name: z.string(),
  completedAt: z.string(),
  status: z.enum(['scored', 'skipped', 'error']),
});

export const CheckpointSchema = z.object({
  version: z.literal(1),
  inputFile: z.string(),
  startedAt: z.string(),
  entries: z.array(CheckpointEntrySchema),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type CheckpointEntry = z.infer<typeof CheckpointEntrySchema>;

export const CHECKPOINT_FILENAME = '.checkpoint.json';

export function checkpointPath(outputDir: string): string {
  return join(outputDir, CHECKPOINT_FILENAME);
}

export function loadCheckpoint(outputDir: string): Checkpoint | null {
  const filePath = checkpointPath(outputDir);
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const result = CheckpointSchema.safeParse(parsed);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

export function saveCheckpoint(outputDir: string, checkpoint: Checkpoint): void {
  mkdirSync(outputDir, { recursive: true });
  const filePath = checkpointPath(outputDir);
  writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf-8');
}

export function getCompletedNames(checkpoint: Checkpoint | null): Set<string> {
  if (!checkpoint) return new Set();
  return new Set(checkpoint.entries.map((e) => e.l3Name));
}
