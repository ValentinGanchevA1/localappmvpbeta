// src/api/locationApi.ts
import { axiosInstance } from './axiosInstance';

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
    const response = await axiosInstance.get('/location/nearby', { params });
    return response.data;
  },
};
