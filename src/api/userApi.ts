import axiosInstance from './axiosInstance';
import { User, UserPreferences, UserProfile } from '@/types/user';

interface AvatarResponse {
  avatarUrl: string;
}

export const userApi = {
  getUserProfile: async (): Promise<User> => {
    try {
      const response = await axiosInstance.get<User>('/user/profile');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch user profile. Please try again.';
      throw new Error(message);
    }
  },

  updateUserProfile: async (data: Partial<User>): Promise<User> => {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Profile data is required');
      }
      const response = await axiosInstance.put<User>('/user/profile', data);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update user profile. Please try again.';
      throw new Error(message);
    }
  },

  uploadAvatar: async (imageUri: string): Promise<AvatarResponse> => {
    try {
      if (!imageUri) {
        throw new Error('Image URI is required');
      }
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await axiosInstance.post<AvatarResponse>(
        '/user/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to upload avatar. Please try again.';
      throw new Error(message);
    }
  },

  deleteAccount: async (): Promise<void> => {
    try {
      await axiosInstance.delete('/user/account');
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete account. Please try again.';
      throw new Error(message);
    }
  },

  getUserById: async (userId: string): Promise<UserProfile> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await axiosInstance.get<UserProfile>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch user. Please try again.';
      throw new Error(message);
    }
  },

  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    try {
      if (!preferences || Object.keys(preferences).length === 0) {
        throw new Error('Preferences are required');
      }
      const response = await axiosInstance.put<UserPreferences>('/user/preferences', preferences);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update preferences. Please try again.';
      throw new Error(message);
    }
  },

  blockUser: async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.post(`/users/${userId}/block`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to block user. Please try again.';
      throw new Error(message);
    }
  },

  reportUser: async (userId: string, reason: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!reason || reason.trim() === '') {
        throw new Error('Report reason is required');
      }
      await axiosInstance.post(`/users/${userId}/report`, { reason });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to report user. Please try again.';
      throw new Error(message);
    }
  },
};
