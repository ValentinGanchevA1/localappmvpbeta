
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TradingStackParamList } from '@/navigation/TradingNavigator';

export type AuthStackParamList = {
  Login: undefined;
  Verification: undefined;
  ProfileSetup: undefined;
  Signup: undefined;
};

export type SocialStackParamList = {
  Chat: { userId: string; username: string };
  // Add other social screens here like UserProfile, etc.
};

export type NotificationStackParamList = {
  NotificationsList: undefined;
  NotificationSettings: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Social: NavigatorScreenParams<SocialStackParamList>;
  Dating: undefined;
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
