import React, { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useAppDispatch } from '@/store/hooks';
import { fetchUserProfile } from '@/store/slices/userSlice';
import { loadNotificationSettings } from '@/store/slices/notificationSettingsSlice';
import { socketService } from '@/services/socketService';
import { firebaseNotificationService } from '@/services/firebaseNotificationService';
import { engagementTrackingService } from '@/services/engagementTrackingService';
import { contextAwarenessService } from '@/services/contextAwarenessService';
import { notificationScheduler } from '@/services/notificationScheduler';
import { AppEnvironment } from '@/config/environment';
import { NotificationPayload } from '@/types/notifications';

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

	// Track if initialization has already been attempted
	const [hasInitialized, setHasInitialized] = useState(false);

	// Store cleanup functions
	const cleanupRef = useRef<(() => void)[]>([]);

	// ============================================================================
	// STEP 1: Initialize when user is authenticated
	// ============================================================================
	useEffect(() => {
		// Prevent multiple initializations
		if (hasInitialized) return;
		if (!isAuthenticated || !user) return;

		const initializeApp = async () => {
			setHasInitialized(true);
			console.log('[AppInitializer] Starting app initialization...');

			// A) Load notification settings first
			try {
				dispatch(loadNotificationSettings());
				console.log('[AppInitializer] ✅ Notification settings loaded');
			} catch (error) {
				console.error('[AppInitializer] ❌ Notification settings error:', error);
			}

			// B) Initialize Firebase notification service
			try {
				await firebaseNotificationService.initialize();
				console.log('[AppInitializer] ✅ Firebase notifications initialized');

				// Set up notification handler to route through scheduler
				const unsubscribeNotifications = firebaseNotificationService.onNotification(
					(payload: NotificationPayload) => {
						// Route notification through intelligent scheduler
						notificationScheduler.scheduleNotification(payload);

						// Track if opened from notification
						if (payload.data?.openedFromNotification) {
							engagementTrackingService.trackNotificationOpened(
								payload.id,
								payload.type
							);
						}
					}
				);
				cleanupRef.current.push(unsubscribeNotifications);
			} catch (error) {
				console.error('[AppInitializer] ❌ Firebase notifications error:', error);
			}

			// C) Initialize engagement tracking
			try {
				await engagementTrackingService.initialize();
				console.log('[AppInitializer] ✅ Engagement tracking initialized');
			} catch (error) {
				console.error('[AppInitializer] ❌ Engagement tracking error:', error);
			}

			// D) Initialize context awareness
			try {
				await contextAwarenessService.initialize();
				console.log('[AppInitializer] ✅ Context awareness initialized');
			} catch (error) {
				console.error('[AppInitializer] ❌ Context awareness error:', error);
			}

			// E) Initialize notification scheduler
			try {
				await notificationScheduler.initialize();
				console.log('[AppInitializer] ✅ Notification scheduler initialized');
			} catch (error) {
				console.error('[AppInitializer] ❌ Notification scheduler error:', error);
			}

			// F) Start location tracking (don't crash app if it fails)
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

			// G) Initialize socket for real-time updates
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

			// H) Fetch user profile (background task)
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
			// Run all cleanup functions
			cleanupRef.current.forEach((cleanup) => cleanup());
			cleanupRef.current = [];

			// Cleanup services
			firebaseNotificationService.cleanup();
			engagementTrackingService.cleanup();
			contextAwarenessService.cleanup();
			notificationScheduler.cleanup();
		};
	}, [isAuthenticated, user, hasInitialized, dispatch, startTracking]);

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
