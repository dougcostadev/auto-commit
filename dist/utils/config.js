"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigPath = getConfigPath;
exports.configExists = configExists;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.getDefaultConfig = getDefaultConfig;
exports.createDefaultConfig = createDefaultConfig;
exports.updateConfig = updateConfig;
exports.generateCommitMessage = generateCommitMessage;
exports.validateConfig = validateConfig;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const config_1 = require("../core/config");
const CONFIG_FILE_NAME = '.dacrc.json';
function getConfigPath() {
    return path_1.default.join(process.cwd(), CONFIG_FILE_NAME);
}
async function configExists() {
    try {
        await fs_1.promises.access(getConfigPath());
        return true;
    }
    catch {
        return false;
    }
}
async function loadConfig() {
    const configPath = getConfigPath();
    try {
        const configData = await fs_1.promises.readFile(configPath, 'utf-8');
        return JSON.parse(configData);
    }
    catch (error) {
        throw new Error(`Failed to load configuration: ${error}`);
    }
}
async function saveConfig(config) {
    const configPath = getConfigPath();
    try {
        const configData = JSON.stringify(config, null, 2);
        await fs_1.promises.writeFile(configPath, configData, 'utf-8');
    }
    catch (error) {
        throw new Error(`Failed to save configuration: ${error}`);
    }
}
function getDefaultConfig() {
    return (0, config_1.createDefaultConfig)();
}
async function createDefaultConfig() {
    const config = getDefaultConfig();
    await saveConfig(config);
    return config;
}
async function updateConfig(updates) {
    const currentConfig = await loadConfig();
    const newConfig = { ...currentConfig, ...updates };
    await saveConfig(newConfig);
    return newConfig;
}
function generateCommitMessage(template, count, type) {
    return template
        .replace('{count}', count.toString())
        .replace('{type}', type.toLowerCase())
        .replace('{files}', count === 1 ? 'file' : 'files');
}
function validateConfig(config) {
    const errors = [];
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
//# sourceMappingURL=config.js.map