import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Button, Avatar, Paragraph} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import {GlobalContext} from '../contexts';

const ProfileScreen = () => {
  const globalContext = useContext(GlobalContext);

  let nameInitial = '';
  const currentUser = auth().currentUser;
  if (currentUser && currentUser.email) {
    nameInitial = currentUser.email.charAt(0);
    if (nameInitial) {
      nameInitial = nameInitial.toUpperCase();
    }
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.avatarContainer}>
        <Avatar.Text size={72} label={nameInitial} />
        <Text style={styles.avatarText}>
          {`@${globalContext.userInfo?.handle}`}
        </Text>
      </View>
      <View style={styles.bioContainer}>
        <Text style={styles.bioHeaderText}>-Bio-</Text>
        <Paragraph style={styles.bioText}>
          {'This is my bio.\nYou can deal with it.'}
        </Paragraph>
      </View>
      <View style={styles.signOutContainer}>
        <Button
          mode="contained"
          onPress={() => {
            globalContext.signOutUser?.();
          }}
          style={{width: '85%', margin: 16}}>
          Logout
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    // borderWidth: 2,
  },
  avatarText: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  bioContainer: {
    flex: 5,
    width: '100%',
    padding: 32,
  },
  bioHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bioText: {
    fontSize: 12,
    marginTop: 8,
  },
  signOutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    // borderWidth: 2,
  },
});

export default ProfileScreen;
