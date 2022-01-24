import React, { useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import {  NodeCameraView } from 'react-native-nodemediaclient';


const RecordScreen = () => {

  let cameraRef = useRef<NodeCameraView>();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
  );
}

export default RecordScreen;