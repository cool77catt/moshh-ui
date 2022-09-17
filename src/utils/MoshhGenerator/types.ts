import {ConstellationInfo} from '../ConstellationManager';
import {PresetType, PixelFormat, VideoCodec} from '../MediaUtils';

export type MoshhGeneratorOptions = {
  outputVideoPath?: string;
  minSubclipDuration?: number;
  maxSubclipDuration?: number;
  outputVideoFormat?: string;
  preloadedConstellations?: ConstellationInfo[];
  statusCallback?: MoshhGeneratorProgressCallback;
};

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
