export type ReadDirItem = {
  ctime: Date; // The creation date of the file (iOS only)
  mtime: Date; // The last modified date of the file
  name: string; // The name of the item
  path: string; // The absolute path to the item
  size: string; // Size in bytes
  isFile: () => boolean; // Is the item just a file?
  isDirectory: () => boolean; // Is the item a directory?
};
