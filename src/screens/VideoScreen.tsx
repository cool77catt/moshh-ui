import React, {createRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import VideoPlayer from '../components/VideoPlayer';
import {GlobalContext} from '../contexts';

export const NAV_ROUTE_VIDEO = 'Video';

export interface VideoScreenParams {
  source: string;
}

type ScreenProps = NativeStackScreenProps<
  {[NAV_ROUTE_VIDEO]: VideoScreenParams},
  typeof NAV_ROUTE_VIDEO
>;

class VideoScreen extends React.Component<ScreenProps> {
  static contextType = GlobalContext;
  _playerRef = createRef<VideoPlayer>();
  _unsubscribe?: () => void;

  componentDidMount() {
    this.context.setVideoScreenRef?.(this);
    this._unsubscribe = this.props.navigation.addListener(
      'beforeRemove',
      () => {
        // Stop the player
        this._playerRef.current?.stop();
      },
    );
  }

  componentWillUnmount() {
    this._unsubscribe?.();
  }

  pause() {
    this._playerRef.current?.pause();
  }

  render() {
    return (
      <View style={styles.mainContainer}>
        <VideoPlayer
          ref={this._playerRef}
          source={this.props.route.params.source}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
});

export default VideoScreen;
