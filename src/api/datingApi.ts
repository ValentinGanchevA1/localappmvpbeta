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
    try {
      if (!params.latitude || !params.longitude) {
        throw new Error('Location coordinates are required');
      }
      if (!params.radius || params.radius <= 0) {
        throw new Error('Valid search radius is required');
      }
      const response = await axiosInstance.get('/dating/nearby', { params });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load nearby profiles. Please try again.';
      throw new Error(message);
    }
  },
  async recordSwipe(params: RecordSwipeParams): Promise<{ swipe: SwipeAction; match: Match | null }> {
    try {
      if (!params.userId) {
        throw new Error('User ID is required');
      }
      if (!params.targetUserId) {
        throw new Error('Target user ID is required');
      }
      if (!params.action || !['like', 'pass', 'super_like'].includes(params.action)) {
        throw new Error('Valid swipe action is required (like, pass, or super_like)');
      }
      const response = await axiosInstance.post('/dating/swipe', params);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to record swipe. Please try again.';
      throw new Error(message);
    }
  },
};
