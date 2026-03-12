/**
 * Counting semaphore for bounding concurrency.
 *
 * Usage:
 *   const sem = new Semaphore(3);
 *   const result = await sem.run(async () => callLLM(prompt));
 */
export class Semaphore {
  private running = 0;
  private readonly max: number;
  private readonly queue: Array<() => void> = [];

  constructor(maxConcurrency: number) {
    if (maxConcurrency < 1) throw new RangeError('maxConcurrency must be >= 1');
    this.max = maxConcurrency;
  }

  /** Acquire a slot. Resolves immediately if a slot is free, queues otherwise. */
  acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  /** Release a slot and unblock the next queued acquire, if any. */
  release(): void {
    const next = this.queue.shift();
    if (next) {
      // Hand the slot directly to the next waiter (running count stays the same)
      next();
    } else {
      this.running--;
    }
  }

  /** Acquire, run fn, release — even if fn throws. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
