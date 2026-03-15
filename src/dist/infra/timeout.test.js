import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout, TimeoutError } from './timeout.js';
describe('withTimeout', () => {
    it('resolves with fn result when fn completes within timeout', async () => {
        const result = await withTimeout(async () => 'hello', 1000);
        assert.equal(result, 'hello');
    });
    it('rejects with TimeoutError when fn exceeds timeout', async () => {
        const err = await assert.rejects(() => withTimeout(async () => {
            await new Promise((r) => setTimeout(r, 500));
            return 'late';
        }, 50), (e) => {
            assert.ok(e instanceof TimeoutError);
            assert.equal(e.name, 'TimeoutError');
            assert.equal(e.timeoutMs, 50);
            return true;
        });
    });
    it('passes AbortSignal to fn', async () => {
        let receivedSignal;
        await withTimeout(async (signal) => {
            receivedSignal = signal;
        }, 1000);
        assert.ok(receivedSignal instanceof AbortSignal);
        assert.equal(receivedSignal.aborted, false);
    });
    it('aborts the signal when timeout fires', async () => {
        let receivedSignal;
        try {
            await withTimeout(async (signal) => {
                receivedSignal = signal;
                await new Promise((r) => setTimeout(r, 500));
            }, 50);
        }
        catch {
            // expected
        }
        assert.ok(receivedSignal);
        assert.equal(receivedSignal.aborted, true);
    });
    it('TimeoutError includes timeout duration in message', async () => {
        try {
            await withTimeout(async () => {
                await new Promise((r) => setTimeout(r, 500));
            }, 75);
            assert.fail('should have thrown');
        }
        catch (e) {
            assert.ok(e instanceof TimeoutError);
            assert.ok(e.message.includes('75'));
        }
    });
});
