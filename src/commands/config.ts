import { CommandOptions, DACConfig } from '../types';
import { loadConfig, saveConfig, configExists } from '../utils/config';
import { createDefaultConfig, getPresetInfo } from '../core/config';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

export async function configCommand(options: CommandOptions): Promise<void> {
  try {
    if (!(await configExists())) {
      console.log(chalk.red('❌ DAC not initialized. Run'), chalk.yellow('dac init'), chalk.red('first.'));
      return;
    }

    if (options.list) {
      await listConfiguration();
    } else if (options.get) {
      await getConfigValue(options.get);
    } else if (options.set) {
      await setConfigValue(options.set);
    } else if (options.reset) {
      await resetConfiguration();
    } else {
      await interactiveConfig();
    }

  } catch (error: any) {
    console.error(chalk.red('❌ Error managing configuration:'), error.message);
    process.exit(1);
  }
}

async function listConfiguration(): Promise<void> {
  const spinner = ora('Loading configuration...').start();
  
  try {
    const config = await loadConfig();
    spinner.succeed('Configuration loaded');
    
    console.log(chalk.cyan('\n📋 Current DAC Configuration:\n'));
    
    console.log(chalk.blue('📦 Basic Information:'));
    console.log(`   Version: ${chalk.white(config.version)}`);
    console.log(`   Commit Template: ${chalk.white(config.commitMessage.template)}`);
    console.log(`   Conventional Commits: ${chalk.white(config.commitMessage.useConventional ? 'Yes' : 'No')}`);
    
    console.log(chalk.blue('\n⚡ Processing Settings:'));
    console.log(`   Parallel Processing: ${chalk.white(config.processing.parallel ? 'Yes' : 'No')}`);
    console.log(`   Max Concurrency: ${chalk.white(config.processing.maxConcurrency)}`);
    console.log(`   Retry Failed Pushes: ${chalk.white(config.processing.retryFailedPushes ? 'Yes' : 'No')}`);
    console.log(`   Skip Large Files: ${chalk.white(config.processing.skipLargeFiles ? 'Yes' : 'No')}`);
    console.log(`   Max File Size: ${chalk.white(formatFileSize(config.processing.maxFileSize))}`);
    console.log(`   Max Push Size: ${chalk.white(formatFileSize(config.maxPushSize))}`);
    
    console.log(chalk.blue('\n📁 File Types & Batch Sizes:'));
    Object.entries(config.fileTypes).forEach(([, typeConfig]) => {
      console.log(`   ${typeConfig.icon} ${chalk.white(typeConfig.name)}: ${chalk.yellow(typeConfig.batchSize)} files per batch`);
    });
    
    if (config.excludePatterns && config.excludePatterns.length > 0) {
      console.log(chalk.blue('\n🚫 Exclude Patterns:'));
      config.excludePatterns.forEach(pattern => {
        console.log(`   • ${chalk.white(pattern)}`);
      });
    }
    
  } catch (error: any) {
    spinner.fail('Failed to load configuration');
    throw error;
  }
}

async function getConfigValue(key: string): Promise<void> {
  const config = await loadConfig();
  const value = getNestedValue(config, key);
  
  if (value === undefined) {
    console.log(chalk.red(`❌ Configuration key '${key}' not found`));
    return;
  }
  
  console.log(chalk.cyan(`📋 ${key}:`), chalk.white(JSON.stringify(value, null, 2)));
}

async function setConfigValue(setValue: string): Promise<void> {
  const [key, ...valueParts] = setValue.split('=');
  const value = valueParts.join('=');
  
  if (!key || !value) {
    console.log(chalk.red('❌ Invalid format. Use: --set key=value'));
    return;
  }
  
  const spinner = ora(`Setting ${key}...`).start();
  
  try {
    const config = await loadConfig();
    
    let parsedValue: any;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    
    setNestedValue(config, key, parsedValue);
    
    await saveConfig(config);
    
    spinner.succeed(`✅ Set ${key} = ${value}`);
    
  } catch (error: any) {
    spinner.fail('Failed to set configuration');
    throw error;
  }
}

async function resetConfiguration(): Promise<void> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset all configuration to defaults?',
      default: false
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.yellow('⚠️  Reset cancelled'));
    return;
  }
  
  const spinner = ora('Resetting configuration...').start();
  
  try {
    const defaultConfig = createDefaultConfig();
    await saveConfig(defaultConfig);
    
    spinner.succeed('✅ Configuration reset to defaults');
    
  } catch (error: any) {
    spinner.fail('Failed to reset configuration');
    throw error;
  }
}

async function interactiveConfig(): Promise<void> {
  const config = await loadConfig();
  
  console.log(chalk.cyan('\n⚙️  Interactive Configuration Manager\n'));
  
  const { action } = await inquirer.prompt([
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

async function configureCommitSettings(config: DACConfig): Promise<void> {
  console.log(chalk.blue('\n📝 Commit Message Configuration\n'));
  
  const answers = await inquirer.prompt([
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
  await saveConfig(config);
  
  console.log(chalk.green('✅ Commit settings updated'));
}

async function configureProcessingSettings(config: DACConfig): Promise<void> {
  console.log(chalk.blue('\n⚡ Processing Configuration\n'));
  
  const answers = await inquirer.prompt([
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
      validate: (input: number) => input >= 1 && input <= 10 ? true : 'Must be between 1 and 10'
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
      validate: (input: number) => input > 0 ? true : 'Must be greater than 0'
    }
  ]);
  
  config.processing = {
    ...answers,
    maxFileSize: answers.maxFileSize * 1024 * 1024
  };
  
  await saveConfig(config);
  console.log(chalk.green('✅ Processing settings updated'));
}

async function configureBatchSizes(config: DACConfig): Promise<void> {
  console.log(chalk.blue('\n📁 Batch Size Configuration\n'));
  
  for (const [, typeConfig] of Object.entries(config.fileTypes)) {
    const { batchSize } = await inquirer.prompt([
      {
        type: 'number',
        name: 'batchSize',
        message: `${typeConfig.icon} ${typeConfig.name} batch size:`,
        default: typeConfig.batchSize,
        validate: (input: number) => input >= 1 && input <= 50 ? true : 'Must be between 1 and 50'
      }
    ]);
    
    typeConfig.batchSize = batchSize;
  }
  
  await saveConfig(config);
  console.log(chalk.green('✅ Batch sizes updated'));
}

async function configureExcludePatterns(config: DACConfig): Promise<void> {
  console.log(chalk.blue('\n🚫 Exclude Patterns Configuration\n'));
  
  if (config.excludePatterns.length > 0) {
    console.log('Current exclude patterns:');
    config.excludePatterns.forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern}`);
    });
    console.log();
  }
  
  const { action } = await inquirer.prompt([
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
      const { pattern } = await inquirer.prompt([
        {
          type: 'input',
          name: 'pattern',
          message: 'Enter exclude pattern (glob format):',
          validate: (input: string) => input.length > 0 ? true : 'Pattern cannot be empty'
        }
      ]);
      config.excludePatterns.push(pattern);
      break;
      
    case 'remove':
      if (config.excludePatterns.length === 0) {
        console.log(chalk.yellow('No patterns to remove'));
        return;
      }
      
      const { patternToRemove } = await inquirer.prompt([
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
      const { confirmClear } = await inquirer.prompt([
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
  
  await saveConfig(config);
  console.log(chalk.green('✅ Exclude patterns updated'));
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

async function configurePushSize(config: DACConfig): Promise<void> {
  console.log(chalk.cyan('\n🚀 Configure Push Size Limits\n'));
  
  console.log(chalk.gray('Current max push size:'), chalk.white(formatFileSize(config.maxPushSize)));
  console.log(chalk.gray('This limits how much data is pushed to the remote at once.\n'));
  
  const { sizeOption } = await inquirer.prompt([
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
    const { customSizeGB } = await inquirer.prompt([
      {
        type: 'number',
        name: 'customSizeGB',
        message: 'Enter maximum push size in GB:',
        default: 1,
        validate: (input: number) => {
          if (input <= 0) return 'Size must be greater than 0';
          if (input > 10) return 'Size should not exceed 10GB for practical reasons';
          return true;
        }
      }
    ]);
    
    newSize = customSizeGB * 1024 * 1024 * 1024;
  }
  
  const spinner = ora('Updating push size configuration...').start();
  
  try {
    config.maxPushSize = newSize;
    await saveConfig(config);
    
    spinner.succeed(`✅ Updated max push size to ${formatFileSize(newSize)}`);
    
    console.log(chalk.cyan('\n💡 What this means:'));
    console.log(chalk.gray('• DAC will create commits normally'));
    console.log(chalk.gray('• When accumulated size reaches'), chalk.white(formatFileSize(newSize)), chalk.gray(', it will push automatically'));
    console.log(chalk.gray('• This prevents single massive pushes that might fail'));
    
  } catch (error: any) {
    spinner.fail('Failed to update push size configuration');
    throw error;
  }
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

async function configurePreset(config: DACConfig): Promise<void> {
  console.log(chalk.blue('\n🎯 Batch Preset Configuration\n'));
  
  const { preset } = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'Choose a batch processing preset:',
      choices: getPresetInfo()
    }
  ]);
  
  const spinner = ora('Applying preset configuration...').start();
  
  try {
    const newConfig = createDefaultConfig({ batchStrategy: preset });
    
    newConfig.commitMessage = config.commitMessage;
    newConfig.processing = config.processing;
    newConfig.excludePatterns = config.excludePatterns;
    
    await saveConfig(newConfig);
    
    spinner.succeed(`✅ Applied ${preset} preset successfully`);
    
    console.log(chalk.cyan('\n📊 New batch sizes:'));
    Object.entries(newConfig.fileTypes).forEach(([, typeConfig]) => {
      console.log(`   ${typeConfig.icon} ${typeConfig.name}: ${chalk.yellow(typeConfig.batchSize)} files per batch`);
    });
    
  } catch (error: any) {
    spinner.fail('Failed to apply preset');
    throw error;
  }
}