import React, { useContext, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { GlobalContext, GlobalContextType } from '../contexts/GlobalContext';


const LoginScreen = () => {
  const [email, setEmail] = useState<string>('');

  const globalContext = useContext<GlobalContextType>(GlobalContext);

  // Set function to perform the log in
  const performLogin = () => {
    if (email) {
      globalContext.login?.(email)
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}>
      <TextInput value={email} autoCapitalize='none' onChangeText={text => setEmail(text)} style={{height: 50, width: 300}}/>
      <View style={{ height: 5 }} />
      <Button mode='contained' onPress={performLogin} style={{width: 300}}>Login</Button>
    </View>
  );
}

export default LoginScreen;