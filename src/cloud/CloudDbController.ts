import {ICloudDb, ICloudDbCollection} from './ICloudDb';
import {CloudDbRecordType, CloudDbArtistType, CloudDbEventType} from './types';

class CloudDbController {
  // static public class properties
  static ARTIST_COLLECTION_NAME = 'Artists';
  static EVENT_COLLECTION_NAME = 'Events';

  // static private class properties
  static _instance: CloudDbController | null = null;

  // private member variables
  _db: ICloudDb;
  _artistCollection: ICloudDbCollection<CloudDbArtistType> | null = null;
  _eventCollection: ICloudDbCollection<CloudDbEventType> | null = null;

  static getInstance() {
    return this._instance;
  }

  static async configure(dbInterface: ICloudDb) {
    if (this._instance == null) {
      this._instance = new CloudDbController(dbInterface);
      await this._instance.setupCollections();
    }
    return this.getInstance();
  }

  constructor(dbInterface: ICloudDb) {
    this._db = dbInterface;
  }

  async setupCollections() {
    this._artistCollection = await this._db.createCollection<CloudDbArtistType>(
      CloudDbController.ARTIST_COLLECTION_NAME,
    );
    this._eventCollection = await this._db.createCollection<CloudDbEventType>(
      CloudDbController.EVENT_COLLECTION_NAME,
    );
  }

  async getArtists(sorted = false) {
    let artists = await this._artistCollection?.readAll();
    if (sorted) {
      artists?.sort((a, b) =>
        a.data.name_lowercase.localeCompare(b.data.name_lowercase),
      );
    }
    return artists;
  }

  async getEvents() {
    // return this._eventCollection?.readAll().then(vals => vals.map(val => ({...val, datetime: val.datetime.toDate}))
    return this._eventCollection?.readAll().then(eventList => {
      // convert the datetime object manually
      return eventList.map(evt => {
        return {
          ...evt,
          data: {
            ...evt.data,
            datetime: this._eventCollection?.nativeToDatetime(
              evt.data.datetime,
            ),
          },
        };
      }) as CloudDbRecordType<CloudDbEventType>[];
    });
  }
}

export default CloudDbController;
