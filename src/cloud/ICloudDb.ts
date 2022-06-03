import {CloudDbRecordType, CloudDbFilterOperand} from './types';

export interface ICloudDb {
  createCollection: <Type>(
    collectionName: string,
  ) => Promise<ICloudDbCollection<Type>>;
}

export interface ICloudDbCollection<Type> {
  nativeToDatetime: (nativeValue: any) => Date;
  create: (record: Type) => Promise<CloudDbRecordType<Type> | null>; // Returns the id of the newly created record
  set: (id: string, record: Type) => Promise<void>; // Creates or Sets the record referred to by the ID
  update: (id: string, record: Partial<Type>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  readOne: (id: string) => Promise<CloudDbRecordType<Type> | null>; // Returns null if record does not exist
  readFilterOne: (
    left: string,
    opString: CloudDbFilterOperand,
    right: any,
  ) => Promise<CloudDbRecordType<Type> | null>;
  readAll: () => Promise<CloudDbRecordType<Type>[]>;
  readFilter: (
    left: string,
    opString: CloudDbFilterOperand,
    right: any,
  ) => Promise<CloudDbRecordType<Type>[]>; // Returns an empty list if does not exist
}
