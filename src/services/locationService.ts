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
      return auth === 'granted';
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

        // ADDED: Small delay to allow OS to propagate permission state
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
           await delay(500);
           return true;
        }
        return false;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }

    return false;
  },

  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
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
        (error) => {
          console.error('[locationService] getCurrentLocation error:', error);
          reject(error);
        },
        {
          // Adjusted settings for better stability
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
          forceRequestLocation: true,
          showLocationDialog: true,
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
