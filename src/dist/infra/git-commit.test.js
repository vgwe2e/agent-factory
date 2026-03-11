import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { autoCommitEvaluation } from './git-commit.js';
describe('git-commit', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'git-commit-test-'));
    });
    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });
    it('returns committed=false when enabled=false', () => {
        const result = autoCommitEvaluation({ outputDir: tempDir, enabled: false });
        assert.equal(result.committed, false);
        assert.equal(result.error, undefined);
    });
    it('returns committed=true after staging and committing files in a test git repo', () => {
        // Initialize a git repo
        execSync('git init', { cwd: tempDir, stdio: 'pipe' });
        execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
        execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });
        // Create an initial commit so HEAD exists
        writeFileSync(join(tempDir, 'init.txt'), 'init');
        execSync('git add . && git commit -m "init"', { cwd: tempDir, stdio: 'pipe' });
        // Create output subdirectory with a file
        const outputDir = join(tempDir, 'output');
        mkdirSync(outputDir);
        writeFileSync(join(outputDir, 'report.json'), '{"result":"ok"}');
        const result = autoCommitEvaluation({ outputDir });
        assert.equal(result.committed, true);
        assert.equal(result.error, undefined);
    });
    it('returns committed=false with no error when there are no staged changes', () => {
        // Initialize a git repo with all files already committed
        execSync('git init', { cwd: tempDir, stdio: 'pipe' });
        execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
        execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });
        writeFileSync(join(tempDir, 'init.txt'), 'init');
        execSync('git add . && git commit -m "init"', { cwd: tempDir, stdio: 'pipe' });
        // outputDir is the repo root -- no new files
        const result = autoCommitEvaluation({ outputDir: tempDir });
        assert.equal(result.committed, false);
        assert.equal(result.error, undefined);
    });
    it('returns committed=false with error string when not inside a git repo', () => {
        // tempDir is NOT a git repo
        writeFileSync(join(tempDir, 'file.txt'), 'data');
        const result = autoCommitEvaluation({ outputDir: tempDir });
        assert.equal(result.committed, false);
        assert.equal(typeof result.error, 'string');
    });
    it('uses custom message when provided', () => {
        execSync('git init', { cwd: tempDir, stdio: 'pipe' });
        execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
        execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });
        writeFileSync(join(tempDir, 'init.txt'), 'init');
        execSync('git add . && git commit -m "init"', { cwd: tempDir, stdio: 'pipe' });
        const outputDir = join(tempDir, 'eval');
        mkdirSync(outputDir);
        writeFileSync(join(outputDir, 'data.json'), '{}');
        const customMsg = 'chore: custom evaluation commit';
        const result = autoCommitEvaluation({ outputDir, message: customMsg });
        assert.equal(result.committed, true);
        // Verify the commit message
        const log = execSync('git log -1 --format=%s', { cwd: tempDir, encoding: 'utf-8' }).trim();
        assert.equal(log, customMsg);
    });
});
