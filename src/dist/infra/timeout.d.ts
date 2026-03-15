/**
 * Promise timeout wrapper with AbortSignal support.
 *
 * Usage:
 *   const result = await withTimeout(
 *     (signal) => fetch(url, { signal }),
 *     5000
 *   );
 */
export declare class TimeoutError extends Error {
    readonly timeoutMs: number;
    constructor(timeoutMs: number);
}
/**
 * Race `fn` against a timeout. If the timeout fires first, the returned
 * promise rejects with TimeoutError and the AbortSignal passed to `fn`
 * is aborted so the work can clean up.
 */
export declare function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T>;
