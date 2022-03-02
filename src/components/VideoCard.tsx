import React, {useState, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {Card, Avatar, IconButton, Menu} from 'react-native-paper';
import {createThumbnail, Thumbnail} from 'react-native-create-thumbnail';

const placeholder = require('../static/img/placeholder.jpeg');

export type VideoCardProps = {
  videoName?: string;
  videoPath: string;
  onPress?: (props: VideoCardProps) => void;
  onLongPress?: (props: VideoCardProps) => void;
};

const VideoCard = (props: VideoCardProps) => {
  const [thumbnail, setThumbnail] = useState<Thumbnail>();

  useEffect(() => {
    createThumbnail({
      url: props.videoPath,
      timeStamp: 1000,
    })
      .then(response => setThumbnail(response))
      .catch(err => console.log(props.videoName, err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.mainContainer}>
      <Card
        style={{width: '100%'}}
        onPress={() => props.onPress?.(props)}
        onLongPress={() => props.onLongPress?.(props)}>
        <Card.Title
          title={props.videoName}
          left={() => (
            <Avatar.Image
              size={50}
              source={thumbnail ? {uri: thumbnail.path} : placeholder}
            />
          )}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoCard;
