import {ILocalFileStore} from './ILocalFileStore';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
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

  join(path1: string, path2: string) {
    return `${path1}/${path2}`;
  }

  absolutePathToRelative(absolutePath: string) {
    const splitPaths = absolutePath.split(this.documentDirectoryPath());
    return _.last(splitPaths)!;
  }

  absolutePath(relativePath: string) {
    return this.join(this.documentDirectoryPath(), relativePath);
  }

  documentDirectoryPath() {
    return RNFS.DocumentDirectoryPath;
  }

  makeDirectory(dirPath: string) {
    return RNFS.mkdir(this.absolutePath(dirPath));
  }

  async cleanDirectory(dirPath: string) {
    const remnants = await this.readDirectory(dirPath);
    for (var dirItem of remnants) {
      try {
        console.log('deleting clean', dirItem.name);
        await this.deleteFile(this.join(dirPath, dirItem.name));
      } catch (err) {
        console.log('error with deleting file', dirItem.name, err);
      }
    }
  }

  saveFile(absoluteSrcPath: string, relativeDstPath: string) {
    return RNFS.moveFile(absoluteSrcPath, this.absolutePath(relativeDstPath));
  }

  async readBinaryFile(relativeDstPath: string) {
    // console.log(
    //   'read binary open',
    //   relativeDstPath,
    //   this.absolutePath(relativeDstPath),
    // );

    const dataBase64 = await RNFS.readFile(
      this.absolutePath(relativeDstPath),
      'base64',
    );

    return Buffer.from(dataBase64, 'base64');
  }

  async writeFile(relativeDstPath: string, contents: string) {
    const absPath = this.absolutePath(relativeDstPath);
    await RNFS.writeFile(absPath, contents, 'utf8');
    return absPath;
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
