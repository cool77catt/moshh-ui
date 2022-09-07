import {ConstellationInfo} from '../ConstellationManager';
import {PresetType} from '../MediaUtils';

export type MoshhGeneratorOptions = {
  minSubclipDuration?: number;
  maxSubclipDuration?: number;
  outputVideoFormat?: string;
  preloadedConstellations?: ConstellationInfo[];
  preset?: PresetType;
};
