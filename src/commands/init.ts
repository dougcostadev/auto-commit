import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import { CommandOptions } from '../types';
import { createDefaultConfig, getPresetInfo } from '../core/config';
import { checkGitRepository, getRepositoryInfo } from '../utils/git';

export async function initCommand(options: CommandOptions): Promise<void> {
  try {
    console.log(chalk.cyan('\n🎯 Initializing Doug Auto Commit...\n'));

    const spinner = ora('Checking Git repository...').start();
    const isGitRepo = await checkGitRepository();
    
    if (!isGitRepo) {
      spinner.fail('Not a Git repository');
      console.log(chalk.red('❌ Please run this command in a Git repository.'));
      process.exit(1);
    }
    
    const repoInfo = await getRepositoryInfo();
    spinner.succeed(`Git repository detected: ${repoInfo.name}`);

    const configPath = path.join(process.cwd(), '.dacrc.json');
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (configExists && !options.force) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'DAC configuration already exists. Overwrite?',
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.yellow('⚠️  Initialization cancelled.'));
        return;
      }
    }

    console.log(chalk.green('\n🔧 Configuration Setup\n'));
    
    const answers = await inquirer.prompt([
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
        validate: (answer: string[]) => {
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
        choices: getPresetInfo()
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

    const setupSpinner = ora('Creating configuration...').start();
    const config = createDefaultConfig(answers);
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    setupSpinner.succeed('Configuration created successfully');

    try {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      let gitignoreContent = '';
      
      try {
        gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      } catch {
      }
      
      if (!gitignoreContent.includes('.dacrc.json')) {
        const addGitignore = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'add',
            message: 'Add .dacrc.json to .gitignore? (recommended)',
            default: true
          }
        ]);
        
        if (addGitignore.add) {
          const newContent = gitignoreContent + (gitignoreContent ? '\n' : '') + '\n# DAC Configuration\n.dacrc.json\n';
          await fs.writeFile(gitignorePath, newContent);
          console.log(chalk.green('✅ Added .dacrc.json to .gitignore'));
        }
      }
    } catch (error) {
    }

    console.log(
      chalk.green('\n🎉 DAC has been successfully initialized!\n') +
      chalk.white('Next steps:\n') +
      chalk.cyan('  • Run ') + chalk.yellow('dac run') + chalk.cyan(' to start batch processing\n') +
      chalk.cyan('  • Run ') + chalk.yellow('dac config') + chalk.cyan(' to modify settings\n') +
      chalk.cyan('  • Run ') + chalk.yellow('dac stats') + chalk.cyan(' to see repository analysis\n')
    );

    console.log(chalk.white('\n📋 Configuration Summary:'));
    console.log(chalk.gray(`   Project Type: ${answers.projectType}`));
    console.log(chalk.gray(`   Batch Strategy: ${answers.batchStrategy}`));
    console.log(chalk.gray(`   File Types: ${answers.fileTypes.join(', ')}`));
    console.log(chalk.gray(`   Conventional Commits: ${answers.useConventionalCommits ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`   Parallel Processing: ${answers.enableParallelProcessing ? 'Yes' : 'No'}`));

  } catch (error: any) {
    console.error(chalk.red('❌ Initialization failed:'), error.message);
    process.exit(1);
  }
}