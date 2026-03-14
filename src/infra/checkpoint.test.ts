import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadCheckpoint,
  saveCheckpoint,
  getCompletedNames,
  checkpointPath,
  createCheckpointWriter,
  clearCheckpointErrors,
  CHECKPOINT_FILENAME,
  CheckpointV2Schema,
  loadCheckpointForMode,
  getCompletedL4Ids,
  createCheckpointV2Writer,
} from './checkpoint.js';
import type { Checkpoint, CheckpointEntry, CheckpointV2, CheckpointV2Entry } from './checkpoint.js';

describe('checkpoint', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'checkpoint-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loadCheckpoint returns null when no checkpoint file exists', () => {
    const result = loadCheckpoint(tempDir);
    assert.equal(result, null);
  });

  it('saveCheckpoint + loadCheckpoint round-trips checkpoint data correctly', () => {
    const checkpoint: Checkpoint = {
      version: 1,
      inputFile: '/path/to/ford_hierarchy.json',
      startedAt: '2026-03-11T10:00:00Z',
      entries: [
        { l3Name: 'Opportunity A', completedAt: '2026-03-11T10:01:00Z', status: 'scored' },
        { l3Name: 'Opportunity B', completedAt: '2026-03-11T10:02:00Z', status: 'skipped' },
      ],
    };

    saveCheckpoint(tempDir, checkpoint);
    const loaded = loadCheckpoint(tempDir);

    assert.deepEqual(loaded, checkpoint);
    assert.equal(loaded!.inputFile, '/path/to/ford_hierarchy.json');
  });

  it('getCompletedNames excludes errored entries from the completed Set', () => {
    const checkpoint: Checkpoint = {
      version: 1,
      inputFile: '/some/path.json',
      startedAt: '2026-03-11T10:00:00Z',
      entries: [
        { l3Name: 'Alpha', completedAt: '2026-03-11T10:01:00Z', status: 'scored' },
        { l3Name: 'Beta', completedAt: '2026-03-11T10:02:00Z', status: 'error' },
        { l3Name: 'Gamma', completedAt: '2026-03-11T10:03:00Z', status: 'skipped' },
      ],
    };

    const names = getCompletedNames(checkpoint);
    assert.deepEqual(names, new Set(['Alpha', 'Gamma']));
  });

  it('getCompletedNames returns empty Set when checkpoint is null', () => {
    const names = getCompletedNames(null);
    assert.deepEqual(names, new Set());
  });

  it('loadCheckpoint returns null when checkpoint file contains invalid JSON', () => {
    writeFileSync(join(tempDir, CHECKPOINT_FILENAME), '{not valid json!!!');
    const result = loadCheckpoint(tempDir);
    assert.equal(result, null);
  });

  it('loadCheckpoint returns null when checkpoint fails Zod schema validation', () => {
    const invalid = { version: 99, bad: 'data' };
    writeFileSync(join(tempDir, CHECKPOINT_FILENAME), JSON.stringify(invalid));
    const result = loadCheckpoint(tempDir);
    assert.equal(result, null);
  });

  it('checkpointPath returns correct path with .checkpoint.json filename', () => {
    const result = checkpointPath('/output/dir');
    assert.equal(result, join('/output/dir', '.checkpoint.json'));
  });

  it('loadCheckpoint falls back to .bak file when primary is corrupt', () => {
    const checkpoint: Checkpoint = {
      version: 1,
      inputFile: '/test/input.json',
      startedAt: '2026-03-11T10:00:00Z',
      entries: [
        { l3Name: 'Recovered', completedAt: '2026-03-11T10:01:00Z', status: 'scored' },
      ],
    };

    // Write corrupt primary and valid backup
    writeFileSync(join(tempDir, CHECKPOINT_FILENAME), '{corrupt!!!');
    writeFileSync(
      join(tempDir, CHECKPOINT_FILENAME + '.bak'),
      JSON.stringify(checkpoint, null, 2),
    );

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries[0].l3Name, 'Recovered');
  });

  it('loadCheckpoint falls back to .bak file when primary is missing', () => {
    const checkpoint: Checkpoint = {
      version: 1,
      inputFile: '/test/input.json',
      startedAt: '2026-03-11T10:00:00Z',
      entries: [
        { l3Name: 'FromBackup', completedAt: '2026-03-11T10:01:00Z', status: 'scored' },
      ],
    };

    // Only backup exists
    writeFileSync(
      join(tempDir, CHECKPOINT_FILENAME + '.bak'),
      JSON.stringify(checkpoint, null, 2),
    );

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries[0].l3Name, 'FromBackup');
  });
});

describe('createCheckpointWriter', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'checkpoint-writer-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function makeCheckpoint(): Checkpoint {
    return {
      version: 1,
      inputFile: '/test/input.json',
      startedAt: '2026-03-11T10:00:00Z',
      entries: [],
    };
  }

  function makeEntry(name: string, status: CheckpointEntry['status'] = 'scored'): CheckpointEntry {
    return { l3Name: name, completedAt: new Date().toISOString(), status };
  }

  it('enqueue adds entry to in-memory checkpoint', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);
    writer.enqueue(makeEntry('Alpha'));
    assert.equal(writer.checkpoint.entries.length, 1);
    assert.equal(writer.checkpoint.entries[0].l3Name, 'Alpha');
  });

  it('enqueue immediately persists to disk (no debounce)', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);
    writer.enqueue(makeEntry('Alpha'));

    // Should be on disk immediately — no need to wait for debounce
    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 1);
    assert.equal(loaded!.entries[0].l3Name, 'Alpha');
  });

  it('flush writes checkpoint file to disk', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);
    writer.enqueue(makeEntry('Alpha'));
    writer.flush();

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 1);
    assert.equal(loaded!.entries[0].l3Name, 'Alpha');
  });

  it('flush produces valid JSON loadable by loadCheckpoint', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);
    writer.enqueue(makeEntry('A'));
    writer.enqueue(makeEntry('B'));
    writer.enqueue(makeEntry('C', 'error'));
    writer.flush();

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 3);
    assert.equal(loaded!.entries[2].status, 'error');
  });

  it('getCompletedNames works on the live checkpoint reference', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);
    writer.enqueue(makeEntry('Alpha'));
    writer.enqueue(makeEntry('Beta'));

    const names = getCompletedNames(writer.checkpoint);
    assert.deepEqual(names, new Set(['Alpha', 'Beta']));
  });

  it('atomic rename: .checkpoint.json.tmp does not persist after flush', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);
    writer.enqueue(makeEntry('Alpha'));
    writer.flush();

    assert.ok(existsSync(join(tempDir, CHECKPOINT_FILENAME)));
    assert.equal(existsSync(join(tempDir, '.checkpoint.json.tmp')), false);
  });

  it('checkpoint object is shared reference (mutations visible)', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);
    writer.enqueue(makeEntry('Alpha'));
    // The original cp should also see the entry (same reference)
    assert.equal(cp.entries.length, 1);
    assert.equal(cp.entries[0].l3Name, 'Alpha');
  });

  it('creates backup copy on each write', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);

    // First enqueue — no backup yet (nothing to back up)
    writer.enqueue(makeEntry('Alpha'));

    // Second enqueue — should create backup of the previous state
    writer.enqueue(makeEntry('Beta'));

    const bakPath = join(tempDir, CHECKPOINT_FILENAME + '.bak');
    assert.ok(existsSync(bakPath), 'backup file should exist after second write');

    // Backup should contain the state from before the second write
    const bakRaw = readFileSync(bakPath, 'utf-8');
    const bakData = JSON.parse(bakRaw);
    assert.equal(bakData.entries.length, 1, 'backup should have 1 entry (before second enqueue)');
    assert.equal(bakData.entries[0].l3Name, 'Alpha');
  });

  it('survives output directory deletion and recreates it', () => {
    const cp = makeCheckpoint();
    const subDir = join(tempDir, 'nested', 'output');
    const writer = createCheckpointWriter(subDir, cp);

    writer.enqueue(makeEntry('Alpha'));
    assert.ok(existsSync(join(subDir, CHECKPOINT_FILENAME)));

    // Delete the output directory (simulating accidental deletion)
    rmSync(subDir, { recursive: true, force: true });
    assert.ok(!existsSync(subDir));

    // Enqueue should recreate the directory and write successfully
    writer.enqueue(makeEntry('Beta'));
    assert.ok(existsSync(join(subDir, CHECKPOINT_FILENAME)));

    const loaded = loadCheckpoint(subDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 2);
  });

  it('installSignalHandlers returns a cleanup function', () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);
    const cleanup = writer.installSignalHandlers();
    assert.equal(typeof cleanup, 'function');
    // Clean up immediately to avoid affecting other tests
    cleanup();
  });
});

describe('clearCheckpointErrors', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'checkpoint-clear-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function makeCheckpointWith(entries: CheckpointEntry[]): Checkpoint {
    return {
      version: 1,
      inputFile: '/test/input.json',
      startedAt: '2026-03-11T10:00:00Z',
      entries,
    };
  }

  function entry(name: string, status: CheckpointEntry['status']): CheckpointEntry {
    return { l3Name: name, completedAt: '2026-03-11T10:01:00Z', status };
  }

  it('returns count of cleared error entries and removes them from checkpoint', () => {
    const cp = makeCheckpointWith([
      entry('Alpha', 'scored'),
      entry('Beta', 'scored'),
      entry('Gamma', 'error'),
    ]);
    saveCheckpoint(tempDir, cp);

    const cleared = clearCheckpointErrors(tempDir);
    assert.equal(cleared, 1);

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 2);
  });

  it('returns 0 when there are no error entries', () => {
    const cp = makeCheckpointWith([
      entry('Alpha', 'scored'),
      entry('Beta', 'skipped'),
    ]);
    saveCheckpoint(tempDir, cp);

    const cleared = clearCheckpointErrors(tempDir);
    assert.equal(cleared, 0);

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 2);
  });

  it('returns N and leaves 0 entries when all entries are errors', () => {
    const cp = makeCheckpointWith([
      entry('Alpha', 'error'),
      entry('Beta', 'error'),
      entry('Gamma', 'error'),
    ]);
    saveCheckpoint(tempDir, cp);

    const cleared = clearCheckpointErrors(tempDir);
    assert.equal(cleared, 3);

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 0);
  });

  it('returns 0 when no checkpoint file exists', () => {
    const cleared = clearCheckpointErrors(tempDir);
    assert.equal(cleared, 0);
  });

  it('preserves scored and skipped entries exactly (l3Name, completedAt, status)', () => {
    const scored = entry('Alpha', 'scored');
    const skipped = entry('Beta', 'skipped');
    const errored = entry('Gamma', 'error');
    const cp = makeCheckpointWith([scored, errored, skipped]);
    saveCheckpoint(tempDir, cp);

    clearCheckpointErrors(tempDir);

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.deepEqual(loaded!.entries, [scored, skipped]);
  });

  it('getCompletedNames excludes previously-errored names after clearing', () => {
    const cp = makeCheckpointWith([
      entry('Alpha', 'scored'),
      entry('Beta', 'error'),
      entry('Gamma', 'skipped'),
    ]);
    saveCheckpoint(tempDir, cp);

    clearCheckpointErrors(tempDir);

    const reloaded = loadCheckpoint(tempDir);
    const names = getCompletedNames(reloaded);
    assert.deepEqual(names, new Set(['Alpha', 'Gamma']));
    assert.ok(!names.has('Beta'));
  });

  it('persists changes to disk (loadCheckpoint after returns filtered entries)', () => {
    const cp = makeCheckpointWith([
      entry('Alpha', 'scored'),
      entry('Beta', 'error'),
    ]);
    saveCheckpoint(tempDir, cp);

    clearCheckpointErrors(tempDir);

    // Verify disk state independently
    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 1);
    assert.equal(loaded!.entries[0].l3Name, 'Alpha');
    assert.equal(loaded!.entries[0].status, 'scored');
  });
});

// ---------------------------------------------------------------------------
// Checkpoint V2 tests
// ---------------------------------------------------------------------------

describe('CheckpointV2Schema', () => {
  it('validates a correct V2 checkpoint', () => {
    const valid = {
      version: 2,
      scoringMode: 'two-pass',
      inputFile: '/path/to/export.json',
      startedAt: '2026-03-14T00:00:00Z',
      entries: [
        { l4Id: 'l4-001', completedAt: '2026-03-14T00:01:00Z', status: 'scored' },
      ],
    };
    const result = CheckpointV2Schema.safeParse(valid);
    assert.ok(result.success, 'valid V2 checkpoint should parse');
  });

  it('rejects V2 checkpoint with missing l4Id', () => {
    const invalid = {
      version: 2,
      scoringMode: 'two-pass',
      inputFile: '/path/to/export.json',
      startedAt: '2026-03-14T00:00:00Z',
      entries: [
        { completedAt: '2026-03-14T00:01:00Z', status: 'scored' },
      ],
    };
    const result = CheckpointV2Schema.safeParse(invalid);
    assert.ok(!result.success, 'missing l4Id should fail');
  });

  it('rejects checkpoint with wrong version', () => {
    const invalid = {
      version: 1,
      scoringMode: 'two-pass',
      inputFile: '/path/to/export.json',
      startedAt: '2026-03-14T00:00:00Z',
      entries: [],
    };
    const result = CheckpointV2Schema.safeParse(invalid);
    assert.ok(!result.success, 'version 1 should not parse as V2');
  });
});

describe('loadCheckpointForMode', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'checkpoint-mode-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function writeV1(dir: string): void {
    const cp: Checkpoint = {
      version: 1,
      inputFile: '/test/input.json',
      startedAt: '2026-03-14T00:00:00Z',
      entries: [
        { l3Name: 'Opp-A', completedAt: '2026-03-14T00:01:00Z', status: 'scored' },
      ],
    };
    writeFileSync(join(dir, CHECKPOINT_FILENAME), JSON.stringify(cp, null, 2));
  }

  function writeV2(dir: string): void {
    const cp = {
      version: 2,
      scoringMode: 'two-pass',
      inputFile: '/test/input.json',
      startedAt: '2026-03-14T00:00:00Z',
      entries: [
        { l4Id: 'l4-001', completedAt: '2026-03-14T00:01:00Z', status: 'scored' },
      ],
    };
    writeFileSync(join(dir, CHECKPOINT_FILENAME), JSON.stringify(cp, null, 2));
  }

  it('returns null with backedUp=false when no checkpoint exists', () => {
    const result = loadCheckpointForMode(tempDir, 'two-pass');
    assert.equal(result.checkpoint, null);
    assert.equal(result.backedUp, false);
  });

  it('backs up V1 as .checkpoint.v12.bak when mode is two-pass', () => {
    writeV1(tempDir);
    const result = loadCheckpointForMode(tempDir, 'two-pass');
    assert.equal(result.checkpoint, null);
    assert.equal(result.backedUp, true);
    assert.ok(existsSync(join(tempDir, '.checkpoint.v12.bak')), 'backup file should exist');
  });

  it('returns V2 checkpoint when mode is two-pass and V2 on disk', () => {
    writeV2(tempDir);
    const result = loadCheckpointForMode(tempDir, 'two-pass');
    assert.ok(result.checkpoint, 'should return V2 checkpoint');
    assert.equal((result.checkpoint as CheckpointV2).version, 2);
    assert.equal(result.backedUp, false);
  });

  it('returns V1 checkpoint when mode is three-lens and V1 on disk', () => {
    writeV1(tempDir);
    const result = loadCheckpointForMode(tempDir, 'three-lens');
    assert.ok(result.checkpoint, 'should return V1 checkpoint');
    assert.equal((result.checkpoint as Checkpoint).version, 1);
    assert.equal(result.backedUp, false);
  });

  it('returns null when mode is three-lens and V2 on disk (incompatible)', () => {
    writeV2(tempDir);
    const result = loadCheckpointForMode(tempDir, 'three-lens');
    assert.equal(result.checkpoint, null);
    assert.equal(result.backedUp, false);
  });
});

describe('getCompletedL4Ids', () => {
  it('returns set of l4Ids excluding errors', () => {
    const cp: CheckpointV2 = {
      version: 2,
      scoringMode: 'two-pass',
      inputFile: '/test/input.json',
      startedAt: '2026-03-14T00:00:00Z',
      entries: [
        { l4Id: 'l4-001', completedAt: '2026-03-14T00:01:00Z', status: 'scored' },
        { l4Id: 'l4-002', completedAt: '2026-03-14T00:02:00Z', status: 'error' },
        { l4Id: 'l4-003', completedAt: '2026-03-14T00:03:00Z', status: 'scored' },
      ],
    };
    const ids = getCompletedL4Ids(cp);
    assert.deepEqual(ids, new Set(['l4-001', 'l4-003']));
  });

  it('returns empty set when checkpoint is null', () => {
    const ids = getCompletedL4Ids(null);
    assert.deepEqual(ids, new Set());
  });
});

describe('createCheckpointV2Writer', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'checkpoint-v2-writer-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function makeV2Checkpoint(): CheckpointV2 {
    return {
      version: 2,
      scoringMode: 'two-pass',
      inputFile: '/test/input.json',
      startedAt: '2026-03-14T00:00:00Z',
      entries: [],
    };
  }

  it('enqueue adds V2 entry and persists to disk', () => {
    const cp = makeV2Checkpoint();
    const writer = createCheckpointV2Writer(tempDir, cp);
    writer.enqueue({ l4Id: 'l4-001', completedAt: '2026-03-14T00:01:00Z', status: 'scored' });

    assert.equal(writer.checkpoint.entries.length, 1);

    // Verify on disk
    const raw = JSON.parse(readFileSync(join(tempDir, CHECKPOINT_FILENAME), 'utf-8'));
    assert.equal(raw.version, 2);
    assert.equal(raw.entries.length, 1);
    assert.equal(raw.entries[0].l4Id, 'l4-001');
  });

  it('flush writes checkpoint to disk', () => {
    const cp = makeV2Checkpoint();
    const writer = createCheckpointV2Writer(tempDir, cp);
    writer.enqueue({ l4Id: 'l4-001', completedAt: '2026-03-14T00:01:00Z', status: 'scored' });
    writer.flush();

    const raw = JSON.parse(readFileSync(join(tempDir, CHECKPOINT_FILENAME), 'utf-8'));
    assert.equal(raw.version, 2);
    assert.equal(raw.entries.length, 1);
  });
});
