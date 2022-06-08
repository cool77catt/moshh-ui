/*
 * USER TYPES
 */
export interface UserInfo {
  _id: string;
  handle: string;
  handleLowercase: string;
  videos?: string[];
}

/*
 *  VIDEO TYPES
 */
export interface VideoMetaData {
  videoId: string;
  cloudStorageRootPath?: string;
  userId: string;
  createdDateTime: Date;
  artistId?: string | null;
  eventId?: string | null;
  track?: string | null;
}
export interface VideoLocalMetaData extends VideoMetaData {
  localFilepath: string;
}
