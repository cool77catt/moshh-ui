import React, {useState} from 'react';
import {StyleSheet} from 'react-native';
import {Portal, Dialog, Text, TextInput, Button} from 'react-native-paper';

type NumberInputDialogProps = {
  visible: boolean;
  title?: string;
  message?: string;
  onValueEntered?: (value: number) => void;
  onCancel?: () => void;
};

const NumberInputDialog = (props: NumberInputDialogProps) => {
  const [input, setInput] = useState('');
  return (
    <Portal>
      <Dialog visible={props.visible} dismissable={false}>
        <Dialog.Title>{props.title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.defaultText}>{props.message}</Text>
          <TextInput
            keyboardType="numeric"
            value={input}
            textAlign="right"
            style={styles.textInput}
            onChangeText={val => setInput(val)}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => props.onCancel?.()}>Cancel</Button>
          <Button onPress={() => props.onValueEntered?.(Number(input))}>
            Ok
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontSize: 20,
    textAlign: 'center',
  },
  textInput: {
    textAlign: 'right',
  },
});

export default NumberInputDialog;
