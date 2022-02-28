import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Alert,
  FlatList,
  ListRenderItem,
} from 'react-native';
import {Text, ActivityIndicator} from 'react-native-paper';
import {ReadDirItem, StatResult} from 'react-native-fs';
import {NodePlayerView} from 'react-native-nodemediaclient';
import {VIDEO_DIRECTORY} from '../constants';
import {VideoCard, VideoCardProps} from '../components';

// Add in a top-navigation bar for My Videos and Reels
// Option to remove/delete the video
// Option to upload to cloud

let RNFS = require('react-native-fs');

type VideoInfo = {
  name: string;
  path: string;
};

const SavedScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videosList, setVideosList] = useState<VideoInfo[]>([]);
  const [videoPath, setVideoPath] = useState();
  const playerRef = useRef();

  const refreshVideosList = () => {
    RNFS.readDir(VIDEO_DIRECTORY)
      .then((result: ReadDirItem[]) => {
        const vidInfo = result.map(file => ({
          name: file.name,
          path: file.path,
        }));
        setVideosList(vidInfo);
        setIsLoading(false);
        setRefreshing(false);
      })
      .catch((error: Error) =>
        Alert.alert('Error', `Error reading saved files: ${error.message}`),
      );
  };

  useEffect(() => {
    refreshVideosList();
  }, []);

  const onVideoCardPressed = (props: VideoCardProps) => {
    setVideoPath(props.videoPath);
  };

  const renderVideoCard: ListRenderItem<VideoInfo> = ({item}) => (
    <VideoCard
      videoName={item.name}
      videoPath={item.path}
      onPress={onVideoCardPressed}
    />
  );

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  } else {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <FlatList
          data={videosList}
          style={{flex: 1, width: '100%'}}
          renderItem={renderVideoCard}
          keyExtractor={item => item.name}
          refreshing={refreshing}
          onRefresh={refreshVideosList}
        />
        <NodePlayerView
          style={{flex: 1, width: '100%'}}
          ref={playerRef}
          inputUrl={videoPath}
          scaleMode={'ScaleAspectFit'}
          bufferTime={300}
          maxBufferTime={1000}
          autoplay={true}
        />
      </View>
    );
  }
};

export default SavedScreen;
