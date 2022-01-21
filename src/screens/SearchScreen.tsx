import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { GlobalContext } from '../contexts';
// import Video from 'react-native-video';
// import VideoPlayer from 'react-native-video-player';


const SearchScreen = () => {

  const globalContext = useContext(GlobalContext);

  const videoPath = require('../static/clips/clip1.mp4');

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* <Video source={videoPath}   // Can be a URL or a local file.                                   // Store reference
        /> */}
    {/* <VideoPlayer
              endWithThumbnail
              video={videoPath}
            /> */}
      <Text>Hello {globalContext.loginInfo?.email}</Text>
    </View>
  );
}

export default SearchScreen;