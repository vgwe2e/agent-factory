import { readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootDir = path.resolve(import.meta.dirname, "..");
const tsxCli = require.resolve("tsx/cli");
const testFiles = collectTestFiles(rootDir);

if (testFiles.length === 0) {
  console.error("No source test files found.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [tsxCli, "--test", ...testFiles],
  {
    cwd: rootDir,
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);

function collectTestFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "dist" || entry.name === "node_modules") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}
