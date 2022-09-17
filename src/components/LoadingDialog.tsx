import React from 'react';
import {StyleSheet} from 'react-native';
import {Portal, Dialog, ActivityIndicator, Text} from 'react-native-paper';

type LoadingDialogProps = {
  visible: boolean;
  message?: string;
};

const LoadingDialog = (props: LoadingDialogProps) => {
  return (
    <Portal>
      <Dialog visible={props.visible} dismissable={false}>
        <Dialog.Content>
          <ActivityIndicator style={styles.activityIndicator} size={'large'} />
          <Text style={styles.defaultText}>{props.message}</Text>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  activityIndicator: {
    padding: 16,
  },
  defaultText: {
    fontSize: 20,
    textAlign: 'center',
  },
});

export default LoadingDialog;
