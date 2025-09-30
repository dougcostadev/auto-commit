"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultConfig = createDefaultConfig;
exports.getPresetInfo = getPresetInfo;
exports.getPresetDescription = getPresetDescription;
exports.getPresetMultiplier = getPresetMultiplier;
const BATCH_MULTIPLIERS = {
    conservative: 1,
    balanced: 10,
    aggressive: 100
};
function createDefaultConfig(answers) {
    const preset = answers?.batchStrategy || 'balanced';
    const multiplier = BATCH_MULTIPLIERS[preset];
    const defaultFileTypes = {
        binary: {
            name: 'Binary Files',
            description: 'Executable files, compiled binaries, and machine code',
            extensions: ['.exe', '.dll', '.so', '.dylib', '.bin', '.app'],
            patterns: ['*.exe', '*.dll', '*.so', '*.dylib', '*.bin', '*.app'],
            batchSize: Math.max(1, 5 * multiplier),
            icon: '⚙️'
        },
        media: {
            name: 'Media Files',
            description: 'Images, videos, audio, and multimedia content',
            extensions: ['.jpg', '.png', '.gif', '.mp4', '.mp3', '.avi', '.mov', '.wav'],
            patterns: ['*.jpg', '*.png', '*.gif', '*.mp4', '*.mp3', '*.avi', '*.mov', '*.wav'],
            batchSize: Math.max(1, 3 * multiplier),
            icon: '🎨'
        },
        assets: {
            name: 'Asset Files',
            description: 'Static assets, fonts, icons, and resources',
            extensions: ['.ttf', '.woff', '.svg', '.ico', '.eot', '.otf'],
            patterns: ['*.ttf', '*.woff*', '*.svg', '*.ico', '*.eot', '*.otf'],
            batchSize: Math.max(1, 10 * multiplier),
            icon: '📦'
        },
        archives: {
            name: 'Archive Files',
            description: 'Compressed files and archives',
            extensions: ['.zip', '.rar', '.tar', '.gz', '.7z', '.bz2'],
            patterns: ['*.zip', '*.rar', '*.tar*', '*.gz', '*.7z', '*.bz2'],
            batchSize: Math.max(1, 2 * multiplier),
            icon: '📚'
        },
        source: {
            name: 'Source Code',
            description: 'Programming language source files',
            extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.php'],
            patterns: ['*.js', '*.ts', '*.py', '*.java', '*.cpp', '*.c', '*.cs', '*.php'],
            batchSize: Math.max(1, 15 * multiplier),
            icon: '💻'
        },
        web: {
            name: 'Web Files',
            description: 'HTML, CSS, and web-related files',
            extensions: ['.html', '.css', '.scss', '.sass', '.less', '.jsx', '.vue'],
            patterns: ['*.html', '*.css', '*.scss', '*.sass', '*.less', '*.jsx', '*.vue'],
            batchSize: Math.max(1, 12 * multiplier),
            icon: '🌐'
        },
        mobile: {
            name: 'Mobile Files',
            description: 'Mobile development files',
            extensions: ['.swift', '.kt', '.dart', '.xaml'],
            patterns: ['*.swift', '*.kt', '*.dart', '*.xaml'],
            batchSize: Math.max(1, 10 * multiplier),
            icon: '📱'
        },
        database: {
            name: 'Database Files',
            description: 'Database files and SQL scripts',
            extensions: ['.sql', '.db', '.sqlite', '.mdb'],
            patterns: ['*.sql', '*.db', '*.sqlite*', '*.mdb'],
            batchSize: Math.max(1, 5 * multiplier),
            icon: '🗄️'
        },
        config: {
            name: 'Configuration',
            description: 'Configuration files and settings',
            extensions: ['.json', '.xml', '.yaml', '.yml', '.ini', '.conf', '.cfg'],
            patterns: ['*.json', '*.xml', '*.yaml', '*.yml', '*.ini', '*.conf', '*.cfg'],
            batchSize: Math.max(1, 8 * multiplier),
            icon: '⚙️'
        },
        docs: {
            name: 'Documentation',
            description: 'Documentation and text files',
            extensions: ['.md', '.txt', '.doc', '.docx', '.pdf', '.rtf'],
            patterns: ['*.md', '*.txt', '*.doc*', '*.pdf', '*.rtf'],
            batchSize: Math.max(1, 10 * multiplier),
            icon: '📝'
        },
        data: {
            name: 'Data Files',
            description: 'Data files and datasets',
            extensions: ['.csv', '.tsv', '.xls', '.xlsx', '.parquet'],
            patterns: ['*.csv', '*.tsv', '*.xls*', '*.parquet'],
            batchSize: Math.max(1, 5 * multiplier),
            icon: '📊'
        },
        system: {
            name: 'System Files',
            description: 'System and hidden files',
            extensions: ['.log', '.tmp', '.cache', '.lock'],
            patterns: ['*.log', '*.tmp', '*.cache', '*.lock', '.*'],
            batchSize: Math.max(1, 20 * multiplier),
            icon: '🔧'
        },
        misc: {
            name: 'Miscellaneous',
            description: 'Other files that don\'t fit in specific categories',
            extensions: [],
            patterns: ['*'],
            batchSize: Math.max(1, 10 * multiplier),
            icon: '📄'
        }
    };
    const batchSizes = {};
    Object.entries(defaultFileTypes).forEach(([type, config]) => {
        batchSizes[type] = config.batchSize;
    });
    return {
        version: '1.0.0',
        batchSizes: batchSizes,
        excludePatterns: [
            'node_modules/**',
            '.git/**',
            'dist/**',
            'build/**',
            '.cache/**',
            '.tmp/**',
            '*.log'
        ],
        commitMessage: {
            template: 'feat: add {count} {type} files - {description}',
            useConventional: answers?.useConventional || true
        },
        processing: {
            parallel: answers?.enableParallel || true,
            maxConcurrency: answers?.maxConcurrency || 3,
            retryFailedPushes: true,
            skipLargeFiles: true,
            maxFileSize: 50 * 1024 * 1024
        },
        maxPushSize: 1024 * 1024 * 1024,
        fileTypes: defaultFileTypes
    };
}
function getPresetInfo() {
    return [
        {
            value: 'conservative',
            name: '🐌 Conservative (Small batches)',
            description: 'Small batches, many commits - Good for detailed history and code review'
        },
        {
            value: 'balanced',
            name: '⚖️  Balanced (Medium batches)',
            description: 'Medium batches, balanced commits - Good balance of organization and efficiency'
        },
        {
            value: 'aggressive',
            name: '🚀 Aggressive (Large batches)',
            description: 'Large batches, few commits - Maximum efficiency, minimal commit count'
        }
    ];
}
function getPresetDescription(preset) {
    const presetInfo = getPresetInfo();
    return presetInfo.find(p => p.value === preset)?.description || 'Unknown preset';
}
function getPresetMultiplier(preset) {
    return BATCH_MULTIPLIERS[preset];
}
//# sourceMappingURL=config.js.map