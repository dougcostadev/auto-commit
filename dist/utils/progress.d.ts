export interface ProgressBarOptions {
    width?: number;
    showPercentage?: boolean;
    showCurrentFile?: boolean;
    showStats?: boolean;
}
export declare class VisualProgress {
    private total;
    private current;
    private options;
    private startTime;
    private lastUpdate;
    constructor(total: number, options?: ProgressBarOptions);
    update(increment?: number): void;
    finish(message?: string): void;
    private render;
    private formatTime;
}
export declare class BatchProgress {
    private totalBatches;
    private currentBatchProgress?;
    constructor(totalBatches: number);
    startBatch(batchNumber: number, batchSize: number, batchName: string): VisualProgress;
    finishBatch(message: string): void;
    showBatchSummary(filesProcessed: number, duration: number): void;
}
export declare function createFileTypeIcon(fileType: string): string;
export declare function formatFilePath(filePath: string, maxLength?: number): string;
//# sourceMappingURL=progress.d.ts.map