import Geolocation from 'react-native-geolocation-service';
import { LocationData } from '@/types/location';

export const locationService = {
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
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  },

  watchPosition(
    onSuccess: (location: LocationData) => void,
    onError?: (error: any) => void
  ): number {
    return Geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined,
          timestamp: position.timestamp,
        });
      },
      onError || console.error,
      { enableHighAccuracy: true, distanceFilter: 50, interval: 10000 }
    );
  },

  stopWatching(watchId: number): void {
    Geolocation.clearWatch(watchId);
  },
};
