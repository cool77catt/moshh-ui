import React, {useRef, useState, useContext} from 'react';
import {Alert, View, StyleSheet} from 'react-native';
import {Button, Switch, Text} from 'react-native-paper';
import {
  launchImageLibrary,
  launchCamera,
  Asset,
} from 'react-native-image-picker';
// import auth from '@react-native-firebase/auth';
import {VideoController, VideoMetaData} from '../controllers';
import VideoInfoInputDialog, {
  VideoInfo,
} from '../components/VideoInfoInputDialog';
import LoadingModal from '../components/LoadingModal';
import {GlobalContext} from '../contexts';

const RecordScreen = () => {
  const [saveToPhotos, setSaveToPhotos] = useState(false);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingMessage = useRef<string>('Processing...');
  const videoFilesRef = useRef<Asset[]>();
  const globalContext = useContext(GlobalContext);

  const saveVideo = async (videoInfo: VideoInfo | null = null) => {
    const videoController = VideoController.getInstance();
    if (
      videoController &&
      videoFilesRef.current &&
      videoFilesRef.current?.length > 0
    ) {
      processingMessage.current = 'Saving file(s)...';
      setIsProcessing(true);
      const promises = videoFilesRef.current.map(async asset => {
        const videoMetaData: VideoMetaData = {
          videoId: VideoController.generateNewId(),
          userId: globalContext.userInfo!._id,
          createdDateTime: new Date(),
          artistId: videoInfo?.artistId,
          eventId: videoInfo?.eventId,
          track: videoInfo?.track,
        };
        return videoController
          .saveVideoLocally(asset.uri!, videoMetaData)
          .then(localMeta => {
            // Upload (don't wait for it to finish before clearing the info dialog)
            if (localMeta) {
              videoController.uploadVideo(videoMetaData.userId, localMeta);
            }
          })
          .catch(err => Alert.alert('Error', `Error saving video ${err}`));
      });

      await Promise.all(promises);

      setIsProcessing(false);
      setInfoDialogVisible(false);
    }
  };

  const recordNew = async () => {
    let result = await launchCamera({
      mediaType: 'video',
      videoQuality: 'high',
      saveToPhotos: saveToPhotos,
      presentationStyle: 'fullScreen',
    });

    if (result.errorCode) {
      Alert.alert('Error', `Error taking video: ${result.errorMessage}`);
    } else if (!result.didCancel && result.assets && result.assets.length > 0) {
      videoFilesRef.current = result.assets;
      setInfoDialogVisible(true);
    }
  };

  const selectFromPhotos = async () => {
    let result = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 0,
    });

    if (result.errorCode) {
      Alert.alert('Error', `Error choosing video: ${result.errorMessage}`);
    } else if (!result.didCancel && result.assets && result.assets.length > 0) {
      videoFilesRef.current = result.assets;
      setInfoDialogVisible(true);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <LoadingModal
        isVisible={isProcessing}
        message={processingMessage.current}
      />
      <VideoInfoInputDialog
        visible={infoDialogVisible}
        okPressed={videoInfo => saveVideo(videoInfo)}
        cancelPressed={() => saveVideo()}
      />
      <View style={styles.saveToPhotosContainer}>
        <Switch
          value={saveToPhotos}
          onChange={() => setSaveToPhotos(!saveToPhotos)}
          style={styles.switch}
        />
        <Text>Save To Photos</Text>
      </View>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => recordNew()}>
        Record New
      </Button>
      <View style={styles.dividerView} />
      <Button
        mode="contained"
        style={styles.button}
        labelStyle={{textAlignVertical: 'center'}}
        onPress={() => selectFromPhotos()}>
        From Photos
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerView: {
    borderWidth: 1,
    borderColor: 'darkgray',
    width: 200,
    margin: 8,
  },
  saveToPhotosContainer: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
  },
  saveToPhotosLabel: {
    fontSize: 16,
  },
  switch: {
    margin: 12,
  },
  button: {
    width: 168,
    height: 48,
    justifyContent: 'center',
  },
});

export default RecordScreen;
