import React, {useState, useRef} from 'react';
import {StyleSheet, View, ViewStyle, Pressable} from 'react-native';
import {IconButton, Colors} from 'react-native-paper';
// import {NodePlayerView} from 'react-native-nodemediaclient';
import {default as RNVideoPlayer} from 'react-native-video-player';

export type VideoPlayerPropsType = {
  videoUrl: string;
};

const VideoPlayer = (props: VideoPlayerPropsType) => {
  const playerRef = useRef<NodePlayerView>();
  const [playState, setPlayState] = useState(true);

  if (playState) {
    playerRef.current?.start();
  } else {
    playerRef.current?.pause();
  }

  const renderPlayButton = () => {
    if (!playState) {
      return (
        <IconButton icon="play-circle-outline" size={75} color={Colors.white} />
      );
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* <View style={styles.stackedViewStyle}> */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <RNVideoPlayer
          video={{uri: props.videoUrl}}
          // videoWidth={1600}
          // videoHeight={900}
          style={{aspectRatio: 16 / 9, height: undefined, width: '100%'}}
        />
        {/* <NodePlayerView
          style={styles.playerStyle}
          ref={playerRef}
          inputUrl={props.videoUrl}
          scaleMode={'ScaleAspectFit'}
          bufferTime={300}
          maxBufferTime={1000}
          autoplay={true}
        /> */}
      </View>
      {/* <Pressable
        style={styles.pressableStyle}
        onPress={() => setPlayState(!playState)}>
        {renderPlayButton()}
      </Pressable> */}
    </View>
  );
};

const stackedViewStyle: ViewStyle = {
  flex: 1,
  position: 'absolute',
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  stackedViewStyle: {...stackedViewStyle},
  pressableStyle: {
    ...stackedViewStyle,
    opacity: 0.7,
  },
  playerStyle: {
    height: '100%',
    width: '100%',
  },
});

export default VideoPlayer;
