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
  CHECKPOINT_FILENAME,
} from './checkpoint.js';
import type { Checkpoint, CheckpointEntry } from './checkpoint.js';

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

  it('getCompletedNames returns Set of all completed L3 names from entries', () => {
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
    assert.deepEqual(names, new Set(['Alpha', 'Beta', 'Gamma']));
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

  it('multiple rapid enqueue calls coalesce into fewer writes (debounce)', async () => {
    const cp = makeCheckpoint();
    const writer = createCheckpointWriter(tempDir, cp);

    // Enqueue 5 entries rapidly - should coalesce into one debounced write
    for (let i = 0; i < 5; i++) {
      writer.enqueue(makeEntry(`Item${i}`));
    }

    // No file yet (debounce hasn't fired)
    // Wait for debounce to fire (100ms + buffer)
    await new Promise((r) => setTimeout(r, 200));

    const loaded = loadCheckpoint(tempDir);
    assert.ok(loaded);
    assert.equal(loaded!.entries.length, 5);
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
});
