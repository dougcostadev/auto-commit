"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchProgress = exports.VisualProgress = void 0;
exports.createFileTypeIcon = createFileTypeIcon;
exports.formatFilePath = formatFilePath;
const chalk_1 = __importDefault(require("chalk"));
class VisualProgress {
    constructor(total, options = {}) {
        this.current = 0;
        this.lastUpdate = 0;
        this.total = total;
        this.startTime = Date.now();
        this.options = {
            width: options.width || 40,
            showPercentage: options.showPercentage ?? true,
            showCurrentFile: options.showCurrentFile ?? true,
            showStats: options.showStats ?? true
        };
    }
    update(increment = 1) {
        this.current = Math.min(this.current + increment, this.total);
        const now = Date.now();
        const timeDiff = now - this.lastUpdate;
        const shouldUpdate = this.current === this.total || timeDiff > 2000;
        if (shouldUpdate) {
            this.lastUpdate = now;
            this.render();
        }
    }
    setCurrent(value) {
        this.current = Math.min(value, this.total);
        this.render();
    }
    finish(message) {
        this.current = this.total;
        this.render();
        process.stdout.write('\n');
        if (message) {
            console.log(message);
        }
    }
    render() {
        const percentage = Math.floor((this.current / this.total) * 100);
        const filled = Math.floor((this.current / this.total) * this.options.width);
        const empty = this.options.width - filled;
        const filledBlocks = chalk_1.default.green('█'.repeat(filled));
        const emptyBlocks = chalk_1.default.gray('░'.repeat(empty));
        const progressBar = `[${filledBlocks}${emptyBlocks}]`;
        let statsText = '';
        if (this.options.showStats) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const rate = this.current / elapsed || 0;
            const eta = this.current > 0 ? (this.total - this.current) / rate : 0;
            statsText = chalk_1.default.blue(` ${this.current}/${this.total}`) +
                (this.options.showPercentage ? chalk_1.default.cyan(` (${percentage}%)`) : '') +
                chalk_1.default.gray(` • ${rate.toFixed(1)}/s`) +
                (eta > 0 && eta < 3600 ? chalk_1.default.gray(` • ETA: ${this.formatTime(eta)}`) : '');
        }
        process.stdout.write('\r\x1b[K' + progressBar + statsText);
    }
    formatTime(seconds) {
        if (seconds < 60)
            return `${seconds.toFixed(0)}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
}
exports.VisualProgress = VisualProgress;
class BatchProgress {
    constructor(totalBatches) {
        this.totalBatches = totalBatches;
    }
    startBatch(batchNumber, batchSize, batchName) {
        console.log(chalk_1.default.cyan(`\n📦 Batch ${batchNumber}/${this.totalBatches}: ${batchName}`));
        this.currentBatchProgress = new VisualProgress(batchSize, {
            width: 50,
            showPercentage: true,
            showCurrentFile: false,
            showStats: true
        });
        return this.currentBatchProgress;
    }
    finishBatch(message) {
        if (this.currentBatchProgress) {
            this.currentBatchProgress.finish(chalk_1.default.green(`✅ ${message}`));
        }
    }
    showBatchSummary(filesProcessed, duration) {
        const rate = filesProcessed / (duration / 1000);
        console.log(chalk_1.default.gray(`   Processed ${filesProcessed} files in ${(duration / 1000).toFixed(1)}s (${rate.toFixed(1)} files/s)`));
    }
}
exports.BatchProgress = BatchProgress;
function createFileTypeIcon(fileType) {
    const icons = {
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
function formatFilePath(filePath, maxLength = 50) {
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
        }
        else {
            return '.../' + parentPath.slice(-remaining) + '/' + filename;
        }
    }
    return '.../' + filename;
}
//# sourceMappingURL=progress.js.map