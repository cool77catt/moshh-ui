import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { GlobalContext } from '../contexts';

const SettingsScreen = () => {

  const globalContext = useContext(GlobalContext);

  const performLogout = () => {
    globalContext.logout?.();
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button mode='contained' onPress={performLogout} style={{width: 300}}>Logout</Button>
    </View>
  );
}

export default SettingsScreen;