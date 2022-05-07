export interface VideoInfoType {
  userId: string;
  videoId: string;
  createdDateTime: Date;
  artistId: string | undefined;
  eventId: string | undefined;
  track: string | undefined;
  storageLocation: string | undefined;
}
