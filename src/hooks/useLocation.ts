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
      const hasPermission = await handlePermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const initialLocation = await locationService.getCurrentLocation();
      const initialRegion: Region = {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      dispatch(updateRegion(initialRegion));
      dispatch(setCurrentLocation(initialLocation));

      stopWatchingRef.current = locationService.watchPosition(
        (location) => {
          dispatch(setCurrentLocation(location));
          dispatch(
            fetchNearbyData({
              latitude: location.latitude,
              longitude: location.longitude,
              radius: 5000, // 5km radius
            })
          );
        },
        (error) => {
          dispatch(setLocationError(error.message));
        }
      );

      dispatch(setLocationTracking(true));
      return { success: true };
    } catch (error: any) {
      dispatch(setLocationError(error.message));
      return { success: false, error: error.message };
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
    } catch (error: any) {
      dispatch(setLocationError(error.message));
      return { success: false, error: error.message };
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
      } catch (error: any) {
        return { success: false, error: error.message };
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
