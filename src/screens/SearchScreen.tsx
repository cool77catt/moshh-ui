import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { GlobalContext } from '../contexts';


const SearchScreen = () => {

  const globalContext = useContext(GlobalContext);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hello {globalContext.email}</Text>
    </View>
  );
}

export default SearchScreen;