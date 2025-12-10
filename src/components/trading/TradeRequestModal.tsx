
import React from 'react';
import { View, Text, Modal, Button } from 'react-native';

const TradeRequestModal = ({ visible, onClose, onConfirm }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text>Trade Request</Text>
          <Text>Do you want to accept this trade?</Text>
          <Button title="Confirm" onPress={onConfirm} />
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

export default TradeRequestModal;
