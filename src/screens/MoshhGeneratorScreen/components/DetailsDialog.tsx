import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Portal, Dialog, Headline, Button, Text} from 'react-native-paper';
import {MoshhVideoInfo} from '../types';
import {timeToString} from '../../../utils/datetime';

export type DetailsDialogProps = {
  visible: boolean;
  videoInfo: MoshhVideoInfo | null;
  onDismiss?: () => void;
  onEditWeight?: () => void;
  onRemoveVideo?: () => void;
};

const DetailsDialog = (props: DetailsDialogProps) => {
  let details: [string, string][] = [];
  if (props.videoInfo) {
    details = [
      ['Weight', `${props.videoInfo.weight}`],
      [
        'Resolution',
        `${props.videoInfo.mediaInfo.effectiveWidth}x${props.videoInfo.mediaInfo.effectiveHeight}`,
      ],
      ['Duration', timeToString(props.videoInfo.mediaInfo.duration, false)],
      ['Frame Rate', `${props.videoInfo.mediaInfo.fps.toFixed(2)}`],
    ];
  }

  return (
    <Portal>
      <Dialog visible={props.visible} onDismiss={() => props.onDismiss?.()}>
        <Dialog.Content>
          <Headline>Details</Headline>
          {details.map(([label, value], idx) => (
            <View style={styles.detailContainer} key={idx}>
              <Text style={styles.detailLabelStyle}>{`${label}: `}</Text>
              <Text>{value}</Text>
            </View>
          ))}
          <View style={styles.dividerStyle} />
          <Button
            mode="contained"
            style={styles.editButtonStyle}
            onPress={() => props.onEditWeight?.()}>
            Edit Weight
          </Button>
          <Button
            mode="contained"
            style={styles.editButtonStyle}
            color={'deeppink'}
            onPress={() => props.onRemoveVideo?.()}>
            Remove Video
          </Button>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  detailContainer: {
    margin: 4,
    flexDirection: 'row',
  },
  detailLabelStyle: {
    fontWeight: 'bold',
  },
  editButtonStyle: {
    margin: 4,
  },
  dividerStyle: {
    width: '100%',
    padding: 2,
    margin: 8,
  },
});

export default DetailsDialog;
