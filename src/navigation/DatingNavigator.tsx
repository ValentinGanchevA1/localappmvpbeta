// src/navigation/DatingNavigator.tsx
// Dating Stack Navigator with all dating screens

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SwipeScreen} from '@/screens/dating/SwipeScreen';
import {MatchesScreen} from '@/screens/dating/MatchesScreen';
import {DatingPreferencesScreen} from '@/screens/dating/DatingPreferencesScreen';
import {ProfileDetailScreen} from '@/screens/dating/ProfileDetailScreen';
import {DatingProfile} from '@/types/dating';
import {COLORS} from '@/config/theme';

// ============================================
// Navigation Types
// ============================================

export type DatingStackParamList = {
  Swipe: undefined;
  Matches: undefined;
  DatingPreferences: undefined;
  ProfileDetail: {profile: DatingProfile};
  DatingChat: {matchId: string; userId: string; username: string};
};

// ============================================
// Stack Navigator
// ============================================

const Stack = createNativeStackNavigator<DatingStackParamList>();

const DatingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Swipe"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {backgroundColor: COLORS.WHITE},
      }}>
      {/* Main Swipe Screen */}
      <Stack.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Matches & Messages */}
      <Stack.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />

      {/* Dating Preferences */}
      <Stack.Screen
        name="DatingPreferences"
        component={DatingPreferencesScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      {/* Profile Detail View */}
      <Stack.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default DatingNavigator;
