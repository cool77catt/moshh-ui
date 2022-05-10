import {VideoDbSchema, VideoMetaData} from './types';
import {ILocalFileStore, ILocalDb, ILocalDbCollection} from '../localStorage';

class VideoController {
  // static public class properties
  static DEFAULT_VIDEO_EXTENSION = 'mp4';
  static DEFAULT_VIDEO_DIRECTORY = 'videos';
  static DEFAULT_DB_NAME = 'videos';

  // static private dlass properties
  static _instance: VideoController | null = null;

  // private member variables
  _localFileStore: ILocalFileStore | null = null;
  _localDb: ILocalDb | null = null;
  _localDbCollection: ILocalDbCollection | null = null;

  static getInstance() {
    return this._instance;
  }

  static async configure(localFileStore: ILocalFileStore, localDb: ILocalDb) {
    if (this._instance == null) {
      this._instance = new VideoController(localFileStore, localDb);
      await this._instance.setupLocalDbCollection();
    }
    return this.getInstance();
  }

  constructor(localFileStore: ILocalFileStore, localDb: ILocalDb) {
    this._localFileStore = localFileStore;
    this._localDb = localDb;
  }

  async setupLocalDbCollection() {
    if (this._localDb) {
      this._localDbCollection = await this._localDb.createCollection(
        VideoController.DEFAULT_DB_NAME,
      );
    }
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

  async saveVideo(
    srcPath: string,
    videoId: string,
    userId: string,
    createdDateTime: Date | null = null,
  ) {
    // Compile the destination filename path
    const newFilepath = this.getVideoFilePath(videoId);

    // Set the initial meta data
    if (!createdDateTime) {
      createdDateTime = new Date();
    }
    const metaData: VideoMetaData = {
      userId,
      createdDateTime: createdDateTime,
    };

    // Save the file
    return this._localFileStore?.saveFile(srcPath, newFilepath)?.then(() => {
      return this.setVideoMetaData(videoId, metaData!);
    });
  }

  async setVideoMetaData(videoId: string, metaData: VideoMetaData) {
    let dbRecord: VideoDbSchema | null = null;

    if (this._localDbCollection) {
      // Build on top of the previous record if it exists
      const recordString = await this._localDbCollection.read(videoId);
      if (recordString) {
        dbRecord = {
          ...(JSON.parse(recordString) as VideoDbSchema),
          ...metaData,
        };
      } else {
        // Set the default db record because its never been set before
        dbRecord = {
          videoId,
          ...metaData,
        };
      }

      this._localDbCollection.write(videoId, JSON.stringify(dbRecord));
    }
  }

  uploadVideo(videoId: string) {
    console.log(videoId);
  }

  async getCapturedVideosList() {
    let result: VideoDbSchema[] = [];
    if (this._localDbCollection) {
      result = await this._localDbCollection.readAll().then(videoList => {
        return videoList.map<VideoDbSchema>(item => {
          return JSON.parse(item.value) as VideoDbSchema;
        });
      });
    }
    return result;
  }

  deleteVideo(videoId: string) {
    return this._localFileStore
      ?.deleteFile(this.getVideoFilePath(videoId))
      .then(() => {
        // Remove from the local db
        return this._localDbCollection?.delete(videoId);
      });
  }
}

export default VideoController;
