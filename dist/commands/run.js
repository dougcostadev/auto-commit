"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = runCommand;
const config_1 = require("../utils/config");
const git_1 = require("../utils/git");
const progress_1 = require("../utils/progress");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
async function runCommand(options) {
    const spinner = (0, ora_1.default)();
    try {
        if (!(await (0, git_1.checkGitRepository)())) {
            console.log(chalk_1.default.red('❌ Not a git repository. Initialize with'), chalk_1.default.yellow('git init'), chalk_1.default.red('first.'));
            return;
        }
        const config = await (0, config_1.loadConfig)();
        if (!config) {
            console.log(chalk_1.default.red('❌ DAC not initialized. Run'), chalk_1.default.yellow('dac init'), chalk_1.default.red('first.'));
            return;
        }
        console.log(chalk_1.default.cyan('🚀 Starting DAC batch commit automation...\n'));
        const repoInfo = await (0, git_1.getRepositoryInfo)();
        console.log(chalk_1.default.blue('📋 Repository:'), chalk_1.default.white(repoInfo.name));
        console.log(chalk_1.default.blue('🌿 Branch:'), chalk_1.default.white(repoInfo.branch));
        if (!repoInfo.isClean) {
            console.log(chalk_1.default.yellow('⚠️  Repository has uncommitted changes'));
        }
        spinner.start('🔍 Analyzing repository files...');
        const untrackedFiles = await (0, git_1.getUntrackedFiles)();
        if (untrackedFiles.length === 0) {
            spinner.succeed(chalk_1.default.green('✅ No untracked files found'));
            console.log(chalk_1.default.cyan('🎉 Repository is up to date!'));
            return;
        }
        spinner.text = `Found ${untrackedFiles.length} untracked files. Analyzing...`;
        const fileAnalysis = await analyzeFiles(untrackedFiles, config.fileTypes, options);
        spinner.succeed(`📊 Analyzed ${fileAnalysis.length} files`);
        if (fileAnalysis.length === 0) {
            console.log(chalk_1.default.yellow('⚠️  No files to process after analysis'));
            return;
        }
        showAnalysisSummary(fileAnalysis);
        const batches = createBatches(fileAnalysis, config, options);
        if (options.dryRun) {
            console.log(chalk_1.default.cyan('\n🔍 DRY RUN MODE - Showing what would be committed:\n'));
            showDryRunPreview(batches);
            return;
        }
        const result = await processBatches(batches, config);
        showProcessingResults(result);
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Error during processing'));
        console.error(chalk_1.default.red('Error:'), error.message);
        process.exit(1);
    }
}
async function analyzeFiles(files, fileTypes, options) {
    const analysis = [];
    for (const file of files) {
        try {
            const stats = await fs_1.promises.stat(file);
            const ext = path_1.default.extname(file).toLowerCase();
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
        }
        catch (error) {
            console.warn(chalk_1.default.yellow(`⚠️  Could not analyze file: ${file}`));
        }
    }
    return analysis;
}
function determineFileType(filePath, extension, fileTypes) {
    const fileName = path_1.default.basename(filePath).toLowerCase();
    for (const [type, config] of Object.entries(fileTypes)) {
        const typeConfig = config;
        if (typeConfig.extensions.includes(extension) ||
            typeConfig.patterns.some((pattern) => {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(fileName);
            })) {
            return type;
        }
    }
    return 'misc';
}
function showAnalysisSummary(analysis) {
    console.log(chalk_1.default.cyan('\n📊 File Analysis Summary:'));
    const typeCount = {};
    let totalSize = 0;
    analysis.forEach(file => {
        typeCount[file.type] = (typeCount[file.type] || 0) + 1;
        totalSize += file.size;
    });
    Object.entries(typeCount).forEach(([type, count]) => {
        console.log(chalk_1.default.blue('  •'), chalk_1.default.white(`${type}: ${count} files`));
    });
    console.log(chalk_1.default.blue('  •'), chalk_1.default.white(`Total size: ${formatFileSize(totalSize)}`));
}
function createBatches(analysis, config, options) {
    const batches = [];
    const filesByType = {};
    analysis.forEach(file => {
        if (!filesByType[file.type]) {
            filesByType[file.type] = [];
        }
        filesByType[file.type].push(file);
    });
    Object.entries(filesByType).forEach(([type, files]) => {
        const fileType = type;
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
function generateCommitMessage(type, files, config) {
    const typeConfig = config.fileTypes[type];
    const count = files.length;
    const icon = typeConfig?.icon || '📁';
    if (count === 1) {
        const fileName = path_1.default.basename(files[0].path);
        return `${icon} Add ${fileName}`;
    }
    else {
        const typeLabel = typeConfig?.name || type;
        return `${icon} Add ${count} ${typeLabel.toLowerCase()}`;
    }
}
function showDryRunPreview(batches) {
    batches.forEach((batch, index) => {
        console.log(chalk_1.default.yellow(`📋 Batch ${index + 1}:`), chalk_1.default.white(batch.message));
        batch.files.forEach(file => {
            console.log(chalk_1.default.gray(`   • ${file.path} (${formatFileSize(file.size)})`));
        });
        console.log();
    });
    console.log(chalk_1.default.cyan(`🎯 Total: ${batches.length} commits would be created`));
}
async function processBatches(batches, config) {
    let successCount = 0;
    const errors = [];
    const startTime = Date.now();
    const maxPushSizeBytes = config.maxPushSize || (1024 * 1024 * 1024);
    let currentPushSize = 0;
    let commitsInCurrentPush = 0;
    let totalPushes = 0;
    const batchProgress = new progress_1.BatchProgress(batches.length);
    console.log(chalk_1.default.cyan(`\n🚀 Starting batch processing with visual progress...\n`));
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchSize = batch.files.reduce((sum, file) => sum + file.size, 0);
        const icon = (0, progress_1.createFileTypeIcon)(batch.type);
        const batchName = `${icon} ${batch.message}`;
        try {
            const progress = batchProgress.startBatch(i + 1, batch.files.length, batchName);
            const batchStartTime = Date.now();
            for (let j = 0; j < batch.files.length; j++) {
                progress.update(1);
                await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
            }
            progress.finish();
            const filePaths = batch.files.map(f => f.path);
            await (0, git_1.addFiles)(filePaths);
            await (0, git_1.createCommit)(batch.message);
            successCount++;
            commitsInCurrentPush++;
            currentPushSize += batchSize;
            const batchDuration = Date.now() - batchStartTime;
            batchProgress.finishBatch(`Committed ${batch.files.length} files (${formatFileSize(batchSize)})`);
            batchProgress.showBatchSummary(batch.files.length, batchDuration);
            const isLastBatch = i === batches.length - 1;
            const shouldPush = currentPushSize >= maxPushSizeBytes || isLastBatch;
            if (shouldPush && commitsInCurrentPush > 0) {
                totalPushes++;
                console.log(chalk_1.default.cyan(`\n🚀 Push ${totalPushes}: Pushing ${commitsInCurrentPush} commits (${formatFileSize(currentPushSize)})...`));
                try {
                    await (0, git_1.pushToRemote)();
                    console.log(chalk_1.default.green(`✅ Push ${totalPushes} successful!`));
                    currentPushSize = 0;
                    commitsInCurrentPush = 0;
                }
                catch (pushError) {
                    console.log(chalk_1.default.yellow(`⚠️  Push ${totalPushes} failed: ${pushError.message}`));
                    console.log(chalk_1.default.gray('   Commits are saved locally. You can push manually later with:'), chalk_1.default.yellow('git push'));
                }
                if (!isLastBatch) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        catch (error) {
            console.log(chalk_1.default.red(`❌ Failed: ${batch.message}`));
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
            filesByType: {},
            totalSize: 0,
            averageFileSize: 0,
            largestCategory: 'misc',
            repositoryType: 'unknown',
            estimatedProcessingTime: duration
        }
    };
}
function showProcessingResults(result) {
    console.log(chalk_1.default.cyan('\n🎉 Processing Complete!\n'));
    console.log(chalk_1.default.green('✅ Success:'), chalk_1.default.white(`${result.commitCount} commits created`));
    console.log(chalk_1.default.blue('📁 Files:'), chalk_1.default.white(`${result.filesProcessed} files processed`));
    console.log(chalk_1.default.blue('⏱️  Duration:'), chalk_1.default.white(`${(result.duration / 1000).toFixed(1)}s`));
    if (result.errors.length > 0) {
        console.log(chalk_1.default.red('\n❌ Errors:'));
        result.errors.forEach(error => {
            console.log(chalk_1.default.red('  •'), chalk_1.default.white(error));
        });
    }
    if (result.success && result.commitCount > 0) {
        console.log(chalk_1.default.cyan('\n💡 Next steps:'));
        console.log(chalk_1.default.gray('  • Review commits:'), chalk_1.default.yellow('git log --oneline'));
        console.log(chalk_1.default.gray('  • Push to remote:'), chalk_1.default.yellow('git push'));
        console.log(chalk_1.default.gray('  • View statistics:'), chalk_1.default.yellow('dac stats'));
    }
}
function formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0)
        return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
//# sourceMappingURL=run.js.map