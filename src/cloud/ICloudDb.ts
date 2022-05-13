import {CloudDbRecordType} from './types';

export interface ICloudDb {
  createCollection: <Type>(
    collectionName: string,
  ) => Promise<ICloudDbCollection<Type>>;
}

export interface ICloudDbCollection<Type> {
  nativeToDatetime: (nativeValue: any) => Date;
  readAll: () => Promise<CloudDbRecordType<Type>[]>;
}
