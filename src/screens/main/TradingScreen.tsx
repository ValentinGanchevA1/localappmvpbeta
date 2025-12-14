
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import TradeOfferCard from '@/components/trading/TradeOfferCard';
import { acceptTrade, declineTrade } from '@/store/slices/tradingSlice';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';
import { MainTabNavigationProp } from '@/types/navigation';
import { Trade } from '@/types/trading';

const TradingScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<MainTabNavigationProp<'Trading'>>();
  const { trades } = useSelector((state: RootState) => state.trading);

  const activeTrades = trades.filter((t: Trade) => t.status === 'pending');
  const tradeHistory = trades.filter((t: Trade) => t.status !== 'pending');

  const handleAccept = (tradeId: string) => {
    dispatch(acceptTrade(tradeId));
  };

  const handleDecline = (tradeId: string) => {
    dispatch(declineTrade(tradeId));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trading</Text>
        <Button
          title="Create Trade"
          onPress={() => navigation.navigate('Trading', { screen: 'CreateTrade' })}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Trades</Text>
        {activeTrades.length > 0 ? (
          activeTrades.map((trade: Trade) => (
            <TradeOfferCard
              key={trade.id}
              offer={trade}
              onAccept={() => handleAccept(trade.id)}
              onDecline={() => handleDecline(trade.id)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No active trades.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trade History</Text>
        {tradeHistory.length > 0 ? (
          tradeHistory.map((trade: Trade) => (
            <View key={trade.id} style={styles.historyItem}>
              <Text>Trade with {trade.toUserId}</Text>
              <Text>Status: {trade.status}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No trade history.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
  },
  title: {
    ...TYPOGRAPHY.H2,
    color: COLORS.BLACK,
  },
  section: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    ...TYPOGRAPHY.H2,
    marginBottom: SPACING.MD,
  },
  emptyText: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: 8,
    marginBottom: SPACING.SM,
  },
});

export default TradingScreen;
