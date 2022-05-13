export interface CloudDbRecordType<Type> {
  _id: string;
  data: Type;
}

export interface CloudDbArtistType {
  name: string;
  name_lowercase: string;
}

export interface CloudDbEventType {
  name: string;
  location: string;
  datetime: Date;
}
