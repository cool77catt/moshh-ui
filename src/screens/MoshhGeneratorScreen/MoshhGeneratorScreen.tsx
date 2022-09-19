import React, {useState, useRef} from 'react';
import {StyleSheet, Text, View, Alert} from 'react-native';
import {Button, IconButton} from 'react-native-paper';
import {launchImageLibrary} from 'react-native-image-picker';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import DocumentPicker, {
  types as DocumentPickerTypes,
} from 'react-native-document-picker';
import {FileSourceDialog, LoadingDialog} from '../../components';
import {fetchVideoInfo} from './utils';
import TimelineCanvas from './TimelineCanvas';
import {MoshhVideoInfo} from './types';
import {
  MoshhGenerator,
  MoshhGeneratorProgressStatus,
  MoshhGeneratorOptions,
  VideoOutputOptions,
} from '../../utils';

const MoshhGeneratorScreen = () => {
  const [isLoadingInputs, setIsLoadingInputs] = useState(false);
  const [isGeneratingMoshh, setIsGeneratingMoshh] = useState(false);
  const [generatingMoshhStatus, setGeneratingMoshhStatus] = useState('');
  const [chooseFileSource, setChooseFileSource] = useState(false);
  const [inputs, setInputs] = useState<string[]>([]);
  const inputInfoMapRef = useRef<Map<string, MoshhVideoInfo>>(
    new Map<string, MoshhVideoInfo>(),
  );

  const onFileSystemSelected = async () => {
    setChooseFileSource(false);

    const results = await DocumentPicker.pickMultiple({
      presentationStyle: 'fullScreen',
      allowMultiSelection: true,
      // mode: 'open',
      type: DocumentPickerTypes.video,
    });

    await loadInputs(results.map(res => res.uri.split('file://')[1]));
  };

  const onGallerySelected = async () => {
    setChooseFileSource(false);

    let result = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 0,
    });

    if (result.errorCode) {
      Alert.alert('Error', `Error choosing video: ${result.errorMessage}`);
    } else if (!result.didCancel && result.assets && result.assets.length > 0) {
      await loadInputs(
        result.assets
          .filter(asset => asset.uri !== undefined)
          .map(asset => asset.uri!),
      );
    }
  };

  const loadInputs = async (filePaths: string[]) => {
    setIsLoadingInputs(true);
    for (let path of filePaths) {
      if (inputs.includes(path)) {
        Alert.alert('Duplicate', 'Video already added to project');
      } else {
        const videoInfo = await fetchVideoInfo(path);
        inputInfoMapRef.current = inputInfoMapRef.current.set(path, videoInfo);
        setInputs(current => [...current, path]);
      }
    }
    setIsLoadingInputs(false);
  };

  const removeVideo = (videoInfo: MoshhVideoInfo) => {
    setInputs(current => current.filter(val => val !== videoInfo.path));
    inputInfoMapRef.current.delete(videoInfo.path);
  };

  const onMoshhGeneratorStatus = (
    status: MoshhGeneratorProgressStatus,
    message: string,
  ) => {
    setGeneratingMoshhStatus(message);
  };

  const onGenerateMoshhPressed = async () => {
    const weights = Array<number>(inputs.length).fill(1);

    setIsGeneratingMoshh(true);
    setGeneratingMoshhStatus('Generating Moshh...');
    try {
      const moshhOptions: MoshhGeneratorOptions = {
        minSubclipDuration: 4.0,
        maxSubclipDuration: 6.0,
        outputVideoFormat: 'mov',
        preloadedConstellations: [],
        statusCallback: onMoshhGeneratorStatus,
      };

      const mediaOptions: VideoOutputOptions = {
        preset: 'ultrafast',
        pixelFormat: 'yuv420p',
        videoCodec: 'libx264',
        fps: 30000 / 1001,
        width: 1080,
        height: 1920,
        excludeAudio: false,
      };

      console.debug('Generating Moshh');
      const startTime = Date.now();
      const outputPath = await MoshhGenerator.generateMoshh(
        inputs,
        weights,
        null,
        {moshhOptions, mediaOptions},
      );
      console.debug('moshh done', Date.now() - startTime);

      console.log('mossh created, path: ', outputPath);
      if (!outputPath) {
        Alert.alert('Error', 'Failed to create Moshh...');
        console.error('Failed to create moshh');
      } else {
        // Move to the gallery
        setGeneratingMoshhStatus('Saving to gallery...');
        await CameraRoll.save(outputPath, {type: 'video'});

        // Delete the tmp file

        // Update the message to show elapsed time

        Alert.alert('Success!', 'Moshh created, find it in the gallery');
      }
    } catch (err) {
      Alert.alert('Error', `Error generating moshh: ${err}`);
    } finally {
      setIsGeneratingMoshh(false);
    }
  };

  const timelineInputs = inputs.map(path => inputInfoMapRef.current.get(path)!);

  return (
    <View style={styles.mainContainer}>
      <LoadingDialog visible={isLoadingInputs} message={'Loading inputs...'} />
      <LoadingDialog
        visible={isGeneratingMoshh}
        message={generatingMoshhStatus}
      />
      <FileSourceDialog
        visible={chooseFileSource}
        onCancel={() => setChooseFileSource(false)}
        onFileSystemSelected={() => onFileSystemSelected()}
        onGallerySelected={() => onGallerySelected()}
      />
      <View style={styles.previewContainer}>
        <Text>Preview!!</Text>
      </View>
      <View style={styles.inputContainer}>
        <View style={styles.timelineButtonsContainer}>
          <IconButton
            icon="plus-box"
            onPress={() => onGallerySelected()}
            // onPress={() => setChooseFileSource(true)}
            size={36}
          />
        </View>
        <View style={styles.timelineContainer}>
          <TimelineCanvas
            videoInfoList={timelineInputs}
            onVideoRemove={vidInfo => removeVideo(vidInfo)}
          />
        </View>
      </View>
      <Button
        mode="contained"
        disabled={inputs.length === 0}
        onPress={() => onGenerateMoshhPressed()}>
        Generate Moshh
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  previewContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    width: '100%',
  },
  inputContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  timelineButtonsContainer: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'flex-end',
  },
  timelineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default MoshhGeneratorScreen;
