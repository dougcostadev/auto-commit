"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const config_1 = require("../core/config");
const git_1 = require("../utils/git");
async function initCommand(options) {
    try {
        console.log(chalk_1.default.cyan('\n🎯 Initializing Doug Auto Commit...\n'));
        // Check if we're in a Git repository
        const spinner = (0, ora_1.default)('Checking Git repository...').start();
        const isGitRepo = await (0, git_1.checkGitRepository)();
        if (!isGitRepo) {
            spinner.fail('Not a Git repository');
            console.log(chalk_1.default.red('❌ Please run this command in a Git repository.'));
            process.exit(1);
        }
        const repoInfo = await (0, git_1.getRepositoryInfo)();
        spinner.succeed(`Git repository detected: ${repoInfo.name}`);
        // Check if config already exists
        const configPath = path_1.default.join(process.cwd(), '.dac.json');
        const configExists = await fs_1.promises.access(configPath).then(() => true).catch(() => false);
        if (configExists && !options.force) {
            const { overwrite } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'DAC configuration already exists. Overwrite?',
                    default: false
                }
            ]);
            if (!overwrite) {
                console.log(chalk_1.default.yellow('⚠️  Initialization cancelled.'));
                return;
            }
        }
        // Interactive setup
        console.log(chalk_1.default.green('\n🔧 Configuration Setup\n'));
        const answers = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'projectType',
                message: 'What type of project is this?',
                choices: [
                    { name: '🌐 Web Development (React, Vue, Angular)', value: 'web' },
                    { name: '💻 Software Development (General programming)', value: 'software' },
                    { name: '📱 Mobile Development (React Native, Flutter)', value: 'mobile' },
                    { name: '🎮 Game Development (Unity, Unreal)', value: 'game' },
                    { name: '🎨 Media/Design Project', value: 'media' },
                    { name: '📚 Documentation/Content', value: 'docs' },
                    { name: '🔧 Mixed/Other', value: 'mixed' }
                ]
            },
            {
                type: 'checkbox',
                name: 'fileTypes',
                message: 'Which file types should be prioritized? (select multiple)',
                choices: [
                    { name: '💻 Source Code (.js, .ts, .py, .java)', value: 'source' },
                    { name: '🌐 Web Files (.html, .css, .jsx, .vue)', value: 'web' },
                    { name: '🎨 Media Files (.jpg, .png, .mp4)', value: 'media' },
                    { name: '📄 Documents (.md, .txt, .pdf)', value: 'docs' },
                    { name: '⚙️ Configuration (.json, .yaml, .env)', value: 'config' },
                    { name: '🗄️ Data Files (.csv, .xml, .sql)', value: 'data' },
                    { name: '📦 Archives (.zip, .tar.gz)', value: 'archives' }
                ],
                validate: (answer) => {
                    if (answer.length < 1) {
                        return 'Please select at least one file type.';
                    }
                    return true;
                }
            },
            {
                type: 'list',
                name: 'batchStrategy',
                message: 'Choose batch processing strategy:',
                choices: [
                    { name: '🚀 Aggressive (Large batches, faster processing)', value: 'aggressive' },
                    { name: '⚖️  Balanced (Medium batches, good performance)', value: 'balanced' },
                    { name: '🔍 Conservative (Small batches, more granular commits)', value: 'conservative' },
                    { name: '🎛️  Custom (I\'ll configure manually)', value: 'custom' }
                ]
            },
            {
                type: 'confirm',
                name: 'useConventionalCommits',
                message: 'Use Conventional Commits format?',
                default: false
            },
            {
                type: 'confirm',
                name: 'enableParallelProcessing',
                message: 'Enable parallel processing for better performance?',
                default: true
            }
        ]);
        // Create configuration
        const setupSpinner = (0, ora_1.default)('Creating configuration...').start();
        const config = (0, config_1.createDefaultConfig)(answers);
        // Write config file
        await fs_1.promises.writeFile(configPath, JSON.stringify(config, null, 2));
        setupSpinner.succeed('Configuration created successfully');
        // Create .gitignore entry if needed
        try {
            const gitignorePath = path_1.default.join(process.cwd(), '.gitignore');
            let gitignoreContent = '';
            try {
                gitignoreContent = await fs_1.promises.readFile(gitignorePath, 'utf-8');
            }
            catch {
                // .gitignore doesn't exist, create it
            }
            if (!gitignoreContent.includes('.dac.json')) {
                const addGitignore = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'add',
                        message: 'Add .dac.json to .gitignore? (recommended)',
                        default: true
                    }
                ]);
                if (addGitignore.add) {
                    const newContent = gitignoreContent + (gitignoreContent ? '\n' : '') + '\n# DAC Configuration\n.dac.json\n';
                    await fs_1.promises.writeFile(gitignorePath, newContent);
                    console.log(chalk_1.default.green('✅ Added .dac.json to .gitignore'));
                }
            }
        }
        catch (error) {
            // Ignore .gitignore errors
        }
        // Show success message
        console.log(chalk_1.default.green('\n🎉 DAC has been successfully initialized!\n') +
            chalk_1.default.white('Next steps:\n') +
            chalk_1.default.cyan('  • Run ') + chalk_1.default.yellow('dac run') + chalk_1.default.cyan(' to start batch processing\n') +
            chalk_1.default.cyan('  • Run ') + chalk_1.default.yellow('dac config') + chalk_1.default.cyan(' to modify settings\n') +
            chalk_1.default.cyan('  • Run ') + chalk_1.default.yellow('dac stats') + chalk_1.default.cyan(' to see repository analysis\n'));
        // Show configuration summary
        console.log(chalk_1.default.white('\n📋 Configuration Summary:'));
        console.log(chalk_1.default.gray(`   Project Type: ${answers.projectType}`));
        console.log(chalk_1.default.gray(`   Batch Strategy: ${answers.batchStrategy}`));
        console.log(chalk_1.default.gray(`   File Types: ${answers.fileTypes.join(', ')}`));
        console.log(chalk_1.default.gray(`   Conventional Commits: ${answers.useConventionalCommits ? 'Yes' : 'No'}`));
        console.log(chalk_1.default.gray(`   Parallel Processing: ${answers.enableParallelProcessing ? 'Yes' : 'No'}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Initialization failed:'), error.message);
        process.exit(1);
    }
}
//# sourceMappingURL=init.js.map