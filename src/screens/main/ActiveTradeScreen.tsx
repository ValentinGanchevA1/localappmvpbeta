
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import TradeOfferCard from '../../components/trading/TradeOfferCard';
import { acceptTrade, declineTrade } from '../../store/slices/tradingSlice';
import { RootState } from '../../store';

const ActiveTradeScreen = () => {
  const dispatch = useDispatch();
  const trades = useSelector((state: RootState) => state.trading.trades);

  const handleAccept = (tradeId: string) => {
    dispatch(acceptTrade(tradeId));
  };

  const handleDecline = (tradeId: string) => {
    dispatch(declineTrade(tradeId));
  };

  const renderTrade = ({ item }: { item: any }) => (
    <TradeOfferCard
      offer={item}
      onAccept={() => handleAccept(item.id)}
      onDecline={() => handleDecline(item.id)}
    />
  );

  return (
    <View>
      <Text>Active Trades</Text>
      <FlatList
        data={trades}
        renderItem={renderTrade}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

export default ActiveTradeScreen;
