import React, {createRef} from 'react';
import {StyleSheet, View, ViewStyle, Pressable} from 'react-native';
import {IconButton, Colors} from 'react-native-paper';
import Video, {VideoProperties} from 'react-native-video';

export interface VideoPlayerProps extends Omit<VideoProperties, 'source'> {
  source?: string;
}

export interface StateType {
  playState: boolean;
}

class VideoPlayer extends React.Component<VideoPlayerProps, StateType> {
  state = {
    playState: true,
  };
  playerRef = createRef<Video>();

  start() {
    this.setState({playState: true});
  }

  pause() {
    this.setState({playState: false});
  }

  playButtonClicked() {
    // Control the video (note, the state hasn't been toggled yet
    // so it represents the current state, not future)
    if (this.props.source) {
      if (this.state.playState) {
        this.pause();
      } else {
        this.start();
      }
    }
  }

  renderPlayButton() {
    if (!this.state.playState) {
      return (
        <IconButton icon="play-circle-outline" size={75} color={Colors.white} />
      );
    }
  }

  render() {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.stackedViewStyle}>
          {this.props.source && (
            <Video
              {...this.props}
              source={{uri: this.props.source}}
              paused={!this.state.playState}
              style={styles.playerStyle}
              ref={this.playerRef}
            />
          )}
        </View>
        <Pressable
          style={styles.pressableStyle}
          onPress={this.playButtonClicked.bind(this)}>
          {this.renderPlayButton()}
        </Pressable>
      </View>
    );
  }
}

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
    flex: 1,
    height: '100%',
    width: '100%',
  },
});

export default VideoPlayer;
