import React, { useContext, useState, useEffect } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { GlobalContext, GlobalContextType } from '../contexts/GlobalContext';
import { 
  GoogleSignin, 
  GoogleSigninButton, 
  statusCodes, 
  NativeModuleError 
} from '@react-native-google-signin/google-signin';
import config from '../config';
import { LoginMethod } from '../types';


// TODO use "GoogleSignin.signInSilently" https://github.com/react-native-google-signin/google-signin/blob/master/example/src/App.tsx
// TODO use "GoogleSignin.getCurrentUser()"


// Configure the Google Sign in
GoogleSignin.configure({
  webClientId: config.webClientId,
  offlineAccess: false,
});


const LoginScreen = () => {
  // const [email, setEmail] = useState<string>('');

  const globalContext = useContext<GlobalContextType>(GlobalContext);

  useEffect(() => {
    console.log("effect mounted");
  }, [])

  // Set function to perform the log in
  // const performLogin = () => {
  //   if (email) {
  //     globalContext.login?.(email)
  //   }
  // }

  const _performGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log(`Hello ${userInfo.user.givenName} at ${userInfo.user.email}`)
      globalContext.login?.({
        email: userInfo.user.email,
        name: userInfo.user.givenName,
        loginMethod: LoginMethod.Google
      })
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
          // this.setState({
          //   error: typedError,
          // });
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}>
      {/* <TextInput value={email} autoCapitalize='none' onChangeText={text => setEmail(text)} style={{height: 50, width: 300}}/>
      <View style={{ height: 5 }} />
      <Button mode='contained' onPress={performLogin} style={{width: 300}}>Login</Button> */}
      <GoogleSigninButton
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Dark}
          onPress={_performGoogleLogin}
        />
    </View>
  );
}

export default LoginScreen;