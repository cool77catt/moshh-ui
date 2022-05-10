// Interface for local databse storage.
// To keep it flexible for multiple types of db's as well simplicity,
// implementation is abstracted to be a <key, value> db where the value
// is limited to a string represetnation of the value.
export interface ILocalDb {
  createCollection: (collectionName: string) => Promise<ILocalDbCollection>;
}

export interface ILocalDbCollection {
  write: (key: string, value: string) => Promise<void>;
  read: (key: string) => Promise<string | null>;
  readAll: () => Promise<LocalDbRecord[]>;
  delete: (key: string) => Promise<void>;
}

export interface LocalDbRecord {
  key: string;
  value: string;
}
