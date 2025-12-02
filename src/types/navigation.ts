import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Verification: undefined;
  ProfileSetup: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Notifications: undefined;
  Profile: undefined;
  Tasks: undefined;
  TaskForm: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> =
  BottomTabNavigationProp<MainTabParamList, T>;

export type MapScreenNavigationProp = MainTabNavigationProp<'Map'>;
