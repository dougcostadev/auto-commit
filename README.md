# 🚀 Doug Auto Commit (DAC)

**Universal Git Commit Automation CLI Tool**

[![npm version](https://badge.fury.io/js/%40dougcostadev%2Fauto-commit.svg)](https://www.npmjs.com/package/@dougcostadev/auto-commit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)

Intelligent batch commit system that automatically categorizes files by type, size, and importance for optimal Git performance.

## 🚀 Quick Start

### Installation

```bash
# Install globally via NPM
npm install -g @dougcostadev/auto-commit

# Or using Yarn
yarn global add @dougcostadev/auto-commit

# Or using pnpm
pnpm add -g @dougcostadev/auto-commit
```

### Usage

```bash
# Navigate to any Git repository
cd your-project

# Initialize DAC configuration
dac init

# Run intelligent batch commits
dac run

# View repository statistics
dac stats

# Configure settings
dac config
```

## 📖 Commands

### `dac init`
Initialize DAC in your repository with interactive setup.

```bash
dac init                    # Interactive setup
dac init --force           # Force reinitialize
dac init --config <path>   # Custom config location
```

### `dac run`
Execute intelligent batch commit automation.

```bash
dac run                     # Full automated processing
dac run --dry-run          # Preview without executing
dac run --type source web  # Process only specific types
dac run --batch-size 500   # Override batch sizes
dac run --skip-analysis    # Skip repository analysis
```

### `dac config`
Manage DAC configuration settings.

```bash
dac config --list          # Show all settings
dac config --set key=value # Set configuration
dac config --get key       # Get specific value
dac config --reset         # Reset to defaults
```

### `dac stats`
View repository and processing statistics.

```bash
dac stats                  # Basic statistics
dac stats --detailed       # Detailed analysis
dac stats --history        # Processing history
```

## 🎯 Features

### 🧠 **Intelligent File Classification**
- **13 Categories**: Binary, Media, Assets, Archives, Source, Web, Mobile, Database, Config, Docs, Data, System, Misc
- **200+ Extensions**: Comprehensive coverage of all major file types
- **Smart Detection**: Advanced pattern matching and content analysis

### 📊 **Interactive CLI Interface**
- **Beautiful UI**: Colorful, gradient interface with ASCII art
- **Progress Tracking**: Real-time progress bars and file-by-file updates
- **Interactive Menus**: Easy navigation and configuration
- **Error Handling**: Graceful error recovery and user feedback

### ⚙️ **Adaptive Configuration**
- **Dynamic Batch Sizing**: Automatically optimized based on file types and repository size
- **Custom Settings**: Configurable batch sizes, file type priorities, and processing rules
- **GitHub Compliance**: Respects 100MB file and ~1GB push limits
- **Project Detection**: Automatic detection of project type (Web, Mobile, Game, etc.)

## 🛠️ Configuration

DAC creates a `.dac.json` configuration file in your repository:

```json
{
  "version": "1.0.0",
  "batchSizes": {
    "binary": 50,
    "media": 75,
    "source": 800,
    "web": 1200,
    "docs": 2500
  },
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**"
  ],
  "commitMessage": {
    "template": "{type} - Batch {batch}/{total} ({count} files)",
    "useConventional": false
  },
  "processing": {
    "parallel": true,
    "maxConcurrency": 4,
    "retryFailedPushes": true,
    "skipLargeFiles": true
  }
}
```

## 🎨 Interface Preview

```
████████╗  █████╗   ██████╗
██╔══██║ ██╔══██╗ ██╔════╝
██║  ██║ ███████║ ██║     
██║  ██║ ██╔══██║ ██║     
██████╔╝ ██║  ██║ ╚██████╗
╚═════╝  ╚═╝  ╚═╝  ╚═════╝

┌─────────────────────────────────────────────────────┐
│  🚀 Doug Auto Commit v1.0.0                       │
│  Universal Git Commit Automation                   │
│  https://github.com/dougcostadev/auto-commit       │
└─────────────────────────────────────────────────────┘

📊 Repository Analysis:
┌──────────────────────────────────────────────────────┐
│ 🌐 web        │  4,521 files │  30% │  4 batches    │
│ 💻 source     │  3,245 files │  21% │  3 batches    │
│ 📄 docs       │  2,890 files │  19% │  2 batches    │
│ 🎨 media      │  1,876 files │  12% │ 25 batches    │
└──────────────────────────────────────────────────────┘

🎯 Repository Type: Web Development Project
⚡ Processing Strategy: Optimized for frontend files
```

## 🔧 Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/dougcostadev/auto-commit.git
cd auto-commit

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
npm run dev

# Test the CLI
npm link
dac --help
```

### Testing

```bash
npm test              # Run tests
npm run lint          # Check code style
npm run format        # Format code
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Support

- **Issues**: [GitHub Issues](https://github.com/dougcostadev/auto-commit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dougcostadev/auto-commit/discussions)
- **Email**: douglas@dougcostadev.com

---

Made with ❤️ by [Douglas Costa](https://github.com/dougcostadev)

⭐ **Star this repository if it helps you!** ⭐