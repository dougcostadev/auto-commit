import { DACConfig } from '../types';
export declare function getConfigPath(): string;
export declare function configExists(): Promise<boolean>;
export declare function loadConfig(): Promise<DACConfig>;
export declare function saveConfig(config: DACConfig): Promise<void>;
export declare function getDefaultConfig(): DACConfig;
export declare function createDefaultConfig(): Promise<DACConfig>;
export declare function updateConfig(updates: Partial<DACConfig>): Promise<DACConfig>;
export declare function generateCommitMessage(template: string, count: number, type: string): string;
export declare function validateConfig(config: any): string[];
//# sourceMappingURL=config.d.ts.map