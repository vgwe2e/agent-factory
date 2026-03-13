import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';

export const CheckpointEntrySchema = z.object({
  /** Skill ID (or l3Name for backward compat with older checkpoints). */
  skillId: z.string().optional(),
  l3Name: z.string().optional(),
  completedAt: z.string(),
  status: z.enum(['scored', 'skipped', 'error']),
}).refine(data => data.skillId || data.l3Name, { message: "Either skillId or l3Name must be present" });

export const CheckpointSchema = z.object({
  version: z.literal(1),
  inputFile: z.string(),
  startedAt: z.string(),
  entries: z.array(CheckpointEntrySchema),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type CheckpointEntry = z.infer<typeof CheckpointEntrySchema>;

export const CHECKPOINT_FILENAME = '.checkpoint.json';
const BACKUP_SUFFIX = '.bak';
const TMP_SUFFIX = '.tmp';

export function checkpointPath(outputDir: string): string {
  return join(outputDir, CHECKPOINT_FILENAME);
}

/**
 * Load a checkpoint from disk with validation. Tries the primary file first,
 * then falls back to the backup copy if the primary is missing or corrupt.
 */
export function loadCheckpoint(outputDir: string): Checkpoint | null {
  const filePath = checkpointPath(outputDir);

  // Try primary file
  const primary = tryLoadFrom(filePath);
  if (primary) return primary;

  // Try backup file
  const backup = tryLoadFrom(filePath + BACKUP_SUFFIX);
  if (backup) return backup;

  return null;
}

function tryLoadFrom(filePath: string): Checkpoint | null {
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
  return new Set(
    checkpoint.entries
      .filter((e) => e.status !== 'error')
      .map((e) => e.skillId ?? e.l3Name ?? ""),
  );
}

/**
 * Remove all error entries from the checkpoint file on disk.
 * Returns the number of entries cleared (0 if no checkpoint or no errors).
 */
export function clearCheckpointErrors(outputDir: string): number {
  const checkpoint = loadCheckpoint(outputDir);
  if (!checkpoint) return 0;

  const before = checkpoint.entries.length;
  checkpoint.entries = checkpoint.entries.filter(e => e.status !== 'error');
  const cleared = before - checkpoint.entries.length;

  if (cleared > 0) {
    saveCheckpoint(outputDir, checkpoint);
  }
  return cleared;
}

// ---------------------------------------------------------------------------
// Durable checkpoint writer
// ---------------------------------------------------------------------------

export interface CheckpointWriter {
  /** Add an entry and immediately persist to disk. */
  enqueue: (entry: CheckpointEntry) => void;
  /** Force an immediate write (call at pipeline end or signal handler). */
  flush: () => void;
  /** Live checkpoint reference — mutations from enqueue are visible here. */
  checkpoint: Checkpoint;
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
export function createCheckpointWriter(
  outputDir: string,
  checkpoint: Checkpoint,
): CheckpointWriter {
  // Resolve to absolute path once at construction to prevent ENOENT from
  // relative path resolution issues during long-running pipelines.
  const resolvedDir = resolve(outputDir);

  function atomicWrite(): void {
    try {
      mkdirSync(resolvedDir, { recursive: true });
      const target = checkpointPath(resolvedDir);
      const tmp = target + TMP_SUFFIX;
      const bak = target + BACKUP_SUFFIX;

      // Back up current checkpoint before overwriting, so crash-during-write
      // doesn't destroy the previous good state.
      if (existsSync(target)) {
        try {
          copyFileSync(target, bak);
        } catch {
          // Non-fatal: backup is best-effort
        }
      }

      writeFileSync(tmp, JSON.stringify(checkpoint, null, 2), 'utf-8');
      renameSync(tmp, target);
    } catch {
      // Fallback: write directly if atomic rename fails
      try {
        mkdirSync(resolvedDir, { recursive: true });
        writeFileSync(
          checkpointPath(resolvedDir),
          JSON.stringify(checkpoint, null, 2),
          'utf-8',
        );
      } catch {
        // Last resort: log to stderr so the operator knows
        console.error('[checkpoint] CRITICAL: Failed to persist checkpoint to disk');
      }
    }
  }

  function enqueue(entry: CheckpointEntry): void {
    checkpoint.entries.push(entry);
    // Write immediately — scored results are too valuable to risk losing.
    atomicWrite();
  }

  function flush(): void {
    atomicWrite();
  }

  function installSignalHandlers(): () => void {
    const handler = (signal: string) => {
      console.error(`[checkpoint] Received ${signal}, flushing checkpoint...`);
      flush();
      // Re-raise the signal after flushing so the process exits with the
      // correct exit code. Remove our handler first to avoid infinite loop.
      process.removeListener('SIGINT', sigintHandler);
      process.removeListener('SIGTERM', sigtermHandler);
      process.kill(process.pid, signal);
    };

    const sigintHandler = () => handler('SIGINT');
    const sigtermHandler = () => handler('SIGTERM');

    // Flush on uncaught exceptions/rejections before the process crashes.
    // Unlike SIGINT/SIGTERM, we don't re-raise — Node.js will exit after
    // the handler runs. The goal is just to save scored results.
    const uncaughtHandler = (err: Error) => {
      console.error(`[checkpoint] Uncaught exception, flushing checkpoint: ${err.message}`);
      flush();
    };
    const unhandledHandler = (_reason: unknown) => {
      console.error('[checkpoint] Unhandled rejection, flushing checkpoint');
      flush();
    };

    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigtermHandler);
    process.on('uncaughtException', uncaughtHandler);
    process.on('unhandledRejection', unhandledHandler);

    // Return cleanup function to remove handlers (useful in tests)
    return () => {
      process.removeListener('SIGINT', sigintHandler);
      process.removeListener('SIGTERM', sigtermHandler);
      process.removeListener('uncaughtException', uncaughtHandler);
      process.removeListener('unhandledRejection', unhandledHandler);
    };
  }

  return { enqueue, flush, checkpoint, installSignalHandlers };
}
