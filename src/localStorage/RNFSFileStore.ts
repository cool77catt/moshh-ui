import {ILocalFileStore} from './ILocalFileStore';
import RNFS from 'react-native-fs';
import _ from 'lodash';
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

  absolutePathToRelative(absolutePath: string) {
    const splitPaths = absolutePath.split(this.documentDirectoryPath());
    return _.last(splitPaths)!;
  }

  absolutePath(relativePath: string) {
    return `${this.documentDirectoryPath()}/${relativePath}`;
  }

  documentDirectoryPath() {
    return RNFS.DocumentDirectoryPath;
  }

  makeDirectory(dirPath: string) {
    return RNFS.mkdir(this.absolutePath(dirPath));
  }

  saveFile(absoluteSrcPath: string, relativeDstPath: string) {
    return RNFS.moveFile(absoluteSrcPath, this.absolutePath(relativeDstPath));
  }

  async readDirectory(relativeDirPath: string, recursive?: boolean) {
    let results: LocalReadDirItem[] = [];
    let dirList: string[] = [this.absolutePath(relativeDirPath)];
    while (dirList.length) {
      const dir = dirList.pop();
      await RNFS.readDir(dir!).then(contents => {
        contents.forEach(dirItem => {
          results.push(dirItem as LocalReadDirItem);
          if (recursive && dirItem.isDirectory()) {
            dirList.push(dirItem.path);
          }
        });
      });
    }
    return results;
  }

  deleteFile(relativeFilePath: string) {
    return RNFS.unlink(this.absolutePath(relativeFilePath));
  }
}

export default RNFSFileStore;
