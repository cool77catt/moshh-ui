import React, {useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import {Dialog, TextInput, Button} from 'react-native-paper';
import {
  CloudDbController,
  CloudDbRecordType,
  CloudDbArtistType,
} from '../cloud';

export type NewArtistCreatorDialogProps = {
  visible: boolean;
  onArtistCreated: (
    artistRecord: CloudDbRecordType<CloudDbArtistType> | null,
  ) => void;
};

const NewArtistCreatorDialog = (props: NewArtistCreatorDialogProps) => {
  const [nameText, setNameText] = useState('');
  const [errorText, setErrorText] = useState('');
  const cloudDbController = CloudDbController.getInstance();

  const nameTextChanged = (val: string) => {
    setErrorText('');
    setNameText(val);
  };

  const okButtonPressed = () => {
    if (nameText === '') {
      setErrorText('Name is invalid.');
      return;
    }

    cloudDbController?.addNewArtist(nameText).then(rec => {
      setNameText('');
      props.onArtistCreated(rec);
    });
  };

  const cancelButtonPressed = () => {
    setNameText('');
    props.onArtistCreated(null);
  };

  const renderErrorText = () => {
    if (errorText) {
      return <Text style={styles.errorText}>{errorText}</Text>;
    }
  };

  return (
    <Dialog visible={props.visible} dismissable={false}>
      <Dialog.Title>Create New Artist</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Name"
          mode="outlined"
          value={nameText}
          onChangeText={text => nameTextChanged(text)}
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

export default NewArtistCreatorDialog;
