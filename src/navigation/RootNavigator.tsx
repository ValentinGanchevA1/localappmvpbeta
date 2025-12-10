// src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import MainTabNavigator from './MainTabNavigator';
import { AuthNavigator } from './AuthNavigator';

/**
 * Root navigator that switches between authentication flow and main app
 * based on user authentication status.
 */
const RootNavigator: React.FC = () => {
	const { isAuthenticated, token } = useAppSelector(
		state => state.auth
	);

	// Log auth state changes in development
	useEffect(() => {
		if (__DEV__) {
			console.log('[RootNavigator] Auth State:', {
				isAuthenticated,
				hasToken: !!token,
			});
		}
	}, [isAuthenticated, token]);

	// Switch between Auth and Main navigation based on authentication
	// If user has a token and isAuthenticated = true, show main app
	// Otherwise, show authentication flow
	return isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />;
};
export default RootNavigator;
