import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useAppDispatch } from '@/store/hooks';
import { fetchUserProfile } from '@/store/slices/userSlice';
import { SocketService } from '@/services/socketService';
import { AppEnvironment } from '@/config/environment';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();
  const { startTracking } = useLocation(); // ⭐ GET LOCATION HOOK
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
        // ⭐⭐⭐ THIS IS WHERE LOCATION TRACKING BEGINS ⭐⭐⭐
        await startTracking();
        console.log('[AppInitializer] Location tracking started');

        // B) Initialize socket for real-time updates
        SocketService.getInstance().initialize(AppEnvironment.SOCKET_URL);
        console.log('[AppInitializer] Socket initialized');

        // C) Fetch user profile (background task)
        dispatch(fetchUserProfile());
        console.log('[AppInitializer] Profile fetch initiated');

        if (__DEV__) {
          console.log('[AppInitializer] App fully initialized');
        }
      } catch (error) {
        console.error('[AppInitializer] Initialization error:', error);
        // Continue anyway - individual features are optional
      }
    };

    initializeApp();

    return () => {
      // Cleanup on unmount (rarely happens)
    };
  }, [isAuthenticated, user, dispatch, startTracking]);

  // ============================================================================
  // STEP 2: Handle app state changes (foreground/background)
  // ============================================================================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // App came to foreground
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        if (isAuthenticated) {
          // Refresh data when user brings app to foreground
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

  // Children render normally once app is initialized
  return <>{children}</>;
};
