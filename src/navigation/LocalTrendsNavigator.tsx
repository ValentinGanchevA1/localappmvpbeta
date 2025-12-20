// src/navigation/LocalTrendsNavigator.tsx
// Local Trends Stack Navigator

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Trend} from '@/types/trends';

// Screens
import TrendsScreen from '@/screens/trends/TrendsScreen';
import TrendDetailScreen from '@/screens/trends/TrendDetailScreen';
import TrendNotificationsScreen from '@/screens/trends/TrendNotificationsScreen';

// ============================================
// Types
// ============================================

export type LocalTrendsStackParamList = {
  TrendsList: undefined;
  TrendDetail: {
    trendId: string;
    trend?: Trend;
  };
  TrendNotifications: undefined;
};

// ============================================
// Navigator
// ============================================

const Stack = createNativeStackNavigator<LocalTrendsStackParamList>();

const LocalTrendsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="TrendsList"
        component={TrendsScreen}
      />
      <Stack.Screen
        name="TrendDetail"
        component={TrendDetailScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="TrendNotifications"
        component={TrendNotificationsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

export default LocalTrendsNavigator;
