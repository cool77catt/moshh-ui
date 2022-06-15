import React, {useState, useEffect, useContext} from 'react';
import {Alert, View, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  Avatar,
  Button,
  ActivityIndicator,
  IconButton,
  List,
} from 'react-native-paper';
import {Thumbnail} from 'react-native-create-thumbnail';
import {GlobalContext} from '../contexts';
import VideoModal from '../components/VideoModal';
import LoadingModal from '../components/LoadingModal';
import VideoInfoInputDialog, {
  VideoInfo,
} from '../components/VideoInfoInputDialog';
import {VideoController, VideoMetaDataLocalExt} from '../controllers';
import {CloudDbController, CloudDbArtistType} from '../cloud';

// TODO - rmove local filepath from metadata whens aving to cloud

const UNKNOWN_LABEL = '[Unknown]';

const placeholderThumbnail = require('../static/img/placeholder.jpeg');
type _LocalVideoInfo = {
  metaData: VideoMetaDataLocalExt;
  thumbnail: Thumbnail;
  isUploaded: boolean;
};

const SavedScreen = () => {
  const globalContext = useContext(GlobalContext);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editList, setEditList] = useState<_LocalVideoInfo[]>([]);
  const [editUnknowns, setEditUnknowns] = useState(false);
  const [videoInfoMap, setVideoInfoMap] = useState(
    new Map<string, _LocalVideoInfo>(),
  );
  const [artistInfoMap, setArtistInfoMap] = useState(
    new Map<string, CloudDbArtistType>(),
  );
  const [videoPath, setVideoPath] = useState('');
  const videoController = VideoController.getInstance();

  const getLatestVideosList = async () => {
    let results = new Map<string, _LocalVideoInfo>();
    if (videoController && globalContext.userInfo) {
      const userId = globalContext.userInfo._id;

      const vids = await videoController.getAllUserVideos(userId);
      await Promise.all(
        vids.map(async vid => {
          const isUploaded = await videoController.isVideoUploaded(vid);
          results.set(vid.base.videoId, {
            metaData: vid,
            thumbnail: placeholderThumbnail,
            isUploaded,
          });
        }),
      );
    }
    return results;
  };

  const getArtistInfos = async (artistIds: string[]) => {
    const cloudController = CloudDbController.getInstance();
    if (cloudController) {
      return Promise.all(
        artistIds.map(async artistId =>
          cloudController.getArtistInfo(artistId),
        ),
      );
    }
    return null;
  };

  const refreshThumbnails = async (videoMap: Map<string, _LocalVideoInfo>) => {
    // Create a new map as a temporary buffer before setting the whole thing
    let newMap = new Map<string, _LocalVideoInfo>();
    const promises = Array.from(videoMap).map(async ([key, vidInfo]) => {
      let updatedInfo = {...vidInfo};
      const newThumbnail = await videoController
        ?.getThumbnail(vidInfo.metaData)
        .catch(err => console.log('Error creating thumbnail:', err));

      // let newThumbnail;
      // if (vidInfo.metaData.localFilepath) {
      //   newThumbnail = await createThumbnail({
      //     url: vidInfo.metaData.localFilepath,
      //     timeStamp: 1000,
      //   }).catch(err => console.log('Error creating thumbnail:', err));
      // }

      if (newThumbnail) {
        updatedInfo = {
          ...updatedInfo,
          thumbnail: newThumbnail,
        };
      }

      newMap.set(key, updatedInfo);
    });

    // wait for all promises to finish
    await Promise.all(promises);

    // Set the new map
    setVideoInfoMap(newMap);
  };

  const refreshAll = async () => {
    setIsProcessing(true);
    // Exit mode
    exitEditMode();

    let videoMap = await getLatestVideosList();
    setVideoInfoMap(videoMap);

    // Update the artist list
    let artistIds: string[] = [];
    for (const videoInfo of videoMap.values()) {
      const artistId = videoInfo.metaData.base.artistId;
      if (videoInfo.metaData.base.artistId) {
        artistIds.push(artistId!);
      }
    }
    artistIds = [...new Set(artistIds)]; // Remove duplicates
    const artists = await getArtistInfos(artistIds);
    if (artists) {
      let tmpMap = new Map<string, CloudDbArtistType>();
      artists.forEach(a => {
        if (a) {
          tmpMap.set(a._id, a.data);
        }
      });
      setArtistInfoMap(tmpMap);
    }

    // Update the thumbnails
    refreshThumbnails(videoMap);

    // Update the loading and processing (Don't wait for thumnails)
    setIsLoading(false);
    setIsProcessing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshAll();
    });
    refreshAll();

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateEditList = (item: _LocalVideoInfo | null) => {
    let tmpList: _LocalVideoInfo[] = [];
    if (item) {
      if (editList.includes(item)) {
        tmpList = editList.filter(element => element !== item);
      } else {
        // Add to the list
        tmpList = [...editList, item];
      }
    }

    const unknownItems = tmpList.filter(vidInfo => {
      return vidInfo.metaData.base.artistId ? false : true;
    });

    setEditUnknowns(unknownItems.length > 0);
    setEditList(tmpList);
  };

  const exitEditMode = () => {
    updateEditList(null);
    setEditMode(false);
  };

  const toggleItemInVideoList = (item: _LocalVideoInfo) => {
    updateEditList(item);
  };

  const deleteVideos = async (fromCloud: boolean) => {
    setIsProcessing(true);

    // Loop through the videos.  Note, this is done in series because
    // it was discovered that doing that in parallel was screwing up the
    // record keeping of the user videos in firebase, the way they were updating
    // the users video list, they were not syncronized.
    for (const vidInfo of editList) {
      console.log('delete', vidInfo.metaData.base.videoId);
      await videoController!
        .deleteVideo(vidInfo.metaData, fromCloud)
        .catch(err =>
          Alert.alert(
            'Error',
            `error deleting video ${vidInfo.metaData.base.videoId} ${err}`,
          ),
        );
    }
    setIsProcessing(false);
    exitEditMode();
    await refreshAll();
  };

  const promptDeleteVideos = () => {
    if (videoController && globalContext.userInfo) {
      Alert.alert('Delete', 'Do you wish to delete this video?', [
        {
          text: 'Local Only',
          onPress: () => deleteVideos(false),
        },
        {
          text: 'Local + Cloud',
          onPress: () => deleteVideos(true),
        },
        {text: 'Cancel'},
      ]);
    }
  };

  const uploadVideos = async () => {
    if (videoController && globalContext.userInfo) {
      setIsProcessing(true);

      // Loop through the videos.  Note, this is done in series because
      // it was discovered that doing that in parallel was screwing up the
      // record keeping of the user videos in firebase, the way they were updating
      // the users video list, they were not syncronized.
      for (const vidInfo of editList) {
        if (!vidInfo.isUploaded) {
          await videoController.uploadVideo(
            globalContext.userInfo!._id,
            vidInfo.metaData,
          );
        } else {
          console.log(
            'video upload already done',
            vidInfo.metaData.base.videoId,
          );
        }
      }

      exitEditMode();
      await refreshAll();
      setIsProcessing(false);
    }
  };

  const setVideoInfo = async (videoInfo: VideoInfo | null = null) => {
    if (videoInfo) {
      for (const item of editList) {
        const metaData: VideoMetaDataLocalExt = {
          ...item.metaData,
          ...videoInfo,
        };
        await videoController?.writeLocalMetaData(metaData);
      }

      refreshAll();
    }

    // Hide the dialog
    setInfoDialogVisible(false);
  };

  const onVideoCardPressed = (item: _LocalVideoInfo) => {
    if (editMode) {
      toggleItemInVideoList(item);
    } else if (!item.metaData.localFilepath) {
      Alert.alert(
        'Future',
        'Video lives in cloud only - will support in future release',
      );
    } else {
      const absPath = videoController?.getAbsolutePath(item.metaData);
      if (absPath) {
        setVideoPath(absPath);
      }
    }
  };

  const onVideoCardLongPressed = (item: _LocalVideoInfo) => {
    updateEditList(item);
    setEditMode(true);
  };

  const renderVideoIcon = (vidInfo: _LocalVideoInfo) => {
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

  const renderVideoUploadedIcon = (vidInfo: _LocalVideoInfo) => {
    if (vidInfo.isUploaded) {
      return (
        <View style={styles.cardContainer}>
          <Avatar.Icon size={24} icon="check" />
        </View>
      );
    }
  };

  const getVideoCardTitle = (vid: _LocalVideoInfo) => {
    return vid.metaData.base.track
      ? vid.metaData.base.track
      : vid.metaData.base.createdDateTime.toString();
  };

  const renderVideoItems = (videos: _LocalVideoInfo[]) => {
    return videos.map((vidInfo, idx) => {
      return (
        <List.Item
          title={getVideoCardTitle(vidInfo)}
          key={idx}
          left={() => renderVideoIcon(vidInfo)}
          right={() => renderVideoUploadedIcon(vidInfo)}
          onPress={() => onVideoCardPressed(vidInfo)}
          onLongPress={() => onVideoCardLongPressed(vidInfo)}
        />
      );
    });
  };

  const renderVideoAccordions = () => {
    let groupedArtistMap = new Map<string, _LocalVideoInfo[]>();
    videoInfoMap.forEach(vidInfo => {
      const artistId = vidInfo.metaData.base.artistId;
      const artist =
        artistId && artistInfoMap.has(artistId)
          ? artistInfoMap.get(artistId)!.name
          : UNKNOWN_LABEL;
      if (groupedArtistMap.has(artist)) {
        groupedArtistMap.get(artist)?.push(vidInfo);
      } else {
        groupedArtistMap.set(artist, [vidInfo]);
      }
    });

    let sortedArtists = Array.from(groupedArtistMap.keys())
      .filter(a => a !== UNKNOWN_LABEL)
      .sort()
      .concat(UNKNOWN_LABEL);

    return sortedArtists.map((artist, idx) => {
      let vids = groupedArtistMap.get(artist);
      if (!vids) {
        vids = [];
      }

      // Sort the videos
      vids.sort((a, b) => {
        return getVideoCardTitle(a).localeCompare(getVideoCardTitle(b));
      });

      // Render
      return (
        <List.Accordion
          title={artist}
          titleStyle={styles.accordionSectionHeader}
          id={`${idx}`}
          key={idx}>
          {renderVideoItems(vids)}
        </List.Accordion>
      );
    });
  };

  const renderEditModeButtons = () => {
    if (editMode) {
      let uploadButton;
      if (!editUnknowns && !editList.every(info => info.isUploaded)) {
        uploadButton = (
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => uploadVideos()}
            disabled={editList.length === 0}>
            Upload
          </Button>
        );
      }

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
              onPress={() => promptDeleteVideos()}
              disabled={editList.length === 0}>
              Delete
            </Button>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => setInfoDialogVisible(true)}
              disabled={editList.length === 0}>
              Describe
            </Button>
            {uploadButton}
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
        <VideoInfoInputDialog
          visible={infoDialogVisible}
          okPressed={videoInfo => setVideoInfo(videoInfo)}
          cancelPressed={() => setVideoInfo()}
        />
        <LoadingModal isVisible={isProcessing} message="processing..." />
        {renderEditModeButtons()}
        <View style={styles.topContainer}>
          <View style={styles.accordionGroupContainer}>
            <List.AccordionGroup>{renderVideoAccordions()}</List.AccordionGroup>
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <Button
            mode="contained"
            style={styles.refreshButton}
            onPress={() => refreshAll()}>
            Refresh
          </Button>
        </View>
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
  topContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
  },
  bottomContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  accordionGroupContainer: {
    width: '100%',
  },
  accordionSectionHeader: {
    fontWeight: 'bold',
    fontSize: 16,
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
    alignContent: 'space-between',
  },
  refreshButton: {
    margin: 8,
    width: '50%',
  },
  button: {
    height: 36,
    marginLeft: 8,
    marginRight: 8,
    justifyContent: 'center',
  },
});

export default SavedScreen;
