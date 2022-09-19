import {ConstellationInfo} from '../ConstellationManager';
import {PresetType, PixelFormat, VideoCodec} from '../MediaUtils';

export type MoshhGeneratorOutputOptions = {
  preset?: PresetType;
  output_pix_fmt?: PixelFormat;
  video_codec?: VideoCodec;
  fps?: number;
  width?: number;
  height?: number;
};

export enum MoshhGeneratorProgressStatus {
  ExtractingAudio,
  GeneratingConstellations,
  CalculatingOffsets,
  CompilingVideo,
  FadingAudios,
  MergingAudios,
  OverlayingAudios,
  CleaningUp,
  Finished,
}

export type MoshhGeneratorProgressCallback = (
  status: MoshhGeneratorProgressStatus,
  statusMessage: string,
) => void;

export type MoshhOutputVideoFormat = 'mov';

export type MoshhGeneratorOptions = {
  minSubclipDuration?: number;
  maxSubclipDuration?: number;
  outputVideoFormat?: MoshhOutputVideoFormat;
  preloadedConstellations?: ConstellationInfo[];
  statusCallback?: MoshhGeneratorProgressCallback | null;
};
