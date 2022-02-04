import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {Modal, ActivityIndicator, Portal} from 'react-native-paper';

export type LodaingModalProps = {
  isVisible: boolean;
};

const LoadingModal = ({isVisible}: LodaingModalProps) => {
  if (isVisible) {
    return (
      <Portal>
        <Modal visible={true} dismissable={false} style={styles.container}>
          <ActivityIndicator animating={true} />
        </Modal>
      </Portal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // height: '15%',
    // width: '65%',
    // marginVertical: 100,
    marginTop: 350,
    marginBottom: 350,
    marginHorizontal: 40,
    // borderWidth: 2,
    backgroundColor: 'white',
  },
});

export default LoadingModal;
