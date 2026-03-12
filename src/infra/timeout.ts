/**
 * Promise timeout wrapper with AbortSignal support.
 *
 * Usage:
 *   const result = await withTimeout(
 *     (signal) => fetch(url, { signal }),
 *     5000
 *   );
 */

export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Race `fn` against a timeout. If the timeout fires first, the returned
 * promise rejects with TimeoutError and the AbortSignal passed to `fn`
 * is aborted so the work can clean up.
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(controller.signal), timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}
