/**
 * Structured logger factory using pino.
 *
 * Creates pino loggers with ISO timestamps and service name binding.
 * Supports child loggers with stage/oppId bindings for pipeline tracing.
 */
import pino from "pino";
/**
 * Create a pino logger instance.
 *
 * @param level - Log level (default: "info"). Use "silent" in tests.
 * @returns Configured pino Logger
 */
export function createLogger(level = "info") {
    return pino({
        level,
        base: { service: "aera-evaluate" },
        timestamp: pino.stdTimeFunctions.isoTime,
    });
}
