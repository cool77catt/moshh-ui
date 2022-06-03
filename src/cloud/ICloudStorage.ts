export interface ICloudStorage {
  getBucket: (bucketName?: string) => ICloudStorageBucket;
}

export interface ICloudStorageBucket {
  saveFile: (srcPath: string, dstPath: string) => Promise<void>;
  deleteFile: (dstPath: string) => Promise<void>;
}
