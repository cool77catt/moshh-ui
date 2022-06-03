import React, {useState, useEffect} from 'react';
import {Alert, StyleSheet} from 'react-native';
import {Portal, Button, TextInput, Dialog} from 'react-native-paper';
import DropDown, {DropDownValue} from './DropDown';
import NewArtistCreatorDialog from './NewArtistCreatorDialog';
import NewEventCreatorDialog from './NewEventCreatorDialog';
import {
  CloudDbController,
  CloudDbRecordType,
  CloudDbArtistType,
  CloudDbEventType,
} from '../cloud';

export type VideoInfo = {
  artistId: string;
  eventId: string;
  track: string;
};

export interface Props {
  visible: boolean;
  okPressed: (videoInfo: VideoInfo) => void;
  cancelPressed: () => void;
}

type InputType = 'GET_INFO' | 'CREATE_NEW_ARTIST' | 'CREATE_NEW_EVENT';

const REFRESH_DROPDOWN_ID = 'REFRESH';
const ADD_NEW_DROPDOWN_ID = 'ADD_NEW';

const VideoInfoInputDialog = (props: Props) => {
  const [artistsList, setArtistsList] = useState<
    CloudDbRecordType<CloudDbArtistType>[]
  >([]);
  const [eventsList, setEventsList] = useState<
    CloudDbRecordType<CloudDbEventType>[]
  >([]);
  const [currentArtistId, setCurrentArtistId] =
    useState<DropDownValue>(REFRESH_DROPDOWN_ID);
  const [currentEventId, setCurrentEventId] =
    useState<DropDownValue>(REFRESH_DROPDOWN_ID);
  const [trackText, setTrackText] = useState('');
  const [inputType, setInputType] = useState<InputType>('GET_INFO');
  const cloudDbController = CloudDbController.getInstance();

  const refreshArtists = (currentId: string = '') => {
    cloudDbController?.getArtists(true).then(dbList => {
      if (dbList) {
        setArtistsList(dbList);
        setCurrentArtistId(currentId === '' ? dbList[0]._id : currentId);
      } else {
        setArtistsList([]);
        setCurrentArtistId(REFRESH_DROPDOWN_ID);
      }
    });
  };

  const refreshEvents = (currentId: string = '') => {
    cloudDbController?.getEvents().then(dbList => {
      if (dbList) {
        setEventsList(dbList);
        setCurrentEventId(currentId === '' ? dbList[0]._id : currentId);
      } else {
        setEventsList([]);
        setCurrentEventId(REFRESH_DROPDOWN_ID);
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

    props.okPressed({
      artistId: currentArtistId as string,
      eventId: currentEventId as string,
      track: trackText,
    });
  };

  const cancelPressed = () => {
    console.log('Cancel pressed');
  };

  const artistSelected = (val: DropDownValue) => {
    setCurrentArtistId(val);
    if (val === REFRESH_DROPDOWN_ID) {
      refreshArtists();
    } else if (val === ADD_NEW_DROPDOWN_ID) {
      setInputType('CREATE_NEW_ARTIST');
    }
  };

  const newArtistCreated = (
    record: CloudDbRecordType<CloudDbArtistType> | null,
  ) => {
    if (record) {
      refreshArtists(record._id);
    }
    setInputType('GET_INFO');
  };

  const eventSelected = (val: string) => {
    setCurrentEventId(val);
    if (val === REFRESH_DROPDOWN_ID) {
      refreshEvents();
    } else if (val === ADD_NEW_DROPDOWN_ID) {
      setInputType('CREATE_NEW_EVENT');
    }
  };

  const newEventCreated = (
    record: CloudDbRecordType<CloudDbEventType> | null,
  ) => {
    if (record) {
      refreshEvents(record._id);
    }
    setInputType('GET_INFO');
  };

  const renderArtistDropdown = () => {
    const localList = artistsList.map(a => ({
      label: a.data.name,
      value: a._id,
    }));
    localList.push({label: 'Refresh', value: REFRESH_DROPDOWN_ID});
    localList.push({label: 'Add new...', value: ADD_NEW_DROPDOWN_ID});
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
    localList.push({label: 'Refresh', value: REFRESH_DROPDOWN_ID});
    localList.push({label: 'Add new...', value: ADD_NEW_DROPDOWN_ID});
    return (
      <DropDown
        label={'Event'}
        list={localList}
        value={currentEventId}
        onValueChanged={val => eventSelected(val as string)}
      />
    );
  };

  return (
    <Portal>
      <NewArtistCreatorDialog
        visible={props.visible && inputType === 'CREATE_NEW_ARTIST'}
        onArtistCreated={val => newArtistCreated(val)}
      />
      <NewEventCreatorDialog
        visible={props.visible && inputType === 'CREATE_NEW_EVENT'}
        onEventCreated={val => newEventCreated(val)}
      />
      <Dialog
        visible={props.visible && inputType === 'GET_INFO'}
        dismissable={false}>
        <Dialog.Title>Video Info</Dialog.Title>
        <Dialog.Content>
          {/* {renderActiveComponents()} */}
          {renderArtistDropdown()}
          {renderEventDropdown()}
          <TextInput
            label="Track"
            mode="outlined"
            style={styles.inputContainer}
            value={trackText}
            onChangeText={text => setTrackText(text)}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => okPressed()}>Done</Button>
          <Button onPress={() => cancelPressed()}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
  },
});

export default VideoInfoInputDialog;
