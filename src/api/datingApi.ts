// src/api/datingApi.ts
import axiosInstance from './axiosInstance';
import { DatingProfile, SwipeAction, Match } from '@/types/dating';

interface GetNearbyProfilesParams {
  latitude: number;
  longitude: number;
  radius: number;
}

interface RecordSwipeParams {
  userId: string;
  targetUserId: string;
  action: 'like' | 'pass' | 'super_like';
}

export const datingApi = {
  async getNearbyProfiles(params: GetNearbyProfilesParams): Promise<DatingProfile[]> {
    const response = await axiosInstance.get('/dating/nearby', { params });
    return response.data;
  },
  async recordSwipe(params: RecordSwipeParams): Promise<{ swipe: SwipeAction; match: Match | null }> {
    const response = await axiosInstance.post('/dating/swipe', params);
    return response.data;
  },
};
