import React, {createRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {Portal, Modal, FAB} from 'react-native-paper';
import VideoPlayer from '../components/VideoPlayer';
import {GlobalContext} from '../contexts';

interface PropsType {
  visible: boolean;
  source: string;
  onClose?: () => void;
}

class VideoModal extends React.Component<PropsType> {
  static contextType = GlobalContext;
  _playerRef = createRef<VideoPlayer>();

  componentDidMount() {
    this.context.setVideoScreenRef?.(this);
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
    return (
      <Portal>
        <Modal visible={this.props.visible} dismissable={false}>
          <View style={styles.mainContainer}>
            {this.renderVideoPlayer()}
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
