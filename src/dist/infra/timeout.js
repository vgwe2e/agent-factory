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
    timeoutMs;
    constructor(timeoutMs) {
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
export async function withTimeout(fn, timeoutMs) {
    const controller = new AbortController();
    let timer;
    const timeoutError = new TimeoutError(timeoutMs);
    const timeoutPromise = new Promise((_resolve, reject) => {
        timer = setTimeout(() => {
            controller.abort(timeoutError);
            reject(timeoutError);
        }, timeoutMs);
    });
    try {
        const result = await Promise.race([fn(controller.signal), timeoutPromise]);
        return result;
    }
    finally {
        clearTimeout(timer);
    }
}
