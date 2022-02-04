import React, {useContext, useRef, useState, useCallback, useEffect} from 'react';
import {SegmentedControlIOSBase, View, ViewStyle} from 'react-native';
import {Text, IconButton, Colors} from 'react-native-paper';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
// import {NodeCameraView} from 'react-native-nodemediaclient';
// import VideoRecorder from 'react-native-beautiful-video-recorder';
// import {Camera, useCameraDevices} from 'react-native-vision-camera';
// import RNFS from 'react-native-fs';
import {VIDEO_DIRECTORY, VIDEO_EXTENSION} from '../constants';

// TODO - after record is done, ask if want to save the file. If not, delete.  
// TODO - If focus lost, delete
// TODO - turn on flash
// TODO - default to back camera
// TODO - test recording from both front and back, and then both
// TODO - hide the nav bar when active, have an X at the top left to leave the screen
// TODO - auto determine video aspect ratio
// TODO - add setting for video quality
// TODO - delete the react-native-beautiful-video-recorder package and remove from pods

// Note, the following was pulled from source regarding certain settings
// public static final int VIDEO_PPRESET_16X9_270 = 0;
// public static final int VIDEO_PPRESET_16X9_360 = 1;
// public static final int VIDEO_PPRESET_16X9_480 = 2;
// public static final int VIDEO_PPRESET_16X9_540 = 3;
// public static final int VIDEO_PPRESET_16X9_720 = 4;
// public static final int VIDEO_PPRESET_16X9_1080 = 5;
// public static final int VIDEO_PPRESET_4X3_270 = 10;
// public static final int VIDEO_PPRESET_4X3_360 = 11;
// public static final int VIDEO_PPRESET_4X3_480 = 12;
// public static final int VIDEO_PPRESET_4X3_540 = 13;
// public static final int VIDEO_PPRESET_4X3_720 = 14;
// public static final int VIDEO_PPRESET_4X3_1080 = 15;
// public static final int VIDEO_PPRESET_1X1_270 = 20;
// public static final int VIDEO_PPRESET_1X1_360 = 21;
// public static final int VIDEO_PPRESET_1X1_480 = 22;
// public static final int VIDEO_PPRESET_1X1_540 = 23;
// public static final int VIDEO_PPRESET_1X1_720 = 24;
// public static final int VIDEO_PPRESET_1X1_1080 = 25;
// public static final int AUDIO_PROFILE_LCAAC = 0;
// public static final int AUDIO_PROFILE_HEAAC = 1;
// public static final int VIDEO_PROFILE_BASELINE = 0;
// public static final int VIDEO_PROFILE_MAIN = 1;
// public static final int VIDEO_PROFILE_HIGH = 2;
// public static final int CAMERA_BACK = 0;
// public static final int CAMERA_FRONT = 1;

// public static final int NM_PIXEL_BGRA = 1;
// public static final int NM_PIXEL_RGBA = 2;

// public static final int NM_LOGLEVEL_ERROR = 0;
// public static final int NM_LOGLEVEL_INFO = 1;
// public static final int NM_LOGLEVEL_DEBUG = 2;

enum RecordAction {
  Start,
  Stop,
  None,
}

const RecordScreen = () => {
  // const videoRef = useRef<VideoRecorder>();
  // const cameraRef = useRef<NodeCameraView>();
  const [isRecording, setIsRecording] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [recordPath, setRecordPath] = useState('');
  const recordAction = useRef<RecordAction>(RecordAction.None);


  // const devices = useCameraDevices();

  // Handle when screen focus changes
  // useFocusEffect(
  //   useCallback(() => {
  //     // Component focused entered code

  //     return () => {
  //       // Component focus exited code
  //       console.log('stop record');
  //       cameraRef.current?.stop();

  //       // Turn off the recording if its running
  //       setIsRecording(false);

  //       // Set if the flash is on
  //       setIsFlashOn(false);
  //     };
  //   }, []),
  // );

  // Handle actions to the recorder AFTER its been rendered, as 
  // that is required in order for the new filename to take effect
  useEffect(() => {
    // videoRef?.current?.open({maxLength: 30}, (data: any) => {
    //   // Move the file
    //   const filepathSplit: string[] = data.uri.split('/');
    //   const newFilepath =
    //     VIDEO_DIRECTORY + '/' + filepathSplit[filepathSplit.length - 1];
    //   RNFS.moveFile(data.uri, newFilepath);
    //   console.log('moving file to ', newFilepath);
    // }, []);
    // Perform camera action
    // switch (recordAction.current) {
    //   case RecordAction.Start:
    //     console.log('record', cameraRef.current?.props.outputUrl);
    //     cameraRef.current?.start();
    //     // setIsRecording(true);
    //     break;
    //   case RecordAction.Stop:
    //     console.log('stop record');
    //     cameraRef.current?.stop();
    //     // setIsRecording(false);
    //     break;
    // }
    // recordAction.current = RecordAction.None;
  }, []);

  // Handle Record Control
  // const recordPressed = () => {
  //   if (!isRecording) {
  //     // Set the filename
  //     // const now = new Date();
  //     // const breakdown = [
  //     //   now.getFullYear(),
  //     //   now.getMonth() + 1,
  //     //   now.getDate(),
  //     //   now.getHours(),
  //     //   now.getMinutes(),
  //     //   now.getSeconds(),
  //     //   now.getMilliseconds()
  //     // ]
  //     // const filename = breakdown.join('_');
  //     // setRecordPath(VIDEO_DIRECTORY + '/' + filename + VIDEO_EXTENSION);
  //     // // Start Recording
  //     // recordAction.current = RecordAction.Start;
  //     videoRef?.current?.open()
  //   } else {
  //     // recordAction.current = RecordAction.Stop;
  //   }
  //   setIsRecording(!isRecording);
  // };

  // Handle Flash Control
  // const flashPressed = () => {
  //   setIsFlashOn(!isFlashOn);
  // };
  // cameraRef.current?.flashEnable(isFlashOn);

  // Handle Camera Swap
  // const swapPressed = () => {
  //   cameraRef.current?.switchCamera();
  // };

  // Render Functions
  const renderRecordButton = () => {
    return (
      <IconButton
        icon={isRecording ? 'stop-circle-outline' : 'record-rec'}
        size={100}
        color={Colors.red400}
        style={{flex: 1}}
        // onPress={recordPressed}
      />
    );
  };

  const renderFlashButton = () => {
    return (
      <IconButton
        icon={isFlashOn ? 'flash-off' : 'flash-outline'}
        size={40}
        color={Colors.black}
        style={{flex: 1}}
        // onPress={flashPressed}
      />
    );
  };

  // const device = devices.back;
  // if (!device) {
  //   return <View />;
  // }

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <View style={stackedViewStyle}>
        {/* <Camera
          device={device}
          isActive={false}
          style={{height: '100%', width: '100%'}}
        /> */}
        {/* <VideoRecorder ref={videoRef} style={{height: '100%', width: '100%'}} /> */}
        {/* <NodeCameraView
          style={{height: '100%', width: '100%'}}
          ref={cameraRef}
          outputUrl={recordPath}
          camera={{cameraId: 0, cameraFrontMirror: true}}
          audio={{bitrate: 32000, profile: 1, samplerate: 44100}}
          video={{
            preset: 12,
            bitrate: 400000,
            profile: 1,
            fps: 30,
            videoFrontMirror: false,
          }}
          autopreview={true}
        /> */}
      </View>
      <View style={buttonOverlayContainer}>
        <View style={buttonGroupStyle}>
          {renderFlashButton()}
          {renderRecordButton()}
          <IconButton
            icon="autorenew"
            size={40}
            color={Colors.black}
            style={{flex: 1}}
            // onPress={swapPressed}
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
