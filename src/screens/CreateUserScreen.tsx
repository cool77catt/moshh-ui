import React, {useState, useContext} from 'react';
import {StyleSheet, View, Alert} from 'react-native';
import {Text, TextInput, Button} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import {
  UserDbRecordType,
  addUserHandleToDatabase,
  getUserInfo,
  FS_ERR_CODE_HANDLE_UNAVAILABLE,
} from '../utils/firestoreDb';
import {GlobalContext} from '../contexts';

// TODO test handle with different capitalization

const CreateUserScreen = () => {
  const context = useContext(GlobalContext);

  const [handleText, setHandleText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentUser = auth().currentUser;

  const handleInputChange = (text: string) => {
    // Ignore any leading @ symbols
    if (text === '@') {
      text = '';
    }

    setErrorMsg(''); // Clear the error message
    setHandleText(text);
  };

  const setHandle = () => {
    addUserHandleToDatabase(currentUser!.uid, handleText)
      .then(() => {
        // Success
        getUserInfo(currentUser!.uid).then((val: UserDbRecordType) =>
          context.setUserInfo?.(val),
        );
      })
      .catch(err => {
        if (err.code === FS_ERR_CODE_HANDLE_UNAVAILABLE) {
          setErrorMsg(err.message);
        }
      });
  };

  return (
    <View style={styles.mainContainer}>
      <View>
        <Text style={styles.title}>Welcome,</Text>
        <Text style={styles.emailText}>{currentUser?.email}</Text>
        <Text style={styles.promptText}>
          Please create a unique handle for your account
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder="Example: @JoeSmith123"
            autoCapitalize={'none'}
            left={<TextInput.Affix text="@" />}
            value={handleText}
            onChangeText={handleInputChange}
          />
        </View>
        <Button mode="contained" style={styles.button} onPress={setHandle}>
          Done
        </Button>
        <Text style={styles.errorLabel}>{errorMsg}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 32,
  },
  emailText: {
    fontSize: 20,
    textAlign: 'right',
    padding: 4,
  },
  promptText: {
    fontSize: 12,
    paddingTop: 32,
  },
  inputContainer: {
    // marginTop: 4,
    marginBottom: 0,
    height: 56,
  },
  button: {
    marginTop: 16,
    justifyContent: 'center',
    height: 48,
  },
  buttonLabel: {
    fontSize: 36,
  },
  errorLabel: {
    padding: 8,
    textAlign: 'center',
    color: 'red',
  },
});

export default CreateUserScreen;
