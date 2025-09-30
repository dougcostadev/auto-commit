import { CommandOptions, FileAnalysis, FileType, ProcessingResult } from '../types';
import { loadConfig } from '../utils/config';
import { checkGitRepository, getUntrackedFiles, addFiles, createCommit, getRepositoryInfo, pushToRemote, pullFromRemote } from '../utils/git';
import { BatchProgress, createFileTypeIcon } from '../utils/progress';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';

export async function runCommand(options: CommandOptions): Promise<void> {
  const spinner = ora();
  
  try {
    if (!(await checkGitRepository())) {
      console.log(chalk.red('❌ Not a git repository. Initialize with'), chalk.yellow('git init'), chalk.red('first.'));
      return;
    }

    const config = await loadConfig();
    if (!config) {
      console.log(chalk.red('❌ DAC not initialized. Run'), chalk.yellow('dac init'), chalk.red('first.'));
      return;
    }

    console.log(chalk.cyan('🚀 Starting DAC batch commit automation...\n'));

    try {
      spinner.start('⬇️  Pulling latest changes...');
      await pullFromRemote();
      spinner.succeed('✅ Repository synchronized');
    } catch (error: any) {
      spinner.warn(`⚠️  Pull failed: ${error.message}`);
      console.log(chalk.gray('   Continuing with local processing...'));
    }

    const repoInfo = await getRepositoryInfo();
    console.log(chalk.blue('📋 Repository:'), chalk.white(repoInfo.name));
    console.log(chalk.blue('🌿 Branch:'), chalk.white(repoInfo.branch));
    
    if (!repoInfo.isClean) {
      console.log(chalk.yellow('⚠️  Repository has uncommitted changes'));
    }

    spinner.start('🔍 Analyzing repository files...');
    const untrackedFiles = await getUntrackedFiles();
    
    if (untrackedFiles.length === 0) {
      spinner.succeed(chalk.green('✅ No untracked files found'));
      console.log(chalk.cyan('🎉 Repository is up to date!'));
      return;
    }

    spinner.text = `Found ${untrackedFiles.length} untracked files. Analyzing...`;
    
    const fileAnalysis = await analyzeFiles(untrackedFiles, config.fileTypes, options);
    spinner.succeed(`📊 Analyzed ${fileAnalysis.length} files`);

    if (fileAnalysis.length === 0) {
      console.log(chalk.yellow('⚠️  No files to process after analysis'));
      return;
    }

    showAnalysisSummary(fileAnalysis);

    const batches = createBatches(fileAnalysis, config, options);
    
    if (options.dryRun) {
      console.log(chalk.cyan('\n🔍 DRY RUN MODE - Showing what would be committed:\n'));
      showDryRunPreview(batches);
      return;
    }

    const result = await processBatches(batches, config);
    showProcessingResults(result);

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Error during processing'));
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

async function analyzeFiles(files: string[], fileTypes: any, options: CommandOptions): Promise<FileAnalysis[]> {
  const analysis: FileAnalysis[] = [];
  
  for (const file of files) {
    try {
      const stats = await fs.stat(file);
      const ext = path.extname(file).toLowerCase();
      const fileType = determineFileType(file, ext, fileTypes);
      
      if (options.type && !options.type.includes(fileType)) {
        continue;
      }
      
      analysis.push({
        path: file,
        type: fileType,
        size: stats.size,
        extension: ext,
        isLarge: stats.size > (1024 * 1024 * 10)
      });
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not analyze file: ${file}`));
    }
  }
  
  return analysis;
}

function determineFileType(filePath: string, extension: string, fileTypes: any): FileType {
  const fileName = path.basename(filePath).toLowerCase();
  
  for (const [type, config] of Object.entries(fileTypes)) {
    const typeConfig = config as any;
    if (typeConfig.extensions.includes(extension) || 
        typeConfig.patterns.some((pattern: string) => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(fileName);
        })) {
      return type as FileType;
    }
  }
  
  return 'misc';
}

function showAnalysisSummary(analysis: FileAnalysis[]): void {
  console.log(chalk.cyan('\n📊 File Analysis Summary:'));
  
  const typeCount: Record<string, number> = {};
  let totalSize = 0;
  
  analysis.forEach(file => {
    typeCount[file.type] = (typeCount[file.type] || 0) + 1;
    totalSize += file.size;
  });
  
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(chalk.blue('  •'), chalk.white(`${type}: ${count} files`));
  });
  
  console.log(chalk.blue('  •'), chalk.white(`Total size: ${formatFileSize(totalSize)}`));
}

function createBatches(analysis: FileAnalysis[], config: any, options: CommandOptions): Array<{type: FileType, files: FileAnalysis[], message: string}> {
  const batches: Array<{type: FileType, files: FileAnalysis[], message: string}> = [];
  const filesByType: Record<FileType, FileAnalysis[]> = {} as any;
  
  analysis.forEach(file => {
    if (!filesByType[file.type]) {
      filesByType[file.type] = [];
    }
    filesByType[file.type].push(file);
  });
  
  Object.entries(filesByType).forEach(([type, files]) => {
    const fileType = type as FileType;
    const batchSize = options.batchSize || config.fileTypes[fileType]?.batchSize || 10;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batchFiles = files.slice(i, i + batchSize);
      const message = generateCommitMessage(fileType, batchFiles, config);
      
      batches.push({
        type: fileType,
        files: batchFiles,
        message
      });
    }
  });
  
  return batches;
}

function generateCommitMessage(type: FileType, files: FileAnalysis[], config: any): string {
  const typeConfig = config.fileTypes[type];
  const count = files.length;
  const icon = typeConfig?.icon || '📁';
  
  if (count === 1) {
    const fileName = path.basename(files[0].path);
    return `${icon} Add ${fileName}`;
  } else {
    const typeLabel = typeConfig?.name || type;
    return `${icon} Add ${count} ${typeLabel.toLowerCase()}`;
  }
}

function showDryRunPreview(batches: Array<{type: FileType, files: FileAnalysis[], message: string}>): void {
  batches.forEach((batch, index) => {
    console.log(chalk.yellow(`📋 Batch ${index + 1}:`), chalk.white(batch.message));
    batch.files.forEach(file => {
      console.log(chalk.gray(`   • ${file.path} (${formatFileSize(file.size)})`));
    });
    console.log();
  });
  
  console.log(chalk.cyan(`🎯 Total: ${batches.length} commits would be created`));
}

async function processBatches(batches: Array<{type: FileType, files: FileAnalysis[], message: string}>, config: any): Promise<ProcessingResult> {
  let successCount = 0;
  const errors: string[] = [];
  const startTime = Date.now();
  
  const maxPushSizeBytes = config.maxPushSize || (1024 * 1024 * 1024);
  let currentPushSize = 0;
  let commitsInCurrentPush = 0;
  let totalPushes = 0;
  
  const batchProgress = new BatchProgress(batches.length);
  
  console.log(chalk.cyan(`\n🚀 Starting batch processing with visual progress...\n`));
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchSize = batch.files.reduce((sum, file) => sum + file.size, 0);
    const icon = createFileTypeIcon(batch.type);
    const batchName = `${icon} ${batch.message}`;
    
    try {
      const progress = batchProgress.startBatch(i + 1, batch.files.length, batchName);
      
      const batchStartTime = Date.now();
      
      const filePaths = batch.files.map(f => f.path);
      
      // Real progress during git add
      await addFiles(filePaths, (processed) => {
        progress.setCurrent(processed);
      });
      
      progress.finish();
      
      await createCommit(batch.message);
      successCount++;
      commitsInCurrentPush++;
      currentPushSize += batchSize;
      
      const batchDuration = Date.now() - batchStartTime;
      batchProgress.finishBatch(`Committed ${batch.files.length} files (${formatFileSize(batchSize)})`);
      batchProgress.showBatchSummary(batch.files.length, batchDuration);
      
      const isLastBatch = i === batches.length - 1;
      const pushSizeReached = currentPushSize >= maxPushSizeBytes;
      const shouldPush = pushSizeReached || isLastBatch;
      
      const pushProgress = ((currentPushSize / maxPushSizeBytes) * 100).toFixed(1);
      console.log(chalk.gray(`   Push size: ${formatFileSize(currentPushSize)} / ${formatFileSize(maxPushSizeBytes)} (${pushProgress}%)`));
      
      if (shouldPush && commitsInCurrentPush > 0) {
        totalPushes++;
        
        const pushReason = pushSizeReached ? 'size limit reached' : 'final batch';
        console.log(chalk.cyan(`\n🚀 Push ${totalPushes}: ${commitsInCurrentPush} commits (${formatFileSize(currentPushSize)}) - ${pushReason}`));
        
        try {
          await pushToRemote();
          console.log(chalk.green(`✅ Push ${totalPushes} successful!`));
          
          currentPushSize = 0;
          commitsInCurrentPush = 0;
          
        } catch (pushError: any) {
          console.log(chalk.yellow(`⚠️  Push ${totalPushes} failed: ${pushError.message}`));
          console.log(chalk.gray('   Commits are saved locally. You can push manually later with:'), chalk.yellow('git push'));
        }
        
        if (!isLastBatch) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (error: any) {
      console.log(chalk.red(`❌ Failed: ${batch.message}`));
      console.log(chalk.gray(`   Error: ${error.message}`));
      errors.push(`Batch ${i + 1}: ${error.message}`);
    }
  }
  
  const duration = Date.now() - startTime;
  const totalFiles = batches.reduce((sum, batch) => sum + batch.files.length, 0);
  
  return {
    success: errors.length === 0,
    filesProcessed: totalFiles,
    commitCount: successCount,
    errors,
    duration,
    statistics: {
      totalFiles,
      filesByType: {} as any,
      totalSize: 0,
      averageFileSize: 0,
      largestCategory: 'misc',
      repositoryType: 'unknown',
      estimatedProcessingTime: duration
    }
  };
}

function showProcessingResults(result: ProcessingResult): void {
  console.log(chalk.cyan('\n🎉 Processing Complete!\n'));
  
  console.log(chalk.green('✅ Success:'), chalk.white(`${result.commitCount} commits created`));
  console.log(chalk.blue('📁 Files:'), chalk.white(`${result.filesProcessed} files processed`));
  console.log(chalk.blue('⏱️  Duration:'), chalk.white(`${(result.duration / 1000).toFixed(1)}s`));
  
  if (result.errors.length > 0) {
    console.log(chalk.red('\n❌ Errors:'));
    result.errors.forEach(error => {
      console.log(chalk.red('  •'), chalk.white(error));
    });
  }
  
  if (result.success && result.commitCount > 0) {
    console.log(chalk.cyan('\n💡 Next steps:'));
    console.log(chalk.gray('  • Review commits:'), chalk.yellow('git log --oneline'));
    console.log(chalk.gray('  • Push to remote:'), chalk.yellow('git push'));
    console.log(chalk.gray('  • View statistics:'), chalk.yellow('dac stats'));
  }
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}