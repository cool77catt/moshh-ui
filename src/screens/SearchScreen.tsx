import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import {Searchbar, Text, List} from 'react-native-paper';
import VideoPlayer from '../components/VideoPlayer';
import {TestEvents, TestVideos} from '../testData';
import {EventType, VideoType} from '../types';
import {v4 as uuidv4} from 'uuid';

const SearchScreen = () => {
  const [searchValue, setSearchValue] = useState('');
  const [expandVideos, setExpandVideos] = useState(true);
  const [expandEvents, setExpandEvents] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // const videoUrl = 'https://stream.mux.com/igErCerqfu61WPsAa7g7nGGkfd8528DdDDEzw6EOqeo.m3u8';
  // console.log('Events:', uuidv4());

  const videoSelected = (item: VideoType) => {
    setVideoUrl(item.url);
  };

  const renderVideo = () => {
    if (videoUrl !== '') {
      return (
        <View style={styles.videoContainer}>
          <VideoPlayer
            videoUrl={videoUrl}
            fullscreen={true}
            autoplay={videoUrl !== ''}
          />
        </View>
      );
    }
  };

  return (
    // TouchableWithoutFeedback wrapper required to dismiss the keyboard
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.mainContainer}>
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
        <View style={styles.contentsContainer}>
          <ScrollView style={styles.resultsContainer}>
            <List.Section style={styles.listSection}>
              <List.Accordion
                title={'Moshhs (0)'}
                titleStyle={styles.sectionHeader}>
                {[].map((val: EventType) => {
                  return (
                    <List.Item
                      title={val.title}
                      key={val.id}
                      description={val.description}
                    />
                  );
                })}
              </List.Accordion>
              <List.Accordion
                title={`Videos (${TestVideos.length})`}
                expanded={expandVideos}
                onPress={() => setExpandVideos(!expandVideos)}
                titleStyle={styles.sectionHeader}>
                {TestVideos.map((val: VideoType) => {
                  return (
                    <List.Item
                      title={val.title}
                      key={val.id}
                      description={val.description}
                      onPress={() => videoSelected(val)}
                    />
                  );
                })}
              </List.Accordion>
              <List.Accordion
                title={`Events (${TestEvents.length})`}
                expanded={expandEvents}
                onPress={() => setExpandEvents(!expandEvents)}
                titleStyle={styles.sectionHeader}>
                {TestEvents.map((val: EventType) => {
                  return (
                    <List.Item
                      title={val.title}
                      key={val.id}
                      description={val.description}
                    />
                  );
                })}
              </List.Accordion>
            </List.Section>
          </ScrollView>
          {renderVideo()}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentsContainer: {
    flex: 1,
    width: '100%',
  },
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
  resultsContainer: {
    flex: 1,
  },
  listSection: {
    width: '100%',
  },
  accordionContainer: {
    width: '100%',
  },
  sectionHeader: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchScreen;
