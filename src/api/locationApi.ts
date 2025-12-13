// src/api/locationApi.ts
import axiosInstance from './axiosInstance';

export interface NearbyUser {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface GetNearbyUsersParams {
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
}

export const locationApi = {
  async getNearbyUsers(params: GetNearbyUsersParams): Promise<NearbyUser[]> {
    try {
      if (typeof params.latitude !== 'number' || typeof params.longitude !== 'number') {
        throw new Error('Location coordinates are required');
      }
      if (typeof params.radius !== 'number' || params.radius <= 0) {
        throw new Error('Valid search radius is required');
      }
      if (typeof params.limit !== 'number' || params.limit <= 0) {
        throw new Error('Valid limit is required');
      }
      const response = await axiosInstance.get('/api/location/nearby', { params });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load nearby users. Please try again.';
      throw new Error(message);
    }
  },
};
