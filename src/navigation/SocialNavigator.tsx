// src/navigation/SocialNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  ChatScreen,
  FriendsListScreen,
  FriendRequestsScreen,
  FriendDiscoveryScreen,
  GroupsScreen,
  SocialCirclesScreen,
  PrivacySettingsScreen,
} from '@/screens/social';
import {SocialStackParamList} from '@/types/navigation';
import {COLORS} from '@/config/theme';

const Stack = createNativeStackNavigator<SocialStackParamList>();

const SocialNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.WHITE,
        },
        headerTintColor: COLORS.TEXT_PRIMARY,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}>
      {/* Main Social Screens */}
      <Stack.Screen
        name="FriendsList"
        component={FriendsListScreen}
        options={{title: 'Friends'}}
      />
      <Stack.Screen
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{title: 'Friend Requests'}}
      />
      <Stack.Screen
        name="FriendDiscovery"
        component={FriendDiscoveryScreen}
        options={{title: 'Find Friends'}}
      />
      <Stack.Screen
        name="Groups"
        component={GroupsScreen}
        options={{title: 'Groups'}}
      />
      <Stack.Screen
        name="SocialCircles"
        component={SocialCirclesScreen}
        options={{title: 'Social Circles'}}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{title: 'Privacy Settings'}}
      />

      {/* Chat */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({route}) => ({
          title: route.params?.username || 'Chat',
        })}
      />

      {/* Placeholder screens - these can be implemented later */}
      <Stack.Screen
        name="UserProfile"
        component={PlaceholderScreen}
        options={{title: 'Profile'}}
      />
      <Stack.Screen
        name="GroupDetail"
        component={PlaceholderScreen}
        options={{title: 'Group Details'}}
      />
      <Stack.Screen
        name="CreateGroup"
        component={PlaceholderScreen}
        options={{title: 'Create Group'}}
      />
      <Stack.Screen
        name="EditGroup"
        component={PlaceholderScreen}
        options={{title: 'Edit Group'}}
      />
      <Stack.Screen
        name="GroupInvites"
        component={PlaceholderScreen}
        options={{title: 'Group Invites'}}
      />
      <Stack.Screen
        name="DiscoverGroups"
        component={PlaceholderScreen}
        options={{title: 'Discover Groups'}}
      />
      <Stack.Screen
        name="CircleDetail"
        component={PlaceholderScreen}
        options={{title: 'Circle Details'}}
      />
      <Stack.Screen
        name="CreateCircle"
        component={PlaceholderScreen}
        options={{title: 'Create Circle'}}
      />
      <Stack.Screen
        name="EditCircle"
        component={PlaceholderScreen}
        options={{title: 'Edit Circle'}}
      />
      <Stack.Screen
        name="PrivacyLevelSelect"
        component={PlaceholderScreen}
        options={{title: 'Select Privacy Level'}}
      />
      <Stack.Screen
        name="LocationPrecisionSelect"
        component={PlaceholderScreen}
        options={{title: 'Location Precision'}}
      />
      <Stack.Screen
        name="LocationCircles"
        component={PlaceholderScreen}
        options={{title: 'Location Circles'}}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={PlaceholderScreen}
        options={{title: 'Blocked Users'}}
      />
      <Stack.Screen
        name="RestrictedUsers"
        component={PlaceholderScreen}
        options={{title: 'Restricted Users'}}
      />
      <Stack.Screen
        name="HiddenFromUsers"
        component={PlaceholderScreen}
        options={{title: 'Hidden From'}}
      />
      <Stack.Screen
        name="CirclePrivacyOverrides"
        component={PlaceholderScreen}
        options={{title: 'Circle Privacy'}}
      />
      <Stack.Screen
        name="DiscoveryPreferences"
        component={PlaceholderScreen}
        options={{title: 'Discovery Preferences'}}
      />
    </Stack.Navigator>
  );
};

// Placeholder screen for screens not yet implemented
import {View, Text, StyleSheet} from 'react-native';

const PlaceholderScreen: React.FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Screen coming soon</Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  placeholderText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
  },
});

export default SocialNavigator;
