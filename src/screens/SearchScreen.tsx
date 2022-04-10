import React, {useState, useEffect, useRef, useContext} from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import {Searchbar, Text, List} from 'react-native-paper';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import VideoPlayer from '../components/VideoPlayer';
import {TestEvents, TestVideos} from '../testData';
import {EventType, VideoType} from '../types';
import {GlobalContext} from '../contexts';
import VideoModal from '../components/VideoModal';

const _NAV_ROUTE_HOME = 'Home';

type RootStackParamList = {
  [_NAV_ROUTE_HOME]: undefined;
  // [NAV_ROUTE_VIDEO]: VideoScreenParams;
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const navigatorOptions = {
  headerTransparent: true,
  title: '',
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const _LocalSearchScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const [searchValue, setSearchValue] = useState('');
  const [expandVideos, setExpandVideos] = useState(true);
  const [expandEvents, setExpandEvents] = useState(false);
  const [videoSource, setVideoSource] = useState('');

  const videoSelected = (item: VideoType) => {
    // navigation.push(NAV_ROUTE_VIDEO, {source: item.url});
    setVideoSource(item.url);
  };

  let videoModal;
  if (videoSource !== '') {
    videoModal = (
      <VideoModal
        source={videoSource}
        visible={true}
        onClose={() => setVideoSource('')}
      />
    );
  }

  return (
    // TouchableWithoutFeedback wrapper required to dismiss the keyboard
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.mainContainer}>
        {videoModal}
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
        <ScrollView style={styles.contentsContainer}>
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
      </View>
    </TouchableWithoutFeedback>
  );
};

const SearchScreen = () => {
  const globalContext = useContext(GlobalContext);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Stop the player
      globalContext.videoModalRef?.current?.pause();
    });

    return unsubscribe;
  }, [navigation, globalContext]);

  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator>
        <Stack.Screen
          name={_NAV_ROUTE_HOME}
          component={_LocalSearchScreen}
          options={navigatorOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
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
});

export default SearchScreen;
