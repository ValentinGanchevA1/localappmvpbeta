import { useCallback, useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setLocationTracking,
  fetchNearbyData,
  setCurrentLocation,
  setLocationError,
  updateRegion,
} from '@/store/slices/locationSlice';
import { LocationPermission } from '@/types/location';
import { Region } from 'react-native-maps';
import { locationService } from '@/services/locationService';

/**
 * useLocation Hook - Real-time geolocation tracking and data fetching.
 */
export const useLocation = () => {
  const dispatch = useAppDispatch();
  const locationState = useAppSelector((state) => state.location);
  const [permission, setPermission] = useState<LocationPermission>(
    'undetermined'
  );
  const stopWatchingRef = useRef<(() => void) | null>(null);

  const handlePermission = useCallback(async () => {
    const hasPermission = await locationService.requestLocationPermission();
    setPermission(hasPermission ? 'granted' : 'denied');
    return hasPermission;
  }, []);

  const startTracking = useCallback(async () => {
    try {
      console.log('[useLocation] 🚀 Starting location tracking...');

      const hasPermission = await handlePermission();
      if (!hasPermission) {
        console.warn('[useLocation] ❌ Location permission denied');
        dispatch(setLocationError('Location permission denied'));
        return { success: false, error: 'Location permission denied' };
      }

      console.log('[useLocation] ✅ Permission granted, getting current location...');

      let initialLocation;
      try {
        initialLocation = await locationService.getCurrentLocation();
        console.log('[useLocation] 📍 Current location:', initialLocation);
      } catch (locationError) {
        const locErrorMessage = locationError instanceof Error ? locationError.message : 'Failed to get current location';
        console.error('[useLocation] ❌ Failed to get initial location:', locErrorMessage);
        dispatch(setLocationError(locErrorMessage));
        return { success: false, error: locErrorMessage };
      }

      const initialRegion: Region = {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      dispatch(updateRegion(initialRegion));
      dispatch(setCurrentLocation(initialLocation));

      // Fetch nearby users immediately (don't crash if this fails)
      console.log('[useLocation] 🔍 Fetching nearby users...');
      try {
        await dispatch(
          fetchNearbyData({
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
            radius: 5000,
          })
        ).unwrap();
      } catch (fetchError) {
        // Log but don't fail - nearby users is not critical for location tracking
        console.warn('[useLocation] ⚠️ Failed to fetch nearby users:', fetchError);
      }

      // Set up continuous tracking
      stopWatchingRef.current = locationService.watchPosition(
        (location) => {
          dispatch(setCurrentLocation(location));
          // Only fetch nearby users if location changed significantly (don't await)
          dispatch(
            fetchNearbyData({
              latitude: location.latitude,
              longitude: location.longitude,
              radius: 5000,
            })
          ).catch((err) => {
            console.warn('[useLocation] ⚠️ Background fetch failed:', err);
          });
        },
        (error) => {
          console.error('[useLocation] ⚠️ Location watch error:', error);
          dispatch(setLocationError(error.message || 'Location tracking error'));
        }
      );

      dispatch(setLocationTracking(true));
      console.log('[useLocation] ✅ Location tracking started successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during location tracking startup.';
      console.error('[useLocation] ❌ Error during startup:', errorMessage);
      dispatch(setLocationError(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, handlePermission]);

  const stopTracking = useCallback(() => {
    if (stopWatchingRef.current) {
      stopWatchingRef.current();
      stopWatchingRef.current = null;
    }
    dispatch(setLocationTracking(false));
  }, [dispatch]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      dispatch(setCurrentLocation(location));
      return { success: true, data: location };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching current location.';
      dispatch(setLocationError(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  const refreshNearbyUsers = useCallback(
    async (params?: {
      latitude?: number;
      longitude?: number;
      radius?: number;
    }) => {
      if (permission !== 'granted') {
        return { success: false, error: 'Permission not granted' };
      }
      try {
        const { latitude, longitude } = locationState;
        if (!latitude || !longitude) {
          throw new Error('Location not available');
        }
        const result = await dispatch(
          fetchNearbyData({
            latitude: params?.latitude ?? latitude,
            longitude: params?.longitude ?? longitude,
            radius: params?.radius || 5000,
          })
        ).unwrap();
        return { success: true, data: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while refreshing nearby users.';
        return { success: false, error: errorMessage };
      }
    },
    [dispatch, permission, locationState]
  );

  const clearError = useCallback(() => {
    dispatch(setLocationError(null));
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopWatchingRef.current) {
        stopWatchingRef.current();
      }
    };
  }, []);

  return {
    ...locationState,
    permission,
    hasLocation: !!(locationState.latitude && locationState.longitude),
    startTracking,
    stopTracking,
    getCurrentLocation,
    refreshNearbyUsers,
    clearError,
  };
};
