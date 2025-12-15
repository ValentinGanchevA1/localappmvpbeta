
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TradingStackParamList } from '@/navigation/TradingNavigator';
import { DatingProfile } from './dating';

export type AuthStackParamList = {
  Login: undefined;
  Verification: undefined;
  ProfileSetup: undefined;
  Signup: undefined;
};

export type SocialStackParamList = {
  // Main Social Tabs
  SocialHome: undefined;
  FriendsList: undefined;
  FriendRequests: undefined;
  FriendDiscovery: undefined;
  Groups: undefined;
  SocialCircles: undefined;
  PrivacySettings: undefined;

  // Chat
  Chat: {userId: string; username: string};

  // User Profile
  UserProfile: {userId: string};

  // Group Details
  GroupDetail: {groupId: string};
  CreateGroup: undefined;
  EditGroup: {groupId: string};
  GroupInvites: undefined;
  DiscoverGroups: undefined;

  // Circle Details
  CircleDetail: {circleId: string};
  CreateCircle: undefined;
  EditCircle: {circleId: string};

  // Privacy Sub-screens
  PrivacyLevelSelect: {
    settingKey: string;
    currentValue: string;
    title: string;
  };
  LocationPrecisionSelect: undefined;
  LocationCircles: undefined;
  BlockedUsers: undefined;
  RestrictedUsers: undefined;
  HiddenFromUsers: undefined;
  CirclePrivacyOverrides: undefined;

  // Discovery
  DiscoveryPreferences: undefined;
};

export type NotificationStackParamList = {
  NotificationsList: undefined;
  NotificationSettings: undefined;
};

export type DatingStackParamList = {
  Swipe: undefined;
  Matches: undefined;
  DatingPreferences: undefined;
  ProfileDetail: {profile: DatingProfile};
  DatingChat: {matchId: string; userId: string; username: string};
};

export type MainTabParamList = {
  Map: undefined;
  Social: NavigatorScreenParams<SocialStackParamList>;
  Dating: NavigatorScreenParams<DatingStackParamList>;
  Trading: NavigatorScreenParams<TradingStackParamList>;
  Notifications: NavigatorScreenParams<NotificationStackParamList>;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Navigation prop types
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;
