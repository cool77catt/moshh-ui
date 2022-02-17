import React, {useState, useRef} from 'react';
import {StyleSheet, View, ViewStyle, Pressable} from 'react-native';
import {IconButton, Colors} from 'react-native-paper';
import {NodePlayerView} from 'react-native-nodemediaclient';

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
      <View style={styles.stackedViewStyle}>
        <NodePlayerView
          style={styles.playerStyle}
          ref={playerRef}
          inputUrl={props.videoUrl}
          scaleMode={'ScaleAspectFit'}
          bufferTime={300}
          maxBufferTime={1000}
          autoplay={true}
        />
      </View>
      <Pressable
        style={styles.pressableStyle}
        onPress={() => setPlayState(!playState)}>
        {renderPlayButton()}
      </Pressable>
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
