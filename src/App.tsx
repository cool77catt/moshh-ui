/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
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
  Avatar,
  Colors,
} from 'react-native-paper';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import RNFS from 'react-native-fs';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {LoginMethodType, LoginInfo} from './types';
import {
  LoginScreen,
  SearchScreen,
  SavedScreen,
  FilterScreen,
  SettingsScreen,
  HomeScreen,
  RecordScreen,
} from './screens';
import {MoshhIcon} from './components';
import {VIDEO_DIRECTORY} from './constants';
import {GlobalContext, GlobalContextType} from './contexts';

// TODO: look into  react-native-nodemediaclient for streaming HLS

// TODO: Setup the theme/color scheme
// TODO: Add to app store

const Tab = createMaterialBottomTabNavigator();

const App = () => {
  // Setup state variables
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(
    auth().currentUser,
  );
  // let [loginInfo, setLoginInfo] = useState<LoginInfo>();
  const [videoDirReady, setVideoDirReady] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const loadResources = async () => {
    // Setup the vids directory
    RNFS.mkdir(VIDEO_DIRECTORY)
      .then(() => setVideoDirReady(true))
      .catch((err: Error) => {
        Alert.alert('Error', `Error with video directory: ${err.message}`);
      });
  };

  // Setup the initial connection with the firebase auth
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
      }
      if (isConnecting) {
        setIsConnecting(false);
      }
    });
    return subscriber; // unsubscribe on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performLogout = () => {
    auth()
      .signOut()
      .then(() => setCurrentUser(auth().currentUser))
      .catch((err: Error) => {
        Alert.alert('Error', `Error logging out: ${err.message}`);
      });
  };

  // Setup the global context
  const globalContextValue: GlobalContextType = {
    signOutUser: performLogout,
  };

  const renderLoadingScreen = () => {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <MoshhIcon />
        <ActivityIndicator animating={true} size="large" />
        <Text style={{color: 'white', fontSize: 24}}>Loading...</Text>
      </View>
    );
  };

  const renderMainComponent = (initResourcesReady: boolean) => {
    if (!initResourcesReady) {
      return renderLoadingScreen();
    } else if (!currentUser) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <LoginScreen />
        </View>
      );
    } else {
      return (
        <NavigationContainer>
          <Tab.Navigator shifting={false} initialRouteName="Home">
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{tabBarLabel: 'Home', tabBarIcon: 'home'}}
            />
            <Tab.Screen
              name="Search"
              component={SearchScreen}
              options={{tabBarIcon: 'magnify'}}
            />
            <Tab.Screen
              name="Record"
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
              name="Settings"
              component={SettingsScreen}
              options={{tabBarIcon: 'account-settings'}}
            />
          </Tab.Navigator>
        </NavigationContainer>
      );
    }
  };

  // Determine if initial resources are ready
  const initResourcesReady = videoDirReady && !isConnecting;

  // Start loading the resources
  if (!initResourcesReady) {
    loadResources();
  }

  return (
    <GlobalContext.Provider value={globalContextValue}>
      <SafeAreaView style={{flex: 1}}>
        <PaperProvider>
          {/* {renderTestPane()} */}
          {renderMainComponent(initResourcesReady)}
        </PaperProvider>
      </SafeAreaView>
    </GlobalContext.Provider>
  );
};

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
