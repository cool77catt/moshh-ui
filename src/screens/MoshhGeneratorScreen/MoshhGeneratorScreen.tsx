import React, {useState, useRef} from 'react';
import {StyleSheet, View, Alert} from 'react-native';
import {Button, IconButton} from 'react-native-paper';
import {launchImageLibrary} from 'react-native-image-picker';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import DocumentPicker, {
  types as DocumentPickerTypes,
} from 'react-native-document-picker';
import {
  FileSourceDialog,
  LoadingDialog,
  ProgressDialog,
  VideoPlayer,
} from '../../components';
import {fetchVideoInfo} from './utils';
import {TimelineCanvas} from './components';
import {MoshhVideoInfo} from './types';
import {
  MoshhGenerator,
  MoshhGeneratorStage,
  MoshhGeneratorOptions,
  VideoOutputOptions,
} from '../../utils';

type _MoshhStatus = {
  progress: number;
  status: string;
};

const MoshhGeneratorScreen = () => {
  const [isLoadingInputs, setIsLoadingInputs] = useState(false);
  const [generatingMoshhStatus, setGeneratingMoshhStatus] =
    useState<_MoshhStatus | null>(null);
  const [chooseFileSource, setChooseFileSource] = useState(false);
  const [inputs, setInputs] = useState<string[]>([]);
  const inputInfoMapRef = useRef<Map<string, MoshhVideoInfo>>(
    new Map<string, MoshhVideoInfo>(),
  );
  const [output, setOutput] = useState<MoshhVideoInfo | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | undefined>(
    undefined,
  );

  const clearProjectContents = () => {
    inputInfoMapRef.current.clear();
    setInputs([]);
    setOutput(null);
    setVideoPreview(undefined);
  };

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

  const onResetProject = () => {
    Alert.alert(
      'Clear project contents',
      'Are you sure you want to clear the project contents?',
      [
        {
          text: 'Yes',
          onPress: () => {
            clearProjectContents();
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
        },
      ],
    );
  };

  const removeVideo = (videoInfo: MoshhVideoInfo) => {
    // If playing the video, clear it
    if (videoInfo.path === videoPreview) {
      setVideoPreview(undefined);
    }

    // Remove from inputs
    setInputs(current => current.filter(val => val !== videoInfo.path));
    inputInfoMapRef.current.delete(videoInfo.path);
  };

  const setWeight = (videoInfo: MoshhVideoInfo, newWeight: number) => {
    const infoRef = inputInfoMapRef.current.get(videoInfo.path);
    if (infoRef) {
      infoRef.weight = newWeight;
      inputInfoMapRef.current = inputInfoMapRef.current.set(
        videoInfo.path,
        infoRef,
      );
    }
  };

  const onMoshhGeneratorStatus = (
    stage: MoshhGeneratorStage,
    progress: number,
    message: string,
  ) => {
    setGeneratingMoshhStatus({
      progress,
      status: message,
    });
  };

  const runMoshhGenerator = async () => {
    const weights = Array<number>(inputs.length).fill(1);

    setGeneratingMoshhStatus({
      progress: 0,
      status: 'Generating moshh...',
    });
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
        setGeneratingMoshhStatus({
          progress: 0,
          status: 'Saving to gallery...',
        });
        await CameraRoll.save(outputPath, {type: 'video'});

        // Generate the thumbnail and video info
        setGeneratingMoshhStatus({
          progress: 0,
          status: 'Generating thumbnail...',
        });
        setOutput(await fetchVideoInfo(outputPath));

        // Update the message to show elapsed time
        Alert.alert('Success!', 'Moshh created, find it in the gallery');
      }
    } catch (err) {
      Alert.alert('Error', `Error generating moshh: ${err}`);
    } finally {
      setGeneratingMoshhStatus(null);
    }
  };

  const onGenerateMoshhPressed = () => {
    Alert.alert(
      'Generate Moshh',
      'Are you sure you want to run the moshh generator? This process takes a few minutes...',
      [
        {
          text: 'Yes',
          onPress: () => runMoshhGenerator(),
        },
        {
          text: 'No',
        },
      ],
    );
  };

  const timelineInputs = inputs.map(path => inputInfoMapRef.current.get(path)!);

  return (
    <View style={styles.mainContainer}>
      <LoadingDialog visible={isLoadingInputs} message={'Loading inputs...'} />
      <ProgressDialog
        visible={generatingMoshhStatus !== null}
        progress={generatingMoshhStatus?.progress}
        message={generatingMoshhStatus?.status}
      />
      <FileSourceDialog
        visible={chooseFileSource}
        onCancel={() => setChooseFileSource(false)}
        onFileSystemSelected={() => onFileSystemSelected()}
        onGallerySelected={() => onGallerySelected()}
      />
      <View style={styles.previewContainer}>
        <VideoPlayer source={videoPreview} />
      </View>
      <View style={styles.inputContainer}>
        <View style={styles.timelineButtonsContainer}>
          <Button
            mode="text"
            disabled={inputs.length === 0}
            onPress={onResetProject}
            labelStyle={styles.timelineButtons}>
            Clear
          </Button>
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
            videoOutput={output}
            onVideoPressed={vidInfo => setVideoPreview(vidInfo.path)}
            onVideoRemove={vidInfo => removeVideo(vidInfo)}
            onWeightChanged={(vidInfo, newWeight) =>
              setWeight(vidInfo, newWeight)
            }
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
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineButtons: {
    fontSize: 20,
  },
  timelineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default MoshhGeneratorScreen;
