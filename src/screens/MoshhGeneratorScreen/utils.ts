import {MediaUtils} from '../../utils';
import {MoshhVideoInfo} from './types';

export async function fetchVideoInfo(
  videoPath: string,
): Promise<MoshhVideoInfo> {
  // Get the media info
  const videoInfo = await MediaUtils.getVideoInformation(videoPath);

  // Compute the thumbnail size
  const thumbnailSize: [number, number] = [
    64,
    Math.floor(64 / videoInfo.effectiveAspectRatio),
  ];

  // Generate the thumbnail
  const thumbnail = await MediaUtils.generateThumbnail(
    videoPath,
    Math.min(5.0, videoInfo.duration),
    {
      size: thumbnailSize,
    },
  );
  if (!thumbnail) {
    console.error('no thumbnail', videoPath);
  }

  // And the info to the map, then add the main list which determines render order
  return {
    path: videoPath,
    weight: 1,
    mediaInfo: videoInfo,
    thumbnail,
  };
}
