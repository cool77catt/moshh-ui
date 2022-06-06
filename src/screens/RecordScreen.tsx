import React, {useRef, useState, useEffect, useContext} from 'react';
import {Alert, View, ViewStyle} from 'react-native';
import {IconButton, Colors} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {
  Camera,
  VideoFile,
  CameraCaptureError,
  useCameraDevices,
  VideoFileType,
} from 'react-native-vision-camera';
// import auth from '@react-native-firebase/auth';
import {VideoController, VideoMetaData} from '../controllers';
import {generateUuid} from '../utils/uuid';
import VideoInfoInputDialog, {
  VideoInfo,
} from '../components/VideoInfoInputDialog';
import {GlobalContext} from '../contexts';

const RecordScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [flashState, setFlashState] = useState<'auto' | 'on' | 'off'>('auto');
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const videoFileRef = useRef<VideoFile>();
  const cameraRef = useRef<Camera>(null);

  const devices = useCameraDevices();
  const [isFrontDevice, setIsFrontDevice] = useState(false);
  const globalContext = useContext(GlobalContext);

  console.log('devices', devices);

  // Stop Recording callback

  // Setup actions to perform when focus is entered/exited

  const navigation = useNavigation();

  useEffect(() => {
    const getPermission = async () => {
      await Camera.requestCameraPermission();
      await Camera.requestMicrophonePermission();
    };
    getPermission();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', async () => {
      // Stop the player
      if (isRecording) {
        await cameraRef.current?.stopRecording();
        setIsRecording(false);
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const saveVideo = (videoInfo: VideoInfo | null = null) => {
    if (videoFileRef) {
      const videoId = generateUuid();
      const videoMetaData: VideoMetaData = {
        videoId,
        userId: globalContext.userInfo!._id,
        createdDateTime: new Date(),
        artistId: videoInfo?.artistId,
        eventId: videoInfo?.eventId,
        track: videoInfo?.track,
      };

      VideoController.getInstance()
        ?.saveVideo(videoFileRef.current!.path, videoId, videoMetaData)
        .then(() => setInfoDialogVisible(false));
    }
  };

  const recordingFinished = (video: VideoFile) => {
    // Prompt user if they want to save
    videoFileRef.current = video;
    Alert.alert('Save', 'Do you wish to save this video?', [
      {
        text: 'Yes',
        onPress: () => setInfoDialogVisible(true),
      },
      {text: 'No'},
    ]);
  };

  // Handle Record Control
  const recordPressed = async () => {
    if (!isRecording) {
      // Start Recording
      cameraRef.current?.startRecording({
        flash: flashState,
        fileType: VideoController.DEFAULT_VIDEO_EXTENSION as VideoFileType,
        onRecordingFinished: recordingFinished,
        onRecordingError: (error: CameraCaptureError) =>
          Alert.alert('Error', error.toString()),
      });
      setIsRecording(true);
    } else {
      await cameraRef.current?.stopRecording();
      setIsRecording(false);
    }
  };

  // Handle Flash Control
  const flashPressed = () => {
    switch (flashState) {
      case 'auto':
        setFlashState('on');
        break;
      case 'on':
        setFlashState('off');
        break;
      case 'off':
        setFlashState('auto');
        break;
    }
  };

  // Handle Camera Swap
  const swapPressed = () => {
    setIsFrontDevice(!isFrontDevice);
  };

  // Render Functions
  const renderRecordButton = () => {
    return (
      <IconButton
        icon={isRecording ? 'stop-circle-outline' : 'record-rec'}
        size={100}
        color={Colors.red400}
        style={{flex: 1}}
        onPress={recordPressed}
      />
    );
  };

  const renderFlashButton = () => {
    let icon = 'flash-auto';

    switch (flashState) {
      case 'auto':
        icon = 'flash-auto';
        break;
      case 'on':
        icon = 'flash-outline';
        break;
      case 'off':
        icon = 'flash-off';
        break;
    }

    return (
      <IconButton
        icon={icon}
        size={40}
        color={Colors.white}
        style={{flex: 1}}
        disabled={isRecording}
        onPress={flashPressed}
      />
    );
  };

  const renderCamera = () => {
    const device = isFrontDevice ? devices.front : devices.back;
    if (device) {
      return (
        <View style={stackedViewStyle}>
          <Camera
            ref={cameraRef}
            device={device}
            isActive={true}
            video={true}
            audio={true}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>
      );
    }
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <VideoInfoInputDialog
        visible={infoDialogVisible}
        okPressed={videoInfo => saveVideo(videoInfo)}
        cancelPressed={() => saveVideo()}
      />
      {renderCamera()}
      <View style={buttonOverlayContainer}>
        <View style={buttonGroupStyle}>
          {renderFlashButton()}
          {renderRecordButton()}
          <IconButton
            icon="autorenew"
            size={40}
            color={Colors.white}
            style={{flex: 1}}
            onPress={swapPressed}
          />
        </View>
      </View>
    </View>
  );
};

const stackedViewStyle: ViewStyle = {
  flex: 1,
  position: 'absolute',
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
};

const buttonOverlayContainer: ViewStyle = {
  ...stackedViewStyle,
  flexDirection: 'column',
  justifyContent: 'flex-end',
};

const buttonGroupStyle: ViewStyle = {
  flexDirection: 'row',
  width: '100%',
  justifyContent: 'space-evenly',
  alignItems: 'center',
};

export default RecordScreen;
