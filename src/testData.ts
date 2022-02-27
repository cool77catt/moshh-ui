import {EventType, UserType, VideoType} from './types';
import {generateUuid} from './utils/uuid';

export const TestUser: UserType = {
  id: generateUuid(),
  name: 'Greta Van Fleet',
  handle: '@gretavanfleet',
};

export const TestEvents: EventType[] = [
  {
    id: generateUuid(),
    users: [TestUser],
    title: 'Red Rocks',
    description: 'Greta Van Fleet at Red Rocks',
  },
];

export const TestVideos: VideoType[] = [
  // {
  //   id: generateUuid(),
  //   event: TestEvents[0],
  //   url: 'https://storage.cloud.google.com/moshh-338102.appspot.com/videos/library/pPgvspi7FOdozfTKCyhtYmF3Ikh1/HighwayTune-GretaVanFleet-RedRocks/HighwayTune-GretaVanFleet-RedRocks.mp4',
  //   // url: 'https://firebasestorage.googleapis.com/v0/b/moshh-338102.appspot.com/o/videos%2Flibrary%2FpPgvspi7FOdozfTKCyhtYmF3Ikh1%2FHighwayTune-GretaVanFleet-RedRocks%2Fhls%2Fhls.m3u8?alt=media&token=61813375-1f79-4548-b5c9-012970ea3183',
  //   title: 'Highway Tune (Camera 1)',
  //   description: 'Greta Van Fleet performs Highway Tune at Red Rock',
  // },
  // {
  //   id: generateUuid(),
  //   event: TestEvents[0],
  //   url: 'https://firebasestorage.googleapis.com/v0/b/moshh-338102.appspot.com/o/videos%2Flibrary%2FpPgvspi7FOdozfTKCyhtYmF3Ikh1%2FGretaVanFleet-HighwayTune-09-23-2019-RedRocks%2FGretaVanFleet-HighwayTune-09-23-2019-RedRocks.mp4?alt=media&token=726da7af-982b-46a5-b0ce-064cc1258b45',
  //   // url: 'https://storage.cloud.google.com/moshh-338102.appspot.com/videos/library/pPgvspi7FOdozfTKCyhtYmF3Ikh1/GretaVanFleet-at-RedRocks-HighwayTune/GretaVanFleet-at-RedRocks-HighwayTune.mp4',
  //   // url: 'https://firebasestorage.googleapis.com/v0/b/moshh-338102.appspot.com/o/videos%2Flibrary%2FpPgvspi7FOdozfTKCyhtYmF3Ikh1%2FGretaVanFleet-at-RedRocks-HighwayTune%2Fhls%2Fhls.m3u8?alt=media&token=bd22e9a1-79f7-4250-ae1d-19b9da8c4689',
  //   title: 'Highway Tune (Camera 2)',
  //   description: 'Greta Van Fleet performs Highway Tune at Red Rock',
  // },
  {
    id: generateUuid(),
    event: TestEvents[0],
    url: 'https://firebasestorage.googleapis.com/v0/b/moshh-338102.appspot.com/o/videos%2Flibrary%2FpPgvspi7FOdozfTKCyhtYmF3Ikh1%2FGretaVanFleet-HighwayTune-09-23-2019-RedRocks%2FGretaVanFleet-HighwayTune-09-23-2019-RedRocks.mp4?alt=media&token=726da7af-982b-46a5-b0ce-064cc1258b45',
    // url: '/Users/cool77catt/Projects/moshh/test-clips/greta-van-fleet/hls/GretaVanFleet-HighwayTune-09-23-2019-RedRocks/hls_360p.m3u8',
    title: 'Highway Tune (Camera 3)',
    description: 'Greta Van Fleet performs Highway Tune at Red Rock',
  },
];
