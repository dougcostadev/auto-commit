export interface DACConfig {
    version: string;
    batchSizes: Record<FileType, number>;
    excludePatterns: string[];
    commitMessage: {
        template: string;
        useConventional: boolean;
    };
    processing: {
        parallel: boolean;
        maxConcurrency: number;
        retryFailedPushes: boolean;
        skipLargeFiles: boolean;
        maxFileSize: number;
    };
    fileTypes: Record<FileType, FileTypeConfig>;
}
export interface FileTypeConfig {
    name: string;
    description: string;
    extensions: string[];
    patterns: string[];
    batchSize: number;
    icon: string;
}
export type FileType = 'binary' | 'media' | 'assets' | 'archives' | 'source' | 'web' | 'mobile' | 'database' | 'config' | 'docs' | 'data' | 'system' | 'misc';
export interface FileAnalysis {
    path: string;
    type: FileType;
    size: number;
    extension: string;
    isLarge: boolean;
}
export interface RepositoryStats {
    totalFiles: number;
    filesByType: Record<FileType, number>;
    totalSize: number;
    averageFileSize: number;
    largestCategory: FileType;
    repositoryType: string;
    estimatedProcessingTime: number;
}
export interface ProcessingResult {
    success: boolean;
    filesProcessed: number;
    commitCount: number;
    errors: string[];
    duration: number;
    statistics: RepositoryStats;
}
export interface CommandOptions {
    force?: boolean;
    config?: string;
    dryRun?: boolean;
    batchSize?: number;
    type?: string[];
    skipAnalysis?: boolean;
    quiet?: boolean;
    detailed?: boolean;
    history?: boolean;
    set?: string;
    get?: string;
    list?: boolean;
    reset?: boolean;
}
//# sourceMappingURL=index.d.ts.map