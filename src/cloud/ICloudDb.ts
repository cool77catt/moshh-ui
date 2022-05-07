export interface ICloudDb {
  getRecords: (dbName: string) => Promise<void>;
}
