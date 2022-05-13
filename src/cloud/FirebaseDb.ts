import {ICloudDb, ICloudDbCollection} from './ICloudDb';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

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

  async readAll() {
    return this._collection.get().then(querySnapshot =>
      querySnapshot.docs.map(docSnapshop => {
        return {
          _id: docSnapshop.id,
          data: docSnapshop.data() as Type,
        };
      }),
    );
  }
}
