import React, { useContext, useRef, useState, useCallback } from 'react';
import { Text, View, ViewStyle, Pressable } from 'react-native';
import {  NodePlayerView } from 'react-native-nodemediaclient';
import { IconButton, Colors } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { GlobalContext } from '../contexts';


const HomeScreen = () => {

  const globalContext = useContext(GlobalContext);
  const playerRef = useRef<NodePlayerView>(null);
  const [playState, setPlayState] = useState(true);

  const videoPath = require('../static/clips/clip1.mp4');

  useFocusEffect(
    useCallback(() => {
      // Component focused entered code
      if (playState) {
        playerRef.current?.start();
      }

      return () => {
        // Component focus exited code
        playerRef.current?.pause();
      }
    }, [])
  );

  const toggleVideoState = () => {
    setPlayState(!playState);
  }

  if (playState) {
    playerRef.current?.start();
  } else {
    playerRef.current?.pause();
  }


  const renderPlayButton = () => {
    if (!playState) {
      return (
        <IconButton icon='play-circle-outline' size={75} color={Colors.white} />
      );
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View style={stackedViewStyle}>
        <NodePlayerView 
          style={{ height: '100%', width: '100%' }}
          ref={playerRef}
          inputUrl={"/Users/cool77catt/Projects/moshh/moshh-api/vid/vid.m3u8"}
          scaleMode={"ScaleAspectFit"}
          bufferTime={300}
          maxBufferTime={1000}
          autoplay={true}
        />
      </View>
      <Pressable style={pressableStyle} onPress={toggleVideoState}>
        {renderPlayButton()}
      </Pressable>
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

const pressableStyle = {
  ...stackedViewStyle,
  opacity: 0.7,
}

export default HomeScreen;