import { SimpleGit } from 'simple-git';
export interface RepositoryInfo {
    name: string;
    branch: string;
    remotes: string[];
    isClean: boolean;
    untrackedFiles: number;
}
export declare function getGit(): SimpleGit;
export declare function checkGitRepository(): Promise<boolean>;
export declare function getRepositoryInfo(): Promise<RepositoryInfo>;
export declare function getUntrackedFiles(): Promise<string[]>;
export declare function addFiles(files: string[], onProgress?: (processed: number, total: number) => void): Promise<void>;
export declare function createCommit(message: string): Promise<string>;
export declare function pullFromRemote(): Promise<void>;
export declare function pushToRemote(remote?: string, branch?: string): Promise<void>;
export declare function isGitLockActive(): Promise<boolean>;
export declare function removeGitLock(): Promise<void>;
//# sourceMappingURL=git.d.ts.map