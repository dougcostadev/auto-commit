#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import boxen from 'boxen';
import { initCommand } from './commands/init';
import { configCommand } from './commands/config';
import { runCommand } from './commands/run';
import { statsCommand } from './commands/stats';

const program = new Command();

function showHeader() {
  console.clear();
  const title = figlet.textSync('DAC', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });
  
  const gradientTitle = gradient.rainbow.multiline(title);
  
  console.log(gradientTitle);
  console.log(
    boxen(
      chalk.white.bold('🚀 Doug Auto Commit v1.0.0\n') +
      chalk.gray('Universal Git Commit Automation\n') +
      chalk.blue('https://github.com/dougcostadev/auto-commit'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
        backgroundColor: '#1e1e1e'
      }
    )
  );
}

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

program
  .command('init')
  .description('🎯 Initialize DAC in current repository')
  .option('-f, --force', 'force initialization even if already configured')
  .option('-c, --config <path>', 'specify custom config file location')
  .action(initCommand);

program
  .command('run')
  .description('⚡ Run intelligent batch commit automation')
  .option('-d, --dry-run', 'preview actions without executing')
  .option('-b, --batch-size <size>', 'override default batch sizes')
  .option('-t, --type <types...>', 'process only specific file types')
  .option('--skip-analysis', 'skip repository analysis')
  .action(runCommand);

program
  .command('config')
  .description('⚙️  Manage DAC configuration')
  .option('-s, --set <key=value>', 'set configuration value')
  .option('-g, --get <key>', 'get configuration value')
  .option('-l, --list', 'list all configuration')
  .option('-r, --reset', 'reset to default configuration')
  .action(configCommand);

program
  .command('stats')
  .description('📊 Show repository and processing statistics')
  .option('-d, --detailed', 'show detailed statistics')
  .option('-h, --history', 'show processing history')
  .action(statsCommand);

program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

if (!process.argv.slice(2).length) {
  showHeader();
  program.outputHelp();
}