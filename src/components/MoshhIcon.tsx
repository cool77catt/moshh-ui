import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {Avatar} from 'react-native-paper';

export type MoshhIconProps = {
  style?: ViewStyle | null;
  size?: number;
};

const MoshhIcon = ({style, size}: MoshhIconProps) => {
  return (
    <View style={style}>
      <Avatar.Text
        size={size ? size : 128}
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
