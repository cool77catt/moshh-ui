import {ICloudDb, ICloudDbCollection} from './ICloudDb';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {CloudDbRecordType, CloudDbFilterOperand} from './types';

export class FirebaseDb implements ICloudDb {
  async createCollection<Type>(collectionName: string) {
    return new FirebaseDbCollection<Type>(
      firestore().collection(collectionName),
    );
  }
}

export class FirebaseDbCollection<Type> implements ICloudDbCollection<Type> {
  _collection: FirebaseFirestoreTypes.CollectionReference;

  constructor(collection: FirebaseFirestoreTypes.CollectionReference) {
    this._collection = collection;
  }

  nativeToDatetime(nativeValue: any) {
    return (nativeValue as FirebaseFirestoreTypes.Timestamp).toDate();
  }

  async create(record: Type) {
    return this._collection
      .add(record)
      .then(doc =>
        doc
          .get()
          .then(docSnapshot => this._docSnapshotToRecordType(docSnapshot)),
      );
  }

  async set(id: string, record: Type) {
    return this._collection.doc(id).set(record);
  }

  async update(id: string, record: Partial<Type>) {
    return this._collection.doc(id).update(record);
  }

  async delete(id: string) {
    return this._collection.doc(id).delete();
  }

  async readOne(id: string) {
    // const doc = await this._collection.doc(id).get();
    // if (doc.exists)
    return this._collection
      .doc(id)
      .get()
      .then(docSnapshot => {
        return {
          _id: docSnapshot.id,
          data: docSnapshot.data() as Type,
        };
      });
  }

  async readFilter(left: string, opString: CloudDbFilterOperand, right: any) {
    return this._collection
      .where(left, opString, right)
      .get()
      .then(querySnapshot => this._querySnapshotToList(querySnapshot));
  }

  async readFilterOne(
    left: string,
    opString: CloudDbFilterOperand,
    right: any,
  ) {
    return this.readFilter(left, opString, right).then(results =>
      results.length > 0 ? results[0] : null,
    );
  }

  async readAll() {
    return this._collection
      .get()
      .then(querySnapshot => this._querySnapshotToList(querySnapshot));
  }

  _querySnapshotToList(
    querySnapshot: FirebaseFirestoreTypes.QuerySnapshot<FirebaseFirestoreTypes.DocumentData>,
  ) {
    return querySnapshot.docs.map(docSnapshot =>
      this._docSnapshotToRecordType(docSnapshot),
    );
  }

  _docSnapshotToRecordType(docSnapshot: FirebaseFirestoreTypes.DocumentData) {
    return {
      _id: docSnapshot.id,
      data: docSnapshot.data() as Type,
    } as CloudDbRecordType<Type>;
  }
}
