import React from 'react';
import {StyleSheet} from 'react-native';
import {Portal, Dialog, Text, ProgressBar} from 'react-native-paper';

type ProgressDialogProps = {
  visible: boolean;
  progress?: number; // [0-100]
  title?: string;
  message?: string;
  color?: string;
};

const ProgressDialog = (props: ProgressDialogProps) => {
  return (
    <Portal>
      <Dialog visible={props.visible} dismissable={false}>
        {props.title && <Dialog.Title>{props.title}</Dialog.Title>}
        <Dialog.Content>
          <ProgressBar
            progress={props.progress ? props.progress / 100 : 0}
            color={props.color}
            style={styles.progressBarStyle}
          />
          <Text style={styles.defaultText}>{props.message}</Text>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  progressBarStyle: {
    marginBottom: 16,
    height: 12,
  },
  defaultText: {
    fontSize: 20,
    textAlign: 'center',
  },
});

export default ProgressDialog;
