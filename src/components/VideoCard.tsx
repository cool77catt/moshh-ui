import React, {useState, useEffect} from 'react';
import {Text, Card, Avatar, IconButton} from 'react-native-paper';
import {createThumbnail, Thumbnail} from 'react-native-create-thumbnail';

const placeholder = require('../static/img/placeholder.jpeg');

type VideoCardProps = {
  videoName?: string;
  videoPath: string;
  onPress?: (props: VideoCardProps) => void;
  onMorePress?: (props: VideoCardProps) => void;
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
    <Card onPress={() => props.onPress?.(props)}>
      <Card.Title
        title={props.videoName}
        left={() => (
          <Avatar.Image
            size={50}
            source={thumbnail ? {uri: thumbnail.path} : placeholder}
          />
        )}
        right={() => (
          <IconButton
            icon="dots-vertical"
            onPress={() => props.onMorePress?.(props)}
          />
        )}
      />
    </Card>
  );
};

export default VideoCard;
