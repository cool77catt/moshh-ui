import _ from 'lodash';
import {createThumbnail} from 'react-native-create-thumbnail';
import {VideoMetaData, VideoMetaDataLocalExt} from './types';
import {ILocalFileStore, ILocalDb, ILocalDbCollection} from '../localStorage';
import {
  ICloudDb,
  ICloudDbCollection,
  ICloudStorage,
  ICloudStorageBucket,
} from '../cloud';
import UserController from './UserController';
import {generateUUID} from '../utils/uuid';

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
  _currentUserId?: string;

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

  static generateNewId() {
    return generateUUID();
  }

  async setCurrentUserId(userId: string) {
    this._currentUserId = userId;
    if (this._localFileStore) {
      await this._localFileStore.makeDirectory(this.getUserDirPath(userId));
      await this._localFileStore.makeDirectory(this.getVideoDirPath(userId));
    }
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

  getUserDirPath(userId: string) {
    return `${userId}`;
  }

  getVideoDirPath(userId: string) {
    return `${this.getUserDirPath(userId)}/${
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

  getAbsolutePath(metaData: VideoMetaDataLocalExt) {
    if (this._localFileStore && metaData.localFilepath) {
      return this._localFileStore.absolutePath(metaData.localFilepath);
    }
  }

  convertMetaDataTimestamps(metaData: VideoMetaData) {
    metaData.createdDateTime = new Date(metaData.createdDateTime);
    return metaData;
  }

  formatMetaDataFromCloud(metaData: VideoMetaData) {
    if (this._cloudDbCollection) {
      metaData.createdDateTime = this._cloudDbCollection?.nativeToDatetime(
        metaData.createdDateTime,
      );
    }
    return metaData;
  }

  stringToLocalMetaData(metaDataStr: string) {
    let metaData = JSON.parse(metaDataStr) as VideoMetaDataLocalExt;

    // Convert the created datetime to a Date object, as it comes out as a string
    metaData.base = this.convertMetaDataTimestamps(metaData.base);
    return metaData;
  }

  metaDataToLocalExt(
    metaData: VideoMetaData,
    localFilepath?: string,
  ): VideoMetaDataLocalExt {
    return {
      base: metaData,
      localFilepath,
    };
  }

  async readLocalMetaData(videoId: string) {
    let results: VideoMetaDataLocalExt | null = null;
    const recordString = await this._localDbCollection?.read(videoId);
    if (recordString) {
      results = this.stringToLocalMetaData(recordString);

      // Convert the created datetime to a Date object, as it comes out as a string
      results.base.createdDateTime = new Date(results.base.createdDateTime);
    }
    return results;
  }

  async writeLocalMetaData(metaData: VideoMetaDataLocalExt) {
    let dbRecord: VideoMetaDataLocalExt | null = null;

    let existingMeta = await this.readLocalMetaData(metaData.base.videoId);
    if (existingMeta) {
      dbRecord = {
        ...existingMeta,
        ...metaData,
      };
    } else {
      dbRecord = metaData;
    }

    return this._localDbCollection?.write(
      metaData.base.videoId,
      JSON.stringify(dbRecord),
    );
  }

  async getAllUserVideos(userId: string) {
    // Returns a list of VideoMetaDataLocalExt
    // If the video is stored in the cloud only and not locally, the
    // localFilepath field will not be set

    // Get the videos in the cloud.
    const cloudVids = await this.getCloudVideos(userId);

    // Get the local videos.
    const localVids = await this.getLocalVideos(userId);

    // Merge the lists
    let finalResults: VideoMetaDataLocalExt[];
    if (!cloudVids || cloudVids.length === 0) {
      finalResults = localVids;
    } else {
      // Separate the ids into cloud only, local only, and interstection
      const cloudIds = cloudVids.map(meta => meta.videoId);
      const localIds = localVids.map(meta => meta.base.videoId);
      const localOnlyIds = _.difference(localIds, cloudIds);
      const cloudOnlyIds = _.difference(cloudIds, localIds);
      const interIds = _.intersection(localIds, cloudIds);

      // Pull all videos that are in cloud but not local
      finalResults = cloudVids
        .filter(meta => cloudOnlyIds.includes(meta.videoId))
        .map(meta => this.metaDataToLocalExt(meta));

      // Pull all videos that are in local but not cloud
      finalResults = finalResults.concat(
        localVids.filter(meta => localOnlyIds.includes(meta.base.videoId)),
      );

      // Merge all videos that show up in both (assume local meta data is more up-to-date)
      finalResults = finalResults.concat(
        interIds.map(videoId => {
          const cloudVid = cloudVids.filter(m => m.videoId === videoId)[0];
          const localVid = localVids.filter(m => m.base.videoId === videoId)[0];

          // Merge the data (base must be treated separately)
          return {
            ...localVid,
            base: {
              ...cloudVid,
              ...localVid.base,
            },
          };
        }),
      );
    }
    return finalResults;
  }

  async getCloudVideos(userId: string) {
    return this._cloudDbCollection
      ?.readFilter('userId', '==', userId)
      .then(recs =>
        recs.map<VideoMetaData>(rec => {
          // Note, the localFilepath field should be undefined
          return this.formatMetaDataFromCloud(rec.data);
        }),
      );
  }

  async getLocalVideos(userId: string) {
    let results: VideoMetaDataLocalExt[] = [];
    let vidIds: string[] = [];

    // Pull videos recorded in the realm database
    if (this._localDbCollection) {
      results = await this._localDbCollection.readAll().then(videoList => {
        return videoList.map<VideoMetaDataLocalExt>(item => {
          let rec = this.stringToLocalMetaData(item.value);

          if (!rec.base) {
            // Video is old schema, need to convert to new schema
            rec = {
              base: rec as unknown as VideoMetaData,
            };
          }

          if (!rec.localFilepath) {
            // Set the default path if it is not set (mainly a backwards compatibility issue)
            rec.localFilepath = this.getVideoFilePath(
              rec.base.userId,
              rec.base.videoId,
              VideoController.DEFAULT_VIDEO_EXTENSION,
            );
          } else {
            if (rec.localFilepath[0] === '/') {
              const relPath = _.last(rec.localFilepath.split('Documents/'));
              rec.localFilepath = relPath;
            }
          }
          return rec;
        });
      });

      // Record the ids for quick searching
      vidIds = results.map(meta => meta.base.videoId as string);
    }

    // Pull videos that exist in the filesystem that weren't in the realm db
    if (this._localFileStore) {
      let temp = await this._localFileStore
        .readDirectory(this.getVideoDirPath(userId))
        .then(dirItems =>
          dirItems
            .map(item => {
              return {
                base: {
                  userId,
                  videoId: item.name.split('.')[0],
                  createdDateTime: item.ctime,
                },
                localFilepath: this._localFileStore!.absolutePathToRelative(
                  item.path,
                ),
              } as VideoMetaDataLocalExt;
            })
            .filter(
              item =>
                !vidIds.includes(item.base.videoId) && item.base.videoId !== '',
            ),
        );

      // concat the results
      results = results.concat(temp);
    }

    return results;
  }

  async getThumbnail(metaData: VideoMetaDataLocalExt) {
    if (metaData.localFilepath && this._localFileStore) {
      const absPath = await this._localFileStore.absolutePath(
        metaData.localFilepath,
      );
      return createThumbnail({
        url: absPath,
        timeStamp: 1000,
      });
    }
    return null;
  }

  async saveVideoLocally(srcPath: string, metaData: VideoMetaData) {
    const extension = _.last(srcPath.split('.'));
    const extMetaData: VideoMetaDataLocalExt = {
      base: metaData,
      localFilepath: this.getVideoFilePath(
        metaData.userId,
        metaData.videoId,
        extension,
      ),
    };
    console.log('saving video locally', extMetaData);
    return this._localFileStore
      ?.saveFile(srcPath, extMetaData.localFilepath!)
      .then(() => this.writeLocalMetaData(extMetaData))
      .then(() => extMetaData);
  }

  async isVideoUploaded(metaData: VideoMetaDataLocalExt) {
    return metaData.base.cloudStorageRootPath &&
      metaData.base.cloudStorageRootPath !== ''
      ? true
      : false;
  }

  async uploadVideo(userId: string, metaData: VideoMetaDataLocalExt) {
    if (!metaData.localFilepath) {
      console.log('uploadVideo: no local filepath for', metaData.base.videoId);
      return;
    }

    // Save to storage
    console.log('saving', metaData.base.videoId);
    const extension = _.last(metaData.localFilepath.split('.'))?.toLowerCase();
    const dstPath = this.getVideoCloudFilePath(
      metaData.base.videoId,
      extension,
    );
    await this._cloudBucket.saveFile(this.getAbsolutePath(metaData)!, dstPath);

    // Save the root path
    metaData.base.cloudStorageRootPath = this.getVideoCloudRoot(
      metaData.base.videoId,
    );

    // Save to cloud db
    if (this._cloudDbCollection) {
      await this._cloudDbCollection!.set(metaData.base.videoId, metaData.base);
      // const existingRec = await this._cloudDbCollection.readOne(
      //   metaData.videoId,
      // );
      // if (!existingRec || !existingRec.data) {
      // await this._cloudDbCollection!.set(metaData.videoId, metaData);
      // } else {
      //   console.log('already saved in the database');
      // }
    }

    // Add to users list
    await this._userController.addVideoToUser(userId, metaData.base.videoId);
  }

  async deleteVideo(
    metaData: VideoMetaDataLocalExt,
    deleteFromCloud: boolean = false,
  ) {
    // Delete from the local file store
    let errorList: Error[] = [];

    // Remove from realm
    console.log('delete', metaData);
    await this._localDbCollection?.delete(metaData.base.videoId).catch(err => {
      errorList.push(err);
    });

    // Delete the file
    if (metaData.localFilepath) {
      console.log('delete file');
      await this._localFileStore
        ?.deleteFile(metaData.localFilepath)
        .catch(err => {
          errorList.push(err);
        });
    }

    // Delete from cloud
    if (deleteFromCloud) {
      // Delete from cloud storage
      console.log('delete dir', this.getVideoCloudRoot(metaData.base.videoId));
      await this._cloudBucket
        .deleteDirectory(this.getVideoCloudRoot(metaData.base.videoId))
        .catch(err => {
          errorList.push(err);
        });

      // Remove the video from the user
      await this._userController
        .removeVideoFromUser(metaData.base.userId, metaData.base.videoId)
        .catch(err => {
          errorList.push(err);
        });

      // Remove from the database
      await this._cloudDbCollection
        ?.delete(metaData.base.videoId)
        .catch(err => {
          errorList.push(err);
        });
    }

    if (errorList.length > 0) {
      throw errorList;
    }
  }
}

export default VideoController;
