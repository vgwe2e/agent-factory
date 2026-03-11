import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadCheckpoint, saveCheckpoint, getCompletedNames, checkpointPath, CHECKPOINT_FILENAME, } from './checkpoint.js';
describe('checkpoint', () => {
    let tempDir;
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
        const checkpoint = {
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
        assert.equal(loaded.inputFile, '/path/to/ford_hierarchy.json');
    });
    it('getCompletedNames returns Set of all completed L3 names from entries', () => {
        const checkpoint = {
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
