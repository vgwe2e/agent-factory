/**
 * Counting semaphore for bounding concurrency.
 *
 * Usage:
 *   const sem = new Semaphore(3);
 *   const result = await sem.run(async () => callLLM(prompt));
 */
export declare class Semaphore {
    private running;
    private readonly max;
    private readonly queue;
    constructor(maxConcurrency: number);
    /** Acquire a slot. Resolves immediately if a slot is free, queues otherwise. */
    acquire(): Promise<void>;
    /** Release a slot and unblock the next queued acquire, if any. */
    release(): void;
    /** Acquire, run fn, release — even if fn throws. */
    run<T>(fn: () => Promise<T>): Promise<T>;
}
