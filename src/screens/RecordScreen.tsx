import React, {useRef, useState, useEffect, useCallback} from 'react';
import {Alert, View, ViewStyle} from 'react-native';
import {IconButton, Colors} from 'react-native-paper';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  Camera,
  VideoFile,
  CameraCaptureError,
  useCameraDevices,
  CameraPermissionRequestResult,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import {VIDEO_DIRECTORY} from '../constants';

const RecordScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [flashState, setFlashState] = useState<'auto' | 'on' | 'off'>('auto');
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionRequestResult | null>(null);
  const [microphonePermission, setMicrophonePermission] =
    useState<CameraPermissionRequestResult | null>(null);
  const cameraRef = useRef<Camera>(null);

  const devices = useCameraDevices();
  const [isFrontDevice, setIsFrontDevice] = useState(false);

  // Stop Recording callback

  // Setup actions to perform when focus is entered/exited

  const navigation = useNavigation();

  useEffect(() => {
    const getPermission = async () => {
      setCameraPermission(await Camera.requestCameraPermission());
      setMicrophonePermission(await Camera.requestMicrophonePermission());
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

  const saveVideo = (video: VideoFile) => {
    const filename = video.path.split('/').reverse()[0];
    const newFilepath = VIDEO_DIRECTORY + '/' + filename;
    RNFS.moveFile(video.path, newFilepath);
  };

  const recordingFinished = (video: VideoFile) => {
    // Prompt user if they want to save
    Alert.alert('Save', 'Do you wish to save this video?', [
      {
        text: 'Yes',
        onPress: () => saveVideo(video),
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
        fileType: 'mp4',
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

  const device = isFrontDevice ? devices.front : devices.back;
  if (device == null) {
    return <View />;
  }

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
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
