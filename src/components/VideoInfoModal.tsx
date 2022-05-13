import React, {useState, useEffect} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {Portal, Modal, Button, TextInput} from 'react-native-paper';
import DropDown from './DropDown';
import ArtistCreator from './ArtistCreator';
import {
  CloudDbController,
  CloudDbRecordType,
  CloudDbArtistType,
  CloudDbEventType,
} from '../cloud';

interface VideoInfoModalProps {
  visible: boolean;
}

const VideoInfoModal = (props: VideoInfoModalProps) => {
  const [artistsList, setArtistsList] = useState<
    CloudDbRecordType<CloudDbArtistType>[]
  >([]);
  const [eventsList, setEventsList] = useState<
    CloudDbRecordType<CloudDbEventType>[]
  >([]);
  const [currentArtistId, setCurrentArtistId] = useState('');
  const [currentEventId, setCurrentEventId] = useState('');
  const [trackText, setTrackText] = useState('');
  const [addNewArtist, setAddNewArtist] = useState(false);
  const cloudDbController = CloudDbController.getInstance();

  const refreshArtists = () => {
    cloudDbController?.getArtists(true).then(dbList => {
      if (dbList) {
        setArtistsList(dbList);
        setCurrentArtistId(dbList[0]._id);
      } else {
        setArtistsList([]);
        setCurrentArtistId('');
      }
    });
  };

  const refreshEvents = () => {
    cloudDbController?.getEvents().then(dbList => {
      if (dbList) {
        setEventsList(dbList);
        setCurrentEventId(dbList[0]._id);
      } else {
        setEventsList([]);
        setCurrentEventId('');
      }
    });
  };

  useEffect(() => {
    refreshArtists();
    refreshEvents();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const okPressed = () => {
    if (currentArtistId === '') {
      Alert.alert('Error', 'Artist not selected');
      return;
    } else if (currentEventId === '') {
      Alert.alert('Error', 'Artist not selected');
      return;
    } else if (trackText === '') {
      Alert.alert('Error', 'Track information is empty');
      return;
    }
  };

  const cancelPressed = () => {
    setAddNewArtist(true);
    console.log('Cancel pressed');
  };

  const artistSelected = (val: string) => {
    setCurrentArtistId(val);
    if (val === '') {
      setAddNewArtist(true);
    }
  };

  const eventSelected = (val: string) => {
    setCurrentEventId(val);
    if (val === '') {
      console.log('Create new Event');
    }
  };

  const renderArtistDropdown = () => {
    const localList = artistsList.map(a => ({
      label: a.data.name,
      value: a._id,
    }));
    localList.push({label: 'Add new...', value: ''});
    return (
      <DropDown
        label={'Artist'}
        list={localList}
        value={currentArtistId}
        onValueChanged={val => artistSelected(val as string)}
      />
    );
  };

  const renderEventDropdown = () => {
    const localList = eventsList.map(a => ({
      label: `${a.data.name}`,
      value: a._id,
    }));
    localList.push({label: 'Add new...', value: ''});
    return (
      <DropDown
        label={'Event'}
        list={localList}
        value={currentEventId}
        onValueChanged={val => eventSelected(val as string)}
      />
    );
  };

  const renderActiveComponents = () => {
    if (addNewArtist) {
      return (
        <View style={styles.mainContainer}>
          <ArtistCreator />
        </View>
      );
    } else {
      return (
        <View style={styles.mainContainer}>
          {renderArtistDropdown()}
          {renderEventDropdown()}
          <TextInput
            label="Track"
            mode="outlined"
            style={styles.inputContainer}
            value={trackText}
            onChangeText={text => setTrackText(text)}
          />
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => okPressed()}>
              OK
            </Button>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => cancelPressed()}>
              Cancel
            </Button>
          </View>
        </View>
      );
    }
  };

  return (
    <Portal>
      <Modal visible={props.visible} dismissable={false}>
        {renderActiveComponents()}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  inputContainer: {
    width: '90%',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  button: {
    margin: 8,
    height: 50,
    justifyContent: 'center',
  },
});

export default VideoInfoModal;
