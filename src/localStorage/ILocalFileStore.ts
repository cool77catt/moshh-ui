import {LocalReadDirItem} from './types';
import {Buffer} from 'buffer';

/**
 * Note => all paths are RELATIVE to the apps directory path!
 * This was necessary because xcode debug builds a separate applciation folder
 * for every build/run.  While it retains the data, the application directory path
 * changes for each build, so you can't maintain absolutely paths.
 */
export interface ILocalFileStore {
  absolutePath: (relativePath: string) => string;
  absolutePathToRelative: (absolutePath: string) => string;
  documentDirectoryPath: () => string;
  makeDirectory: (dirPath: string) => Promise<void>;
  saveFile: (absoluteSrcPath: string, relativeDstPath: string) => Promise<void>;
  writeFile: (relativeDstPath: string, contents: string) => Promise<string>;
  readBinaryFile: (relativeDstPath: string) => Promise<Buffer>;
  readDirectory: (relativeDirPath: string) => Promise<LocalReadDirItem[]>;
  deleteFile: (relativeFilePath: string) => Promise<void>;
}
