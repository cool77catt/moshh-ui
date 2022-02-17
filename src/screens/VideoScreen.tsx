import React from 'react';
import {StyleSheet, View} from 'react-native';
import VideoPlayer from '../components/VideoPlayer';

const VideoScreen = () => {
  return (
    <View style={styles.mainContainer}>
      <VideoPlayer />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'red',
  },
});

export default VideoScreen;
