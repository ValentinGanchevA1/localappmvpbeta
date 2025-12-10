import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { LocationData } from '@/types/location';

// ✅ Configure the library when available (older/newer versions may not expose this API)
try {
  (Geolocation as any).setRNConfiguration?.({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'auto',
  });
} catch {
  // no-op: method not available in this version
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
        return granted === PermissionsAndroid.RESULTS.GRANTED;
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
          // Prevent crash by rejecting safely
          console.error('[locationService] getCurrentLocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true, // ✅ Ensure it asks for a fresh location
          showLocationDialog: true,   // ✅ Prompt to turn on GPS if off
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
