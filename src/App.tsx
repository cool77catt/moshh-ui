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
import { 
  LoginScreen,
  SearchScreen,
  SavedScreen,
  FilterScreen,
  SettingsScreen,
} from './screens';
import { GlobalContext, GlobalContextType } from './contexts';

// TODO: Setup the theme/color scheme
// TODO: login with Google
// TODO: Add to app store




const Tab = createMaterialBottomTabNavigator();

const App = () => {

  // Create the email state
  let [email, setEmail] = useState<string>('');

  // Setup the global context
  let globalContextValue: GlobalContextType = {
    email,
    login: (email: string) => setEmail(email),
    logout: () => setEmail('')
  }


  const renderSection = () => {
    if (email === '') {
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
              <Tab.Screen name="Search" component={SearchScreen} />
              <Tab.Screen name="Saved" component={SavedScreen} />
              <Tab.Screen name="Filter" component={FilterScreen} />
              <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </PaperProvider>
      );
    }
  }


  return (
    <GlobalContext.Provider value={globalContextValue}>
      {renderSection()}
      {/* <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoginScreen />
      </View> */}
    </GlobalContext.Provider>
    // <View
    //   style={{
    //     flex: 1,
    //     justifyContent: "center",
    //     alignItems: "center"
    //   }}>
    //   <Text style={{color: "white"}}>Hello, world!</Text>
    // </View>
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
