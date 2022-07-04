import {ICloudDb, ICloudDbCollection} from '../cloud';
import {UserInfo} from './types';

class UserController {
  // static public class properties
  static USER_COLLECTION_NAME = 'Users';
  static ERROR_HANDLE_IN_USE = 'UserController/Handle-In-Use';

  // static private class properties
  static _instance: UserController | null = null;

  // private member variables
  _cloudDb: ICloudDb;
  _userDbCollection: ICloudDbCollection<UserInfo> | null = null;

  static getInstance() {
    return this._instance;
  }

  static async configure(cloudDb: ICloudDb) {
    if (this._instance == null) {
      this._instance = new UserController(cloudDb);
      await this._instance.setupCollections();
    }
    return this.getInstance();
  }

  static getDefaultUserDbRecord(id: string): UserInfo {
    return {
      _id: id,
      handle: '',
      handleLowercase: '',
    };
  }

  constructor(cloudDb: ICloudDb) {
    this._cloudDb = cloudDb;
  }

  async setupCollections() {
    this._userDbCollection = await this._cloudDb.createCollection<UserInfo>(
      UserController.USER_COLLECTION_NAME,
    );
  }

  async isUserHandleAvailable(handle: string) {
    return this._userDbCollection
      ?.readFilter('handleLowercase', '==', handle.toLowerCase())
      .then(val => val.length === 0);
  }

  async addUserHandleToDatabase(id: string, handle: string) {
    return this.isUserHandleAvailable(handle).then(available => {
      if (available) {
        return this._userDbCollection?.update(id, {
          handle,
          handleLowercase: handle.toLowerCase(),
        });
      } else {
        throw new Error(UserController.ERROR_HANDLE_IN_USE);
      }
    });
  }

  async readUserInfo(id: string) {
    return this._userDbCollection?.readOne(id).then(val => val?.data);
  }

  async setDefaultUserInfo(id: string) {
    return this._userDbCollection
      ?.set(id, UserController.getDefaultUserDbRecord(id))
      .then(() => {
        return this.readUserInfo(id);
      });
  }
}

export default UserController;
