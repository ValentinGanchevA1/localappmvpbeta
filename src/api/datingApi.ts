// src/api/datingApi.ts
// Comprehensive Dating API with matches, likes, preferences, and advanced features

import axiosInstance from './axiosInstance';
import {
  DatingProfile,
  DatingPreferences,
  SwipeAction,
  SwipeActionType,
  Match,
  Like,
  UserDatingStats,
  Boost,
  UpdateDatingProfilePayload,
  SwipePayload,
  SwipeResponse,
  FetchProfilesParams,
  UpdatePreferencesPayload,
  ProfileReport,
  ReportReason,
} from '@/types/dating';

// ============================================
// Request/Response Types
// ============================================

interface GetNearbyProfilesParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  offset?: number;
}

interface RecordSwipeParams {
  userId: string;
  targetUserId: string;
  action: SwipeActionType;
}

interface GetMatchesParams {
  status?: 'active' | 'archived' | 'unmatched';
  limit?: number;
  offset?: number;
}

interface GetLikesParams {
  limit?: number;
  offset?: number;
  unseenOnly?: boolean;
}

interface ReportProfileParams {
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
}

interface UnmatchParams {
  matchId: string;
  reason?: string;
}

// ============================================
// Dating API
// ============================================

export const datingApi = {
  // ============================================
  // Profile Endpoints
  // ============================================

  /**
   * Get current user's dating profile
   */
  async getMyProfile(): Promise<DatingProfile> {
    try {
      const response = await axiosInstance.get('/api/dating/profile');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load your dating profile.';
      throw new Error(message);
    }
  },

  /**
   * Create dating profile
   */
  async createProfile(profileData: Partial<DatingProfile>): Promise<DatingProfile> {
    try {
      const response = await axiosInstance.post('/api/dating/profile', profileData);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create dating profile.';
      throw new Error(message);
    }
  },

  /**
   * Update dating profile
   */
  async updateProfile(updates: UpdateDatingProfilePayload): Promise<DatingProfile> {
    try {
      const response = await axiosInstance.patch('/api/dating/profile', updates);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update dating profile.';
      throw new Error(message);
    }
  },

  /**
   * Get a specific user's dating profile
   */
  async getProfile(userId: string): Promise<DatingProfile> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await axiosInstance.get(`/api/dating/profile/${userId}`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load profile.';
      throw new Error(message);
    }
  },

  /**
   * Upload profile photo
   */
  async uploadPhoto(formData: FormData): Promise<{ photoId: string; url: string }> {
    try {
      const response = await axiosInstance.post('/api/dating/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to upload photo.';
      throw new Error(message);
    }
  },

  /**
   * Delete profile photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/api/dating/photos/${photoId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete photo.';
      throw new Error(message);
    }
  },

  /**
   * Reorder profile photos
   */
  async reorderPhotos(photoIds: string[]): Promise<void> {
    try {
      await axiosInstance.put('/api/dating/photos/reorder', { photoIds });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to reorder photos.';
      throw new Error(message);
    }
  },

  /**
   * Toggle profile active status
   */
  async toggleProfileActive(isActive: boolean): Promise<DatingProfile> {
    try {
      const response = await axiosInstance.patch('/api/dating/profile/active', { isActive });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update profile status.';
      throw new Error(message);
    }
  },

  // ============================================
  // Discovery Endpoints
  // ============================================

  /**
   * Get nearby profiles for swiping
   */
  async getNearbyProfiles(params: GetNearbyProfilesParams): Promise<DatingProfile[]> {
    try {
      if (!params.latitude || !params.longitude) {
        throw new Error('Location coordinates are required');
      }
      const response = await axiosInstance.get('/api/dating/nearby', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching nearby profiles:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load nearby profiles. Please try again.';
      throw new Error(message);
    }
  },

  /**
   * Get recommended profiles based on algorithm
   */
  async getRecommendations(params: FetchProfilesParams): Promise<DatingProfile[]> {
    try {
      const response = await axiosInstance.get('/api/dating/recommendations', { params });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load recommendations.';
      throw new Error(message);
    }
  },

  /**
   * Refresh profile deck with new profiles
   */
  async refreshProfiles(params: FetchProfilesParams): Promise<DatingProfile[]> {
    try {
      const response = await axiosInstance.post('/api/dating/refresh', params);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to refresh profiles.';
      throw new Error(message);
    }
  },

  // ============================================
  // Swipe Endpoints
  // ============================================

  /**
   * Record a swipe action (like, pass, super_like)
   */
  async recordSwipe(params: RecordSwipeParams): Promise<SwipeResponse> {
    try {
      if (!params.userId) {
        throw new Error('User ID is required');
      }
      if (!params.targetUserId) {
        throw new Error('Target user ID is required');
      }
      if (!params.action || !['like', 'pass', 'super_like', 'rewind'].includes(params.action)) {
        throw new Error('Valid swipe action is required');
      }
      const response = await axiosInstance.post('/api/dating/swipe', params);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to record swipe. Please try again.';
      throw new Error(message);
    }
  },

  /**
   * Rewind last swipe
   */
  async rewindSwipe(): Promise<{ profile: DatingProfile; rewindsRemaining: number }> {
    try {
      const response = await axiosInstance.post('/api/dating/rewind');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to rewind. You may have no rewinds remaining.';
      throw new Error(message);
    }
  },

  // ============================================
  // Matches Endpoints
  // ============================================

  /**
   * Get all matches
   */
  async getMatches(params?: GetMatchesParams): Promise<Match[]> {
    try {
      const response = await axiosInstance.get('/api/dating/matches', { params });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load matches.';
      throw new Error(message);
    }
  },

  /**
   * Get a specific match
   */
  async getMatch(matchId: string): Promise<Match> {
    try {
      if (!matchId) {
        throw new Error('Match ID is required');
      }
      const response = await axiosInstance.get(`/api/dating/matches/${matchId}`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load match details.';
      throw new Error(message);
    }
  },

  /**
   * Get new matches count
   */
  async getNewMatchesCount(): Promise<number> {
    try {
      const response = await axiosInstance.get('/api/dating/matches/new/count');
      return response.data.count;
    } catch (error: any) {
      return 0;
    }
  },

  /**
   * Unmatch a user
   */
  async unmatch(params: UnmatchParams): Promise<void> {
    try {
      if (!params.matchId) {
        throw new Error('Match ID is required');
      }
      await axiosInstance.delete(`/api/dating/matches/${params.matchId}`, {
        data: { reason: params.reason },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to unmatch.';
      throw new Error(message);
    }
  },

  /**
   * Archive a match
   */
  async archiveMatch(matchId: string): Promise<Match> {
    try {
      const response = await axiosInstance.patch(`/api/dating/matches/${matchId}/archive`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to archive match.';
      throw new Error(message);
    }
  },

  /**
   * Unarchive a match
   */
  async unarchiveMatch(matchId: string): Promise<Match> {
    try {
      const response = await axiosInstance.patch(`/api/dating/matches/${matchId}/unarchive`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to unarchive match.';
      throw new Error(message);
    }
  },

  /**
   * Mark match as seen
   */
  async markMatchSeen(matchId: string): Promise<void> {
    try {
      await axiosInstance.patch(`/api/dating/matches/${matchId}/seen`);
    } catch (error: any) {
      // Silent fail for seen status
    }
  },

  // ============================================
  // Likes Endpoints (Who Liked You)
  // ============================================

  /**
   * Get users who liked you
   */
  async getLikes(params?: GetLikesParams): Promise<Like[]> {
    try {
      const response = await axiosInstance.get('/api/dating/likes', { params });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load likes.';
      throw new Error(message);
    }
  },

  /**
   * Get likes count
   */
  async getLikesCount(): Promise<number> {
    try {
      const response = await axiosInstance.get('/api/dating/likes/count');
      return response.data.count;
    } catch (error: any) {
      return 0;
    }
  },

  /**
   * Mark like as seen
   */
  async markLikeSeen(likeId: string): Promise<void> {
    try {
      await axiosInstance.patch(`/api/dating/likes/${likeId}/seen`);
    } catch (error: any) {
      // Silent fail
    }
  },

  // ============================================
  // Preferences Endpoints
  // ============================================

  /**
   * Get dating preferences
   */
  async getPreferences(): Promise<DatingPreferences> {
    try {
      const response = await axiosInstance.get('/api/dating/preferences');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load preferences.';
      throw new Error(message);
    }
  },

  /**
   * Update dating preferences
   */
  async updatePreferences(preferences: Partial<DatingPreferences>): Promise<DatingPreferences> {
    try {
      const response = await axiosInstance.patch('/api/dating/preferences', preferences);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update preferences.';
      throw new Error(message);
    }
  },

  // ============================================
  // Stats & Limits Endpoints
  // ============================================

  /**
   * Get user's dating stats and remaining limits
   */
  async getStats(): Promise<UserDatingStats> {
    try {
      const response = await axiosInstance.get('/api/dating/stats');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load stats.';
      throw new Error(message);
    }
  },

  // ============================================
  // Boost Endpoints
  // ============================================

  /**
   * Activate profile boost
   */
  async activateBoost(): Promise<Boost> {
    try {
      const response = await axiosInstance.post('/api/dating/boost');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to activate boost. You may have no boosts remaining.';
      throw new Error(message);
    }
  },

  /**
   * Get active boost status
   */
  async getBoostStatus(): Promise<Boost | null> {
    try {
      const response = await axiosInstance.get('/api/dating/boost/status');
      return response.data;
    } catch (error: any) {
      return null;
    }
  },

  // ============================================
  // Report & Block Endpoints
  // ============================================

  /**
   * Report a profile
   */
  async reportProfile(params: ReportProfileParams): Promise<ProfileReport> {
    try {
      if (!params.reportedUserId) {
        throw new Error('User ID is required');
      }
      if (!params.reason) {
        throw new Error('Report reason is required');
      }
      const response = await axiosInstance.post('/api/dating/report', params);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to report profile.';
      throw new Error(message);
    }
  },

  /**
   * Block a user from dating
   */
  async blockUser(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.post(`/api/dating/block/${userId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to block user.';
      throw new Error(message);
    }
  },

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.delete(`/api/dating/block/${userId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to unblock user.';
      throw new Error(message);
    }
  },

  /**
   * Get blocked users list
   */
  async getBlockedUsers(): Promise<DatingProfile[]> {
    try {
      const response = await axiosInstance.get('/api/dating/blocked');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load blocked users.';
      throw new Error(message);
    }
  },

  // ============================================
  // Messaging Endpoints
  // ============================================

  /**
   * Get conversation messages for a match
   */
  async getMessages(matchId: string, params?: { limit?: number; before?: string }): Promise<any[]> {
    try {
      if (!matchId) {
        throw new Error('Match ID is required');
      }
      const response = await axiosInstance.get(`/api/dating/matches/${matchId}/messages`, { params });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load messages.';
      throw new Error(message);
    }
  },

  /**
   * Send a message in a match conversation
   */
  async sendMessage(matchId: string, content: string): Promise<any> {
    try {
      if (!matchId) {
        throw new Error('Match ID is required');
      }
      if (!content?.trim()) {
        throw new Error('Message content is required');
      }
      const response = await axiosInstance.post(`/api/dating/matches/${matchId}/messages`, {
        content: content.trim(),
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send message.';
      throw new Error(message);
    }
  },

  /**
   * Mark messages as read
   */
  async markMessagesRead(matchId: string): Promise<void> {
    try {
      await axiosInstance.patch(`/api/dating/matches/${matchId}/messages/read`);
    } catch (error: any) {
      // Silent fail
    }
  },

  // ============================================
  // Verification Endpoints
  // ============================================

  /**
   * Request profile verification
   */
  async requestVerification(selfieData: FormData): Promise<{ status: string }> {
    try {
      const response = await axiosInstance.post('/api/dating/verify', selfieData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to submit verification request.';
      throw new Error(message);
    }
  },

  /**
   * Get verification status
   */
  async getVerificationStatus(): Promise<{ status: 'none' | 'pending' | 'verified' | 'rejected' }> {
    try {
      const response = await axiosInstance.get('/api/dating/verify/status');
      return response.data;
    } catch (error: any) {
      return { status: 'none' };
    }
  },
};
