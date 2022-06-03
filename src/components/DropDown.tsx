import React, {useState, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import RNPDropDown from 'react-native-paper-dropdown';

export type DropDownValue = string | number;

interface DropDownProps {
  label?: string;
  list: {label: string; value: DropDownValue}[];
  value: DropDownValue;
  onValueChanged: (value: DropDownValue) => void;
}

const DropDown = (props: DropDownProps) => {
  const [showDropDown, setShowDropDown] = useState(false);

  useEffect(() => {
    return () => {
      setShowDropDown(false);
    };
  }, []);

  const onValueChanged = (val: DropDownValue) => {
    setShowDropDown(false);
    props.onValueChanged(val);
  };

  return (
    <View style={styles.mainContainer}>
      <RNPDropDown
        label={props.label}
        mode={'outlined'}
        visible={showDropDown}
        showDropDown={() => setShowDropDown(true)}
        onDismiss={() => setShowDropDown(false)}
        value={props.value}
        setValue={val => onValueChanged(val)}
        list={props.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    paddingBottom: 8,
  },
});

export default DropDown;
