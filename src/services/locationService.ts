import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { LocationData } from '@/types/location';

// Helper to wait for a specific time
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

// Configure the library
try {
  (Geolocation as any).setRNConfiguration?.({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'auto',
  });
} catch {
  // no-op
}

export const locationService = {
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      if (auth === 'granted') {
        // Small delay to allow iOS location services to initialize
        await delay(800);
        return true;
      }
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby users.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        // CRITICAL: Longer delay to allow Android Geolocation service to initialize
        // This prevents crashes when getCurrentPosition is called immediately after permission grant
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
           console.log('[locationService] Permission granted, waiting for GPS initialization...');
           await delay(1500);
           return true;
        }
        return false;
      } catch (err) {
        console.warn('[locationService] Permission request error:', err);
        return false;
      }
    }

    return false;
  },

  async getCurrentLocation(retryCount = 0): Promise<LocationData> {
    const maxRetries = 3;

    return new Promise((resolve, reject) => {
      console.log(`[locationService] Getting current location (attempt ${retryCount + 1}/${maxRetries + 1})...`);

      Geolocation.getCurrentPosition(
        (position) => {
          console.log('[locationService] ✅ Successfully got location:', {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || undefined,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          });
        },
        async (error) => {
          console.error('[locationService] ❌ getCurrentLocation error:', {
            code: error.code,
            message: error.message,
            attempt: retryCount + 1,
          });

          // Retry logic for transient errors
          if (retryCount < maxRetries && (error.code === 2 || error.code === 3)) {
            // Error code 2: POSITION_UNAVAILABLE, 3: TIMEOUT
            console.log(`[locationService] Retrying after ${(retryCount + 1) * 1000}ms...`);
            await delay((retryCount + 1) * 1000);
            try {
              const result = await locationService.getCurrentLocation(retryCount + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(new Error(`Failed to get location: ${error.message} (code: ${error.code})`));
          }
        },
        {
          // Adjusted settings for better stability
          enableHighAccuracy: true,
          timeout: 15000, // Reduced timeout for faster retries
          maximumAge: 1000,
          forceRequestLocation: true,
          showLocationDialog: false, // Don't show dialog again after permission granted
        }
      );
    });
  },

  watchPosition(
    onSuccess: (location: LocationData) => void,
    onError?: (error: any) => void
  ): () => void {
    const id = Geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined,
          timestamp: position.timestamp,
        });
      },
      onError || console.error,
      {
        enableHighAccuracy: true,
        distanceFilter: 50,
        interval: 10000,
        forceRequestLocation: true,
      }
    );
    return () => Geolocation.clearWatch(id);
  },

  stopWatching(watchId: number): void {
    Geolocation.clearWatch(watchId);
  },
};
