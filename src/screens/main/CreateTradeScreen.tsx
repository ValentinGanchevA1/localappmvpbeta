
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { addTrade } from '@/store/slices/tradingSlice';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';

const CreateTradeScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [toUserId, setToUserId] = useState('');
  const [itemsOffered, setItemsOffered] = useState('');

  const handleInitiateTrade = () => {
    const newTrade = {
      id: Math.random().toString(36).substr(2, 9),
      fromUserId: 'user1', // This should be the current user's ID
      toUserId,
      itemsOffered: itemsOffered.split(',').map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        description: '',
        ownerId: 'user1',
      })),
      itemsRequested: [],
      status: 'pending' as 'pending',
    };
    dispatch(addTrade(newTrade));
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Trade</Text>
      <TextInput
        style={styles.input}
        placeholder="Recipient User ID"
        value={toUserId}
        onChangeText={setToUserId}
      />
      <TextInput
        style={styles.input}
        placeholder="Items to Offer (comma-separated)"
        value={itemsOffered}
        onChangeText={setItemsOffered}
      />
      <Button title="Initiate Trade" onPress={handleInitiateTrade} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    ...TYPOGRAPHY.H2,
    marginBottom: SPACING.LG,
  },
  input: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: 8,
    marginBottom: SPACING.MD,
    ...TYPOGRAPHY.BODY,
  },
});

export default CreateTradeScreen;
