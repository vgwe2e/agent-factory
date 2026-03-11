import { execSync } from 'node:child_process';

export interface GitCommitOptions {
  outputDir: string;
  message?: string;
  enabled?: boolean;
}

export interface GitCommitResult {
  committed: boolean;
  error?: string;
}

export function autoCommitEvaluation(opts: GitCommitOptions): GitCommitResult {
  if (opts.enabled === false) {
    return { committed: false };
  }

  try {
    // Verify we are inside a git repo
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: opts.outputDir,
      stdio: 'pipe',
    });

    // Stage the output directory
    execSync(`git add "${opts.outputDir}"`, {
      cwd: opts.outputDir,
      stdio: 'pipe',
    });

    // Check for staged changes (exit code 1 means changes exist)
    try {
      execSync('git diff --cached --quiet', {
        cwd: opts.outputDir,
        stdio: 'pipe',
      });
      // If command succeeds (exit 0), no staged changes
      return { committed: false };
    } catch {
      // exit code 1 = there are staged changes, continue to commit
    }

    // Build commit message
    const message =
      opts.message ??
      `chore(eval): auto-commit evaluation artifacts ${new Date().toISOString()}`;

    execSync(`git commit -m "${message}"`, {
      cwd: opts.outputDir,
      stdio: 'pipe',
    });

    return { committed: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { committed: false, error: errorMessage };
  }
}
