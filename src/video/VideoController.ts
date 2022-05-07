import {VideoInfoType} from './types';
import {ILocalFileStore} from '../localStorage';

class VideoController {
  // static public class properties
  static DEFAULT_VIDEO_EXTENSION = 'mp4';
  static DEFAULT_VIDEO_DIRECTORY = 'videos';

  // static private dlass properties
  static _instance: VideoController | null = null;

  // private member variables
  _localFileStore: ILocalFileStore | null = null;

  static getInstance() {
    return this._instance;
  }

  static async configure(localFileStore: ILocalFileStore) {
    if (this._instance == null) {
      this._instance = new VideoController(localFileStore);
    }
    return this.getInstance();
  }

  constructor(localFileStore: ILocalFileStore) {
    this._localFileStore = localFileStore;
  }

  getVideoDirPath() {
    return `${this._localFileStore?.documentDirectoryPath()}/${
      VideoController.DEFAULT_VIDEO_DIRECTORY
    }`;
  }

  getVideoFilePath(
    videoId: string,
    videoExtension: string = VideoController.DEFAULT_VIDEO_EXTENSION,
  ) {
    return `${this.getVideoDirPath()}/${videoId}.${videoExtension}`;
  }

  saveVideo(
    srcPath: string,
    videoId: string,
    metaData: VideoInfoType | null = null,
  ) {
    // Compile the destination filename path
    const newFilepath = this.getVideoFilePath(videoId);

    // Save the file
    return this._localFileStore?.saveFile(srcPath, newFilepath)?.then(() => {
      if (metaData) {
        this.setVideoMetaData(videoId, metaData);
      }
    });
  }

  setVideoMetaData(videoId: string, metaData: VideoInfoType) {
    console.log(videoId, metaData);
  }

  uploadVideo(videoId: string) {
    console.log(videoId);
  }

  getCapturedVideosList() {
    return this._localFileStore
      ?.readDirectory(this.getVideoDirPath())
      // .then(items => {
      //   return items.map(item => {
      //     return {
      //       // userId: string;
      //       // videoId: string;
      //       // createdDateTime: Date;
      //       // artistId: string | undefined;
      //       // eventId: string | undefined;
      //       // track: string | undefined;
      //       // storageLocation: string | undefined;
      //     } as VideoInfoType;
      //   });
      // });
  }

  deleteVideo(videoId: string) {
    return this._localFileStore?.deleteFile(this.getVideoFilePath(videoId));
  }
}

export default VideoController;
