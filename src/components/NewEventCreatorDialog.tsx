import React, {useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import {Dialog, TextInput, Button} from 'react-native-paper';
import {CloudDbController, CloudDbRecordType, CloudDbEventType} from '../cloud';

export type NewEventCreatorDialogProps = {
  visible: boolean;
  onEventCreated: (
    eventRecord: CloudDbRecordType<CloudDbEventType> | null,
  ) => void;
};

const NewEventCreatorDialog = (props: NewEventCreatorDialogProps) => {
  const [nameText, setNameText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [errorText, setErrorText] = useState('');
  const cloudDbController = CloudDbController.getInstance();

  const nameTextChanged = (val: string) => {
    setErrorText('');
    setNameText(val);
  };

  const locationTextChanged = (val: string) => {
    setErrorText('');
    setLocationText(val);
  };

  const okButtonPressed = () => {
    if (nameText === '') {
      setErrorText('Name is invalid.');
    } else if (locationText === '') {
      setErrorText('Location is blank.');
    } else {
      let datetime = new Date();
      cloudDbController
        ?.addNewEvent(nameText, locationText, datetime)
        .then(rec => {
          setNameText('');
          setLocationText('');
          props.onEventCreated(rec);
        });
    }
  };

  const cancelButtonPressed = () => {
    setNameText('');
    setLocationText('');
    props.onEventCreated(null);
  };

  const renderErrorText = () => {
    if (errorText) {
      return <Text style={styles.errorText}>{errorText}</Text>;
    }
  };

  return (
    <Dialog visible={props.visible} dismissable={false}>
      <Dialog.Title>Create New Event</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Name"
          mode="outlined"
          value={nameText}
          onChangeText={text => nameTextChanged(text)}
        />
        <TextInput
          label="Location"
          mode="outlined"
          value={locationText}
          onChangeText={text => locationTextChanged(text)}
        />
        {renderErrorText()}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => okButtonPressed()}>Add</Button>
        <Button onPress={() => cancelButtonPressed()}>Cancel</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  errorText: {
    fontSize: 16,
    color: 'red',
    margin: 8,
    textAlign: 'right',
  },
});

export default NewEventCreatorDialog;
