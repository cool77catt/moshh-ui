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
import {
  Avatar,
  Button,
  ActivityIndicator,
  IconButton,
  List,
} from 'react-native-paper';
import {createThumbnail, Thumbnail} from 'react-native-create-thumbnail';
import VideoModal from '../components/VideoModal';
import {VideoController, VideoDbSchema} from '../video';

// Add in a top-navigation bar for My Videos and Reels
// Option to remove/delete the video
// Option to upload to cloud

const placeholderThumbnail = require('../static/img/placeholder.jpeg');
type VideoInfo = {
  metaData: VideoDbSchema;
  localPath: string;
  thumbnail: Thumbnail;
};

const SavedScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editList, setEditList] = useState<VideoInfo[]>([]);
  // const [videosList, setVideosList] = useState<VideoDbSchema[]>([]);
  const [videoInfoMap, setVideoInfoMap] = useState(
    new Map<string, VideoInfo>(),
  );
  const [videoPath, setVideoPath] = useState('');
  const videoController = VideoController.getInstance();

  const refreshVideosList = async () => {
    exitEditMode();

    if (videoController) {
      videoController.getCapturedVideosList().then(vids => {
        vids.forEach(vid => {
          if (videoInfoMap.has(vid.videoId)) {
            return; // Skip as the video has already been updated
          }

          const path = videoController.getVideoFilePath(vid.videoId);
          setVideoInfoMap(
            new Map(
              videoInfoMap.set(vid.videoId, {
                metaData: vid,
                localPath: path,
                thumbnail: placeholderThumbnail,
              }),
            ),
          );

          // Create the thumbnails
          createThumbnail({
            url: path,
            timeStamp: 1000,
          })
            .then(thumbnail => {
              setVideoInfoMap(
                new Map(
                  videoInfoMap.set(vid.videoId, {
                    ...videoInfoMap.get(vid.videoId)!,
                    thumbnail,
                  }),
                ),
              );
            })
            .catch(err => {
              console.log(vid.videoId, err);
            });
        });
      });
    }
    setIsLoading(false);
    setRefreshing(false);
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
      videoController?.deleteVideo(value.metaData.videoId);
    });
  };

  const uploadVideos = () => {
    // Startup a waiting icon
    editList.forEach(async vidInfo => {
      console.log(vidInfo.metaData.videoId);
      // await CloudVideoWriter.writeVideo(value.path, videoId).catch(
      //   (error: Error) => console.log(error),
      // );
    });
  };

  const onVideoCardPressed = (item: VideoInfo) => {
    if (editMode) {
      toggleItemInVideoList(item);
    } else {
      setVideoPath(item.localPath);
    }
  };

  const onVideoCardLongPressed = (item: VideoInfo) => {
    setEditList([...editList, item]);
    setEditMode(true);
  };

  const renderVideoIcon = (vidInfo: VideoInfo) => {
    let editIcon;
    if (editMode) {
      const iconText = editList.includes(vidInfo)
        ? 'check-circle'
        : 'checkbox-blank-circle-outline';
      editIcon = (
        <IconButton
          icon={iconText}
          onPress={() => toggleItemInVideoList(vidInfo)}
        />
      );
    }

    return (
      <View style={styles.cardContainer}>
        {editIcon}
        <Avatar.Image size={50} source={{uri: vidInfo.thumbnail.path}} />
      </View>
    );
  };

  const renderVideoItems = (videos: VideoInfo[]) => {
    return videos.map((vidInfo, idx) => {
      return (
        <List.Item
          title={vidInfo.metaData.createdDateTime}
          key={idx}
          left={() => renderVideoIcon(vidInfo)}
          onPress={() => onVideoCardPressed(vidInfo)}
          onLongPress={() => onVideoCardLongPressed(vidInfo)}
        />
      );
    });
  };

  const renderVideoAccordions = () => {
    let artistMap = new Map<string, VideoInfo[]>();
    videoInfoMap.forEach(vidInfo => {
      const artist = vidInfo.metaData.artistId
        ? vidInfo.metaData.artistId
        : 'Unknown';
      if (artistMap.has(artist)) {
        artistMap.get(artist)?.push(vidInfo);
      } else {
        artistMap.set(artist, [vidInfo]);
      }
    });

    return Array.from(artistMap.keys())
      .sort()
      .map((artist, idx) => {
        let vids = artistMap.get(artist);
        if (!vids) {
          vids = [];
        }
        return (
          <List.Accordion title={artist} id={`${idx}`} key={idx}>
            {renderVideoItems(vids)}
          </List.Accordion>
        );
      });
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
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => uploadVideos()}
              disabled={editList.length === 0}>
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
        <ActivityIndicator animating={isProcessing} size="large" />
        <View style={styles.accordionGroupContainer}>
          <List.AccordionGroup>
            {renderVideoAccordions()}
            {/* <List.Accordion title="Unknown" id="1"> */}
              {/* <List.Item title="Item 1" /> */}
              {/* <FlatList
                data={videosList}
                style={{flex: 1, width: '100%'}}
                renderItem={renderVideoCard}
                keyExtractor={item => item.name}
                refreshing={refreshing}
                onRefresh={refreshVideosList}
              /> */}
            {/* </List.Accordion> */}
          </List.AccordionGroup>
        </View>
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
  accordionGroupContainer: {
    width: '100%',
  },
  editBarContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 8,
  },
  cardContainer: {
    // width: '100%',
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
