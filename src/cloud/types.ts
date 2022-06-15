export interface CloudDbRecordType<Type> {
  _id: string;
  data: Type;
}

export interface CloudDbArtistType {
  name: string;
  nameLowercase: string;
}

export interface CloudDbEventType {
  name: string;
  nameLowercase: string;
  location: string;
  datetime: Date;
}

export type CloudDbFilterOperand = '==' | '<=' | '>=' | '<' | '>' | '!=' | 'in';

export interface CloudStorageRef {
  path: string;
  name: string;
}
