// src/api/datingApi.ts
// Comprehensive Dating API with matches, likes, preferences, and advanced features

import axiosInstance from './axiosInstance';
import {
  DatingProfile,
  DatingPreferences,
  SwipeActionType,
  Match,
  Like,
  UserDatingStats,
  Boost,
  UpdateDatingProfilePayload,
  SwipeResponse,
  FetchProfilesParams,
  ProfileReport,
  ReportReason,
  DEFAULT_DATING_PREFERENCES,
  FREE_DAILY_LIMITS,
} from '@/types/dating';
import {getMockDatingProfiles, ALL_MOCK_PROFILES} from '@/data/mockDatingProfiles';

// Flag to enable mock data when backend is unavailable
const USE_MOCK_FALLBACK = __DEV__;

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
      // Return mock user profile in dev mode
      if (USE_MOCK_FALLBACK) {
        console.log('[DatingAPI] Using mock user profile (backend unavailable)');
        return {
          id: 'current-user',
          userId: 'current-user-id',
          name: 'You',
          age: 28,
          gender: 'male',
          lookingFor: 'everyone',
          relationshipGoal: 'long_term',
          interests: ['Travel', 'Music', 'Coffee', 'Hiking'],
          bio: 'This is your profile.',
          prompts: [],
          photos: [],
          location: {latitude: 37.7749, longitude: -122.4194, city: 'San Francisco'},
          basics: {height: 175},
          lifestyle: {drinking: 'socially', smoking: 'never', exercise: 'often'},
          work: {jobTitle: 'Developer'},
          datingPreferences: DEFAULT_DATING_PREFERENCES,
          verificationStatus: 'verified',
          isActive: true,
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

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

      // Return mock data in dev mode when backend is unavailable
      if (USE_MOCK_FALLBACK) {
        console.log('[DatingAPI] Using mock profiles (backend unavailable)');
        return getMockDatingProfiles(undefined, undefined, params.limit || 20);
      }

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
      // Return mock data in dev mode when backend is unavailable
      if (USE_MOCK_FALLBACK) {
        console.log('[DatingAPI] Using mock recommendations (backend unavailable)');
        return getMockDatingProfiles(undefined, undefined, params.limit || 20);
      }

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
      // Return mock swipe response in dev mode
      if (USE_MOCK_FALLBACK) {
        console.log('[DatingAPI] Using mock swipe response (backend unavailable)');

        // Simulate a match occasionally (30% chance on like/super_like)
        const isMatch =
          params.action !== 'pass' && Math.random() < 0.3;

        const targetProfile = ALL_MOCK_PROFILES.find(p => p.userId === params.targetUserId);

        let match: Match | null = null;
        if (isMatch && targetProfile) {
          match = {
            id: `match-${Date.now()}`,
            user1Id: params.userId,
            user2Id: params.targetUserId,
            user1Profile: {
              id: 'current-user',
              userId: params.userId,
              name: 'You',
              age: 28,
              gender: 'male',
              lookingFor: 'everyone',
              relationshipGoal: 'long_term',
              interests: [],
              bio: '',
              prompts: [],
              photos: [],
              location: {latitude: 37.7749, longitude: -122.4194},
              basics: {},
              lifestyle: {drinking: 'socially', smoking: 'never', exercise: 'often'},
              work: {},
              datingPreferences: DEFAULT_DATING_PREFERENCES,
              verificationStatus: 'verified',
              isActive: true,
              lastActive: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            user2Profile: targetProfile,
            matchedAt: new Date().toISOString(),
            unreadCount: 0,
            status: 'active',
            matchedVia: params.action === 'super_like' ? 'super_like' : 'mutual_like',
          };
        }

        return {
          swipe: {
            id: `swipe-${Date.now()}`,
            userId: params.userId,
            targetUserId: params.targetUserId,
            action: params.action,
            timestamp: new Date().toISOString(),
            seen: false,
          },
          match,
          likesRemaining: params.action === 'like' ? 99 : 100,
          superLikesRemaining: params.action === 'super_like' ? 0 : 1,
        };
      }

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
      // Return empty matches in dev mode (matches are created from swipes)
      if (USE_MOCK_FALLBACK) {
        console.log('[DatingAPI] Using empty matches (backend unavailable)');
        return [];
      }

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
    } catch {
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
    } catch {
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
    } catch {
      return 0;
    }
  },

  /**
   * Mark like as seen
   */
  async markLikeSeen(likeId: string): Promise<void> {
    try {
      await axiosInstance.patch(`/api/dating/likes/${likeId}/seen`);
    } catch {
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
      // Return default preferences in dev mode
      if (USE_MOCK_FALLBACK) {
        console.log('[DatingAPI] Using default preferences (backend unavailable)');
        return DEFAULT_DATING_PREFERENCES;
      }

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
      // Return mock stats in dev mode
      if (USE_MOCK_FALLBACK) {
        console.log('[DatingAPI] Using mock stats (backend unavailable)');
        return {
          totalLikes: 25,
          totalPasses: 15,
          totalSuperLikes: 3,
          totalMatches: 5,
          likesRemaining: FREE_DAILY_LIMITS.likes,
          superLikesRemaining: FREE_DAILY_LIMITS.superLikes,
          rewindsRemaining: FREE_DAILY_LIMITS.rewinds,
          boostsRemaining: FREE_DAILY_LIMITS.boosts,
          nextRefresh: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isBoostActive: false,
        };
      }

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
    } catch {
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
    } catch {
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
    } catch {
      return { status: 'none' };
    }
  },
};
