// src/hooks/useAppHydration.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { StorageService } from '@/services/storageService';
import { setToken } from '@/store/slices/authSlice';

/**
 * Hydrate app state from persistent storage on startup
 * Handles offline-first scenario where user data needs to be restored
 */
export const useAppHydration = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector(state => state.auth);

  useEffect(() => {
    const hydrateApp = async () => {
      try {
        console.log('[Hydration] Starting app hydration...');

        // Restore auth token from AsyncStorage
        const storedToken = await StorageService.getAuthToken();
        if (storedToken && !token) {
          dispatch(setToken(storedToken));
          console.log('[Hydration] ✅ Token restored from storage');
        }

        // Restore user preferences
        const prefs = await StorageService.getPreferences();
        if (prefs) {
          console.log('[Hydration] ✅ Preferences restored');
        }
      } catch (error) {
        console.error('[Hydration] ❌ Hydration failed:', error);
      }
    };

    hydrateApp();
  }, [dispatch, token]);
};
