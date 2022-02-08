import React, {useContext, useState, useEffect} from 'react';
import {Alert, Text, View, StyleSheet} from 'react-native';
import {Button, TextInput, Divider} from 'react-native-paper';
import {
  GoogleSignin,
  statusCodes,
  NativeModuleError,
  User,
} from '@react-native-google-signin/google-signin';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {MoshhIcon, LoadingModal} from '../components';
import config from '../config';
import {LoginMethodType} from '../types';
import {GlobalContext, GlobalContextType} from '../contexts/GlobalContext';

// TODO use "GoogleSignin.signInSilently" https://github.com/react-native-google-signin/google-signin/blob/master/example/src/App.tsx
// TODO use "GoogleSignin.getCurrentUser()"
// TODO if logged in via google, make sure they have an account first.  If not, they need to sign up
// TODO forgot password
// TODO Sign Up

export type LoginScreenProps = {
  doneCallback?: (user: FirebaseAuthTypes.User) => void;
};

// Configure the Google Sign in
GoogleSignin.configure({
  webClientId: config.webClientId,
  offlineAccess: false,
});

const LoginScreen = () => {
  // const globalContext = useContext<GlobalContextType>(GlobalContext);
  // const [isConnecting, setIsConnecting] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const _performGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();

      // Sign in 
      const {idToken} = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return auth().signInWithCredential(googleCredential);
      // }
    } catch (error) {
      const typedError = error as NativeModuleError;
      // TODO address all these options
      switch (typedError.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          // sign in was cancelled
          Alert.alert('cancelled');
          break;
        case statusCodes.IN_PROGRESS:
          // operation (eg. sign in) already in progress
          Alert.alert('in progress');
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          // android only
          Alert.alert('play services not available or outdated');
          break;
        default:
          Alert.alert('Something went wrong', typedError.toString());
      }
    }
  };

  const validateInput = () => {
    if (inputEmail === '') {
      Alert.alert('Invalid', 'No email address entered');
      return false;
    } else if (inputPassword === '') {
      Alert.alert('Invalid', 'No password entered');
      return false;
    }
    return true;
  };

  const createNewAccountGeneric = () => {
    if (!validateInput()) {
      return;
    }
    auth()
      .createUserWithEmailAndPassword(inputEmail, inputPassword) // Success will trigger the listener in app.tsx
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('', 'That email address is already in use!');
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert('', 'That email address is invalid!');
        } else {
          console.error(error);
        }
      });
  };

  const signInGeneric = () => {
    validateInput();
    auth()
      .signInWithEmailAndPassword(inputEmail, inputPassword) // Success will trigger the listener in app.tsx
      .catch(error => {
        if (error.code === 'auth/invalid-email') {
          Alert.alert('', 'That email address is invalid!');
        } else if (error.code === 'auth/user-not-found') {
          Alert.alert('', 'That email address is not found!');
        } else if (error.code === 'auth/wrong-password') {
          Alert.alert('', 'Invalid Password');
        } else {
          console.error(error);
        }
      });
  };

  const renderActionLabel = () => {
    const text = isNewUser ? 'Create New Account' : 'Sign In';
    return <Text style={styles.actionLabel}>{text}</Text>;
  };

  const renderSignUpOrInButton = () => {
    const text = isNewUser ? 'Create Account' : 'Sign In';
    return (
      <Button
        mode="contained"
        style={styles.button}
        labelStyle={styles.buttonLabel}
        onPress={isNewUser ? createNewAccountGeneric : signInGeneric}>
        {text}
      </Button>
    );
  };

  const renderSeparatorText = () => {
    const text = `or sign ${isNewUser ? 'up' : 'in'} with`;
    return <Text style={styles.separatorText}>{text}</Text>;
  };

  const renderForgotPasswordButton = () => {
    const text = isNewUser ? '' : 'Forgot Password';

    const onPress = () => {
      auth()
        .sendPasswordResetEmail(inputEmail)
        .then(() => Alert.alert('Reset', 'Password reset sent to email'))
        .catch((err: Error) => Alert.alert('Error', err.message));
    };

    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}>
        <Button
          compact={true}
          onPress={onPress}
          labelStyle={styles.forgotPasswordText}>
          {text}
        </Button>
      </View>
    );
  };

  const renderChangeActionButton = () => {
    const text = isNewUser ? 'Sign In' : 'Create Account';
    return (
      <Button style={{flex: 1}} onPress={() => setIsNewUser(!isNewUser)}>
        {text}
      </Button>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <MoshhIcon size={104} style={styles.moshhIconView} />
      {renderActionLabel()}
      <Text style={styles.emailLabel}>Email</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={{flex: 1}}
          value={inputEmail}
          textContentType={'username'}
          autoCapitalize={'none'}
          onChangeText={text => setInputEmail(text)}
        />
      </View>
      <Text style={styles.emailLabel}>Password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={{flex: 1}}
          value={inputPassword}
          secureTextEntry={!showPassword}
          textContentType={'password'}
          right={
            <TextInput.Icon
              name="eye"
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          onChangeText={text => setInputPassword(text)}
        />
      </View>
      {renderForgotPasswordButton()}
      {renderSignUpOrInButton()}
      {renderSeparatorText()}
      <Button
        style={{backgroundColor: '#EA4335'}}
        labelStyle={{color: 'white', fontWeight: 'bold'}}
        onPress={_performGoogleLogin}>
        Google
      </Button>
      <Button
        style={{backgroundColor: '#1DA1F2', marginTop: 4}}
        labelStyle={{color: 'white', fontWeight: 'bold'}}
        onPress={() => console.log('Twitter login')}>
        Twitter
      </Button>
      <Button
        style={{backgroundColor: '#4585FB', marginTop: 4}}
        labelStyle={{color: 'white', fontWeight: 'bold'}}
        onPress={() => console.log('Facebook login')}>
        Facebook
      </Button>
      <Divider style={{marginTop: 24, borderWidth: 1}} />
      <View style={styles.optionsContainer}>{renderChangeActionButton()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '85%',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  moshhIconView: {
    margin: 16,
    alignItems: 'center',
  },
  actionLabel: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'left',
    textTransform: 'uppercase',
  },
  emailLabel: {
    paddingBottom: 8,
    paddingTop: 16,
    fontSize: 16,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginTop: 8,
    marginBottom: 0,
    justifyContent: 'center',
    height: 56,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
    height: 48,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  separatorText: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    // alignContent: 'space-around',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 12,
    textAlign: 'right',
    marginRight: 0,
  },
});

export default LoginScreen;
