import {LocalReadDirItem} from './types';

export interface ILocalFileStore {
  documentDirectoryPath: () => string;
  makeDirectory: (dirPath: string) => Promise<void>;
  saveFile: (srcPath: string, dstPath: string) => Promise<void>;
  readDirectory: (dirPath: string) => Promise<LocalReadDirItem[]>;
  deleteFile: (filePath: string) => Promise<void>;
}
