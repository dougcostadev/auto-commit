"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommand = configCommand;
const config_1 = require("../utils/config");
const config_2 = require("../core/config");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
async function configCommand(options) {
    try {
        // Check if config exists
        if (!(await (0, config_1.configExists)())) {
            console.log(chalk_1.default.red('❌ DAC not initialized. Run'), chalk_1.default.yellow('dac init'), chalk_1.default.red('first.'));
            return;
        }
        // Handle different config operations
        if (options.list) {
            await listConfiguration();
        }
        else if (options.get) {
            await getConfigValue(options.get);
        }
        else if (options.set) {
            await setConfigValue(options.set);
        }
        else if (options.reset) {
            await resetConfiguration();
        }
        else {
            // Interactive config management
            await interactiveConfig();
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error managing configuration:'), error.message);
        process.exit(1);
    }
}
async function listConfiguration() {
    const spinner = (0, ora_1.default)('Loading configuration...').start();
    try {
        const config = await (0, config_1.loadConfig)();
        spinner.succeed('Configuration loaded');
        console.log(chalk_1.default.cyan('\n📋 Current DAC Configuration:\n'));
        // Basic Info
        console.log(chalk_1.default.blue('📦 Basic Information:'));
        console.log(`   Version: ${chalk_1.default.white(config.version)}`);
        console.log(`   Commit Template: ${chalk_1.default.white(config.commitMessage.template)}`);
        console.log(`   Conventional Commits: ${chalk_1.default.white(config.commitMessage.useConventional ? 'Yes' : 'No')}`);
        // Processing Settings
        console.log(chalk_1.default.blue('\n⚡ Processing Settings:'));
        console.log(`   Parallel Processing: ${chalk_1.default.white(config.processing.parallel ? 'Yes' : 'No')}`);
        console.log(`   Max Concurrency: ${chalk_1.default.white(config.processing.maxConcurrency)}`);
        console.log(`   Retry Failed Pushes: ${chalk_1.default.white(config.processing.retryFailedPushes ? 'Yes' : 'No')}`);
        console.log(`   Skip Large Files: ${chalk_1.default.white(config.processing.skipLargeFiles ? 'Yes' : 'No')}`);
        console.log(`   Max File Size: ${chalk_1.default.white(formatFileSize(config.processing.maxFileSize))}`);
        console.log(`   Max Push Size: ${chalk_1.default.white(formatFileSize(config.maxPushSize))}`);
        // File Types and Batch Sizes
        console.log(chalk_1.default.blue('\n📁 File Types & Batch Sizes:'));
        Object.entries(config.fileTypes).forEach(([, typeConfig]) => {
            console.log(`   ${typeConfig.icon} ${chalk_1.default.white(typeConfig.name)}: ${chalk_1.default.yellow(typeConfig.batchSize)} files per batch`);
        });
        // Exclude Patterns
        if (config.excludePatterns && config.excludePatterns.length > 0) {
            console.log(chalk_1.default.blue('\n🚫 Exclude Patterns:'));
            config.excludePatterns.forEach(pattern => {
                console.log(`   • ${chalk_1.default.white(pattern)}`);
            });
        }
    }
    catch (error) {
        spinner.fail('Failed to load configuration');
        throw error;
    }
}
async function getConfigValue(key) {
    const config = await (0, config_1.loadConfig)();
    const value = getNestedValue(config, key);
    if (value === undefined) {
        console.log(chalk_1.default.red(`❌ Configuration key '${key}' not found`));
        return;
    }
    console.log(chalk_1.default.cyan(`📋 ${key}:`), chalk_1.default.white(JSON.stringify(value, null, 2)));
}
async function setConfigValue(setValue) {
    const [key, ...valueParts] = setValue.split('=');
    const value = valueParts.join('=');
    if (!key || !value) {
        console.log(chalk_1.default.red('❌ Invalid format. Use: --set key=value'));
        return;
    }
    const spinner = (0, ora_1.default)(`Setting ${key}...`).start();
    try {
        const config = await (0, config_1.loadConfig)();
        // Parse value
        let parsedValue;
        try {
            parsedValue = JSON.parse(value);
        }
        catch {
            parsedValue = value;
        }
        // Set nested value
        setNestedValue(config, key, parsedValue);
        // Save config
        await (0, config_1.saveConfig)(config);
        spinner.succeed(`✅ Set ${key} = ${value}`);
    }
    catch (error) {
        spinner.fail('Failed to set configuration');
        throw error;
    }
}
async function resetConfiguration() {
    const { confirm } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to reset all configuration to defaults?',
            default: false
        }
    ]);
    if (!confirm) {
        console.log(chalk_1.default.yellow('⚠️  Reset cancelled'));
        return;
    }
    const spinner = (0, ora_1.default)('Resetting configuration...').start();
    try {
        const defaultConfig = (0, config_2.createDefaultConfig)();
        await (0, config_1.saveConfig)(defaultConfig);
        spinner.succeed('✅ Configuration reset to defaults');
    }
    catch (error) {
        spinner.fail('Failed to reset configuration');
        throw error;
    }
}
async function interactiveConfig() {
    const config = await (0, config_1.loadConfig)();
    console.log(chalk_1.default.cyan('\n⚙️  Interactive Configuration Manager\n'));
    const { action } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to configure?',
            choices: [
                { name: '🎯 Change Batch Preset (Conservative/Balanced/Aggressive)', value: 'preset' },
                { name: '📝 Commit Message Settings', value: 'commit' },
                { name: '⚡ Processing Settings', value: 'processing' },
                { name: '� Push Size Limits', value: 'pushsize' },
                { name: '�📁 File Type Batch Sizes', value: 'batches' },
                { name: '🚫 Exclude Patterns', value: 'exclude' },
                { name: '📋 View All Settings', value: 'view' },
                { name: '🔄 Reset to Defaults', value: 'reset' }
            ]
        }
    ]);
    switch (action) {
        case 'preset':
            await configurePreset(config);
            break;
        case 'commit':
            await configureCommitSettings(config);
            break;
        case 'processing':
            await configureProcessingSettings(config);
            break;
        case 'pushsize':
            await configurePushSize(config);
            break;
        case 'batches':
            await configureBatchSizes(config);
            break;
        case 'exclude':
            await configureExcludePatterns(config);
            break;
        case 'view':
            await listConfiguration();
            break;
        case 'reset':
            await resetConfiguration();
            break;
    }
}
async function configureCommitSettings(config) {
    console.log(chalk_1.default.blue('\n📝 Commit Message Configuration\n'));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'template',
            message: 'Commit message template:',
            default: config.commitMessage.template
        },
        {
            type: 'confirm',
            name: 'useConventional',
            message: 'Use Conventional Commits format?',
            default: config.commitMessage.useConventional
        }
    ]);
    config.commitMessage = answers;
    await (0, config_1.saveConfig)(config);
    console.log(chalk_1.default.green('✅ Commit settings updated'));
}
async function configureProcessingSettings(config) {
    console.log(chalk_1.default.blue('\n⚡ Processing Configuration\n'));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'parallel',
            message: 'Enable parallel processing?',
            default: config.processing.parallel
        },
        {
            type: 'number',
            name: 'maxConcurrency',
            message: 'Maximum concurrency (1-10):',
            default: config.processing.maxConcurrency,
            validate: (input) => input >= 1 && input <= 10 ? true : 'Must be between 1 and 10'
        },
        {
            type: 'confirm',
            name: 'retryFailedPushes',
            message: 'Retry failed pushes?',
            default: config.processing.retryFailedPushes
        },
        {
            type: 'confirm',
            name: 'skipLargeFiles',
            message: 'Skip large files automatically?',
            default: config.processing.skipLargeFiles
        },
        {
            type: 'number',
            name: 'maxFileSize',
            message: 'Maximum file size (MB):',
            default: Math.round(config.processing.maxFileSize / 1024 / 1024),
            validate: (input) => input > 0 ? true : 'Must be greater than 0'
        }
    ]);
    config.processing = {
        ...answers,
        maxFileSize: answers.maxFileSize * 1024 * 1024
    };
    await (0, config_1.saveConfig)(config);
    console.log(chalk_1.default.green('✅ Processing settings updated'));
}
async function configureBatchSizes(config) {
    console.log(chalk_1.default.blue('\n📁 Batch Size Configuration\n'));
    for (const [, typeConfig] of Object.entries(config.fileTypes)) {
        const { batchSize } = await inquirer_1.default.prompt([
            {
                type: 'number',
                name: 'batchSize',
                message: `${typeConfig.icon} ${typeConfig.name} batch size:`,
                default: typeConfig.batchSize,
                validate: (input) => input >= 1 && input <= 50 ? true : 'Must be between 1 and 50'
            }
        ]);
        typeConfig.batchSize = batchSize;
    }
    await (0, config_1.saveConfig)(config);
    console.log(chalk_1.default.green('✅ Batch sizes updated'));
}
async function configureExcludePatterns(config) {
    console.log(chalk_1.default.blue('\n🚫 Exclude Patterns Configuration\n'));
    if (config.excludePatterns.length > 0) {
        console.log('Current exclude patterns:');
        config.excludePatterns.forEach((pattern, index) => {
            console.log(`${index + 1}. ${pattern}`);
        });
        console.log();
    }
    const { action } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: 'Add new pattern', value: 'add' },
                { name: 'Remove pattern', value: 'remove' },
                { name: 'Clear all patterns', value: 'clear' }
            ]
        }
    ]);
    switch (action) {
        case 'add':
            const { pattern } = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'pattern',
                    message: 'Enter exclude pattern (glob format):',
                    validate: (input) => input.length > 0 ? true : 'Pattern cannot be empty'
                }
            ]);
            config.excludePatterns.push(pattern);
            break;
        case 'remove':
            if (config.excludePatterns.length === 0) {
                console.log(chalk_1.default.yellow('No patterns to remove'));
                return;
            }
            const { patternToRemove } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'patternToRemove',
                    message: 'Select pattern to remove:',
                    choices: config.excludePatterns.map((p, i) => ({ name: p, value: i }))
                }
            ]);
            config.excludePatterns.splice(patternToRemove, 1);
            break;
        case 'clear':
            const { confirmClear } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirmClear',
                    message: 'Clear all exclude patterns?',
                    default: false
                }
            ]);
            if (confirmClear) {
                config.excludePatterns = [];
            }
            break;
    }
    await (0, config_1.saveConfig)(config);
    console.log(chalk_1.default.green('✅ Exclude patterns updated'));
}
// Helper functions
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key])
            current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}
async function configurePushSize(config) {
    console.log(chalk_1.default.cyan('\n🚀 Configure Push Size Limits\n'));
    console.log(chalk_1.default.gray('Current max push size:'), chalk_1.default.white(formatFileSize(config.maxPushSize)));
    console.log(chalk_1.default.gray('This limits how much data is pushed to the remote at once.\n'));
    const { sizeOption } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'sizeOption',
            message: 'Choose maximum push size:',
            choices: [
                { name: '📦 Small (500MB) - Conservative, frequent pushes', value: 500 * 1024 * 1024 },
                { name: '⚖️  Medium (1GB) - Balanced push size', value: 1024 * 1024 * 1024 },
                { name: '🚀 Large (2GB) - Larger pushes, less frequent', value: 2 * 1024 * 1024 * 1024 },
                { name: '💪 XLarge (5GB) - Maximum efficiency', value: 5 * 1024 * 1024 * 1024 },
                { name: '🔧 Custom - Enter custom size', value: 'custom' }
            ]
        }
    ]);
    let newSize = sizeOption;
    if (sizeOption === 'custom') {
        const { customSizeGB } = await inquirer_1.default.prompt([
            {
                type: 'number',
                name: 'customSizeGB',
                message: 'Enter maximum push size in GB:',
                default: 1,
                validate: (input) => {
                    if (input <= 0)
                        return 'Size must be greater than 0';
                    if (input > 10)
                        return 'Size should not exceed 10GB for practical reasons';
                    return true;
                }
            }
        ]);
        newSize = customSizeGB * 1024 * 1024 * 1024;
    }
    const spinner = (0, ora_1.default)('Updating push size configuration...').start();
    try {
        config.maxPushSize = newSize;
        await (0, config_1.saveConfig)(config);
        spinner.succeed(`✅ Updated max push size to ${formatFileSize(newSize)}`);
        console.log(chalk_1.default.cyan('\n💡 What this means:'));
        console.log(chalk_1.default.gray('• DAC will create commits normally'));
        console.log(chalk_1.default.gray('• When accumulated size reaches'), chalk_1.default.white(formatFileSize(newSize)), chalk_1.default.gray(', it will push automatically'));
        console.log(chalk_1.default.gray('• This prevents single massive pushes that might fail'));
    }
    catch (error) {
        spinner.fail('Failed to update push size configuration');
        throw error;
    }
}
function formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0)
        return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
async function configurePreset(config) {
    console.log(chalk_1.default.blue('\n🎯 Batch Preset Configuration\n'));
    const { preset } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'preset',
            message: 'Choose a batch processing preset:',
            choices: (0, config_2.getPresetInfo)()
        }
    ]);
    const spinner = (0, ora_1.default)('Applying preset configuration...').start();
    try {
        // Recreate config with new preset
        const newConfig = (0, config_2.createDefaultConfig)({ batchStrategy: preset });
        // Keep existing settings but update batch sizes
        newConfig.commitMessage = config.commitMessage;
        newConfig.processing = config.processing;
        newConfig.excludePatterns = config.excludePatterns;
        await (0, config_1.saveConfig)(newConfig);
        spinner.succeed(`✅ Applied ${preset} preset successfully`);
        // Show what changed
        console.log(chalk_1.default.cyan('\n📊 New batch sizes:'));
        Object.entries(newConfig.fileTypes).forEach(([, typeConfig]) => {
            console.log(`   ${typeConfig.icon} ${typeConfig.name}: ${chalk_1.default.yellow(typeConfig.batchSize)} files per batch`);
        });
    }
    catch (error) {
        spinner.fail('Failed to apply preset');
        throw error;
    }
}
//# sourceMappingURL=config.js.map