import React, { useContext, useRef, useState, useEffect } from 'react';
import { Text, View, ViewStyle, Pressable } from 'react-native';
import { GlobalContext } from '../contexts';
// import Video from 'react-native-video';
// import VideoPlayer from 'react-native-video-player';
import {  NodePlayerView } from 'react-native-nodemediaclient';
import { IconButton, Colors } from 'react-native-paper';


const HomeScreen = () => {

  const globalContext = useContext(GlobalContext);
  const playerRef = useRef<NodePlayerView>(null);
  const [playState, setPlayState] = useState(true);

  const videoPath = require('../static/clips/clip1.mp4');

  useEffect(() => {
    console.log("component mounted");
    return () => {
      console.log("Component Unmounted");
    }
  }, []);

  const toggleVideoState = () => {
    if (playState) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.start();
    }
    setPlayState(!playState);
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