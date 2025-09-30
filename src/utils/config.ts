import { promises as fs } from 'fs';
import path from 'path';
import { DACConfig } from '../types';
import { createDefaultConfig as createCoreDefaultConfig } from '../core/config';

const CONFIG_FILE_NAME = '.dacrc.json';

export function getConfigPath(): string {
  return path.join(process.cwd(), CONFIG_FILE_NAME);
}

export async function configExists(): Promise<boolean> {
  try {
    await fs.access(getConfigPath());
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(): Promise<DACConfig> {
  const configPath = getConfigPath();
  
  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configData) as DACConfig;
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error}`);
  }
}

export async function saveConfig(config: DACConfig): Promise<void> {
  const configPath = getConfigPath();
  
  try {
    const configData = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, configData, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save configuration: ${error}`);
  }
}

export function getDefaultConfig(): DACConfig {
  return createCoreDefaultConfig();
}

export async function createDefaultConfig(): Promise<DACConfig> {
  const config = getDefaultConfig();
  await saveConfig(config);
  return config;
}

export async function updateConfig(updates: Partial<DACConfig>): Promise<DACConfig> {
  const currentConfig = await loadConfig();
  const newConfig = { ...currentConfig, ...updates };
  await saveConfig(newConfig);
  return newConfig;
}

export function generateCommitMessage(template: string, count: number, type: string): string {
  return template
    .replace('{count}', count.toString())
    .replace('{type}', type.toLowerCase())
    .replace('{files}', count === 1 ? 'file' : 'files');
}

export function validateConfig(config: any): string[] {
  const errors: string[] = [];
  
  if (!config.projectName || typeof config.projectName !== 'string') {
    errors.push('Project name must be a non-empty string');
  }
  
  if (!Array.isArray(config.fileTypes)) {
    errors.push('File types must be an array');
  }
  
  if (typeof config.batchSize !== 'number' || config.batchSize < 1) {
    errors.push('Batch size must be a positive number');
  }
  
  if (!config.commitTemplate || typeof config.commitTemplate !== 'string') {
    errors.push('Commit template must be a non-empty string');
  }
  
  if (!Array.isArray(config.excludePatterns)) {
    errors.push('Exclude patterns must be an array');
  }
  
  if (typeof config.delayBetweenCommits !== 'number' || config.delayBetweenCommits < 0) {
    errors.push('Delay between commits must be a non-negative number');
  }
  
  if (typeof config.maxFileSize !== 'number' || config.maxFileSize <= 0) {
    errors.push('Max file size must be a positive number');
  }
  
  return errors;
}