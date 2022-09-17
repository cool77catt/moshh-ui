import React, {useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Avatar, IconButton, List, Menu} from 'react-native-paper';
import {MoshhVideoInfo} from './types';

export type TimelineCanvasProps = {
  videoInfoList: MoshhVideoInfo[];
  onVideoRemove?: (videoInfo: MoshhVideoInfo) => void;
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

  const renderMenuItem = (idx: number) => {
    return (
      <Menu
        visible={menuVisibleIdx === idx}
        onDismiss={() => setMenuVisibleIdx(-1)}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => setMenuVisibleIdx(idx)}
          />
        }>
        <Menu.Item onPress={() => menuDeletePressed(idx)} title="Remove" />
      </Menu>
    );
  };

  return (
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
                <Avatar.Image size={48} source={{uri: videoInfo.thumbnail}} />
              )}
              right={() => renderMenuItem(idx)}
            />
          );
        })}
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
