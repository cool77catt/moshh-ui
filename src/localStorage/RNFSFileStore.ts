import {ILocalFileStore} from './ILocalFileStore';
import RNFS from 'react-native-fs';
import {LocalReadDirItem} from './types';

class RNFSFileStore implements ILocalFileStore {
  // Static Public class properties

  // Static Private Class Properties
  static _instance: RNFSFileStore | null = null;

  static getInstance() {
    return this._instance;
  }

  static async configure() {
    if (this._instance == null) {
      this._instance = new RNFSFileStore();
      console.log(this._instance.documentDirectoryPath());
    }
    return this.getInstance();
  }

  documentDirectoryPath() {
    return RNFS.DocumentDirectoryPath;
  }

  makeDirectory(dirPath: string) {
    return RNFS.mkdir(dirPath);
  }

  saveFile(srcPath: string, dstPath: string) {
    return RNFS.moveFile(srcPath, dstPath);
  }

  readDirectory(dirPath: string) {
    return RNFS.readDir(dirPath).then(items => {
      return items.map(item => {
        return item as LocalReadDirItem; // The LocalReadDirItem we are returning matches that of the RNFS module ReadDirItem type
      });
    });
  }

  deleteFile(filePath: string) {
    return RNFS.unlink(filePath);
  }
}

export default RNFSFileStore;
