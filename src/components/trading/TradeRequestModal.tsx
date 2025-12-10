
import React from 'react';
import { View, Text, Modal, Button, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';

interface TradeRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const TradeRequestModal: React.FC<TradeRequestModalProps> = ({ visible, onClose, onConfirm }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Trade Request</Text>
          <Text style={styles.modalText}>Do you want to accept this trade?</Text>
          <View style={styles.buttonContainer}>
            <Button title="Confirm" onPress={onConfirm} />
            <Button title="Close" onPress={onClose} color={COLORS.DANGER} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: SPACING.LG,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...TYPOGRAPHY.H2,
    marginBottom: SPACING.MD,
  },
  modalText: {
    ...TYPOGRAPHY.BODY,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});

export default TradeRequestModal;
