// src/screens/social/PrivacySettingsScreen.tsx
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchPrivacySettings,
  updatePrivacySettings,
  selectPrivacySettings,
  selectPrivacyLoading,
  selectBlockedUserIds,
} from '@/store/slices/socialGraphSlice';
import {PrivacySettingRow, PrivacySection} from '@/components/social';
import {PrivacyLevel, PrivacySettings} from '@/types/socialGraph';

const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const privacySettings = useAppSelector(selectPrivacySettings);
  const loading = useAppSelector(selectPrivacyLoading);
  const blockedUsers = useAppSelector(selectBlockedUserIds);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchPrivacySettings());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchPrivacySettings());
    setRefreshing(false);
  }, [dispatch]);

  const handleUpdateSetting = async (
    key: keyof PrivacySettings,
    value: any,
  ) => {
    try {
      await dispatch(updatePrivacySettings({[key]: value}));
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleToggle = (key: keyof PrivacySettings) => (value: boolean) => {
    handleUpdateSetting(key, value);
  };

  const handlePrivacySelect = (key: keyof PrivacySettings) => () => {
    navigation.navigate('PrivacyLevelSelect', {
      settingKey: key,
      currentValue: privacySettings[key],
      title: getSettingTitle(key),
    });
  };

  const getSettingTitle = (key: string): string => {
    const titles: Record<string, string> = {
      profileVisibility: 'Profile Visibility',
      bioVisibility: 'Bio Visibility',
      avatarVisibility: 'Avatar Visibility',
      locationSharing: 'Location Sharing',
      onlineStatusVisibility: 'Online Status',
      lastSeenVisibility: 'Last Seen',
      postsVisibility: 'Posts',
      activityVisibility: 'Activity',
      storiesVisibility: 'Stories',
      friendListVisibility: 'Friend List',
      mutualFriendsVisibility: 'Mutual Friends',
      groupMembershipVisibility: 'Group Membership',
      whoCanMessage: 'Who Can Message',
      whoCanCall: 'Who Can Call',
      whoCanAddToGroups: 'Group Invites',
      whoCanSendFriendRequests: 'Friend Requests',
    };
    return titles[key] || key;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <PrivacySection title="Profile Privacy">
        <PrivacySettingRow
          icon="👤"
          title="Profile Visibility"
          description="Who can see your profile"
          type="select"
          value={privacySettings.profileVisibility}
          onPress={handlePrivacySelect('profileVisibility')}
        />
        <PrivacySettingRow
          icon="📝"
          title="Bio Visibility"
          description="Who can see your bio"
          type="select"
          value={privacySettings.bioVisibility}
          onPress={handlePrivacySelect('bioVisibility')}
        />
        <PrivacySettingRow
          icon="🖼️"
          title="Avatar Visibility"
          description="Who can see your profile picture"
          type="select"
          value={privacySettings.avatarVisibility}
          onPress={handlePrivacySelect('avatarVisibility')}
        />
      </PrivacySection>

      <PrivacySection title="Location Privacy">
        <PrivacySettingRow
          icon="📍"
          title="Location Sharing"
          description="Who can see your location"
          type="select"
          value={privacySettings.locationSharing}
          onPress={handlePrivacySelect('locationSharing')}
        />
        <PrivacySettingRow
          icon="🎯"
          title="Location Precision"
          description="How precise your location appears"
          type="select"
          value={privacySettings.locationPrecision}
          onPress={() => navigation.navigate('LocationPrecisionSelect')}
        />
        <PrivacySettingRow
          icon="⭕"
          title="Location Circles"
          description="Specific circles that can see your location"
          type="navigation"
          onPress={() => navigation.navigate('LocationCircles')}
        />
      </PrivacySection>

      <PrivacySection title="Activity & Status">
        <PrivacySettingRow
          icon="🟢"
          title="Online Status"
          description="Who can see when you're online"
          type="select"
          value={privacySettings.onlineStatusVisibility}
          onPress={handlePrivacySelect('onlineStatusVisibility')}
        />
        <PrivacySettingRow
          icon="🕐"
          title="Last Seen"
          description="Who can see when you were last active"
          type="select"
          value={privacySettings.lastSeenVisibility}
          onPress={handlePrivacySelect('lastSeenVisibility')}
        />
        <PrivacySettingRow
          icon="📰"
          title="Posts"
          description="Who can see your posts"
          type="select"
          value={privacySettings.postsVisibility}
          onPress={handlePrivacySelect('postsVisibility')}
        />
        <PrivacySettingRow
          icon="📊"
          title="Activity"
          description="Who can see your activity"
          type="select"
          value={privacySettings.activityVisibility}
          onPress={handlePrivacySelect('activityVisibility')}
        />
      </PrivacySection>

      <PrivacySection title="Connections">
        <PrivacySettingRow
          icon="👥"
          title="Friend List"
          description="Who can see your friends"
          type="select"
          value={privacySettings.friendListVisibility}
          onPress={handlePrivacySelect('friendListVisibility')}
        />
        <PrivacySettingRow
          icon="🤝"
          title="Mutual Friends"
          description="Who can see mutual friends"
          type="select"
          value={privacySettings.mutualFriendsVisibility}
          onPress={handlePrivacySelect('mutualFriendsVisibility')}
        />
        <PrivacySettingRow
          icon="🏠"
          title="Group Membership"
          description="Who can see groups you're in"
          type="select"
          value={privacySettings.groupMembershipVisibility}
          onPress={handlePrivacySelect('groupMembershipVisibility')}
        />
      </PrivacySection>

      <PrivacySection title="Communication">
        <PrivacySettingRow
          icon="💬"
          title="Who Can Message"
          description="Who can send you messages"
          type="select"
          value={privacySettings.whoCanMessage}
          onPress={handlePrivacySelect('whoCanMessage')}
        />
        <PrivacySettingRow
          icon="📞"
          title="Who Can Call"
          description="Who can call you"
          type="select"
          value={privacySettings.whoCanCall}
          onPress={handlePrivacySelect('whoCanCall')}
        />
        <PrivacySettingRow
          icon="➕"
          title="Group Invites"
          description="Who can add you to groups"
          type="select"
          value={privacySettings.whoCanAddToGroups}
          onPress={handlePrivacySelect('whoCanAddToGroups')}
        />
        <PrivacySettingRow
          icon="🤝"
          title="Friend Requests"
          description="Who can send you friend requests"
          type="select"
          value={privacySettings.whoCanSendFriendRequests}
          onPress={handlePrivacySelect('whoCanSendFriendRequests')}
        />
      </PrivacySection>

      <PrivacySection title="Discovery">
        <PrivacySettingRow
          icon="📧"
          title="Discoverable by Email"
          description="Let others find you by email"
          type="toggle"
          value={privacySettings.discoverableByEmail}
          onToggle={handleToggle('discoverableByEmail')}
        />
        <PrivacySettingRow
          icon="📱"
          title="Discoverable by Phone"
          description="Let others find you by phone number"
          type="toggle"
          value={privacySettings.discoverableByPhone}
          onToggle={handleToggle('discoverableByPhone')}
        />
        <PrivacySettingRow
          icon="📍"
          title="Discoverable by Location"
          description="Appear in location-based suggestions"
          type="toggle"
          value={privacySettings.discoverableByLocation}
          onToggle={handleToggle('discoverableByLocation')}
        />
        <PrivacySettingRow
          icon="⭐"
          title="Discoverable by Interests"
          description="Appear in interest-based suggestions"
          type="toggle"
          value={privacySettings.discoverableByInterests}
          onToggle={handleToggle('discoverableByInterests')}
        />
        <PrivacySettingRow
          icon="🔍"
          title="Appear in Search"
          description="Let others find you in search"
          type="toggle"
          value={privacySettings.discoverableInSearch}
          onToggle={handleToggle('discoverableInSearch')}
        />
      </PrivacySection>

      <PrivacySection title="Blocking & Restrictions">
        <PrivacySettingRow
          icon="🚫"
          title="Blocked Users"
          description={`${blockedUsers.length} blocked user${blockedUsers.length !== 1 ? 's' : ''}`}
          type="navigation"
          onPress={() => navigation.navigate('BlockedUsers')}
        />
        <PrivacySettingRow
          icon="⚠️"
          title="Restricted Users"
          description="Users with limited access"
          type="navigation"
          onPress={() => navigation.navigate('RestrictedUsers')}
        />
        <PrivacySettingRow
          icon="👻"
          title="Hidden From"
          description="Users who can't see you"
          type="navigation"
          onPress={() => navigation.navigate('HiddenFromUsers')}
        />
      </PrivacySection>

      <PrivacySection title="Circle Overrides">
        <PrivacySettingRow
          icon="⭕"
          title="Circle Privacy Settings"
          description="Custom privacy for each circle"
          type="navigation"
          onPress={() => navigation.navigate('CirclePrivacyOverrides')}
        />
      </PrivacySection>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your privacy settings control who can see your information and interact
          with you. Changes take effect immediately.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  footer: {
    padding: SPACING.LG,
    paddingBottom: SPACING.LG * 2,
  },
  footerText: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PrivacySettingsScreen;
