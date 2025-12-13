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

			console.log('[AppInitializer] Starting app initialization...');

			// A) Start location tracking (don't crash app if it fails)
			try {
				const result = await startTracking();
				if (result.success) {
					console.log('[AppInitializer] ✅ Location tracking started');
				} else {
					console.warn('[AppInitializer] ⚠️ Location tracking failed:', result.error);
				}
			} catch (error) {
				console.error('[AppInitializer] ❌ Location tracking error:', error);
				// Continue with app initialization even if location fails
			}

			// B) Initialize socket for real-time updates
			try {
				if (socketService && typeof socketService.initialize === 'function') {
					socketService.initialize(AppEnvironment.SOCKET_URL);
					console.log('[AppInitializer] ✅ Socket initialized');
				} else {
					console.warn('[AppInitializer] ⚠️ SocketService not ready or invalid');
				}
			} catch (error) {
				console.error('[AppInitializer] ❌ Socket initialization error:', error);
			}

			// C) Fetch user profile (background task)
			try {
				dispatch(fetchUserProfile());
				console.log('[AppInitializer] ✅ Profile fetch initiated');
			} catch (error) {
				console.error('[AppInitializer] ❌ Profile fetch error:', error);
			}

			if (__DEV__) {
				console.log('[AppInitializer] ✅ App initialization complete');
			}
		};

		(async () => {
			try {
				await initializeApp();
			} catch (error) {
				console.error('[AppInitializer] ❌ Critical initialization error:', error);
				// App continues to run even if initialization partially fails
			}
		})();

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
