import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { Button, Avatar } from 'react-native-paper';
import { 
  GoogleSignin,
  NativeModuleError 
} from '@react-native-google-signin/google-signin';
import { GlobalContext } from '../contexts';
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

  let nameInitial = ''
  if (globalContext.loginInfo && globalContext.loginInfo.name) {
    nameInitial = globalContext.loginInfo!.name!.charAt(0);
  }
  

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} >
      <Avatar.Text size={72} label={nameInitial} style={{marginTop: 24, marginBottom: 16}}/>
      <Text>{globalContext.loginInfo?.email}</Text>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}} >
      </View>
      <Button mode='contained' onPress={performLogout} style={{width: '85%', margin: 16}}>Logout</Button>
    </View>
  );
}

export default SettingsScreen;