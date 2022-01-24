/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
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
import { GlobalContext, GlobalContextType } from './contexts';

// TODO: look into  react-native-nodemediaclient for streaming HLS

// TODO: Setup the theme/color scheme
// TODO: Add to app store



function renderTestPane() {
  return (

    <SafeAreaView style={{ flex: 1 }}>
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
    </SafeAreaView>
  );
}


const Tab = createMaterialBottomTabNavigator();

const App = () => {

  // Create the email state
  let [loginInfo, setLoginInfo] = useState<LoginInfo>();

  // Setup the global context
  let globalContextValue: GlobalContextType = {
    loginInfo,
    login: (loginInfo: LoginInfo) => setLoginInfo(loginInfo),
    logout: () => setLoginInfo(undefined)
  }

  const renderMainComponent = () => {
    if (!loginInfo) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoginScreen />
        </View>
      );
    } else {
      return (
        <PaperProvider>
          <NavigationContainer>
            <Tab.Navigator shifting={false}>
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Search" component={SearchScreen} />
              <Tab.Screen name="Record" component={RecordScreen} />
              <Tab.Screen name="Saved" component={SavedScreen} />
              {/* <Tab.Screen name="Filter" component={FilterScreen} /> */}
              <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </PaperProvider>
      );
    }
  }


  return (
    <GlobalContext.Provider value={globalContextValue}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* {renderTestPane()} */}
        {renderMainComponent()}
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
