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

export type CompressionSpeed =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow'
  | 'placebo';

export type ClipConcatInfo = {
  audioPath: string;
  startPointSecs: number;
  duration: number;
};
