/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  SafeAreaView,
  Alert,
  StyleSheet,
  StyleProp,
  TextStyle,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {
  Provider as PaperProvider,
  Text,
  ActivityIndicator,
  DefaultTheme,
} from 'react-native-paper';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import RNFS from 'react-native-fs';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import RNBootSplash from 'react-native-bootsplash';
import {
  LoginScreen,
  SearchScreen,
  SavedScreen,
  FilterScreen,
  ProfileScreen,
  HomeScreen,
  RecordScreen,
  CreateUserScreen,
} from './screens';
import MoshhIcon from './components/MoshhIcon';
import {VIDEO_DIRECTORY} from './constants';
import {GlobalContext, GlobalContextType} from './contexts';
import {
  UserDbRecordType,
  getUserInfo,
  setDefaultUserInfo,
} from './utils/firestoreDb';
import VideoModal from './components/VideoModal';

const Tab = createMaterialBottomTabNavigator();

const App = () => {
  // Setup state variables
  const [currentUserInfo, setCurrentUserInfo] =
    useState<UserDbRecordType | null>(null);
  // const [userHandleValid, setUserHandleValid] = useState<boolean>(false);
  // let [loginInfo, setLoginInfo] = useState<LoginInfo>();
  const [videoDirReady, setVideoDirReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const videoModalRef = useRef<VideoModal | null>(null);

  const checkResourceStatus = () => {
    const loadedStatus = isConnected && videoDirReady;
    if (!resourcesLoaded && loadedStatus) {
      RNBootSplash.hide({fade: true});
      setResourcesLoaded(true);
    }
  };

  const loadResources = async () => {
    console.log('dir', RNFS.DocumentDirectoryPath);
    // Setup the vids directory
    RNFS.mkdir(VIDEO_DIRECTORY)
      .then(() => setVideoDirReady(true))
      .catch((err: Error) => {
        Alert.alert('Error', `Error with video directory: ${err.message}`);
      });
  };

  // Setup the initial connection with the firebase auth
  useEffect(() => {
    // Load the resources
    loadResources();

    const subscriber = auth().onAuthStateChanged(user => {
      if (!isConnected) {
        // Ignore the first call, as it simplies means the registration/connection is done
        setIsConnected(true);
      }

      if (!user) {
        setCurrentUserInfo(null);
      } else if (!user.email) {
        Alert.alert('Error', 'User has no email address...');
        setCurrentUserInfo(null);
      } else {
        getUserInfo(user.uid)
          .then((data: UserDbRecordType) => {
            if (!data) {
              setDefaultUserInfo(user.uid)
                .then((defaultData: UserDbRecordType) => {
                  setCurrentUserInfo(defaultData);
                })
                .catch(err =>
                  console.log('Error setting default user data', err.message),
                );
            } else {
              setCurrentUserInfo(data);
            }
          })
          .catch(err => {
            console.log(err.message);
            Alert.alert('Error', `Error getting user info ${err.message}`);
            setCurrentUserInfo(null);
          });
      }
    });

    return subscriber; // unsubscribe on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performLogout = () => {
    auth()
      .signOut()
      .then(() => setCurrentUserInfo(null))
      .catch((err: Error) => {
        Alert.alert('Error', `Error logging out: ${err.message}`);
      });
  };

  // Setup the global context
  const globalContextValue: GlobalContextType = {
    userInfo: currentUserInfo,
    setUserInfo: setCurrentUserInfo,
    signOutUser: performLogout,
    videoModalRef: videoModalRef,
    setVideoModalRef: ref => (videoModalRef.current = ref),
  };

  // Check the status of the resources that need to be loaded
  checkResourceStatus();

  const renderLoadingScreen = () => {
    return (
      <View style={styles.mainContainer}>
        <MoshhIcon />
        <ActivityIndicator animating={true} size="large" />
        <Text style={{color: 'white', fontSize: 24}}>Loading...</Text>
      </View>
    );
  };

  const renderMainComponent = () => {
    if (!resourcesLoaded) {
      return renderLoadingScreen();
    } else if (!auth().currentUser) {
      return (
        <View style={styles.mainContainer}>
          <LoginScreen />
        </View>
      );
    } else if (!currentUserInfo || !currentUserInfo.handle) {
      return (
        <View style={styles.mainContainer}>
          <CreateUserScreen />
        </View>
      );
    } else {
      return (
        <NavigationContainer>
          <Tab.Navigator shifting={false} initialRouteName="Home">
            {/* <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{tabBarLabel: 'Home', tabBarIcon: 'home'}}
            /> */}
            <Tab.Screen
              name="Search"
              component={SearchScreen}
              options={{tabBarIcon: 'magnify'}}
            />
            <Tab.Screen
              name="Rec"
              component={RecordScreen}
              options={{tabBarIcon: 'plus-circle-outline'}}
            />
            <Tab.Screen
              name="Saved"
              component={SavedScreen}
              options={{tabBarIcon: 'content-save'}}
            />
            {/* <Tab.Screen name="Filter" component={FilterScreen} /> */}
            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{tabBarIcon: 'account-settings'}}
            />
          </Tab.Navigator>
        </NavigationContainer>
      );
    }
  };

  return (
    <GlobalContext.Provider value={globalContextValue}>
      <SafeAreaView style={{flex: 1}}>
        <PaperProvider theme={{...DefaultTheme, dark: false}}>
          {/* {renderTestPane()} */}
          {renderMainComponent()}
        </PaperProvider>
      </SafeAreaView>
    </GlobalContext.Provider>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;

// import React from 'react';
// import {
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   useColorScheme,
//   View,
// } from 'react-native';

// import {
//   Colors,
//   DebugInstructions,
//   Header,
//   LearnMoreLinks,
//   ReloadInstructions,
// } from 'react-native/Libraries/NewAppScreen';

// const Section: React.FC<{
//   title: string;
// }> = ({children, title}) => {
//   const isDarkMode = useColorScheme() === 'dark';
//   return (
//     <View style={styles.sectionContainer}>
//       <Text
//         style={[
//           styles.sectionTitle,
//           {
//             color: isDarkMode ? Colors.white : Colors.black,
//           },
//         ]}>
//         {title}
//       </Text>
//       <Text
//         style={[
//           styles.sectionDescription,
//           {
//             color: isDarkMode ? Colors.light : Colors.dark,
//           },
//         ]}>
//         {children}
//       </Text>
//     </View>
//   );
// };

// const App = () => {
//   const isDarkMode = useColorScheme() === 'dark';

//   const backgroundStyle = {
//     backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
//   };

//   return (
//     <SafeAreaView style={backgroundStyle}>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <ScrollView
//         contentInsetAdjustmentBehavior="automatic"
//         style={backgroundStyle}>
//         <Header />
//         <View
//           style={{
//             backgroundColor: isDarkMode ? Colors.black : Colors.white,
//           }}>
//           <Section title="Step One">
//             Edit <Text style={styles.highlight}>App.tsx</Text> to change this
//             screen and then come back to see your edits.
//           </Section>
//           <Section title="See Your Changes">
//             <ReloadInstructions />
//           </Section>
//           <Section title="Debug">
//             <DebugInstructions />
//           </Section>
//           <Section title="Learn More">
//             Read the docs to discover what to do next:
//           </Section>
//           <LearnMoreLinks />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   sectionContainer: {
//     marginTop: 32,
//     paddingHorizontal: 24,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '600',
//   },
//   sectionDescription: {
//     marginTop: 8,
//     fontSize: 18,
//     fontWeight: '400',
//   },
//   highlight: {
//     fontWeight: '700',
//   },
// });

// export default App;
