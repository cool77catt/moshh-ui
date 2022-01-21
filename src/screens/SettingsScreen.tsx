import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { GlobalContext } from '../contexts';
import { 
  GoogleSignin,
  NativeModuleError 
} from '@react-native-google-signin/google-signin';
import { LoginMethod } from '../types';

const SettingsScreen = () => {

  const globalContext = useContext(GlobalContext);

  const performGoogleLogout = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (error) {
      const typedError = error as NativeModuleError;
      console.log(typedError);
    }
  }

  const performLogout = async () => {
    if (globalContext.loginInfo?.loginMethod === LoginMethod.Google) {
      performGoogleLogout();
    }

    globalContext.logout?.();
  };

  

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button mode='contained' onPress={performLogout} style={{width: 300}}>Logout</Button>
    </View>
  );
}

export default SettingsScreen;