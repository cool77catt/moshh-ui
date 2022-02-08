import firestore from '@react-native-firebase/firestore';

export const FS_ERR_CODE_HANDLE_UNAVAILABLE = 'FirestoreError/Handle-In-Use';

const codeToMsgMap = new Map([
  [FS_ERR_CODE_HANDLE_UNAVAILABLE, 'Handle already in use'],
]);

// Firestore constants
class FirestoreError extends Error {
  code: string;

  constructor(code: string) {
    super(codeToMsgMap.get(code));
    this.code = code;
  }
}

// Extract the database collections
const db = {
  users: firestore().collection('Users'),
};

export type UserDbRecordType = {
  handle?: string;
  handleLowercase?: string; // Used for querying
  hype?: number;
  bio?: string;
  // videos;
  // likes;
  // shares;
  // subscriptions;
  validated?: boolean;
};

export const defaultUserDbRecord: UserDbRecordType = {};

export async function isUserHandleAvailable(handle: string) {
  return new Promise((resolve, _) => {
    db.users
      .where('handleLowercase', '==', handle.toLowerCase())
      .get()
      .then(querySnapshot => {
        resolve(querySnapshot.empty);
      });
  });
}

export async function getUserInfo(uid: string) {
  return new Promise<UserDbRecordType>((resolve, _) => {
    db.users
      .doc(uid)
      .get()
      .then(docSnapshot => {
        resolve(docSnapshot.data() as UserDbRecordType);
      });
  });
}

export async function setDefaultUserInfo(uid: string) {
  return new Promise<UserDbRecordType>((resolve, _) => {
    db.users
      .doc(uid)
      .set(defaultUserDbRecord)
      .then(() => {
        getUserInfo(uid).then(data => resolve(data));
      });
  });
}

// addHandleToDatabase()
//  Usage: Add a new handle to the database
//    If the handle exists, raise an error
//    otherwise return a void promise to indicate success
export async function addUserHandleToDatabase(uid: string, handle: string) {
  return new Promise<void>((resolve, reject) => {
    isUserHandleAvailable(handle).then(isAvailable => {
      if (isAvailable) {
        // Add to the database
        db.users
          .doc(uid)
          .update({
            handle: handle,
            handleLowercase: handle.toLowerCase(),
          })
          .then(() => resolve())
          .catch(err => reject(err));
      } else {
        reject(new FirestoreError(FS_ERR_CODE_HANDLE_UNAVAILABLE));
      }
    });
  });
}
