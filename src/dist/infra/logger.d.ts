/**
 * Structured logger factory using pino.
 *
 * Creates pino loggers with ISO timestamps and service name binding.
 * Supports child loggers with stage/oppId bindings for pipeline tracing.
 */
import pino from "pino";
export type Logger = pino.Logger;
/**
 * Create a pino logger instance.
 *
 * @param level - Log level (default: "info"). Use "silent" in tests.
 * @returns Configured pino Logger
 */
export declare function createLogger(level?: string): Logger;
