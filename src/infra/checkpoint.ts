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

// ---------------------------------------------------------------------------
// Checkpoint V2 schema (two-pass mode: keyed by L4 ID)
// ---------------------------------------------------------------------------

export const CheckpointV2EntrySchema = z.object({
  l4Id: z.string(),
  completedAt: z.string(),
  status: z.enum(['scored', 'error']),
});

export const CheckpointV2Schema = z.object({
  version: z.literal(2),
  scoringMode: z.literal('two-pass'),
  inputFile: z.string(),
  startedAt: z.string(),
  entries: z.array(CheckpointV2EntrySchema),
});

export type CheckpointV2 = z.infer<typeof CheckpointV2Schema>;
export type CheckpointV2Entry = z.infer<typeof CheckpointV2EntrySchema>;

export const CHECKPOINT_FILENAME = '.checkpoint.json';
const V12_BACKUP_FILENAME = '.checkpoint.v12.bak';
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
// Mode-aware checkpoint loading (V1 for three-lens, V2 for two-pass)
// ---------------------------------------------------------------------------

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
export function loadCheckpointForMode(
  outputDir: string,
  scoringMode: 'two-pass' | 'three-lens',
): CheckpointForModeResult {
  const filePath = checkpointPath(outputDir);
  if (!existsSync(filePath)) {
    return { checkpoint: null, backedUp: false };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return { checkpoint: null, backedUp: false };
  }

  // Try V2 first
  const v2Result = CheckpointV2Schema.safeParse(raw);
  if (v2Result.success) {
    if (scoringMode === 'two-pass') {
      return { checkpoint: v2Result.data, backedUp: false };
    }
    // three-lens mode with V2 on disk: incompatible, start fresh
    return { checkpoint: null, backedUp: false };
  }

  // Try V1
  const v1Result = CheckpointSchema.safeParse(raw);
  if (v1Result.success) {
    if (scoringMode === 'three-lens') {
      return { checkpoint: v1Result.data, backedUp: false };
    }
    // two-pass mode with V1 on disk: back up and start fresh
    try {
      copyFileSync(filePath, join(outputDir, V12_BACKUP_FILENAME));
    } catch {
      // Non-fatal: backup is best-effort
    }
    return { checkpoint: null, backedUp: true };
  }

  // Neither V1 nor V2 -- corrupt/unknown, start fresh
  return { checkpoint: null, backedUp: false };
}

/**
 * Get completed L4 IDs from a V2 checkpoint (excludes error entries).
 */
export function getCompletedL4Ids(checkpoint: CheckpointV2 | null): Set<string> {
  if (!checkpoint) return new Set();
  return new Set(
    checkpoint.entries
      .filter((e) => e.status !== 'error')
      .map((e) => e.l4Id),
  );
}

/**
 * Create a durable checkpoint writer for V2 (two-pass) checkpoints.
 * Same atomic write pattern as V1 writer, but accepts CheckpointV2Entry objects.
 */
export function createCheckpointV2Writer(
  outputDir: string,
  checkpoint: CheckpointV2,
): CheckpointWriter {
  const resolvedDir = resolve(outputDir);

  function atomicWrite(): void {
    try {
      mkdirSync(resolvedDir, { recursive: true });
      const target = checkpointPath(resolvedDir);
      const tmp = target + TMP_SUFFIX;
      const bak = target + BACKUP_SUFFIX;

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
      try {
        mkdirSync(resolvedDir, { recursive: true });
        writeFileSync(
          checkpointPath(resolvedDir),
          JSON.stringify(checkpoint, null, 2),
          'utf-8',
        );
      } catch {
        console.error('[checkpoint] CRITICAL: Failed to persist V2 checkpoint to disk');
      }
    }
  }

  function enqueue(entry: CheckpointV2Entry): void {
    checkpoint.entries.push(entry);
    atomicWrite();
  }

  function flush(): void {
    atomicWrite();
  }

  function installSignalHandlers(): () => void {
    const handler = (signal: string) => {
      console.error(`[checkpoint] Received ${signal}, flushing V2 checkpoint...`);
      flush();
      process.removeListener('SIGINT', sigintHandler);
      process.removeListener('SIGTERM', sigtermHandler);
      process.kill(process.pid, signal);
    };

    const sigintHandler = () => handler('SIGINT');
    const sigtermHandler = () => handler('SIGTERM');

    const uncaughtHandler = (err: Error) => {
      console.error(`[checkpoint] Uncaught exception, flushing V2 checkpoint: ${err.message}`);
      flush();
    };
    const unhandledHandler = (_reason: unknown) => {
      console.error('[checkpoint] Unhandled rejection, flushing V2 checkpoint');
      flush();
    };

    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigtermHandler);
    process.on('uncaughtException', uncaughtHandler);
    process.on('unhandledRejection', unhandledHandler);

    return () => {
      process.removeListener('SIGINT', sigintHandler);
      process.removeListener('SIGTERM', sigtermHandler);
      process.removeListener('uncaughtException', uncaughtHandler);
      process.removeListener('unhandledRejection', unhandledHandler);
    };
  }

  // Cast enqueue to accept CheckpointEntry for interface compat -- callers
  // use CheckpointV2Entry in practice, but the interface type is shared.
  return {
    enqueue: enqueue as unknown as (entry: CheckpointEntry) => void,
    flush,
    checkpoint: checkpoint as unknown as Checkpoint,
    installSignalHandlers,
  };
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
