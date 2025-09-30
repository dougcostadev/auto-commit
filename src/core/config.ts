import { DACConfig, FileType, FileTypeConfig } from '../types';

export function createDefaultConfig(answers?: any): DACConfig {
  const defaultFileTypes: Record<FileType, FileTypeConfig> = {
    binary: {
      name: 'Binary Files',
      description: 'Executable files, compiled binaries, and machine code',
      extensions: ['.exe', '.dll', '.so', '.dylib', '.bin', '.app'],
      patterns: ['*.exe', '*.dll', '*.so', '*.dylib', '*.bin', '*.app'],
      batchSize: 5,
      icon: '⚙️'
    },
    media: {
      name: 'Media Files',
      description: 'Images, videos, audio, and multimedia content',
      extensions: ['.jpg', '.png', '.gif', '.mp4', '.mp3', '.avi', '.mov', '.wav'],
      patterns: ['*.jpg', '*.png', '*.gif', '*.mp4', '*.mp3', '*.avi', '*.mov', '*.wav'],
      batchSize: 3,
      icon: '🎨'
    },
    assets: {
      name: 'Asset Files',
      description: 'Static assets, fonts, icons, and resources',
      extensions: ['.ttf', '.woff', '.svg', '.ico', '.eot', '.otf'],
      patterns: ['*.ttf', '*.woff*', '*.svg', '*.ico', '*.eot', '*.otf'],
      batchSize: 10,
      icon: '📦'
    },
    archives: {
      name: 'Archive Files',
      description: 'Compressed files and archives',
      extensions: ['.zip', '.rar', '.tar', '.gz', '.7z', '.bz2'],
      patterns: ['*.zip', '*.rar', '*.tar*', '*.gz', '*.7z', '*.bz2'],
      batchSize: 2,
      icon: '📚'
    },
    source: {
      name: 'Source Code',
      description: 'Programming language source files',
      extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.php'],
      patterns: ['*.js', '*.ts', '*.py', '*.java', '*.cpp', '*.c', '*.cs', '*.php'],
      batchSize: 15,
      icon: '💻'
    },
    web: {
      name: 'Web Files',
      description: 'HTML, CSS, and web-related files',
      extensions: ['.html', '.css', '.scss', '.sass', '.less', '.jsx', '.vue'],
      patterns: ['*.html', '*.css', '*.scss', '*.sass', '*.less', '*.jsx', '*.vue'],
      batchSize: 12,
      icon: '🌐'
    },
    mobile: {
      name: 'Mobile Files',
      description: 'Mobile development files',
      extensions: ['.swift', '.kt', '.dart', '.xaml'],
      patterns: ['*.swift', '*.kt', '*.dart', '*.xaml'],
      batchSize: 10,
      icon: '📱'
    },
    database: {
      name: 'Database Files',
      description: 'Database files and SQL scripts',
      extensions: ['.sql', '.db', '.sqlite', '.mdb'],
      patterns: ['*.sql', '*.db', '*.sqlite*', '*.mdb'],
      batchSize: 5,
      icon: '🗄️'
    },
    config: {
      name: 'Configuration',
      description: 'Configuration files and settings',
      extensions: ['.json', '.xml', '.yaml', '.yml', '.ini', '.conf', '.cfg'],
      patterns: ['*.json', '*.xml', '*.yaml', '*.yml', '*.ini', '*.conf', '*.cfg'],
      batchSize: 8,
      icon: '⚙️'
    },
    docs: {
      name: 'Documentation',
      description: 'Documentation and text files',
      extensions: ['.md', '.txt', '.doc', '.docx', '.pdf', '.rtf'],
      patterns: ['*.md', '*.txt', '*.doc*', '*.pdf', '*.rtf'],
      batchSize: 10,
      icon: '📝'
    },
    data: {
      name: 'Data Files',
      description: 'Data files and datasets',
      extensions: ['.csv', '.tsv', '.xls', '.xlsx', '.parquet'],
      patterns: ['*.csv', '*.tsv', '*.xls*', '*.parquet'],
      batchSize: 5,
      icon: '📊'
    },
    system: {
      name: 'System Files',
      description: 'System and hidden files',
      extensions: ['.log', '.tmp', '.cache', '.lock'],
      patterns: ['*.log', '*.tmp', '*.cache', '*.lock', '.*'],
      batchSize: 20,
      icon: '🔧'
    },
    misc: {
      name: 'Miscellaneous',
      description: 'Other files that don\'t fit in specific categories',
      extensions: [],
      patterns: ['*'],
      batchSize: 10,
      icon: '📄'
    }
  };

  const defaultBatchSizes: Record<FileType, number> = {
    binary: 5,
    media: 3,
    assets: 10,
    archives: 2,
    source: 15,
    web: 12,
    mobile: 10,
    database: 5,
    config: 8,
    docs: 10,
    data: 5,
    system: 20,
    misc: 10
  };

  return {
    version: '1.0.0',
    batchSizes: defaultBatchSizes,
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
      maxFileSize: 50 * 1024 * 1024 // 50MB
    },
    fileTypes: defaultFileTypes
  };
}