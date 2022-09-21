import {VideoInfo} from '../../utils';

export type MoshhVideoInfo = {
  path: string;
  mediaInfo: VideoInfo;
  weight: number;
  thumbnail?: string;
};
