import React, {useState} from 'react';
import {ScrollView, StyleSheet, View, Alert} from 'react-native';
import {Avatar, IconButton, List} from 'react-native-paper';
import {MoshhVideoInfo} from '../types';
import DetailsDialog from './DetailsDialog';
import {NumberInputDialog} from '../../../components';
import {timeToString} from '../../../utils/datetime';

export type TimelineCanvasProps = {
  videoInfoList: MoshhVideoInfo[];
  videoOutput?: MoshhVideoInfo | null;
  onVideoRemove?: (videoInfo: MoshhVideoInfo) => void;
  onVideoPressed?: (videoInfo: MoshhVideoInfo) => void;
  onWeightChanged?: (videoInfo: MoshhVideoInfo, newWeight: number) => void;
};

const TimelineCanvas = (props: TimelineCanvasProps) => {
  const [menuVisibleIdx, setMenuVisibleIdx] = useState(-1);
  const [editWeight, setEditWeight] = useState(false);

  const menuDeletePressed = (idx: number) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to remove this video from your project?',
      [
        {
          text: 'Yes',
          onPress: () => {
            setMenuVisibleIdx(-1);
            props.onVideoRemove?.(props.videoInfoList[idx]);
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
        },
      ],
    );
  };

  const menuVideoInfo =
    menuVisibleIdx >= 0 ? props.videoInfoList[menuVisibleIdx] : null;

  return (
    <View style={styles.mainContainer}>
      <DetailsDialog
        visible={menuVisibleIdx >= 0}
        videoInfo={menuVideoInfo}
        onDismiss={() => setMenuVisibleIdx(-1)}
        onEditWeight={() => setEditWeight(true)}
        onRemoveVideo={() => menuDeletePressed(menuVisibleIdx)}
      />
      <NumberInputDialog
        visible={editWeight}
        title="Enter New Weight:"
        onValueEntered={val => {
          setEditWeight(false);
          setMenuVisibleIdx(-1);
          props.onWeightChanged?.(props.videoInfoList[menuVisibleIdx], val);
        }}
        onCancel={() => setEditWeight(false)}
      />
      <ScrollView style={styles.listContainer}>
        <List.Section style={styles.listContainer}>
          {props.videoInfoList.map((videoInfo, idx) => {
            const desc = [
              `${videoInfo.mediaInfo.effectiveWidth}x${videoInfo.mediaInfo.effectiveHeight}`,
              `Weight: ${videoInfo.weight}`,
            ].join('\n');

            const lengthStr = timeToString(videoInfo.mediaInfo.duration, false);
            return (
              <List.Item
                key={idx}
                title={`Input ${idx + 1} (${lengthStr})`}
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
                    <IconButton
                      icon="dots-vertical"
                      onPress={() => setMenuVisibleIdx(idx)}
                    />
                  </View>
                )}
                onPress={() => props.onVideoPressed?.(videoInfo)}
                onLongPress={() => setMenuVisibleIdx(idx)}
              />
            );
          })}
        </List.Section>
      </ScrollView>
      {props.videoOutput && (
        <List.Accordion title="Output">
          <List.Item
            title={props.videoOutput.path}
            titleStyle={styles.titleStyle}
            left={() => (
              <View style={styles.centeredContainer}>
                <Avatar.Image
                  size={48}
                  source={{uri: props.videoOutput!.thumbnail}}
                />
              </View>
            )}
            onPress={() => props.onVideoPressed?.(props.videoOutput!)}
          />
        </List.Accordion>
      )}
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
