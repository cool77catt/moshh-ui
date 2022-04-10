import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Alert,
  FlatList,
  ListRenderItem,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button, ActivityIndicator, IconButton} from 'react-native-paper';
import RNFS, {ReadDirItem, StatResult} from 'react-native-fs';
import {VIDEO_DIRECTORY} from '../constants';
import VideoCard, {VideoCardProps} from '../components/VideoCard';
import VideoModal from '../components/VideoModal';
import {setDefaultUserInfo} from '../utils/firestoreDb';

// Add in a top-navigation bar for My Videos and Reels
// Option to remove/delete the video
// Option to upload to cloud

type VideoInfo = {
  name: string;
  path: string;
};

const SavedScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editList, setEditList] = useState<VideoInfo[]>([]);
  const [videosList, setVideosList] = useState<VideoInfo[]>([]);
  const [videoPath, setVideoPath] = useState('');

  const refreshVideosList = () => {
    exitEditMode();
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
    const unsubscribe = navigation.addListener('focus', () => {
      // Stop the player
      refreshVideosList();
    });
    refreshVideosList();

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitEditMode = useCallback(() => {
    setEditList([]);
    setEditMode(false);
  }, []);

  const toggleItemInVideoList = (item: VideoInfo) => {
    if (editList.includes(item)) {
      setEditList(editList.filter(element => element !== item));
    } else {
      // Add to the list
      setEditList([...editList, item]);
    }
  };

  const deleteVideos = () => {
    editList.forEach(value => {
      RNFS.unlink(value.path).then(() => {
        refreshVideosList();
      });
    });
  };

  const onVideoCardPressed = (item: VideoInfo) => {
    if (editMode) {
      toggleItemInVideoList(item);
    } else {
      setVideoPath(item.path);
    }
  };

  const onVideoCardLongPressed = (item: VideoInfo) => {
    setEditList([...editList, item]);
    setEditMode(true);
  };

  const renderVideoCard: ListRenderItem<VideoInfo> = ({item}) => {
    let editIcon;
    if (editMode) {
      const iconText = editList.includes(item)
        ? 'check-circle'
        : 'checkbox-blank-circle-outline';
      editIcon = (
        <IconButton
          icon={iconText}
          onPress={() => toggleItemInVideoList(item)}
        />
      );
    }

    return (
      <View style={styles.cardContainer}>
        {editIcon}
        <VideoCard
          videoName={item.name}
          videoPath={item.path}
          onPress={() => onVideoCardPressed(item)}
          onLongPress={() => onVideoCardLongPressed(item)}
        />
      </View>
    );
  };

  const renderEditModeButtons = () => {
    if (editMode) {
      return (
        <View style={styles.editBarContainer}>
          <IconButton
            icon="close"
            size={24}
            color="black"
            onPress={() => exitEditMode()}
          />
          <View style={styles.editButtonsContainer}>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => deleteVideos()}
              disabled={editList.length === 0}>
              Delete
            </Button>
            <Button mode="contained" style={styles.button} disabled={true}>
              Upload
            </Button>
          </View>
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  } else {
    return (
      <View style={styles.mainContainer}>
        <VideoModal
          source={videoPath}
          visible={videoPath !== ''}
          repeat={true}
          onClose={() => setVideoPath('')}
        />
        <FlatList
          data={videosList}
          style={{flex: 1, width: '100%'}}
          renderItem={renderVideoCard}
          keyExtractor={item => item.name}
          refreshing={refreshing}
          onRefresh={refreshVideosList}
        />
        {renderEditModeButtons()}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  editBarContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 8,
  },
  cardContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  button: {
    height: 36,
    marginLeft: 8,
    marginRight: 8,
    justifyContent: 'center',
  },
});

export default SavedScreen;
