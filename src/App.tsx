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
import {View, SafeAreaView, Alert, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {
  Provider as PaperProvider,
  Text,
  ActivityIndicator,
  DefaultTheme,
} from 'react-native-paper';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import auth from '@react-native-firebase/auth';
import RNBootSplash from 'react-native-bootsplash';
import {
  LoginScreen,
  SearchScreen,
  SavedScreen,
  ProfileScreen,
  RecordScreen,
  CreateUserScreen,
  MoshhGeneratorScreen,
} from './screens';
import MoshhIcon from './components/MoshhIcon';
import {GlobalContext, GlobalContextType} from './contexts';
import VideoModal from './components/VideoModal';
import {VideoController, UserController, UserInfo} from './controllers';
import {RNFSFileStore, RealmDb} from './localStorage';
import {CloudDbController, FirebaseDb, GCPCloudStorage} from './cloud';
import {MediaUtils} from './utils/MediaUtils';
import {MoshhGenerator} from './utils/MoshhGenerator';

const Tab = createMaterialBottomTabNavigator();

const App = () => {
  // Setup state variables
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const videoModalRef = useRef<VideoModal | null>(null);

  const checkResourceStatus = () => {
    const loadedStatus = isConnected;
    if (!resourcesLoaded && loadedStatus) {
      RNBootSplash.hide({fade: true});
      setResourcesLoaded(true);
    }
  };

  const configureModules = async () => {
    // setup local storage
    const localDb = new RealmDb();
    const localFileStore = await RNFSFileStore.configure();

    // Connfigure the media utils and Moshh Generator
    await MediaUtils.configure(localFileStore!);
    await MoshhGenerator.configure(localFileStore!);

    // localFileStore
    //   ?.readDirectory('')
    //   .then(dirItems =>
    //     dirItems.forEach(item => console.log('read', item.path)),
    //   );

    // localFileStore
    //   ?.readDirectory('', true)
    //   .then(dirItems =>
    //     dirItems.forEach(item => console.log('readRecurs', item.path)),
    //   );

    // setup cloud storage
    const cloudDb = new FirebaseDb();
    await CloudDbController.configure(cloudDb);

    // setup the user controller
    const userController = await UserController.configure(cloudDb);

    // setup video controller
    const cloudStorage = new GCPCloudStorage();
    await VideoController.configure(
      localFileStore!,
      localDb,
      cloudStorage,
      cloudDb,
      userController!,
    );
  };

  const currentUserChanged = async (user: UserInfo | null) => {
    setCurrentUserInfo(user);
    if (user) {
      VideoController.getInstance()?.setCurrentUserId(user._id);
    }
  };

  // Setup the initial connection with the firebase auth
  useEffect(() => {
    // Load the resources
    configureModules();

    const subscriber = auth().onAuthStateChanged(user => {
      if (!isConnected) {
        // Ignore the first call, as it simplies means the registration/connection is done
        setIsConnected(true);
      }

      if (!user) {
        currentUserChanged(null);
      } else if (!user.email) {
        Alert.alert('Error', 'User has no email address...');
        currentUserChanged(null);
      } else {
        console.log('User Id:', user.uid);
        const userController = UserController.getInstance();
        userController
          ?.readUserInfo(user.uid)
          .then(data => {
            if (!data) {
              userController
                .setDefaultUserInfo(user.uid)
                .then(defaultData => {
                  if (defaultData) {
                    currentUserChanged(defaultData);
                  } else {
                    throw new Error(`Default data is ${defaultData}`);
                  }
                })
                .catch(err =>
                  console.log('Error setting default user data', err.message),
                );
            } else {
              currentUserChanged(data);
            }
          })
          .catch(err => {
            console.log(err.message);
            Alert.alert('Error', `Error getting user info ${err.message}`);
            currentUserChanged(null);
          });
      }
    });

    return subscriber; // unsubscribe on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performLogout = () => {
    auth()
      .signOut()
      .then(() => currentUserChanged(null))
      .catch((err: Error) => {
        Alert.alert('Error', `Error logging out: ${err.message}`);
      });
  };

  // Setup the global context
  const globalContextValue: GlobalContextType = {
    userInfo: currentUserInfo,
    setUserInfo: currentUserChanged,
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

  const renderTabLayout = () => {
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
            name="Add"
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
      return renderTabLayout();
    }
  };

  return (
    <GlobalContext.Provider value={globalContextValue}>
      <SafeAreaView style={{flex: 1}}>
        <PaperProvider theme={{...DefaultTheme}}>
          <View style={styles.mainContainer}>
            {true ? <MoshhGeneratorScreen /> : renderMainComponent()}
          </View>
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
