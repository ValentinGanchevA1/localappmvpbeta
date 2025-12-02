import axiosInstance from './axiosInstance';

export interface NearbyUser {
  id: string;
  name: string;
  avatar?: string;
  latitude: number;
  longitude: number;
  distance: number;
  isOnline: boolean;
}

export const locationApi = {
  updateLocation: async (latitude: number, longitude: number) => {
    return axiosInstance.post('/api/location/update', {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  },

  getNearbyUsers: async (params: {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
  }): Promise<NearbyUser[]> => {
    const response = await axiosInstance.get<NearbyUser[]>('/api/location/nearby', {
      params: {
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius || 5000,
        limit: params.limit || 50,
      },
    });
    return response.data;
  },

  getGeofences: async () => {
    const response = await axiosInstance.get('/api/location/geofences');
    return response.data;
  },
};
