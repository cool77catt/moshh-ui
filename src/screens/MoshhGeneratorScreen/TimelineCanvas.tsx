import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Avatar, Button, Dialog, List, Portal} from 'react-native-paper';
import {MoshhVideoInfo} from './types';

export type TimelineCanvasProps = {
  videoInfoList: MoshhVideoInfo[];
  onVideoRemove?: (videoInfo: MoshhVideoInfo) => void;
  onVideoPressed?: (videoInfo: MoshhVideoInfo) => void;
};

function intToStrPadded(value: number, padCount: number) {
  return value.toString().padStart(padCount, '0');
}

const TimelineCanvas = (props: TimelineCanvasProps) => {
  const [menuVisibleIdx, setMenuVisibleIdx] = useState(-1);

  const menuDeletePressed = (idx: number) => {
    setMenuVisibleIdx(-1);
    props.onVideoRemove?.(props.videoInfoList[idx]);
  };

  return (
    <View style={styles.mainContainer}>
      <Portal>
        <Dialog
          visible={menuVisibleIdx >= 0}
          onDismiss={() => setMenuVisibleIdx(-1)}>
          <Dialog.Content>
            <Button
              mode="contained"
              onPress={() => menuDeletePressed(menuVisibleIdx)}>
              Remove
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>
      <ScrollView style={styles.listContainer}>
        <List.Section style={styles.listContainer}>
          {props.videoInfoList.map((videoInfo, idx) => {
            // Break the time into mins:secs.milliseonds
            let duration = videoInfo.mediaInfo.duration;
            const mins = Math.floor(duration / 60);
            duration -= mins * 60;
            const secs = Math.floor(duration);
            duration -= secs;
            const msecs = Math.floor(duration * 1000);

            const desc = [
              `${videoInfo.mediaInfo.effectiveWidth}x${videoInfo.mediaInfo.effectiveHeight}`,
              `${intToStrPadded(mins, 2)}:${intToStrPadded(
                secs,
                2,
              )}.${intToStrPadded(msecs, 3)}`,
              `${videoInfo.mediaInfo.fps.toFixed(2)} fps`,
            ].join('  ');

            return (
              <List.Item
                key={idx}
                title={`Input ${idx + 1}`}
                description={desc}
                titleStyle={styles.titleStyle}
                left={() => (
                  <View style={styles.centeredContainer}>
                    <Avatar.Image
                      size={48}
                      source={{uri: videoInfo.thumbnail}}
                    />
                  </View>
                )}
                right={() => (
                  <View style={styles.centeredContainer}>
                    <Button
                      mode="text"
                      onPress={() => console.log('pressed b')}>
                      {`W: ${videoInfo.weight}`}
                    </Button>
                  </View>
                )}
                onPress={() => props.onVideoPressed?.(videoInfo)}
                onLongPress={() => setMenuVisibleIdx(idx)}
              />
            );
          })}
        </List.Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '100%',
  },
  centeredContainer: {
    justifyContent: 'center',
    // borderWidth: 2,
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  titleStyle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default TimelineCanvas;
