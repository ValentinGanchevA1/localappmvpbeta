import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TradingScreen, CreateTradeScreen } from '@/screens/main';

export type TradingStackParamList = {
  TradingHome: undefined;
  CreateTrade: undefined;
};

const Stack = createNativeStackNavigator<TradingStackParamList>();

const TradingNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TradingHome"
        component={TradingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTrade"
        component={CreateTradeScreen}
        options={{ title: 'Create Trade' }}
      />
    </Stack.Navigator>
  );
};

export default TradingNavigator;
