
// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  MapScreen,
  ProfileScreen,
} from '@/screens/main';
import SocialNavigator from './SocialNavigator';
import TradingNavigator from './TradingNavigator';
import NotificationNavigator from './NotificationNavigator';
import DatingNavigator from './DatingNavigator';
import { MainTabParamList } from '@/types/navigation';
import { COLORS, TYPOGRAPHY } from '@/config/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon configuration
const getTabBarIcon = (
	routeName: keyof MainTabParamList,
	focused: boolean,
	color: string,
	size: number
) => {
	let iconName: string;

	switch (routeName) {
		case 'Map':
			iconName = focused ? 'map' : 'map-outline';
			break;
    case 'Social':
      iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
      break;
    case 'Dating':
      iconName = focused ? 'heart' : 'heart-outline';
      break;
		case 'Notifications':
			iconName = focused ? 'notifications' : 'notifications-outline';
			break;
		case 'Profile':
			iconName = focused ? 'person-circle' : 'person-circle-outline';
			break;
    case 'Trading':
      iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
      break;
		default:
			iconName = 'alert-circle';
	}

	return <Icon name={iconName} size={size} color={color} />;
};

/**
 * Main tab navigator for authenticated users
 * Provides bottom tab navigation to primary app features
 */
const MainTabNavigator: React.FC = () => {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ focused, color, size }) =>
					getTabBarIcon(route.name, focused, color, size),
				tabBarActiveTintColor: COLORS.PRIMARY,
				tabBarInactiveTintColor: '#8E8E93',
				tabBarStyle: {
					backgroundColor: COLORS.WHITE,
					borderTopWidth: 1,
					borderTopColor: '#E5E5EA',
					height: 60,
					paddingBottom: 8,
					paddingTop: 8,
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
				},
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
			})}
		>
			<Tab.Screen
				name="Map"
				component={MapScreen}
				options={{
					title: 'Map',
					headerShown: false, // Map has its own header
				}}
			/>

      <Tab.Screen
        name="Social"
        component={SocialNavigator}
        initialParams={{ screen: 'Chat', params: { userId: 'user2', username: 'Mike_Trader' } }}
        options={{
          title: 'Social',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Dating"
        component={DatingNavigator}
        options={{
          title: 'Dating',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Trading"
        component={TradingNavigator}
        options={{
          title: 'Trading',
          headerShown: false,
        }}
      />

			<Tab.Screen
				name="Notifications"
				component={NotificationNavigator}
				options={{
					title: 'Notifications',
					headerShown: false,
				}}
			/>

			<Tab.Screen
				name="Profile"
				component={ProfileScreen}
				options={{
					title: 'Profile',
					headerShown: true,
				}}
			/>
		</Tab.Navigator>
	);
};

export default MainTabNavigator;
