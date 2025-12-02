import { useCallback, useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  startLocationTracking,
  stopLocationTracking,
  fetchNearbyData,
  updateCurrentLocation,
  clearLocationError,
  updateRegion,
} from '@/store/slices/locationSlice';
import { requestLocationPermission } from '@/utils/permissions';
import { LocationPermission } from '@/types/location';
import Geolocation from 'react-native-geolocation-service';
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
  const watchIdRef = useRef<number | null>(null);

  const handlePermission = useCallback(async () => {
    const status = await requestLocationPermission();
    setPermission(status);
    return status;
  }, []);

 const startTracking = useCallback(async () => {
   try {
     // 1. Request location permission (iOS/Android)
     const perm = await handlePermission();
     if (perm !== 'granted') {
       throw new Error('Location permission denied');
     }

     // 2. Get initial location to center map
     const { latitude, longitude } = await locationService.getCurrentLocation();

     // 3. Update Redux store with initial location
     const initialRegion: Region = {
       latitude,
       longitude,
       latitudeDelta: 0.0922,
       longitudeDelta: 0.0421,
     };
     dispatch(updateRegion(initialRegion));
     dispatch(updateCurrentLocation()); // Updates in Redux

     // 4. Start watching for continuous location changes
     // This runs in background and sends updates to backend every 30 seconds
     watchIdRef.current = Geolocation.watchPosition(
       (position) => {
         // A) Update local state
         dispatch(updateCurrentLocation());

         // B) Fetch nearby users when location changes
         dispatch(
           fetchNearbyData({
             latitude: position.coords.latitude,
             longitude: position.coords.longitude,
             radius: 5000, // 5km radius
           })
         );

         // C) Send location to backend via API
         locationApi.updateLocation(
           position.coords.latitude,
           position.coords.longitude
         );
       },
       (error) => console.error('[useLocation] Watch Error:', error),
       {
         enableHighAccuracy: true,
         distanceFilter: 50, // Update every 50 meters
         interval: 10000, // Check every 10 seconds
       }
     );

     dispatch(startLocationTracking()); // Set Redux flag
     return { success: true };
   } catch (error: any) {
     console.error('[useLocation] Start Tracking Error:', error);
     return { success: false, error: error.message };
   }
 }, [dispatch, handlePermission]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    dispatch(stopLocationTracking());
  }, [dispatch]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const result = await dispatch(updateCurrentLocation()).unwrap();
      return { success: true, data: result };
    } catch (error: any) {
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
    [
      dispatch,
      permission,
      locationState.latitude,
      locationState.longitude,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...locationState,
    permission,
    hasLocation: !!(
      locationState.latitude && locationState.longitude
    ),
    startTracking,
    stopTracking,
    getCurrentLocation,
    refreshNearbyUsers,
    clearError: useCallback(() => dispatch(clearLocationError()), [dispatch]),
  };
};
export const startLocationTracking = () =>
  setLocationTracking(true);
export const stopLocationTracking = () =>
  setLocationTracking(false);
export const clearLocationError = () =>
  setLocationError(null);
