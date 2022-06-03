import {ICloudDb, ICloudDbCollection} from './ICloudDb';
import {CloudDbRecordType, CloudDbArtistType, CloudDbEventType} from './types';

// TODO - create a separate artist contorller
// TODO  create a separate event controler
// TODO - delete the cloud db controller
// TODO - create a cloud controller that will contain all the various cloud controllers, so only have to pass the single object.  Then the obect using it can just reference the specific cotroller it needs.

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
        a.data.nameLowercase.localeCompare(b.data.nameLowercase),
      );
    }
    return artists;
  }

  async getArtistInfo(artistId: string) {
    return this._artistCollection?.readOne(artistId);
  }

  async addNewArtist(name: string) {
    let nameLowercase = name.toLowerCase();
    if (!this._artistCollection) {
      return null;
    }
    return this._artistCollection
      .readFilterOne('nameLowercase', '==', nameLowercase)
      .then(rec => {
        if (!rec) {
          // Artist does not exist
          return this._artistCollection!.create({
            name,
            nameLowercase,
          });
        } else {
          // Artist already exists
          return rec;
        }
      });
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

  async addNewEvent(name: string, location: string, datetime: Date) {
    let nameLowercase = name.toLowerCase();
    if (!this._eventCollection) {
      return null;
    }

    return this._eventCollection
      .readFilterOne('nameLowercase', '==', nameLowercase)
      .then(rec => {
        if (!rec) {
          // Event does not exist
          return this._eventCollection!.create({
            name,
            nameLowercase,
            location,
            datetime,
          });
        } else {
          // Event already exists
          return rec;
        }
      });
  }
}

export default CloudDbController;
