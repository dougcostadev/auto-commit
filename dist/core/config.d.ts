import { DACConfig } from '../types';
export type BatchPreset = 'conservative' | 'balanced' | 'aggressive';
export interface PresetMultipliers {
    conservative: number;
    balanced: number;
    aggressive: number;
}
export declare function createDefaultConfig(answers?: any): DACConfig;
export declare function getPresetInfo(): Array<{
    value: BatchPreset;
    name: string;
    description: string;
}>;
export declare function getPresetDescription(preset: BatchPreset): string;
export declare function getPresetMultiplier(preset: BatchPreset): number;
//# sourceMappingURL=config.d.ts.map