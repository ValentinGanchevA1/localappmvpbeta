// src/components/trading/TradeOfferCard.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Trade } from '@/types/trading';

interface TradeOfferCardProps {
  offer: Trade;
  onAccept: () => void;
  onDecline: () => void;
}

const TradeOfferCard: React.FC<TradeOfferCardProps> = ({ offer, onAccept, onDecline }) => {
  return (
    <View style={styles.card}>
      <Text>Trade offer from {offer.fromUserId}</Text>
      <View style={styles.buttons}>
        <Button title="Accept" onPress={onAccept} />
        <Button title="Decline" onPress={onDecline} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    elevation: 1,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
});

export default TradeOfferCard;
