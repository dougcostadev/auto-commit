#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const gradient_string_1 = __importDefault(require("gradient-string"));
const boxen_1 = __importDefault(require("boxen"));
const init_1 = require("./commands/init");
const config_1 = require("./commands/config");
const run_1 = require("./commands/run");
const stats_1 = require("./commands/stats");
const program = new commander_1.Command();
// ASCII Art Header
function showHeader() {
    console.clear();
    const title = figlet_1.default.textSync('DAC', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default',
    });
    const gradientTitle = gradient_string_1.default.rainbow.multiline(title);
    console.log(gradientTitle);
    console.log((0, boxen_1.default)(chalk_1.default.white.bold('🚀 Doug Auto Commit v1.0.0\n') +
        chalk_1.default.gray('Universal Git Commit Automation\n') +
        chalk_1.default.blue('https://github.com/dougcostadev/auto-commit'), {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
        backgroundColor: '#1e1e1e'
    }));
}
// CLI Configuration
program
    .name('dac')
    .description('🚀 Doug Auto Commit - Universal Git Commit Automation')
    .version('1.0.0', '-v, --version', 'display version number')
    .option('-q, --quiet', 'run in quiet mode')
    .option('--no-header', 'skip header display')
    .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (!opts.noHeader && !opts.quiet) {
        showHeader();
    }
});
// Commands
program
    .command('init')
    .description('🎯 Initialize DAC in current repository')
    .option('-f, --force', 'force initialization even if already configured')
    .option('-c, --config <path>', 'specify custom config file location')
    .action(init_1.initCommand);
program
    .command('run')
    .description('⚡ Run intelligent batch commit automation')
    .option('-d, --dry-run', 'preview actions without executing')
    .option('-b, --batch-size <size>', 'override default batch sizes')
    .option('-t, --type <types...>', 'process only specific file types')
    .option('--skip-analysis', 'skip repository analysis')
    .action(run_1.runCommand);
program
    .command('config')
    .description('⚙️  Manage DAC configuration')
    .option('-s, --set <key=value>', 'set configuration value')
    .option('-g, --get <key>', 'get configuration value')
    .option('-l, --list', 'list all configuration')
    .option('-r, --reset', 'reset to default configuration')
    .action(config_1.configCommand);
program
    .command('stats')
    .description('📊 Show repository and processing statistics')
    .option('-d, --detailed', 'show detailed statistics')
    .option('-h, --history', 'show processing history')
    .action(stats_1.statsCommand);
// Global error handler
program.exitOverride();
try {
    program.parse();
}
catch (error) {
    if (error.code !== 'commander.help' && error.code !== 'commander.version') {
        console.error(chalk_1.default.red('❌ Error:'), error.message);
        process.exit(1);
    }
}
// Show help if no command provided
if (!process.argv.slice(2).length) {
    showHeader();
    program.outputHelp();
}
//# sourceMappingURL=cli.js.map