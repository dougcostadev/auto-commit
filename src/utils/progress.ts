import chalk from 'chalk';

export interface ProgressBarOptions {
  width?: number;
  showPercentage?: boolean;
  showCurrentFile?: boolean;
  showStats?: boolean;
}

export class VisualProgress {
  private total: number;
  private current: number = 0;
  private options: Required<ProgressBarOptions>;
  private startTime: number;
  private lastUpdate: number = 0;
  
  constructor(total: number, options: ProgressBarOptions = {}) {
    this.total = total;
    this.startTime = Date.now();
    this.options = {
      width: options.width || 40,
      showPercentage: options.showPercentage ?? true,
      showCurrentFile: options.showCurrentFile ?? true,
      showStats: options.showStats ?? true
    };
  }

  public update(increment: number = 1, currentFile?: string): void {
    this.current = Math.min(this.current + increment, this.total);
    
    const now = Date.now();
    if (now - this.lastUpdate < 100 && this.current < this.total) {
      return;
    }
    this.lastUpdate = now;
    
    this.render(currentFile);
  }

  public finish(message?: string): void {
    this.current = this.total;
    this.render();
    if (message) {
      console.log(`\n${message}`);
    } else {
      console.log();
    }
  }

  private render(currentFile?: string): void {
    const percentage = Math.floor((this.current / this.total) * 100);
    const filled = Math.floor((this.current / this.total) * this.options.width);
    const empty = this.options.width - filled;
    
    const filledBlocks = chalk.green('█'.repeat(filled));
    const emptyBlocks = chalk.gray('░'.repeat(empty));
    const progressBar = `[${filledBlocks}${emptyBlocks}]`;
    
    let statsText = '';
    if (this.options.showStats) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const rate = this.current / elapsed || 0;
      const eta = this.current > 0 ? (this.total - this.current) / rate : 0;
      
      statsText = chalk.blue(` ${this.current}/${this.total}`) + 
                 (this.options.showPercentage ? chalk.cyan(` (${percentage}%)`) : '') +
                 chalk.gray(` • ${rate.toFixed(1)}/s`) +
                 (eta > 0 && eta < 3600 ? chalk.gray(` • ETA: ${this.formatTime(eta)}`) : '');
    }
    
    let fileInfo = '';
    if (this.options.showCurrentFile && currentFile) {
      const maxLength = 60;
      const displayPath = currentFile.length > maxLength 
        ? '...' + currentFile.slice(-maxLength + 3)
        : currentFile;
      fileInfo = `\n${chalk.gray('📁')} ${chalk.white(displayPath)}`;
    }
    
    process.stdout.write('\r\x1b[K');
    if (this.options.showCurrentFile) {
      process.stdout.write('\x1b[1A\r\x1b[K');
    }
    
    process.stdout.write(`${progressBar}${statsText}${fileInfo}`);
  }
  
  private formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
}

export class BatchProgress {
  private totalBatches: number;
  private currentBatchProgress?: VisualProgress;
  
  constructor(totalBatches: number) {
    this.totalBatches = totalBatches;
  }
  
  public startBatch(batchNumber: number, batchSize: number, batchName: string): VisualProgress {
    console.log(chalk.cyan(`\n📦 Batch ${batchNumber}/${this.totalBatches}: ${batchName}`));
    console.log();
    
    this.currentBatchProgress = new VisualProgress(batchSize, {
      width: 50,
      showPercentage: true,
      showCurrentFile: true,
      showStats: true
    });
    
    return this.currentBatchProgress;
  }
  
  public finishBatch(message: string): void {
    if (this.currentBatchProgress) {
      this.currentBatchProgress.finish(chalk.green(`✅ ${message}`));
    }
  }
  
  public showBatchSummary(filesProcessed: number, duration: number): void {
    const rate = filesProcessed / (duration / 1000);
    console.log(chalk.gray(`   Processed ${filesProcessed} files in ${(duration / 1000).toFixed(1)}s (${rate.toFixed(1)} files/s)`));
  }
}

export function createFileTypeIcon(fileType: string): string {
  const icons: Record<string, string> = {
    binary: '⚙️',
    media: '🎨',
    assets: '📦',
    archives: '📚',
    source: '💻',
    web: '🌐',
    mobile: '📱',
    database: '🗄️',
    config: '⚙️',
    docs: '📝',
    data: '📊',
    system: '🔧',
    misc: '📄'
  };
  
  return icons[fileType] || '📄';
}

export function formatFilePath(filePath: string, maxLength: number = 50): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }
  
  const parts = filePath.split('/');
  if (parts.length === 1) {
    return '...' + filePath.slice(-maxLength + 3);
  }
  
  const filename = parts[parts.length - 1];
  const remaining = maxLength - filename.length - 4;
  
  if (remaining > 0) {
    const parentPath = parts.slice(0, -1).join('/');
    if (parentPath.length <= remaining) {
      return parentPath + '/' + filename;
    } else {
      return '.../' + parentPath.slice(-remaining) + '/' + filename;
    }
  }
  
  return '.../' + filename;
}