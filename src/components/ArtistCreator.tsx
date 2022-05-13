import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button} from 'react-native-paper';

const ArtistCreator = () => {
  return (
    <View style={styles.mainContainer}>
      <Button>test</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    width: '90%',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  button: {
    margin: 8,
    height: 50,
    justifyContent: 'center',
  },
});

export default ArtistCreator;
