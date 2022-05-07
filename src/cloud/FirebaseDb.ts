import {ICloudDb} from './ICloudDb';
import firestore from '@react-native-firebase/firestore';

class FirebaseDb implements ICloudDb {
  // getFilteredRecords(dbName: string) {
  //   const coll = firestore().collection(dbName);
  //   coll.get().then(docSnapshot => {
  //     return 
  //   })
  // }
}
