import {EventType, UserType, VideoType} from './types';

export const TestUser: UserType = {
  id: '56914437-0ecb-45bc-8287-72c9287ec2e3',
  name: 'Greta Van Fleet',
  handle: '@gretavanfleet',
};

export const TestEvents: EventType[] = [
  {
    id: 'eca6ec89-f5e1-46d9-84d8-cc0210ce7081',
    users: [TestUser],
    title: 'Red Rocks',
    description: 'Greta Van Fleet at Red Rocks',
  },
];

export const TestVideos: VideoType[] = [
  {
    id: '8efbc096-9bc9-4117-a1e1-1b9bc2d98dc7',
    event: TestEvents[0],
    url: 'https://firebasestorage.googleapis.com/v0/b/moshh-338102.appspot.com/o/videos%2Flibrary%2FpPgvspi7FOdozfTKCyhtYmF3Ikh1%2FHighwayTune-GretaVanFleet-RedRocks%2FHighwayTune-GretaVanFleet-RedRocks.mp4?alt=media&token=7190b886-f573-421b-bd28-9fbafdc8dfda',
    // url: '/Users/cool77catt/Projects/moshh/test-clips/greta-van-fleet/hls/HighwayTune-GretaVanFleet-RedRocks/hls.m3u8',
    title: 'Highway Tune (Camera 1)',
    description: 'Greta Van Fleet performs Highway Tune at Red Rock',
  },
  {
    id: '76cf2e60-448e-4752-9ffe-2cd03ba16381',
    event: TestEvents[0],
    url: 'https://firebasestorage.googleapis.com/v0/b/moshh-338102.appspot.com/o/videos%2Flibrary%2FpPgvspi7FOdozfTKCyhtYmF3Ikh1%2FGretaVanFleet-at-RedRocks-HighwayTune%2FGretaVanFleet-at-RedRocks-HighwayTune.mp4?alt=media&token=f21f3ecc-c077-422b-8226-d940a3338fdc',
    // url: '/Users/cool77catt/Projects/moshh/test-clips/greta-van-fleet/hls/GretaVanFleet-at-RedRocks-HighwayTune/hls.m3u8',
    title: 'Highway Tune (Camera 2)',
    description: 'Greta Van Fleet performs Highway Tune at Red Rock',
  },
  {
    id: '8e66bd02-2802-44c3-ae4e-750cd6d9da26',
    event: TestEvents[0],
    url: 'https://firebasestorage.googleapis.com/v0/b/moshh-338102.appspot.com/o/videos%2Flibrary%2FpPgvspi7FOdozfTKCyhtYmF3Ikh1%2FGretaVanFleet-HighwayTune-09-23-2019-RedRocks%2FGretaVanFleet-HighwayTune-09-23-2019-RedRocks.mp4?alt=media&token=726da7af-982b-46a5-b0ce-064cc1258b45',
    // url: '/Users/cool77catt/Projects/moshh/test-clips/greta-van-fleet/hls/GretaVanFleet-HighwayTune-09-23-2019-RedRocks/hls_360p.m3u8',
    title: 'Highway Tune (Camera 3)',
    description: 'Greta Van Fleet performs Highway Tune at Red Rock',
  },
];
