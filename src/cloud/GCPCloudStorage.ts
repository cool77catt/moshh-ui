import {ICloudStorage, ICloudStorageBucket} from './ICloudStorage';
import {CloudStorageRef} from './types';

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

  async deleteDirectory(dirPath: string) {
    const dirItems = await this.listDirectory(dirPath);
    if (dirItems.length === 0) {
      // No more children - delete
      await this.deleteFile(dirPath);
    } else {
      // Delete its children first (meaning its a directory, which gets deleted implicityly by deleting all its contents)
      for (const item of dirItems) {
        await this.deleteDirectory(item.path);
      }
    }
  }

  listDirectory(dirPath: string) {
    return this._storage
      .ref(dirPath)
      .listAll()
      .then(contents =>
        contents.items.map<CloudStorageRef>(item => ({
          path: item.fullPath,
          name: item.name,
        })),
      );
  }
}
