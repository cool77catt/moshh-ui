import {VideoMetaData} from './types';
import {ILocalFileStore, ILocalDb, ILocalDbCollection} from '../localStorage';
import {
  ICloudDb,
  ICloudDbCollection,
  ICloudStorage,
  ICloudStorageBucket,
} from '../cloud';
import UserController from './UserController';

class VideoController {
  // static public class properties
  static DEFAULT_VIDEO_EXTENSION = 'mp4';
  static DEFAULT_VIDEO_DIRECTORY = 'videos';
  static DEFAULT_DB_NAME = 'videos';
  static CLOUD_DB_COLLECTION_NAME = 'Videos';
  static VIDEO_BUCKET_NAME = 'videos';

  // static private dlass properties
  static _instance: VideoController | null = null;

  // private member variables
  _localFileStore: ILocalFileStore | null = null;
  _localDb: ILocalDb | null = null;
  _localDbCollection: ILocalDbCollection | null = null;
  _cloudBucket: ICloudStorageBucket;
  _cloudDb: ICloudDb;
  _cloudDbCollection: ICloudDbCollection<VideoMetaData> | null = null;
  _userController: UserController;

  static getInstance() {
    return this._instance;
  }

  static async configure(
    localFileStore: ILocalFileStore,
    localDb: ILocalDb,
    cloudStorage: ICloudStorage,
    cloudDb: ICloudDb,
    userController: UserController,
  ) {
    if (this._instance == null) {
      this._instance = new VideoController(
        localFileStore,
        localDb,
        cloudStorage,
        cloudDb,
        userController,
      );
      await this._instance.setupLocalDbCollection();
      await this._instance.setupCloudDbCollection();
    }
    return this.getInstance();
  }

  constructor(
    localFileStore: ILocalFileStore,
    localDb: ILocalDb,
    cloudStorage: ICloudStorage,
    cloudDb: ICloudDb,
    userController: UserController,
  ) {
    this._localFileStore = localFileStore;
    this._localDb = localDb;
    this._cloudBucket = cloudStorage.getBucket();
    this._cloudDb = cloudDb;
    this._userController = userController;
  }

  async setupLocalDbCollection() {
    if (this._localDb) {
      this._localDbCollection = await this._localDb.createCollection(
        VideoController.DEFAULT_DB_NAME,
      );
    }
  }

  async setupCloudDbCollection() {
    if (this._cloudDb) {
      this._cloudDbCollection = await this._cloudDb.createCollection(
        VideoController.CLOUD_DB_COLLECTION_NAME,
      );
    }
  }

  getVideoDirPath(userId: string) {
    return `${this._localFileStore?.documentDirectoryPath()}/${userId}/${
      VideoController.DEFAULT_VIDEO_DIRECTORY
    }`;
  }

  getVideoFilePath(
    userId: string,
    videoId: string,
    videoExtension: string = VideoController.DEFAULT_VIDEO_EXTENSION,
  ) {
    return `${this.getVideoDirPath(userId)}/${videoId}.${videoExtension}`;
  }

  getVideoCloudRoot(videoId: string) {
    return `${VideoController.VIDEO_BUCKET_NAME}/library/${videoId}`;
  }

  getVideoCloudFilePath(
    videoId: string,
    extension: string = VideoController.DEFAULT_VIDEO_EXTENSION,
  ) {
    return `${this.getVideoCloudRoot(videoId)}/${videoId}.${extension}`;
  }

  stringToMetaData(metaDataStr: string) {
    let results = JSON.parse(metaDataStr) as VideoMetaData;

    // Convert the created datetime to a Date object, as it comes out as a string
    results.createdDateTime = new Date(results.createdDateTime);
    return results;
  }

  async saveVideo(srcPath: string, videoId: string, metaData: VideoMetaData) {
    // Compile the destination filename path
    const newFilepath = this.getVideoFilePath(metaData.userId, videoId);

    // Save the file
    return this._localFileStore?.saveFile(srcPath, newFilepath)?.then(() => {
      return this.setVideoMetaData(videoId, metaData);
    });
  }

  async getVideoMetaData(videoId: string) {
    let results: VideoMetaData | null = null;
    const recordString = await this._localDbCollection?.read(videoId);
    if (recordString) {
      results = this.stringToMetaData(recordString);

      // Convert the created datetime to a Date object, as it comes out as a string
      results.createdDateTime = new Date(results.createdDateTime);
    }
    return results;
  }

  async setVideoMetaData(videoId: string, metaData: VideoMetaData) {
    let dbRecord: VideoMetaData | null = null;

    let existingMeta = await this.getVideoMetaData(videoId);
    if (existingMeta) {
      dbRecord = {
        ...existingMeta,
        ...metaData,
      };
    } else {
      dbRecord = metaData;
    }

    return this._localDbCollection?.write(videoId, JSON.stringify(dbRecord));
  }

  async isVideoUploaded(videoId: string) {
    let result = false;

    // Check if the record exists
    if (this._cloudDbCollection) {
      const rec = await this._cloudDbCollection.readOne(videoId);
      if (rec && rec.data) {
        result = true;
      }
    }

    return result;
  }

  async getCapturedVideosList(userId: string) {
    let results: VideoMetaData[] = [];
    let vidIds: string[] = [];

    // Pull videos recorded in the realm database
    if (this._localDbCollection) {
      results = await this._localDbCollection.readAll().then(videoList => {
        return videoList.map<VideoMetaData>(item => {
          return this.stringToMetaData(item.value);
        });
      });

      // Record the ids for quick searching
      vidIds = results.map(meta => meta.videoId as string);
    }

    // Pull videos that exist in the filesystem that weren't in the realm db
    if (this._localFileStore) {
      let temp = await this._localFileStore
        .readDirectory(this.getVideoDirPath(userId))
        .then(dirItems =>
          dirItems
            .map(item => {
              return {
                userId,
                videoId: item.name.split('.')[0],
                createdDateTime: item.ctime,
              } as VideoMetaData;
            })
            .filter(
              item => !vidIds.includes(item.videoId) && item.videoId !== '',
            ),
        );

      // concat the results
      results = results.concat(temp);
    }

    return results;
  }

  async uploadVideo(
    userId: string,
    metaData: VideoMetaData,
    localPath: string,
  ) {
    // Save to storage
    console.log('saving', metaData.videoId);
    const dstPath = this.getVideoCloudFilePath(metaData.videoId);
    await this._cloudBucket.saveFile(localPath, dstPath);

    // Save the root path
    metaData.cloudStorageRootPath = this.getVideoCloudRoot(metaData.videoId);

    // Save to cloud db
    if (this._cloudDbCollection) {
      const existingRec = await this._cloudDbCollection.readOne(
        metaData.videoId,
      );
      if (!existingRec || !existingRec.data) {
        await this._cloudDbCollection!.set(metaData.videoId, metaData);
      } else {
        console.log('already saved in the database');
      }
    }

    // Add to users list
    await this._userController.addVideoToUser(userId, metaData.videoId);
  }

  async deleteVideo(
    userId: string,
    videoId: string,
    deleteFromCloud: boolean = false,
  ) {
    // Delete from the local file store
    // Remove from realm
    await this._localDbCollection?.delete(videoId);

    // Delete the file
    await this._localFileStore?.deleteFile(
      this.getVideoFilePath(userId, videoId),
    );

    // Delete from cloud
    if (deleteFromCloud) {
      // Delete from cloud storage
      await this._cloudBucket.deleteFile(this.getVideoCloudFilePath(videoId));

      // Remove the video from the user
      await this._userController.removeVideoFromUser(userId, videoId);

      // Remove from the database
      await this._cloudDbCollection?.delete(videoId);
    }
  }
}

export default VideoController;
