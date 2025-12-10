// src/components/trading/TradeOfferCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trade } from '@/types/trading';
import { Button, Card } from '@/components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';

interface TradeOfferCardProps {
  offer: Trade;
  onAccept: (offer: Trade) => void;
  onDecline: (offer: Trade) => void;
}

const TradeOfferCard: React.FC<TradeOfferCardProps> = ({ offer, onAccept, onDecline }) => {
  const fromUser = offer?.fromUserId ?? 'unknown user';

  return (
    <Card
      padding="medium"
      testID="trade-offer-card"
      accessibilityLabel={`Trade offer from ${fromUser}`}
    >
      <Text style={styles.title}>
        Trade offer from <Text style={styles.user}>{fromUser}</Text>
      </Text>

      <View style={styles.buttons}>
        <Button
          title="Accept"
          onPress={() => onAccept(offer)}
          variant="success"
          testID="accept-offer-button"
        />
        <View style={styles.spacer} />
        <Button
          title="Decline"
          onPress={() => onDecline(offer)}
          variant="danger"
          testID="decline-offer-button"
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  user: {
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  spacer: {
    width: SPACING.MD,
  },
});

export default TradeOfferCard;
