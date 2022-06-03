import {ICloudStorage, ICloudStorageBucket} from './ICloudStorage';
import storage, {
  firebase,
  FirebaseStorageTypes,
} from '@react-native-firebase/storage';

export class GCPCloudStorage implements ICloudStorage {
  getBucket(bucketName?: string) {
    return new GCPCloudStorageBucket(bucketName);
  }
}

export class GCPCloudStorageBucket implements ICloudStorageBucket {
  _storage: FirebaseStorageTypes.Module;

  constructor(bucket?: string) {
    this._storage = bucket ? firebase.app().storage(bucket) : storage();
  }

  async saveFile(srcPath: string, dstPath: string) {
    await this._storage.ref(dstPath).putFile(srcPath);
  }

  async deleteFile(dstPath: string) {
    await this._storage.ref(dstPath).delete();
  }
}
