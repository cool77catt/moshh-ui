import React, { useContext, useRef, useState, useCallback } from 'react';
import { View, ViewStyle } from 'react-native';
import { Text, IconButton, Colors } from 'react-native-paper';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {  NodeCameraView } from 'react-native-nodemediaclient';


const RecordScreen = ({navigation}: any) => {

  // console.log(props);
  const cameraRef = useRef<NodeCameraView>();
  const [isRecording, setIsRecording] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);


  // Handle when screen focus changes
  useFocusEffect(
    useCallback(() => {
      // Component focused entered code

      return () => {
        // Component focus exited code

        // Turn off the recording if its running
        cameraRef.current?.stop();
        setIsRecording(false);

        // Set if the flash is on
        setIsFlashOn(false);
      }
    }, [])
  );

  // Handle Record Control
  const recordPressed = () => {
    if (!isRecording) {
      // Start Recording
      cameraRef.current?.start();
    } else {
      cameraRef.current?.stop();
    }
    setIsRecording(!isRecording);
  }

  // Handle Flash Control
  const flashPressed = () => {
    setIsFlashOn(!isFlashOn);
  }
  cameraRef.current?.flashEnable(isFlashOn);

  // Handle Camera Swap
  const swapPressed = () => {
    cameraRef.current?.switchCamera();
  }


  const renderRecordButton = () => {
    return (
      <IconButton 
        icon={isRecording ? 'stop-circle-outline' : 'record-rec'}
        size={100} 
        color={Colors.red400} 
        style={{flex: 1}} 
        onPress={recordPressed} 
      />
    )
  }

  const renderFlashButton = () => {
    return (
      <IconButton 
        icon={isFlashOn ? 'flash-off' : 'flash-outline'}
        size={40} 
        color={Colors.black} 
        style={{flex: 1}} 
        onPress={flashPressed} 
      />
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View style={stackedViewStyle}>
        <NodeCameraView 
          style={{ height: '100%', width: '100%' }}
          ref={cameraRef}
          // outputUrl = {"rtmp://192.168.0.10/live/stream"}
          camera={{ cameraId: 1, cameraFrontMirror: true }}
          audio={{ bitrate: 32000, profile: 1, samplerate: 44100 }}
          video={{ preset: 12, bitrate: 400000, profile: 1, fps: 15, videoFrontMirror: false }}
          autopreview={true}
        />
      </View>
      <View style={buttonOverlayContainer}>
        <View style={buttonGroupStyle}>
          {renderFlashButton()}
          {renderRecordButton()}
          <IconButton icon='autorenew' size={40} color={Colors.black} style={{flex: 1}} onPress={swapPressed} />
        </View>
      </View>
    </View>
  );
}

const stackedViewStyle: ViewStyle = {
  flex: 1, 
  position: 'absolute', 
  width: '100%', 
  height: '100%',
  justifyContent: 'center', 
  alignItems: 'center',
}

const buttonOverlayContainer: ViewStyle = {
  ...stackedViewStyle,
  flexDirection: 'column',
  justifyContent: 'flex-end', 
}

const buttonGroupStyle: ViewStyle = {
  flexDirection: 'row',
  width: '100%',
  justifyContent: 'space-evenly', 
  alignItems: 'center',
}

export default RecordScreen;