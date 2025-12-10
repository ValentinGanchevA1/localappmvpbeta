
import React from 'react';
import { View, Text, Button } from 'react-native';

const TradeOfferCard = ({ offer, onAccept, onDecline }) => {
  return (
    <View style={{ padding: 10, margin: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
      <Text>Trade Offer</Text>
      {/* Display offer details here */}
      <Button title="Accept" onPress={onAccept} />
      <Button title="Decline" onPress={onDecline} />
    </View>
  );
};

export default TradeOfferCard;
