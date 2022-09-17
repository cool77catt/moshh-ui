import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';

export type Props = Omit<
  React.ComponentProps<typeof Dialog>,
  'children' | 'onDismiss'
> & {
  onFileSystemSelected?: () => void;
  onGallerySelected?: () => void;
  onCancel?: () => void;
};

const FileSourceDialog = (props: Props) => {
  return (
    <Portal>
      <Dialog dismissable={false} {...props}>
        <Dialog.Title>Choose Video Source</Dialog.Title>
        <Dialog.Content style={styles.contentLayout}>
          <View>
            <Button
              mode="contained"
              onPress={() => props.onFileSystemSelected?.()}
              style={{marginTop: 8}}>
              File System
            </Button>
            <Button
              mode="contained"
              onPress={() => props.onGallerySelected?.()}
              style={{marginTop: 8}}>
              Gallery
            </Button>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => props.onCancel?.()}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  contentLayout: {
    alignItems: 'center',
  },
});

export default FileSourceDialog;
