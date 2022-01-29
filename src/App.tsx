/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useState} from 'react';
import {View, SafeAreaView, Alert} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { 
  Provider as PaperProvider,  
  Text,
  ActivityIndicator,
  Colors,
} from 'react-native-paper';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { LoginMethod, LoginInfo } from './types';
import { 
  LoginScreen,
  SearchScreen,
  SavedScreen,
  FilterScreen,
  SettingsScreen,
  HomeScreen,
  RecordScreen,
} from './screens';
import { VIDEO_DIRECTORY } from './constants';
import { GlobalContext, GlobalContextType } from './contexts';

// TODO: look into  react-native-nodemediaclient for streaming HLS

// TODO: Setup the theme/color scheme
// TODO: Add to app store


import { ReadDirItem, StatResult } from 'react-native-fs';
let RNFS = require('react-native-fs');

function renderTestPane() {

  const dirExists = (directory: string) => {
    RNFS.stat(directory)
      .then((res: StatResult) => {
        console.log('dir exists', res.isDirectory());
      })
      .catch((err: Error) => {
        console.log('Error dir exists', err.message);
      });
  }

  const makeDirectory = (directory: string) => {
    RNFS.mkdir(directory)
      .then(() => {
        console.log('directory created')
      })
      .catch((err: Error) => {
        console.log('mkdir error', err.message);
      });
  }

  // Note, to see types, go to node_modules/react-native-fs/FS.common.js
  const readContents = (directory: string) => {
    console.log('read dir', directory)
    RNFS.readDir(directory)
      .then((result: ReadDirItem[]) => {
        console.log(`Got ${result.length} Results:`);
        result.forEach(file => console.log(file.name));
      })
  }

  const writeFile = () => {
    const path = RNFS.DocumentDirectoryPath + '/test.txt';

    // write the file
    RNFS.writeFile(path, 'Hello Clarice', 'utf8')
      .then(() => {
        console.log('FILE WRITTEN!');
      })
      .catch((err: Error) => {
        console.log(err.message);
      }
    );
  }

  // const videoDirectory = RNFS.DocumentDirectoryPath + '/vids';
  // makeDirectory(videoDirectory);
  // dirExists(videoDirectory);
  // readContents(RNFS.DocumentDirectoryPath);
  // writeFile();

  return (


      <View style={{
        flex: 1, justifyContent: 'center', alignItems: 'center', 
        borderColor: 'white', borderWidth: 2 
      }}>
        <View style={{ 
          flex: 1, position: 'absolute', height: '100%', width: '100%', 
          justifyContent: 'center', alignItems: 'center', backgroundColor: 'red', 
          borderColor: 'blue', borderWidth: 5 
        }}>
        </View>

        <View style={{ 
          flex: 1, position: 'absolute', height: '100%', width: '100%', 
          justifyContent: 'center', alignItems: 'center', backgroundColor: 'blue', 
          opacity: 0.5, borderColor: 'green', borderWidth: 5 
        }}>
        </View>
      </View>
  );
}


const Tab = createMaterialBottomTabNavigator();

const App = () => {
  // Setup state variables
  let [loginInfo, setLoginInfo] = useState<LoginInfo>();
  let [videoDirReady, setVideoDirReady] = useState<boolean>(false);

  // Setup the global context
  let globalContextValue: GlobalContextType = {
    loginInfo,
    login: (loginInfo: LoginInfo) => setLoginInfo(loginInfo),
    logout: () => setLoginInfo(undefined)
  };

  const loadResources = async () => {
    // Setup the vids directory
    RNFS.mkdir(VIDEO_DIRECTORY)
      .then(() => setVideoDirReady(true))
      .catch((err: Error) => {
        Alert.alert('Error', `Error with video directory: ${err.message}`);
      });
  };

  const renderLoadingScreen = () => {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator animating={true} size='large' />
        <Text style={{color: 'white', fontSize: 24}}>Loading...</Text>
      </View>
    );
  };

  const renderMainComponent = (initResourcesReady: boolean) => {
    if (!initResourcesReady) {
      return renderLoadingScreen();
    } else if (!loginInfo) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <LoginScreen />
        </View>
      );
    } else {
      return (
        <PaperProvider>
          <NavigationContainer>
            <Tab.Navigator shifting={false} initialRouteName='Home' >
              <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{tabBarLabel: 'Home', tabBarIcon: 'home'}}
              />
              <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: 'magnify' }} />
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
        </PaperProvider>
      );
    }
  }

  // Determine if initial resources are ready
  const initResourcesReady = videoDirReady;


  // Start loading the resources
  if (!initResourcesReady) {
    loadResources();
  }

  return (
    <GlobalContext.Provider value={globalContextValue}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* {renderTestPane()} */}
        {renderMainComponent(initResourcesReady)}
      </SafeAreaView>
    </GlobalContext.Provider>
  );
}

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
