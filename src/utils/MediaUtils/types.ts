import {Log, Statistics} from 'ffmpeg-kit-react-native';

export type AudioFormatType = 'wav';

export type ExecutionInfo = {
  logs: Log[];
  failStackTrace: string;
  output: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  statistics: Statistics[];
  command?: string;
};

export type AudioData = {
  data: number[];
  rate: number;
};

export type VideoInfo = {
  width: number;
  height: number;
  aspectRatio: number;
  effectiveWidth: number; // Accounts for rotation
  effectiveHeight: number; // Accounts for rotation
  effectiveAspectRatio: number;
  rotation?: number;
  fpsString: string;
  fps: number;
  duration: number;
};

/**
 * Compression speed is the tradeoff between
 * compression quality and speed - the slower the speed,
 * the better the compression (smaller file size per quality)
 */
export type PresetType =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow';

export type PixelFormat = 'yuv420p';

export type VideoCodec = 'libx264';

export type VideoOutputOptions = {
  preset?: PresetType;
  pixelFormat?: PixelFormat;
  videoCodec?: VideoCodec;
  fps?: number;
  width?: number;
  height?: number;
  excludeAudio?: boolean;
};

export type ClipConcatInfo = {
  videoPath: string;
  startPointSecs: number;
  duration: number;
};
