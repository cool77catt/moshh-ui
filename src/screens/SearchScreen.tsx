import React, { useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { GlobalContext } from '../contexts';


const SearchScreen = () => {

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Search</Text>
    </View>
  );
}

export default SearchScreen;