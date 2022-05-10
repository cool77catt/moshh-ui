import {ILocalDb, ILocalDbCollection, LocalDbRecord} from './ILocalDb';
import Realm from 'realm';

interface _RecordType {
  _id: string;
  value: string;
}

export class RealmDb implements ILocalDb {
  // private members

  createCollection(collectionName: string) {
    const schema: Realm.ObjectSchema = {
      name: collectionName,
      properties: {
        _id: 'string',
        value: 'string',
      },
      primaryKey: '_id',
    };

    return Realm.open({
      path: `${collectionName}.realm`,
      schema: [schema],
    }).then(realm => {
      return new RealmDbCollection(realm, schema);
    });
  }
}

export class RealmDbCollection implements ILocalDbCollection {
  // private members
  _realm: Realm;
  _schema: Realm.ObjectSchema;

  constructor(realm: Realm, schema: Realm.ObjectSchema) {
    this._realm = realm;
    this._schema = schema;
  }

  async write(key: string, value: string) {
    const record = {
      _id: key,
      value: value,
    };

    const results = this._getRealmObject(key);

    this._realm.write(() => {
      if (results.isEmpty()) {
        this._realm.create(this._schema.name, record);
      } else {
        (results.slice(0, 1)[0] as unknown as _RecordType).value = value;
      }
    });
  }

  async delete(key: string) {
    const results = this._getRealmObject(key);

    if (!results.isEmpty()) {
      this._realm.write(() => {
        this._realm.delete(results);
      });
    }
  }

  _getRealmObject(key: string) {
    return this._realm.objects(this._schema.name).filtered(`_id = '${key}'`);
  }

  async read(key: string) {
    let result = null;
    const objs = this._getRealmObject(key);
    if (!objs.isEmpty()) {
      result = (objs.slice(0, 1)[0] as unknown as _RecordType).value;
    }
    return result;
  }

  async readAll() {
    const objs = this._realm.objects(this._schema.name);
    return objs.map<LocalDbRecord>(item => {
      const record = item as unknown as _RecordType; // Cast to record type
      return {
        key: record._id,
        value: record.value,
      };
    });
  }
}
