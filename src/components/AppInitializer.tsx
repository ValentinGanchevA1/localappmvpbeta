import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useAppDispatch } from '@/store/hooks';
import { fetchUserProfile } from '@/store/slices/userSlice';
import { socketService } from '@/services/socketService';
import { AppEnvironment } from '@/config/environment';

interface AppInitializerProps {
	children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
	const dispatch = useAppDispatch();
	const { isAuthenticated, user } = useAuth();
	const { startTracking } = useLocation();
	const [appState, setAppState] = useState<AppStateStatus>(
		AppState.currentState
	);

	// ============================================================================
	// STEP 1: Initialize when user is authenticated
	// ============================================================================
	useEffect(() => {
		const initializeApp = async () => {
			if (!isAuthenticated || !user) return; // Wait for auth

			try {
				// A) Start location tracking
				await startTracking();
				console.log('[AppInitializer] Location tracking started');

				// B) Initialize socket for real-time updates
				if (socketService && typeof socketService.initialize === 'function') {
					socketService.initialize(AppEnvironment.SOCKET_URL);
					console.log('[AppInitializer] Socket initialized');
				} else {
					console.warn('[AppInitializer] SocketService not ready or invalid');
				}

				// C) Fetch user profile (background task)
				dispatch(fetchUserProfile());
				console.log('[AppInitializer] Profile fetch initiated');

				if (__DEV__) {
					console.log('[AppInitializer] App fully initialized');
				}
			} catch (error) {
				console.error('[AppInitializer] Initialization error:', error);
			}
		};

		void initializeApp();

		return () => {
			// Cleanup
		};
	}, [isAuthenticated, user, dispatch, startTracking]);

	// ============================================================================
	// STEP 2: Handle app state changes (foreground/background)
	// ============================================================================
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			if (appState.match(/inactive|background/) && nextAppState === 'active') {
				if (isAuthenticated) {
					dispatch(fetchUserProfile());
					if (__DEV__) {
						console.log('[AppInitializer] App resumed, refreshing data');
					}
				}
			}
			setAppState(nextAppState);
		});

		return () => {
			subscription.remove();
		};
	}, [appState, isAuthenticated, dispatch]);

	return <>{children}</>;
};
