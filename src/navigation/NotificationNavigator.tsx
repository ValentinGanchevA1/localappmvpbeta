// src/navigation/NotificationNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NotificationsScreen } from '@/screens/main';
import { NotificationSettingsScreen } from '@/screens/settings';
import { NotificationStackParamList } from '@/types/navigation';
import { COLORS, TYPOGRAPHY } from '@/config/theme';

const Stack = createStackNavigator<NotificationStackParamList>();

const NotificationNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.WHITE,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5EA',
        },
        headerTitleStyle: {
          fontSize: TYPOGRAPHY.SIZES.LG,
          fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
          color: COLORS.BLACK,
        },
        headerTintColor: COLORS.PRIMARY,
      }}
    >
      <Stack.Screen
        name="NotificationsList"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
    </Stack.Navigator>
  );
};

export default NotificationNavigator;
