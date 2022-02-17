import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Searchbar} from 'react-native-paper';
import VideoPlayer from '../components/VideoPlayer';

const SearchScreen = () => {
  const [searchValue, setSearchValue] = useState('');

  const videoUrl = 'https://stream.mux.com/igErCerqfu61WPsAa7g7nGGkfd8528DdDDEzw6EOqeo.m3u8';

  return (
    // TouchableWithoutFeedback wrapper required to dismiss the keyboard
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <View style={styles.searchBarContainer}>
          <Searchbar
            placeholder="Search"
            autoCapitalize="none"
            autoComplete="off"
            style={styles.searchBar}
            value={searchValue}
            onChangeText={setSearchValue}
          />
        </View>
        <View style={{flex: 1, width: '100%'}}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <VideoPlayer videoUrl={videoUrl} />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    marginTop: 24,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    width: '100%',
  },
  searchBar: {
    margin: 8,
    width: '90%',
  },
});

export default SearchScreen;
