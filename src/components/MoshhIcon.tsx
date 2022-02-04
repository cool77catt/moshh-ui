import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {Avatar} from 'react-native-paper';

export type MoshhIconProps = {
  style?: ViewStyle | null;
};

const MoshhIcon = ({style}: MoshhIconProps) => {
  return (
    <View style={style}>
      <Avatar.Text
        size={128}
        label="MOSHH"
        style={styles.moshhContainer}
        labelStyle={styles.moshhLabel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  moshhContainer: {
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 2,
  },
  moshhLabel: {
    color: 'red',
    fontFamily: 'TitanOne',
    fontSize: 24,
  },
});

export default MoshhIcon;
