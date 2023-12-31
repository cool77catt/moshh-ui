import React, {createRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {Portal, Modal, FAB} from 'react-native-paper';
import VideoPlayer, {VideoPlayerProps} from './VideoPlayer';

interface VideoModalProps extends VideoPlayerProps {
  visible: boolean;
  onClose?: () => void;
}

class VideoModal extends React.Component<VideoModalProps> {
  _playerRef = createRef<VideoPlayer>();

  componentDidMount() {
    this.context.setVideoModalRef?.(this);
  }

  pause() {
    this._playerRef.current?.pause();
  }

  close() {
    this.pause();
    this.props.onClose?.();
  }

  renderVideoPlayer() {
    if (this.props.source !== '') {
      return <VideoPlayer ref={this._playerRef} source={this.props.source} />;
    }
  }

  render() {
    let videoPlayer;
    if (this.props.source !== '') {
      videoPlayer = (
        <VideoPlayer
          {...this.props}
          ref={this._playerRef}
          source={this.props.source}
        />
      );
    }

    return (
      <Portal>
        <Modal visible={this.props.visible} dismissable={false}>
          <View style={styles.mainContainer}>
            {videoPlayer}
            <FAB
              style={styles.fab}
              small
              icon="close"
              onPress={() => this.close()}
            />
          </View>
        </Modal>
      </Portal>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    top: 0,
    left: 0,
  },
});

export default VideoModal;
