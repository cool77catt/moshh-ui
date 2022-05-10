export interface VideoMetaData {
  userId: string;
  createdDateTime: Date;
  artistId?: string;
  eventId?: string;
  track?: string;
}

export interface VideoDbSchema extends VideoMetaData {
  videoId: string;
  storageLocation?: string;
}
