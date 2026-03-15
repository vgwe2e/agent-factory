import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Semaphore } from './semaphore.js';
describe('Semaphore', () => {
    it('run() resolves with the return value of fn', async () => {
        const sem = new Semaphore(1);
        const result = await sem.run(async () => 42);
        assert.equal(result, 42);
    });
    it('run() rejects with fn error after releasing the slot', async () => {
        const sem = new Semaphore(1);
        await assert.rejects(() => sem.run(async () => { throw new Error('boom'); }), { message: 'boom' });
        // Slot should be released - next run should work
        const result = await sem.run(async () => 'ok');
        assert.equal(result, 'ok');
    });
    it('limits concurrency to N', async () => {
        const sem = new Semaphore(2);
        let running = 0;
        let maxRunning = 0;
        const task = () => sem.run(async () => {
            running++;
            maxRunning = Math.max(maxRunning, running);
            await new Promise((r) => setTimeout(r, 50));
            running--;
        });
        await Promise.all([task(), task(), task(), task(), task()]);
        assert.equal(maxRunning, 2);
    });
    it('queues tasks when all slots are taken', async () => {
        const sem = new Semaphore(1);
        const order = [];
        const task1 = sem.run(async () => {
            await new Promise((r) => setTimeout(r, 50));
            order.push(1);
        });
        const task2 = sem.run(async () => {
            order.push(2);
        });
        const task3 = sem.run(async () => {
            order.push(3);
        });
        await Promise.all([task1, task2, task3]);
        assert.deepEqual(order, [1, 2, 3]);
    });
    it('acquire and release work independently', async () => {
        const sem = new Semaphore(1);
        await sem.acquire();
        // Slot is taken - start a second acquire that should queue
        let acquired = false;
        const p = sem.acquire().then(() => { acquired = true; });
        // Give microtask queue a chance
        await new Promise((r) => setTimeout(r, 10));
        assert.equal(acquired, false, 'second acquire should be queued');
        sem.release();
        await p;
        assert.equal(acquired, true, 'second acquire should resolve after release');
        sem.release();
    });
});
