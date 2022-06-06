import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {Modal, ActivityIndicator, Portal} from 'react-native-paper';

export type LodaingModalProps = {
  isVisible: boolean;
  message?: string;
};

const LoadingModal = (props: LodaingModalProps) => {
  return (
    <Portal>
      <Modal
        visible={props.isVisible}
        dismissable={false}
        style={styles.container}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.message}>{props.message}</Text>
      </Modal>
    </Portal>
  );
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
  message: {
    textAlign: 'center',
    fontSize: 20,
    padding: 12,
  },
});

export default LoadingModal;
