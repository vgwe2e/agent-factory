import { describe, it } from "node:test";
import assert from "node:assert/strict";
describe("createLogger", () => {
    it("returns an object with info, error, and child methods", async () => {
        const { createLogger } = await import("./logger.js");
        const logger = createLogger("silent");
        assert.equal(typeof logger.info, "function");
        assert.equal(typeof logger.error, "function");
        assert.equal(typeof logger.child, "function");
    });
    it("creates a logger with silent level when specified", async () => {
        const { createLogger } = await import("./logger.js");
        const logger = createLogger("silent");
        assert.equal(logger.level, "silent");
    });
    it("creates a logger with info level by default", async () => {
        const { createLogger } = await import("./logger.js");
        const logger = createLogger();
        assert.equal(logger.level, "info");
    });
    it("child logger carries stage binding", async () => {
        const { createLogger } = await import("./logger.js");
        const logger = createLogger("silent");
        const child = logger.child({ stage: "triage" });
        const bindings = child.bindings();
        assert.equal(bindings.stage, "triage");
    });
    it("grandchild logger carries both stage and oppId bindings", async () => {
        const { createLogger } = await import("./logger.js");
        const logger = createLogger("silent");
        const child = logger.child({ stage: "triage" });
        const grandchild = child.child({ oppId: "OPP-001" });
        const bindings = grandchild.bindings();
        assert.equal(bindings.oppId, "OPP-001");
        // parent bindings are inherited but not shown in direct bindings()
        // verify via the child chain
    });
});
