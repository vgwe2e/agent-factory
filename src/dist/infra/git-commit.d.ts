export interface GitCommitOptions {
    outputDir: string;
    message?: string;
    enabled?: boolean;
}
export interface GitCommitResult {
    committed: boolean;
    error?: string;
}
export declare function autoCommitEvaluation(opts: GitCommitOptions): GitCommitResult;
